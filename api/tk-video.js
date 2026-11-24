/*
  api/tk-video.js  (Vercel Serverless Function) - Deployed at omegaperfumes-vercel.vercel.app
  -----------------------------------------------------------------------
  Endpoint para servir videos a TikTok (PULL_FROM_URL).
  El dominio omegaperfumes-vercel.vercel.app YA ESTÁ VERIFICADO en TikTok
  (meta tag tiktok-site-verification).

  DOS MODOS:
  1. GET /api/tk-video?f=archivo.mp4  -> Sirve video desde video-puente local
  2. POST /api/tk-video               -> Sube video y devuelve URL pública
*/

const VIDEO_PUENTE_URL = process.env.VIDEO_PUENTE_URL || 'http://host.docker.internal:4600';
const VIDEO_PUENTE_TOKEN = process.env.VIDEO_PUENTE_TOKEN || '';

function corsHeaders(req) {
  const origin = req.headers.origin || req.headers.referer || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-puente-token',
    'Access-Control-Max-Age': '86400'
  };
}

async function fetchFromVideoPuente(path, token) {
  const url = `${VIDEO_PUENTE_URL}${path}`;
  const headers = {};
  if (token) headers['x-puente-token'] = token;
  const res = await fetch(url, { headers });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`Video-Puente ${res.status}: ${err}`);
  }
  return res;
}

// GET /api/tk-video?f=archivo.mp4
async function handleGet(req, res) {
  const filename = req.query.f;
  if (!filename || !filename.endsWith('.mp4')) {
    return res.status(400).json({ error: 'Parámetro "f" requerido (archivo .mp4)' });
  }

  try {
    const vpRes = await fetchFromVideoPuente(`/video/${encodeURIComponent(filename)}`, VIDEO_PUENTE_TOKEN);
    
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));
    
    const buffer = await vpRes.arrayBuffer();
    res.status(200).send(Buffer.from(buffer));
  } catch (e) {
    console.error('Error sirviendo video:', e.message);
    return res.status(502).json({ error: 'No se pudo obtener el video', detalle: e.message });
  }
}

// POST /api/tk-video
async function handlePost(req, res) {
  const contentType = req.headers['content-type'] || '';
  
  if (contentType.includes('multipart/form-data')) {
    return res.status(400).json({ error: 'Use JSON con { videoBase64, filename }' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { videoBase64, filename } = body;
    
    if (!videoBase64 || !filename) {
      return res.status(400).json({ error: 'Faltan videoBase64 y filename' });
    }

    // OPCIÓN A: Vercel Blob (requiere plan Pro)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob');
      const buffer = Buffer.from(videoBase64, 'base64');
      const blob = await put(filename, buffer, {
        access: 'public',
        contentType: 'video/mp4',
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      return res.status(200).json({ ok: true, url: blob.url, provider: 'vercel-blob' });
    }

    // OPCIÓN B: Cloudflare R2
    if (process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID) {
      const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');
      const client = new S3Client({
        region: 'auto',
        endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY
        }
      });
      const buffer = Buffer.from(videoBase64, 'base64');
      await client.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET || 'omega-videos',
        Key: filename,
        Body: buffer,
        ContentType: 'video/mp4',
        ACL: 'public-read'
      }));
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${filename}`;
      return res.status(200).json({ ok: true, url: publicUrl, provider: 'cloudflare-r2' });
    }

    // OPCIÓN C: Proxy a video-puente (requiere túnel público)
    const proxyUrl = `https://omegaperfumes-vercel.vercel.app/api/tk-video?f=${encodeURIComponent(filename)}`;
    return res.status(200).json({ 
      ok: true, 
      url: proxyUrl, 
      provider: 'video-puente-proxy',
      nota: 'El video debe estar en video-puente/colaVideos. TikTok hará PULL_FROM_URL a esta URL.'
    });

  } catch (e) {
    console.error('Error subiendo video:', e.message);
    return res.status(500).json({ error: 'Error subiendo video', detalle: e.message });
  }
}

module.exports = async (req, res) => {
  Object.entries(corsHeaders(req)).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return handleGet(req, res);
  }

  if (req.method === 'POST') {
    return handlePost(req, res);
  }

  return res.status(405).json({ error: 'Método no permitido' });
};