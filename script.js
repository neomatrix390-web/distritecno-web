// DISTRITECNO - JavaScript Principal
console.log('Script loaded');
window.onerror = function(msg, url, line) {
  console.error('JS Error:', msg, 'at', url, ':', line);
  return true;
};

/* ===== CONFIGURACION GLOBAL ===== */

// WhatsApp oficial de DISTRITECNO (Berazategui, Buenos Aires).
// Antes estaba un numero de ejemplo hardcodeado que rompia TODOS los botones
// de WhatsApp del sitio (el JS reemplaza las tarjetas renderizadas).
const WHATSAPP_DISTRITECNO = 'https://wa.me/5491140351402';

// Normaliza texto para comparar categorias sin que importen tildes ni mayusculas.
// Antes el filtro comparaba con "===" y el boton decia "Tecnologia" mientras el
// producto decia "Tecnologia" / "Tecnologia con tilde": el filtro noaba nada.
function normalizarCategoria(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM ready');
  console.log('PRODUCTS_DATA:', typeof PRODUCTS_DATA, PRODUCTS_DATA ? PRODUCTS_DATA.length : 'undefined');

  // ===== NAVEGACION MOVIL =====
  const hamburger = document.getElementById('hamburger');
  const nav = document.getElementById('nav');
  const navOverlay = document.createElement('div');
  navOverlay.className = 'nav-overlay';
  document.body.appendChild(navOverlay);

  if (hamburger) {
    hamburger.addEventListener('click', function() {
      const isActive = nav.classList.toggle('active');
      hamburger.classList.toggle('active');
      navOverlay.classList.toggle('active');
      hamburger.setAttribute('aria-expanded', isActive);
    });
  }

  if (navOverlay) {
    navOverlay.addEventListener('click', function() {
      nav.classList.remove('active');
      hamburger.classList.remove('active');
      navOverlay.classList.remove('active');
    });
  }

  document.querySelectorAll('.nav__link').forEach(function(link) {
    link.addEventListener('click', function() {
      nav.classList.remove('active');
      hamburger.classList.remove('active');
      navOverlay.classList.remove('active');
    });
  });

  // ===== HEADER SCROLL =====
  const header = document.getElementById('header');
  window.addEventListener('scroll', function() {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // ===== SCROLL TO TOP =====
  const scrollTopBtn = document.getElementById('scrollTop');
  window.addEventListener('scroll', function() {
    if (window.scrollY > 500) {
      scrollTopBtn.classList.add('visible');
    } else {
      scrollTopBtn.classList.remove('visible');
    }
  });
  if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ===== CONTADOR ANIMADO =====
  function animateCounter(element, target, duration) {
    duration = duration || 2000;
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(function() {
      start += increment;
      if (start >= target) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(start);
      }
    }, 16);
  }

  // ===== ANIMACIONES DE ENTRADA =====
  const animateObserver = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('[data-animate]').forEach(function(el) {
    animateObserver.observe(el);
  });

  // ===== FILTRO DE PRODUCTOS =====
  const filterBtns = document.querySelectorAll('.products__filter .filter-btn');
  const productsGrid = document.getElementById('productsGrid');
  let currentFilter = 'all';
  let displayedCount = 0;
  const ITEMS_PER_PAGE = 12;

  function renderProducts(filter, reset) {
    filter = filter || 'all';
    if (reset) {
      productsGrid.innerHTML = '';
      displayedCount = 0;
    }

    if (typeof PRODUCTS_DATA === 'undefined') {
      productsGrid.innerHTML = '<p style="text-align:center;color:#94a3b8;padding:40px;">Cargando productos...</p>';
      return;
    }

    const filtroNormalizado = normalizarCategoria(filter);
    const filtered = filter === 'all'
      ? PRODUCTS_DATA
      : PRODUCTS_DATA.filter(function(p) {
          return normalizarCategoria(p.category) === filtroNormalizado;
        });

    const toShow = filtered.slice(displayedCount, displayedCount + ITEMS_PER_PAGE);

    toShow.forEach(function(product) {
      const card = document.createElement('div');
      card.className = 'product-card';
      card.dataset.category = product.category;

      const priceHtml = product.price > 0
        ? '<span class="product-card__price">$' + product.price.toLocaleString('es-AR') + '</span>'
        : '<span class="product-card__price product-card__price--zero">Consultar precio</span>';

      const stockHtml = product.stock > 0
        ? '<span class="product-card__stock"><i class="fas fa-check-circle"></i> Stock: ' + product.stock + '</span>'
        : '<span class="product-card__stock product-card__stock--out"><i class="fas fa-times-circle"></i> Sin stock</span>';

      const descHtml = product.description
        ? '<p class="product-card__desc">' + product.description + '</p>'
        : '';

      const featuresHtml = product.features && product.features.length > 0
        ? '<ul class="product-card__features">' + product.features.map(function(f) { return '<li><i class="fas fa-check"></i> ' + f + '</li>'; }).join('') + '</ul>'
        : '';

      const mlBtn = '';
      const waBtn = '<a href="' + WHATSAPP_DISTRITECNO + '?text=' + encodeURIComponent('Hola! Me interesa: ' + product.name + ' (' + product.sku + ')') + '" target="_blank" class="product-card__btn product-card__btn--wa"><i class="fab fa-whatsapp"></i> WhatsApp</a>';

      card.innerHTML = '<div class="product-card__img">' +
        '<img src="' + product.image + '" alt="' + product.name + '" loading="lazy" onerror="this.src=\'https://via.placeholder.com/300x300/1e293b/94a3b8?text=Sin+imagen\'">' +
        '</div>' +
        '<div class="product-card__body">' +
        '<div class="product-card__sku">' + product.sku + (product.brand ? ' · ' + product.brand : '') + '</div>' +
        '<h3 class="product-card__name">' + product.name + '</h3>' +
        priceHtml +
        stockHtml +
        descHtml +
        featuresHtml +
        '<div class="product-card__actions">' + waBtn + mlBtn + '</div>' +
        '</div>';

      productsGrid.appendChild(card);
    });

    displayedCount += toShow.length;

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      if (displayedCount >= filtered.length) {
        loadMoreBtn.style.display = 'none';
      } else {
        loadMoreBtn.style.display = 'inline-flex';
      }
    }

    // Actualizar contador
    const counterEl = document.querySelector('[data-count="67"]');
    if (counterEl) {
      counterEl.textContent = PRODUCTS_DATA.length;
      counterEl.dataset.animated = 'true';
    }

    // El boton "Agregar" se agrega a las recien renderizadas (no solo a las
    // que ya estaban en el HTML estatico).
    if (typeof addCartButtons === 'function') addCartButtons();
  }

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderProducts(currentFilter, true);
    });
  });

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', function() {
      renderProducts(currentFilter, false);
    });
  }

  // Cargar productos iniciales
  renderProducts('all', true);

  // ===== TESTIMONIOS =====
  const testimonialCards = document.querySelectorAll('.testimonial-card');
  const dots = document.querySelectorAll('.dot');
  let currentTestimonial = 0;

  function showTestimonial(index) {
    testimonialCards.forEach(function(card) { card.classList.remove('active'); });
    dots.forEach(function(dot) { dot.classList.remove('active'); });
    if (testimonialCards[index]) testimonialCards[index].classList.add('active');
    if (dots[index]) dots[index].classList.add('active');
    currentTestimonial = index;
  }

  dots.forEach(function(dot) {
    dot.addEventListener('click', function() {
      showTestimonial(parseInt(dot.dataset.index));
    });
  });

  setInterval(function() {
    const next = (currentTestimonial + 1) % testimonialCards.length;
    showTestimonial(next);
  }, 5000);

  // ===== FORMULARIO DE CONTACTO =====
  const contactForm = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
      submitBtn.disabled = true;

      setTimeout(function() {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        if (formSuccess) formSuccess.classList.add('show');
        contactForm.reset();
        setTimeout(function() {
          if (formSuccess) formSuccess.classList.remove('show');
        }, 5000);
      }, 1500);
    });
  }

  // ===== SMOOTH SCROLL =====
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    });
  });
});
// ===== CARRITO DE COMPRAS =====
const CART_KEY = 'distritecno_cart';
let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (badge) {
        const count = cart.reduce((sum, item) => sum + item.qty, 0);
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

function addToCart(sku, name, price, image) {
    const existing = cart.find(item => item.sku === sku);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ sku, name, price, image, qty: 1 });
    }
    saveCart();
    openCart();
}

