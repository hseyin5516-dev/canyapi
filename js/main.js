/**
 * Can Yapı Antalya - Ana JavaScript Dosyası (Main Logic)
 * Mobil navigasyon, teklif modalı, dosya yükleme önizlemesi,
 * form doğrulama, talep saklama ve etkileşimler.
 */

// İletişim Sabitleri (Kolayca güncellenebilir)
const CAN_YAPI_CONFIG = {
  phone: "+90 532 555 07 24",
  phoneRaw: "+905325550724",
  whatsapp: "905325550724",
  email: "info@canyapiantalya.com",
  address: "Muratpaşa, Antalya / Türkiye"
};

document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initHeader();
  initMobileNav();
  initQuoteModal();
  initForms();
  initCounters();
});

/* ==========================================================================
   THEME SWITCHER (Koyu Siyah / Açık Beyaz)
   ========================================================================== */
function initTheme() {
  const savedTheme = localStorage.getItem('canyapi_theme') || 'dark';
  applyTheme(savedTheme);

  document.querySelectorAll('.js-theme-toggle').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      applyTheme(newTheme);
      localStorage.setItem('canyapi_theme', newTheme);
    });
  });
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const toggleBtns = document.querySelectorAll('.js-theme-toggle');
  toggleBtns.forEach(btn => {
    if (theme === 'light') {
      btn.innerHTML = '🌙 <span>Koyu</span>';
      btn.setAttribute('title', 'Koyu Temaya Geç');
    } else {
      btn.innerHTML = '☀️ <span>Açık</span>';
      btn.setAttribute('title', 'Açık Temaya Geç');
    }
  });
}


/* ==========================================================================
   HEADER SCROLL & MOBIL MENU
   ========================================================================== */
function initHeader() {
  const header = document.querySelector('.header');
  if (!header) return;

  window.addEventListener('scroll', function() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

function initMobileNav() {
  const hamburgerBtn = document.querySelector('.hamburger-btn');
  const closeBtn = document.querySelector('.mobile-close-btn');
  const overlay = document.querySelector('.mobile-nav-overlay');
  const drawer = document.querySelector('.mobile-nav-drawer');
  const servicesToggle = document.querySelector('.js-mobile-services-toggle');
  const submenu = document.querySelector('.mobile-submenu');

  function openMenu() {
    if (drawer && overlay) {
      drawer.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeMenu() {
    if (drawer && overlay) {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  if (overlay) overlay.addEventListener('click', closeMenu);

  if (servicesToggle && submenu) {
    servicesToggle.addEventListener('click', function(e) {
      e.preventDefault();
      submenu.classList.toggle('open');
    });
  }
}

/* ==========================================================================
   QUOTE / FREE DISCOVERY MODAL LOGIC
   ========================================================================== */
let selectedFilesStore = [];

function initQuoteModal() {
  const modalOverlay = document.getElementById('quoteModal');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const triggerBtns = document.querySelectorAll('.js-open-quote-modal');

  triggerBtns.forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      const service = this.getAttribute('data-service') || '';
      const isDiscovery = this.getAttribute('data-discovery') === 'true';
      openQuoteModal(service, isDiscovery);
    });
  });

  if (modalCloseBtn && modalOverlay) {
    modalCloseBtn.addEventListener('click', closeQuoteModal);
    modalOverlay.addEventListener('click', function(e) {
      if (e.target === modalOverlay) closeQuoteModal();
    });
  }

  // ESC tuşu ile kapatma
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeQuoteModal();
  });

  // Dosya Yükleme Alanı
  initFileUpload('modalFileInput', 'modalUploadBox', 'modalFilePreview');
}

window.openQuoteModal = function(serviceName = '', isDiscovery = false) {
  const modalOverlay = document.getElementById('quoteModal');
  if (!modalOverlay) return;

  const serviceSelect = document.getElementById('modalServiceSelect');
  const discoveryCheckbox = document.getElementById('modalDiscoveryCheck');
  const modalTitle = document.getElementById('modalTitle');

  if (serviceSelect && serviceName) {
    serviceSelect.value = serviceName;
  }

  if (discoveryCheckbox) {
    discoveryCheckbox.checked = isDiscovery;
  }

  if (modalTitle) {
    modalTitle.innerText = isDiscovery ? 'Ücretsiz Keşif Talebi' : 'Hemen Teklif Alın';
  }

  modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Analytics tetikle
  if (window.CanYapiAnalytics) {
    if (isDiscovery) {
      window.CanYapiAnalytics.track('free_discovery_click', { service: serviceName || 'Genel' });
    }
  }
};

window.closeQuoteModal = function() {
  const modalOverlay = document.getElementById('quoteModal');
  if (modalOverlay) {
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }
};

/* ==========================================================================
   FILE UPLOAD & PREVIEW (Fotoğraf Yükleme Desteği)
   ========================================================================== */
function initFileUpload(inputId, boxId, previewId) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(boxId);
  const preview = document.getElementById(previewId);

  if (!input || !box || !preview) return;

  box.addEventListener('dragover', function(e) {
    e.preventDefault();
    box.classList.add('dragover');
  });

  box.addEventListener('dragleave', function() {
    box.classList.remove('dragover');
  });

  box.addEventListener('drop', function(e) {
    e.preventDefault();
    box.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files, preview);
    }
  });

  input.addEventListener('change', function() {
    if (input.files && input.files.length > 0) {
      handleFiles(input.files, preview);
    }
  });
}

