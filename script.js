// DISTRITECNO - JavaScript Principal
// Carga productos, maneja navegación, animaciones y formulario

// ===== PRODUCTOS =====
// Se cargan desde products-data.js (generado desde db.json del POS)

// ===== NAVEGACIÓN MÓVIL =====
const hamburger = document.getElementById('hamburger');
const nav = document.getElementById('nav');
const navOverlay = document.createElement('div');
navOverlay.className = 'nav-overlay';
document.body.appendChild(navOverlay);

hamburger.addEventListener('click', () => {
  const isActive = nav.classList.toggle('active');
  hamburger.classList.toggle('active');
  navOverlay.classList.toggle('active');
  hamburger.setAttribute('aria-expanded', isActive);
});

navOverlay.addEventListener('click', () => {
  nav.classList.remove('active');
  hamburger.classList.remove('active');
  navOverlay.classList.remove('active');
  hamburger.setAttribute('aria-expanded', 'false');
});

// Cerrar menú al hacer clic en un enlace
document.querySelectorAll('.nav__link').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('active');
    hamburger.classList.remove('active');
    navOverlay.classList.remove('active');
  });
});

// ===== HEADER SCROLL =====
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// ===== SCROLL TO TOP =====
const scrollTopBtn = document.getElementById('scrollTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 500) {
    scrollTopBtn.classList.add('visible');
  } else {
    scrollTopBtn.classList.remove('visible');
  }
});

scrollTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// ===== CONTADOR ANIMADO =====
function animateCounter(element, target, duration = 2000) {
  let start = 0;
  const increment = target / (duration / 16);
  const timer = setInterval(() => {
    start += increment;
    if (start >= target) {
      element.textContent = target;
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(start);
    }
  }, 16);
}

// Iniciar contadores cuando sean visibles
const observerCounters = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.count);
      if (target && !el.dataset.animated) {
        el.dataset.animated = 'true';
        animateCounter(el, target);
      }
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('[data-count]').forEach(el => {
  observerCounters.observe(el);
});

// ===== ANIMACIONES DE ENTRADA =====
const animateObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('animated');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('[data-animate]').forEach(el => {
  animateObserver.observe(el);
});

// ===== FILTRO DE PRODUCTOS =====
const filterBtns = document.querySelectorAll('.products__filter .filter-btn');
const productsGrid = document.getElementById('productsGrid');
let currentFilter = 'all';
let displayedCount = 0;
const ITEMS_PER_PAGE = 12;

function renderProducts(filter = 'all', reset = true) {
  if (reset) {
    productsGrid.innerHTML = '';
    displayedCount = 0;
  }

  const filtered = filter === 'all'
    ? PRODUCTS_DATA
    : PRODUCTS_DATA.filter(p => p.category === filter);

  const toShow = filtered.slice(displayedCount, displayedCount + ITEMS_PER_PAGE);

  toShow.forEach(product => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.category = product.category;

    const priceHtml = product.price > 0
      ? `<span class="product-card__price">$${product.price.toLocaleString('es-AR')}</span>`
      : `<span class="product-card__price product-card__price--zero">Consultar precio</span>`;

    card.innerHTML = `
      <div class="product-card__img">
        <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://via.placeholder.com/300x300/1e293b/94a3b8?text=Sin+imagen'">
      </div>
      <div class="product-card__body">
        <div class="product-card__sku">${product.sku}</div>
        <h3 class="product-card__name">${product.name}</h3>
        ${priceHtml}
        <a href="#contacto" class="product-card__btn">
          <i class="fab fa-whatsapp"></i> Consultar
        </a>
      </div>
    `;
    productsGrid.appendChild(card);
  });

  displayedCount += toShow.length;

  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (displayedCount >= filtered.length) {
    loadMoreBtn.style.display = 'none';
  } else {
    loadMoreBtn.style.display = 'inline-flex';
  }
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderProducts(currentFilter, true);
  });
});

document.getElementById('loadMoreBtn').addEventListener('click', () => {
  renderProducts(currentFilter, false);
});

// Cargar productos iniciales
renderProducts('all', true);

// ===== TESTIMONIOS =====
const testimonialCards = document.querySelectorAll('.testimonial-card');
const dots = document.querySelectorAll('.dot');
let currentTestimonial = 0;

function showTestimonial(index) {
  testimonialCards.forEach(card => card.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));
  testimonialCards[index].classList.add('active');
  dots[index].classList.add('active');
  currentTestimonial = index;
}

dots.forEach(dot => {
  dot.addEventListener('click', () => {
    showTestimonial(parseInt(dot.dataset.index));
  });
});

// Auto-rotar testimonios
setInterval(() => {
  const next = (currentTestimonial + 1) % testimonialCards.length;
  showTestimonial(next);
}, 5000);

// ===== FILTRO DE PROYECTOS (si existiera) =====
// (No aplica para DISTRITECNO, pero se mantiene por compatibilidad)

// ===== FORMULARIO DE CONTACTO =====
const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

contactForm.addEventListener('submit', (e) => {
  e.preventDefault();

  // Simular envío
  const submitBtn = contactForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
  submitBtn.disabled = true;

  setTimeout(() => {
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    formSuccess.classList.add('show');
    contactForm.reset();

    setTimeout(() => {
      formSuccess.classList.remove('show');
    }, 5000);
  }, 1500);
});

// ===== SMOOTH SCROLL PARA ENLACES INTERNOS =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
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