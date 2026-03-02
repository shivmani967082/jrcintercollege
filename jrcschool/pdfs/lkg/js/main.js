/**
 * Main JavaScript File for JRC School Website
 * Handles common functionality across all pages
 */

// ============================================
// UTILITY FUNCTIONS
// ============================================

const JRCUtils = {
  // Initialize all common features
  init() {
    this.initScrollAnimations();
    this.initSmoothScroll();
    this.initMobileMenu();
    this.initBackToTop();
    this.initNavbarScroll();
    this.initFormValidation();
    this.initTooltips();
    this.initLazyLoading();
    this.initWhatsAppButton();
    this.initNewsLoader();
  },

  // ============================================
  // NEWS / ANNOUNCEMENTS LOADER (होम पेज)
  // ============================================
  async initNewsLoader() {
    const container = document.getElementById('newsContainer');
    if (!container) return;
    const API_BASE = 'https://jrc-school-pro.onrender.com';
    try {
      const res = await fetch(`${API_BASE}/api/news?limit=10`);
      const json = await res.json();
      if (json.success && json.data && json.data.length) {
        const typeLabels = { notice: 'सूचना', holiday: 'छुट्टी', exam: 'परीक्षा', event: 'कार्यक्रम', general: 'सामान्य' };
        container.innerHTML = json.data.map(n => {
          const d = n.date ? new Date(n.date).toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
          const typeLabel = typeLabels[n.type] || 'सूचना';
          return `<div class="bg-white rounded-xl shadow p-4 border-l-4 border-blue-500">
            <span class="text-xs font-medium text-blue-600">${typeLabel}</span>
            <h3 class="font-semibold text-gray-800 mt-1">${this._escapeHtml(n.title)}</h3>
            <p class="text-sm text-gray-600 mt-1">${this._escapeHtml(n.content)}</p>
            ${d ? `<p class="text-xs text-gray-500 mt-2">${d}</p>` : ''}
          </div>`;
        }).join('');
      } else {
        container.innerHTML = '<p class="text-center text-gray-600">इस समय कोई सूचना नहीं है।</p>';
      }
    } catch (err) {
      console.warn('News load failed:', err);
      container.innerHTML = '<p class="text-center text-gray-600">सूचनाएं लोड नहीं हो सकीं। बाद में दोबारा देखें।</p>';
    }
  },

  _escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // ============================================
  // SCROLL ANIMATIONS
  // ============================================
  initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          // Optional: Stop observing after animation
          // observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => {
      observer.observe(el);
    });

    // Observe cards for staggered animations
    document.querySelectorAll('.facility-card, .card-hover').forEach((el, index) => {
      el.style.animationDelay = `${index * 0.1}s`;
      observer.observe(el);
    });
  },

  // ============================================
  // SMOOTH SCROLLING
  // ============================================
  initSmoothScroll() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const headerOffset = 80;
          const elementPosition = target.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  },

  // ============================================
  // MOBILE MENU
  // ============================================
  initMobileMenu() {
    // Create mobile menu button if it doesn't exist
    const header = document.querySelector('header');
    if (!header) return;

    const nav = header.querySelector('nav');
    if (!nav) return;

    // Check if mobile menu button already exists
    if (document.getElementById('mobileMenuBtn')) return;

    // Create mobile menu button
    const menuBtn = document.createElement('button');
    menuBtn.id = 'mobileMenuBtn';
    menuBtn.className = 'md:hidden text-white p-2 hover:bg-blue-800 rounded';
    menuBtn.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    `;
    menuBtn.setAttribute('aria-label', 'Toggle menu');

    // Insert button before nav
    nav.parentNode.insertBefore(menuBtn, nav);

    // Mobile menu toggle
    menuBtn.addEventListener('click', () => {
      nav.classList.toggle('hidden');
      nav.classList.toggle('absolute');
      nav.classList.toggle('top-full');
      nav.classList.toggle('left-0');
      nav.classList.toggle('right-0');
      nav.classList.toggle('bg-blue-900');
      nav.classList.toggle('flex-col');
      nav.classList.toggle('p-4');
      nav.classList.toggle('space-y-4');
      nav.classList.toggle('shadow-lg');
      
      // Update icon
      const icon = menuBtn.querySelector('svg path');
      if (nav.classList.contains('hidden')) {
        icon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
      } else {
        icon.setAttribute('d', 'M6 18L18 6M6 6l12 12');
      }
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!nav.contains(e.target) && !menuBtn.contains(e.target)) {
        nav.classList.add('hidden');
        nav.classList.remove('absolute', 'top-full', 'left-0', 'right-0', 'bg-blue-900', 'flex-col', 'p-4', 'space-y-4', 'shadow-lg');
        const icon = menuBtn.querySelector('svg path');
        icon.setAttribute('d', 'M4 6h16M4 12h16M4 18h16');
      }
    });
  },

  // ============================================
  // WHATSAPP FLOATING BUTTON
  // ============================================
  initWhatsAppButton() {
    if (document.getElementById('whatsAppFloatBtn')) return;
    
    const phone = '918874543973'; // School number
    const msg = encodeURIComponent('नमस्ते, JRC स्कूल की वेबसाइट से संपर्क कर रहा/रही हूं।');
    const url = `https://wa.me/${phone}?text=${msg}`;
    
    const btn = document.createElement('a');
    btn.id = 'whatsAppFloatBtn';
    btn.href = url;
    btn.target = '_blank';
    btn.rel = 'noopener noreferrer';
    btn.className = 'fixed bottom-6 left-6 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all z-50 flex items-center justify-center';
    btn.setAttribute('aria-label', 'WhatsApp पर संपर्क करें');
    btn.innerHTML = `
      <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      <span class="sr-only">WhatsApp</span>
    `;
    document.body.appendChild(btn);
  },

  // ============================================
  // BACK TO TOP BUTTON
  // ============================================
  initBackToTop() {
    // Create back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.id = 'backToTop';
    backToTopBtn.className = 'fixed bottom-8 right-8 bg-yellow-400 text-blue-900 p-3 rounded-full shadow-lg hover:bg-yellow-300 transition-all opacity-0 pointer-events-none z-50';
    backToTopBtn.innerHTML = `
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path>
      </svg>
    `;
    backToTopBtn.setAttribute('aria-label', 'Back to top');
    document.body.appendChild(backToTopBtn);

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
      if (window.pageYOffset > 300) {
        backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.add('opacity-100');
      } else {
        backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
        backToTopBtn.classList.remove('opacity-100');
      }
    });

    // Scroll to top on click
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  },

  // ============================================
  // NAVBAR SCROLL EFFECT
  // ============================================
  initNavbarScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    let lastScroll = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 100) {
        header.style.backgroundColor = 'rgba(30, 58, 138, 0.95)';
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      } else {
        header.style.backgroundColor = '';
        header.style.boxShadow = '';
      }

      // Hide/show navbar on scroll (optional)
      // if (currentScroll > lastScroll && currentScroll > 200) {
      //   header.style.transform = 'translateY(-100%)';
      // } else {
      //   header.style.transform = 'translateY(0)';
      // }
      // lastScroll = currentScroll;
    });
  },

  // ============================================
  // FORM VALIDATION HELPERS
  // ============================================
  initFormValidation() {
    // Add real-time validation to inputs
    document.querySelectorAll('input[type="tel"], input[type="email"], input[pattern]').forEach(input => {
      input.addEventListener('blur', () => {
        this.validateField(input);
      });

      input.addEventListener('input', () => {
        if (input.classList.contains('error')) {
          this.validateField(input);
        }
      });
    });
  },

  validateField(field) {
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    // Remove previous error styling
    field.classList.remove('error', 'border-red-500');
    const existingError = field.parentElement.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    // Required field check
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      errorMessage = 'This field is required';
    }

    // Pattern validation
    if (isValid && field.hasAttribute('pattern')) {
      const pattern = new RegExp(field.getAttribute('pattern'));
      if (!pattern.test(value)) {
        isValid = false;
        errorMessage = field.getAttribute('data-error') || 'Invalid format';
      }
    }

    // Email validation
    if (isValid && field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    }

    // Phone validation (10 digits)
    if (isValid && field.type === 'tel' && value) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(value.replace(/\D/g, ''))) {
        isValid = false;
        errorMessage = 'Please enter a valid 10-digit phone number';
      }
    }

    // Show error if invalid
    if (!isValid) {
      field.classList.add('error', 'border-red-500');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message text-red-500 text-xs mt-1';
      errorDiv.textContent = errorMessage;
      field.parentElement.appendChild(errorDiv);
    }

    return isValid;
  },

  validateForm(form) {
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });

    return isValid;
  },

  // ============================================
  // TOOLTIPS
  // ============================================
  initTooltips() {
    document.querySelectorAll('[data-tooltip]').forEach(element => {
      element.addEventListener('mouseenter', (e) => {
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip absolute bg-gray-900 text-white text-xs rounded px-2 py-1 z-50';
        tooltip.textContent = e.target.getAttribute('data-tooltip');
        document.body.appendChild(tooltip);

        const rect = e.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
        tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;

        e.target._tooltip = tooltip;
      });

      element.addEventListener('mouseleave', (e) => {
        if (e.target._tooltip) {
          e.target._tooltip.remove();
          delete e.target._tooltip;
        }
      });
    });
  },

  // ============================================
  // LAZY LOADING
  // ============================================
  initLazyLoading() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  },

  // ============================================
  // NOTIFICATION SYSTEM
  // ============================================
  showNotification(message, type = 'success', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all ${
      type === 'success' ? 'bg-green-500 text-white' :
      type === 'error' ? 'bg-red-500 text-white' :
      type === 'info' ? 'bg-blue-500 text-white' :
      'bg-gray-800 text-white'
    }`;
    notification.textContent = message;
    notification.style.transform = 'translateX(400px)';
    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    // Remove after duration
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, duration);
  },

  // ============================================
  // LOADING STATE
  // ============================================
  setLoading(element, isLoading) {
    if (isLoading) {
      element.disabled = true;
      element.dataset.originalText = element.textContent;
      element.innerHTML = '<span class="spinner inline-block mr-2"></span>Loading...';
    } else {
      element.disabled = false;
      element.textContent = element.dataset.originalText || element.textContent;
    }
  },

  // ============================================
  // WHATSAPP INTEGRATION
  // ============================================
  sendToWhatsApp(phone, message) {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  },

  // ============================================
  // EMAIL INTEGRATION
  // ============================================
  sendEmail(to, subject, body) {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    window.location.href = `mailto:${to}?subject=${encodedSubject}&body=${encodedBody}`;
  },

  // ============================================
  // LOCAL STORAGE HELPERS
  // ============================================
  saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn('LocalStorage not available:', e);
    }
  },

  getFromLocalStorage(key) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (e) {
      console.warn('LocalStorage not available:', e);
      return null;
    }
  },

  // ============================================
  // DEBOUNCE FUNCTION
  // ============================================
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => JRCUtils.init());
} else {
  JRCUtils.init();
}

// Export for use in other scripts
window.JRCUtils = JRCUtils;