function removeFromCart(sku) {
    cart = cart.filter(item => item.sku !== sku);
    saveCart();
    renderCart();
}

function updateQty(sku, delta) {
    const item = cart.find(i => i.sku === sku);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) removeFromCart(sku);
        else saveCart();
    }
    renderCart();
}

function renderCart() {
    const body = document.getElementById('cartBody');
    const footer = document.getElementById('cartFooter');
    const totalEl = document.getElementById('cartTotal');
    if (!body) return;

    if (cart.length === 0) {
        body.innerHTML = '<p class="cart-empty">Tu carrito está vacío</p>';
        if (footer) footer.style.display = 'none';
        return;
    }

    let html = '';
    let total = 0;
    cart.forEach(item => {
        const itemTotal = item.price * item.qty;
        total += itemTotal;
        html += '<div class="cart-item">';
        html += '<img src="' + item.image + '" alt="' + item.name + '" class="cart-item__img" onerror="this.src=\'https://via.placeholder.com/60x60/1e293b/94a3b8?text=Img\'">';
        html += '<div class="cart-item__info">';
        html += '<div class="cart-item__name">' + item.name + '</div>';
        html += '<div class="cart-item__price">$' + item.price.toLocaleString('es-AR') + ' x ' + item.qty + ' = $' + itemTotal.toLocaleString('es-AR') + '</div>';
        html += '<div class="cart-item__qty">';
        html += '<button onclick="updateQty(\'' + item.sku + '\', -1)">-</button>';
        html += '<span>' + item.qty + '</span>';
        html += '<button onclick="updateQty(\'' + item.sku + '\', 1)">+</button>';
        html += '</div>';
        html += '<div class="cart-item__remove" onclick="removeFromCart(\'' + item.sku + '\')">Eliminar</div>';
        html += '</div>';
        html += '</div>';
    });

    body.innerHTML = html;
    if (footer) footer.style.display = 'block';
    if (totalEl) totalEl.textContent = '$' + total.toLocaleString('es-AR');
}