function handleFiles(files, previewElement) {
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    // Sadece resim ve pdf dosyalarını kabul et
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      showToast('Lütfen yalnızca fotoğraf veya PDF dosyası yükleyin.', 'error');
      continue;
    }

    selectedFilesStore.push({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
    });

    renderPreviews(previewElement);
  }
}

function renderPreviews(previewElement) {
  previewElement.innerHTML = '';
  selectedFilesStore.forEach((f, idx) => {
    const chip = document.createElement('div');
    chip.className = 'preview-chip';
    chip.innerHTML = `
      <span>📎 ${f.name} (${f.size})</span>
      <span class="remove-file" onclick="removeSelectedFile(${idx}, '${previewElement.id}')">&times;</span>
    `;
    previewElement.appendChild(chip);
  });
}

window.removeSelectedFile = function(index, previewId) {
  selectedFilesStore.splice(index, 1);
  const previewElement = document.getElementById(previewId);
  if (previewElement) renderPreviews(previewElement);
};

/* ==========================================================================
   FORM SUBMISSION & LEAD MANAGEMENT
   ========================================================================== */
function initForms() {
  const quoteForms = document.querySelectorAll('.js-quote-form');

  quoteForms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      const name = form.querySelector('[name="name"]')?.value.trim();
      const phone = form.querySelector('[name="phone"]')?.value.trim();
      const service = form.querySelector('[name="service"]')?.value;
      const location = form.querySelector('[name="location"]')?.value;
      const notes = form.querySelector('[name="notes"]')?.value.trim();
      const discovery = form.querySelector('[name="discovery"]')?.checked || false;

      if (!name || !phone || !service) {
        showToast('Lütfen Ad Soyad, Telefon ve Hizmet Türü alanlarını doldurun.', 'error');
        return;
      }

      // Yeni Teklif Nesnesi
      const newLead = {
        id: 'CY-' + Date.now().toString().slice(-6),
        name: name,
        phone: phone,
        service: service,
        location: location || 'Antalya / Belirtilmedi',
        notes: notes || '-',
        isDiscovery: discovery,
        files: [...selectedFilesStore],
        date: new Date().toLocaleString('tr-TR'),
        status: 'Yeni'
      };

      // localStorage kaydı (Can Yapı Yönetim Paneli için)
      saveLeadToStorage(newLead);

      // Ölçümleme (Analytics Event)
      if (window.CanYapiAnalytics) {
        window.CanYapiAnalytics.track('quote_form_submit', {
          service: service,
          location: location,
          isDiscovery: discovery
        });
      }

      // Başarılı Mesajı
      showToast('Talebiniz başarıyla alındı! Ekibimiz en kısa sürede sizinle iletişime geçecektir.', 'success');
      form.reset();
      selectedFilesStore = [];
      const preview = form.querySelector('.file-preview-list');
      if (preview) preview.innerHTML = '';

      closeQuoteModal();

      // WhatsApp ile hızlı bildirim opsiyonu (Kullanıcı dilerse direkt WhatsApp'a da yollar)
      setTimeout(() => {
        askSendToWhatsApp(newLead);
      }, 700);
    });
  });
}

function saveLeadToStorage(lead) {
  try {
    const existing = JSON.parse(localStorage.getItem('canyapi_leads') || '[]');
    existing.unshift(lead);
    localStorage.setItem('canyapi_leads', JSON.stringify(existing));
  } catch (err) {
    console.error('Lead storage error:', err);
  }
}

function askSendToWhatsApp(lead) {
  const text = encodeURIComponent(
    `*Yeni Proje Talebi (Can Yapı)*\n` +
    `👤 *Ad Soyad:* ${lead.name}\n` +
    `📞 *Telefon:* ${lead.phone}\n` +
    `🛠 *Hizmet:* ${lead.service}\n` +
    `📍 *Konum:* ${lead.location}\n` +
    `🔍 *Ücretsiz Keşif:* ${lead.isDiscovery ? 'Evet, Keşif Talep Edildi' : 'Hayır'}\n` +
    `📝 *Açıklama:* ${lead.notes}`
  );
  const waUrl = `https://wa.me/${CAN_YAPI_CONFIG.whatsapp}?text=${text}`;

  // Kullanıcıya WhatsApp ile de iletme önerisi
  if (confirm("Talebinizi WhatsApp üzerinden Can Yapı Antalya yetkilisine doğrudan iletmek ister misiniz?")) {
    window.open(waUrl, '_blank');
  }
}

/* ==========================================================================
   TOAST NOTIFICATION COMPONENT
   ========================================================================== */
function showToast(message, type = 'info') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  const icon = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}
window.showToast = showToast;

/* ==========================================================================
   ANIMATED STATS COUNTERS (RK Reno Style)
   ========================================================================== */
function initCounters() {
  const counters = document.querySelectorAll('.js-counter');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const counter = entry.target;
        const target = parseInt(counter.getAttribute('data-target'), 10);
        let count = 0;
        const speed = target / 40;

        const updateCount = () => {
          count += speed;
          if (count < target) {
            counter.innerText = Math.ceil(count);
            requestAnimationFrame(updateCount);
          } else {
            counter.innerText = target;
          }
        };
        updateCount();
        observer.unobserve(counter);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}
