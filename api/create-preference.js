/*
  api/create-preference.js  (Serverless Function de Vercel)
  --------------------------------------------------------------------------
  Crea la preferencia de pago en MercadoPago para el carrito del sitio.

  QUE ESTABA MAL:
    1. El Access Token estaba HARCODEADO en el repo (se publico en GitHub).
    2. Se usaba el SDK v1 (mercadopago.configure + response.body.id) contra
       la API v2, que devolvia 500 FUNCTION_INVOCATION_FAILED.
    3. notification_url apuntaba a /api/webhook, que no existe (404).

  QUE HACE AHORA:
    - El token se lee de la variable de entorno MP_ACCESS_TOKEN (Vercel).
    - Se llama directo a la REST API v2 de MercadoPago con fetch nativo:
      no hace falta ningun paquete externo ni node_modules.
    - Si no hay token configurado, responde 503 con un mensaje claro en vez
      de romperse.
    - notification_url es opcional y solo se manda si esta definida en
      MP_WEBHOOK_URL.

  CONFIGURAR EN VERCEL (obligatorio):
    MP_ACCESS_TOKEN = APP_USR-...
    (opcional) MP_WEBHOOK_URL = https://.../api/webhook
*/

const API_MP = 'https://api.mercadopago.com/checkout/preferences';

function origenPermitido(req) {
  const permitido = process.env.ALLOWED_ORIGIN;
  if (!permitido) return '*';
  const headers = req.headers || {};
  const lista = permitido.split(',').map((v) => v.trim()).filter(Boolean);
  const origen = headers.origin || headers.referer || '';
  return lista.some((o) => origen.indexOf(o) !== -1) ? origen : lista[0];
}

module.exports = async (req, res) => {
  const origen = origenPermitido(req);
  res.setHeader('Access-Control-Allow-Origin', origen);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Metodo no permitido' });
  }

  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('Falta la variable de entorno MP_ACCESS_TOKEN en Vercel.');
    return res.status(503).json({
      error: 'MercadoPago no esta configurado en este entorno. Configura MP_ACCESS_TOKEN.'
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const items = body.items;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No hay productos en el carrito' });
    }

    const itemsMp = items.map((item) => {
      const cantidad = Number(item.quantity || item.qty || 1);
      const precio = Number(item.unit_price || item.price || 0);
      return {
        title: String(item.title || item.name || 'Producto').slice(0, 120),
        quantity: cantidad > 0 ? cantidad : 1,
        unit_price: precio > 0 ? precio : 1,
        currency_id: 'ARS'
      };
    });

    const base = process.env.SITE_URL || 'https://distritecno-web.vercel.app';
    const preferencia = {
      items: itemsMp,
      back_urls: {
        success: base + '?status=success',
        failure: base + '?status=failure',
        pending: base + '?status=pending'
      },
      auto_return: 'approved',
      statement_descriptor: 'DISTRITECNO'
    };

    // Solo se manda si el proyecto tiene un webhook real configurado.
    if (process.env.MP_WEBHOOK_URL) {
      preferencia.notification_url = process.env.MP_WEBHOOK_URL;
    }

    const respuesta = await fetch(API_MP, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify(preferencia)
    });

    const datos = await respuesta.json().catch(() => ({}));

    if (!respuesta.ok) {
      console.error('MercadoPago respondio', respuesta.status, datos);
      return res.status(502).json({
        error: 'MercadoPago rechazo la preferencia',
        detalle: datos && datos.message ? datos.message : undefined
      });
    }

    return res.status(200).json({
      id: datos.id,
      init_point: datos.init_point,
      sandbox_init_point: datos.sandbox_init_point
    });
  } catch (error) {
    console.error('Error creando la preferencia:', error);
    return res.status(500).json({ error: 'No se pudo crear la preferencia de pago' });
  }
};