function openCart() {
    document.getElementById('cartOverlay').classList.add('active');
    document.getElementById('cartModal').classList.add('active');
    renderCart();
}

function closeCart() {
    document.getElementById('cartOverlay').classList.remove('active');
    document.getElementById('cartModal').classList.remove('active');
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    updateCartBadge();
    const cartIcon = document.getElementById('cartIcon');
    const cartClose = document.getElementById('cartClose');
    const cartOverlay = document.getElementById('cartOverlay');
    if (cartIcon) cartIcon.addEventListener('click', openCart);
    if (cartClose) cartClose.addEventListener('click', closeCart);
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (cart.length === 0) return;

            const items = cart.map(function(item) {
                return {
                    title: item.name,
                    quantity: item.qty,
                    unit_price: item.price,
                    currency_id: 'ARS'
                };
            });

            const original = checkoutBtn.innerHTML;
            checkoutBtn.disabled = true;
            checkoutBtn.innerHTML = '<span>Generando pago...</span>';

            // Respaldo: si MercadoPago no esta disponible, el pedido se
            // completa por WhatsApp. El cliente nunca se queda trabado.
            function irPorWhatsApp() {
                let msg = 'Hola! Quiero comprar:%0A';
                cart.forEach(function(item) {
                    msg += '- ' + item.name + ' x' + item.qty + ' = $' + (item.price * item.qty).toLocaleString('es-AR') + '%0A';
                });
                const total = cart.reduce(function(sum, item) { return sum + item.price * item.qty; }, 0);
                msg += 'Total: $' + total.toLocaleString('es-AR');
                window.open(WHATSAPP_DISTRITECNO + '?text=' + msg, '_blank');
            }

            fetch('/api/create-preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: items })
            })
                .then(function(r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.json();
                })
                .then(function(data) {
                    if (!data || !data.init_point) throw new Error('respuesta sin init_point');
                    window.location.href = data.init_point;
                })
                .catch(function(error) {
                    console.warn('Checkout con MercadoPago no disponible, uso WhatsApp:', error);
                    checkoutBtn.disabled = false;
                    checkoutBtn.innerHTML = original;
                    irPorWhatsApp();
                });
        });
    }
});

// Add "Agregar al carrito" button to product cards
// This will be called after products are rendered
function addCartButtons() {
    document.querySelectorAll('.product-card').forEach(function(card) {
        const sku = card.dataset.sku || (card.querySelector('.product-card__sku')?.textContent?.split(' ')[0] || '');
        const name = card.querySelector('.product-card__name')?.textContent;
        const priceText = card.querySelector('.product-card__price')?.textContent;
        const price = priceText && priceText !== 'Consultar precio' ? parseInt(priceText.replace(/[^0-9]/g, '')) : 0;
        const img = card.querySelector('img')?.src;
        if (sku && name && price > 0) {
            const actions = card.querySelector('.product-card__actions');
            if (actions && !actions.querySelector('.btn--cart')) {
                const cartBtn = document.createElement('button');
                cartBtn.className = 'product-card__btn product-card__btn--cart';
                cartBtn.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar';
                cartBtn.addEventListener('click', function() {
                    addToCart(sku, name, price, img);
                });
                actions.appendChild(cartBtn);
            }
        }
    });
}

// Run after page load
setTimeout(addCartButtons, 1000);