import os

main_js_path = os.path.join(os.path.dirname(__file__), '..', 'js', 'main.js')
with open(main_js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the block starting at '// 1. Projeler Sayfasında' up to 'function initProjectSliders()'
start_marker = '// 1. Projeler'
end_marker = '/* ==========================================================================\n   PROJECT SLIDER CONTROLS'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1 or end_idx == -1:
    # Try normalized
    c_norm = content.replace('\r\n', '\n')
    start_idx = c_norm.find(start_marker)
    end_idx = c_norm.find('/* ==========================================================================\n   PROJECT SLIDER CONTROLS')
    if start_idx == -1 or end_idx == -1:
        print("Markers not found!")
        exit(1)
    content = c_norm

replacement = """// 1. Projeler Sayfasında VE Ana Sayfada Çoklu Görsel Slider & Dinamik Listeleme
  const projectsGrid = document.querySelector('.projects-grid');
  if (projectsGrid) {
    try {
      const projects = await window.CmsClient.getProjects();
      if (projects && projects.length > 0) {
        const isProjelerPage = window.location.pathname.includes('projeler');
        // Ana sayfada en güncel 3 projeyi, projeler sayfasında tümünü listele
        const displayProjects = isProjelerPage ? projects : projects.slice(0, 3);

        projectsGrid.innerHTML = displayProjects.map((p, pIdx) => {
          const specsHtml = (p.specs || []).map(s => `
            <div class="spec-row">
              <span class="spec-label">${s.label}</span>
              <span class="spec-val ${s.isPassed ? 'badge-passed' : ''}">${s.val}</span>
            </div>
          `).join('');

          const imagesList = (Array.isArray(p.images) && p.images.length > 0) ? p.images : [p.image || 'images/real/proje-luks-mutfak.webp'];
          const hasMultiple = imagesList.length > 1;

          let thumbHtml = '';
          if (hasMultiple) {
            const slidesHtml = imagesList.map((imgUrl, idx) => `
              <div class="project-slider-slide gallery-item" data-index="${idx}">
                <img src="${imgUrl}" alt="${p.title} - Görsel ${idx+1}" loading="lazy" decoding="async" onerror="this.src='images/real/proje-luks-mutfak.webp'">
              </div>
            `).join('');

            const dotsHtml = imagesList.map((_, idx) => `
              <span class="project-slider-dot ${idx === 0 ? 'active' : ''}" data-target="${idx}"></span>
            `).join('');

            thumbHtml = `
              <div class="project-slider" id="slider-${p.id || pIdx}">
                <div class="project-slider-badge">📷 <span class="slider-counter">1/${imagesList.length}</span></div>
                <button type="button" class="project-slider-btn prev" aria-label="Önceki Görsel">‹</button>
                <div class="project-slider-track">
                  ${slidesHtml}
                </div>
                <button type="button" class="project-slider-btn next" aria-label="Sonraki Görsel">›</button>
                <div class="project-slider-dots">
                  ${dotsHtml}
                </div>
              </div>
            `;
          } else {
            thumbHtml = `
              <div class="project-thumb gallery-item">
                <img src="${imagesList[0]}" alt="${p.title}" loading="lazy" decoding="async" onerror="this.src='images/real/proje-luks-mutfak.webp'">
              </div>
            `;
          }

          return `
            <div class="project-card">
              ${thumbHtml}
              <div class="project-spec-table">
                <div class="spec-header">
                  <h4>${p.title}</h4>
                  <span class="spec-location">${p.location || 'Antalya'}</span>
                </div>
                ${specsHtml}
              </div>
            </div>
          `;
        }).join('');

        initProjectSliders();
        initGalleryLightbox();
      }
    } catch (err) {
      console.warn('Dinamik proje listeleme hatası:', err);
    }
  }

  // 2. Hizmet Sayfalarında Alt Grid Galeri Senkronizasyonu
  const serviceGalleryGrid = document.querySelector('.service-gallery-section .gallery-grid, .service-gallery-grid');
  if (serviceGalleryGrid) {
    try {
      const services = await window.CmsClient.getServices();
      const currentPath = window.location.pathname.toLowerCase();

      const matchedService = services.find(s => {
        if (!s.slug) return false;
        const cleanSlug = s.slug.replace('.html', '').toLowerCase();
        return currentPath.includes(cleanSlug);
      });

      if (matchedService && Array.isArray(matchedService.gallery) && matchedService.gallery.length > 0) {
        serviceGalleryGrid.innerHTML = matchedService.gallery.map((imgUrl, i) => `
          <div class="gallery-item">
            <img src="${imgUrl}" alt="${matchedService.title} Uygulaması ${i+1}" loading="lazy" decoding="async" onerror="this.src='images/logo.webp'">
            <div class="gallery-overlay">
              <span class="gallery-badge">Antalya Projesi</span>
              <h4 class="gallery-caption">${matchedService.title} Uygulaması #${i+1}</h4>
            </div>
            <div class="gallery-zoom-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
            </div>
          </div>
        `).join('');

        initGalleryLightbox();
      }
    } catch (e) {
      console.warn('Hizmet galeri senkronizasyon hatası:', e);
    }
  }

  // 3. Genel Site Metinleri (Hero, Telefon, Sosyal Medya vb.) Senkronizasyonu
  try {
    const settings = await window.CmsClient.getSettings();
    if (settings) {
      if (settings.phone) {
        document.querySelectorAll('.top-phone span, .contact-phone-display, .top-bar-item strong').forEach(el => el.textContent = settings.phone);
        const cleanTel = settings.phone.replace(/[^0-9+]/g, '');
        document.querySelectorAll('a[href^="tel:"]').forEach(el => el.href = 'tel:' + cleanTel);
      }
      if (settings.whatsapp) {
        const cleanWa = settings.whatsapp.replace(/[^0-9]/g, '');
        document.querySelectorAll('a[href*="wa.me"]').forEach(el => {
          el.href = `https://wa.me/${cleanWa}?text=Merhaba,%20Can%20Yapı%20Antalya%20için%20ücretsiz%20keşif%20ve%20fiyat%20teklifi%20almak%20istiyorum.`;
        });
      }
      if (settings.heroTitle) {
        const heroTitle = document.querySelector('.hero-title-main, .poster-gold-title');
        if (heroTitle) heroTitle.innerHTML = settings.heroTitle;
      }
      if (settings.heroSubtitle) {
        const heroSub = document.querySelector('.hero-desc-main, .hero-poster-desc');
        if (heroSub) heroSub.textContent = settings.heroSubtitle;
      }
      // Sosyal Medya İkonları
      const socialLinks = [
        { key: 'instagram', prefix: 'https://instagram.com/' },
        { key: 'facebook', prefix: 'https://facebook.com/' },
        { key: 'tiktok', prefix: 'https://tiktok.com/@' },
        { key: 'twitter', prefix: 'https://x.com/' }
      ];
      socialLinks.forEach(item => {
        const val = settings[item.key] || (settings.social && settings.social[item.key]);
        document.querySelectorAll(`.footer-social a[href*="${item.key}"], .social-links a[href*="${item.key}"]`).forEach(linkEl => {
          if (val && val.trim()) {
            linkEl.style.display = 'inline-flex';
            linkEl.href = val.startsWith('http') ? val : (item.prefix + val.replace('@', ''));
          } else {
            linkEl.style.display = 'none';
          }
        });
      });
    }
  } catch (e) {
    console.warn('Settings sync error:', e);
  }
}

"""

new_content = content[:start_idx] + replacement + content[end_idx:]
with open(main_js_path, 'w', encoding='utf-8', newline='\r\n') as f:
    f.write(new_content)

print("Successfully updated js/main.js with full dynamic synchronization!")
