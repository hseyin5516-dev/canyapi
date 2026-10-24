/**
 * Can Yapı Antalya - Kurumsal İçerik & Talep Yönetim Paneli (CMS)
 * 
 * Hosting üzerinde PHP API ile tam entegre çalışır.
 * Projeler, Hizmetler, Blog, Site Metinleri ve Fotoğraf Yükleyici modüllerini yönetir.
 */

// Bağımsız Admin Toast Bildirim Mekanizması
window.showToast = function(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column;gap:10px;pointer-events:none;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const bg = type === 'success' ? '#10B981' : (type === 'error' ? '#EF4444' : '#3B82F6');
  toast.style.cssText = `background:${bg};color:#FFF;padding:12px 20px;border-radius:8px;font-weight:600;font-size:0.9rem;box-shadow:0 8px 24px rgba(0,0,0,0.35);pointer-events:auto;transition:all 0.3s ease;transform:translateY(10px);opacity:0;`;
  toast.textContent = message;
  container.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.transform = 'translateY(0)';
    toast.style.opacity = '1';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
};

const ADMIN_CREDENTIALS = {
  username: 'canyapi',
  passwords: ['05458320190', '5458320190']
};

let currentProjects = [];
let currentServices = [];
let currentBlog = [];
let currentSettings = {};

document.addEventListener('DOMContentLoaded', async function() {
  initAdminAuth();
  if (isUserAuthenticated()) {
    await initCmsDashboard();
  }
});

/* ==========================================================================
   1. GÜVENLİK VE GİRİŞ KONTROLÜ (Authentication)
   ========================================================================== */
function isUserAuthenticated() {
  return sessionStorage.getItem('canyapi_admin_auth') === 'true';
}

function initAdminAuth() {
  const overlay = document.getElementById('adminLoginOverlay');
  const loginForm = document.getElementById('adminLoginForm');
  const errorMsg = document.getElementById('loginErrorMsg');
  const logoutBtn = document.getElementById('adminLogoutBtn');

  if (isUserAuthenticated()) {
    if (overlay) overlay.classList.add('hidden');
  } else {
    if (overlay) overlay.classList.remove('hidden');
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const user = document.getElementById('adminUsername')?.value.trim().toLowerCase();
      const pass = document.getElementById('adminPassword')?.value.trim();

      if (user === ADMIN_CREDENTIALS.username && ADMIN_CREDENTIALS.passwords.includes(pass)) {
        sessionStorage.setItem('canyapi_admin_auth', 'true');
        sessionStorage.setItem('canyapi_cms_token', pass);

        // PHP Auth API'sine de bildirmeyi dene
        try {
          await fetch('api/auth.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
          });
        } catch (err) {}

        if (errorMsg) errorMsg.style.display = 'none';
        if (overlay) overlay.classList.add('hidden');
        await initCmsDashboard();
        window.showToast?.('Yönetim paneline başarıyla giriş yapıldı.', 'success');
      } else {
        if (errorMsg) {
          errorMsg.style.display = 'block';
          errorMsg.textContent = 'Kullanıcı adı veya şifre hatalı. Lütfen kontrol ediniz.';
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function() {
      sessionStorage.removeItem('canyapi_admin_auth');
      sessionStorage.removeItem('canyapi_cms_token');
      try {
        await fetch('api/auth.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout' })
        });
      } catch (err) {}

      if (overlay) {
        overlay.classList.remove('hidden');
        const passInput = document.getElementById('adminPassword');
        if (passInput) passInput.value = '';
      }
      window.showToast?.('Güvenli çıkış yapıldı.', 'info');
    });
  }
}

/* ==========================================================================
   2. DASHBOARD BAŞLATMA & SEKME YÖNETİMİ
   ========================================================================== */
async function initCmsDashboard() {
  setupTabs();
  checkApiConnection();
  loadMetrics();
  await loadAllData();
  setupEventListeners();
}

function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', function() {
      const tabId = this.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Son aktif sekmeyi hatırla
  const lastTab = localStorage.getItem('canyapi_active_tab') || 'tab-dashboard';
  switchTab(lastTab);
}

window.switchTab = function(tabId) {
  const targetBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabId}"]`);
  const targetPanel = document.getElementById(tabId);
  if (!targetPanel) return;

  document.querySelectorAll('.nav-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content-panel').forEach(p => p.classList.remove('active'));

  if (targetBtn) targetBtn.classList.add('active');
  targetPanel.classList.add('active');
  localStorage.setItem('canyapi_active_tab', tabId);
};

async function checkApiConnection() {
  const badge = document.getElementById('apiStatusBadge');
  if (!badge) return;

  const isServer = await window.CmsClient.detectServerApi();
  if (isServer) {
    badge.className = 'badge-status active';
    badge.innerHTML = '🟢 Sunucu API Bağlı (Hosting)';
  } else {
    badge.className = 'badge-status inactive';
    badge.innerHTML = '🟡 Yerel / Önizleme Modu (Hostingde Otomatik Bağlanır)';
  }
}

async function loadAllData() {
  try {
    currentSettings = await window.CmsClient.getSettings();
    currentProjects = await window.CmsClient.getProjects();
    currentServices = await window.CmsClient.getServices();
    currentBlog = await window.CmsClient.getBlogPosts();

    // Sayaçları ve arayüzü güncelle
    updateCounts();
    renderProjectsTable();
    renderServicesTable();
    renderBlogTable();
    populateSiteTexts();
    loadSocialSettings();
    loadLeads();
    loadMediaGallery();
  } catch (err) {
    console.error('Veriler yüklenirken hata:', err);
  }
}

function updateCounts() {
  const pCount = document.getElementById('countProjects');
  const sCount = document.getElementById('countServices');
  const bCount = document.getElementById('countBlog');
  if (pCount) pCount.innerText = currentProjects.length;
  if (sCount) sCount.innerText = currentServices.length;
  if (bCount) bCount.innerText = currentBlog.length;
}

/* ==========================================================================
   3. PROJELER YÖNETİMİ (CRUD & ÇOKLU GÖRSEL SLIDER)
   ========================================================================== */
let currentModalProjectImages = [];

function renderProjectsTable() {
  const tbody = document.getElementById('projectsTableBody');
  if (!tbody) return;

  if (currentProjects.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 30px;">Henüz kayıtlı proje yok. "+ Yeni Proje Ekle" butonuna tıklayarak ekleyebilirsiniz.</td></tr>';
    return;
  }

  tbody.innerHTML = currentProjects.map((p, idx) => {
    const spec1 = p.specs && p.specs[0] ? p.specs[0].val : (p.description ? p.description.slice(0, 30) + '...' : '-');
    const imgCount = (p.images && p.images.length) ? p.images.length : (p.image ? 1 : 0);
    return `
      <tr>
        <td>
          <div style="position: relative; width: 50px; height: 50px;">
            <img src="${p.image || 'images/real/proje-luks-mutfak.jpg'}" alt="${p.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid var(--admin-border);" onerror="this.src='images/logo.png'">
            <span style="position: absolute; bottom: 0; right: 0; background: rgba(0,0,0,0.8); color: #FFF; font-size: 0.65rem; padding: 1px 4px; border-radius: 3px; font-weight: 700;">${imgCount} 📷</span>
          </div>
        </td>
        <td>
          <strong style="color: #FFF; font-size: 0.95rem;">${p.title}</strong>
        </td>
        <td><span class="badge-service">${p.category || 'Tadilat'}</span></td>
        <td><span class="text-muted">${p.location || 'Antalya'}</span></td>
        <td><small style="color: #A78BFA;">${spec1}</small></td>
        <td style="text-align: right; white-space: nowrap;">
          <button onclick="editProject('${p.id}')" class="btn btn-sm btn-outline" style="padding: 4px 10px; font-size: 0.78rem;">Düzenle / Fotoğraflar</button>
          <button onclick="deleteProject('${p.id}')" class="btn btn-sm" style="padding: 4px 10px; font-size: 0.78rem; background: #FF3333; color: white;">Sil</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderModalProjectImages() {
  const container = document.getElementById('projImagesPreviewList');
  const jsonInput = document.getElementById('projImagesJson');
  if (!container) return;

  if (jsonInput) jsonInput.value = JSON.stringify(currentModalProjectImages);

  if (currentModalProjectImages.length === 0) {
    container.innerHTML = '<span class="text-muted" style="font-size: 0.8rem; padding: 6px;">Henüz çoklu fotoğraf eklenmedi. "Çoklu Fotoğraf Ekle" butonuyla şantiyeden çektiğiniz birden fazla fotoğrafı ekleyebilirsiniz.</span>';
    return;
  }

  const currentCover = document.getElementById('projImage')?.value.trim();
  container.innerHTML = currentModalProjectImages.map((imgUrl, i) => {
    const isCover = currentCover === imgUrl;
    return `
      <div onclick="selectAndCropProjectImage('${imgUrl}')" style="cursor: pointer; position: relative; width: 68px; height: 68px; border-radius: 6px; overflow: hidden; border: 2px solid ${isCover ? 'var(--primary-orange, #FF5500)' : 'var(--admin-border)'}; background: #000;" title="Kapak Olarak Seç ve Çerçevele">
        <img src="${normalizeImageUrl(imgUrl)}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/logo.webp'">
        <button type="button" onclick="event.stopPropagation(); removeModalProjectImage(${i})" style="position: absolute; top: 2px; right: 2px; background: rgba(255,0,0,0.85); color: white; border: none; width: 18px; height: 18px; border-radius: 50%; font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1;" title="Fotoğrafı Kaldır">✕</button>
        <span style="position: absolute; bottom: 2px; left: 2px; background: rgba(0,0,0,0.75); color: #FFF; font-size: 9px; padding: 1px 4px; border-radius: 2px; display: flex; align-items: center; gap: 2px;">
          ${i+1} ✂️
        </span>
      </div>
    `;
  }).join('');
}

window.removeModalProjectImage = function(index) {
  currentModalProjectImages.splice(index, 1);
  renderModalProjectImages();
  if (currentModalProjectImages.length > 0) {
    const mainImg = document.getElementById('projImage');
    if (mainImg) mainImg.value = currentModalProjectImages[0];
  }
};

window.openProjectModal = function(id = null) {
  const modal = document.getElementById('projectModal');
  const title = document.getElementById('projectModalTitle');
  const form = document.getElementById('projectForm');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('projId').value = '';
  currentModalProjectImages = [];

  if (id) {
    const p = currentProjects.find(item => item.id === id);
    if (p) {
      title.innerText = 'Projeyi Düzenle & Fotoğrafları Yönet';
      document.getElementById('projId').value = p.id;
      document.getElementById('projTitle').value = p.title || '';
      document.getElementById('projCategory').value = p.category || 'Tadilat';
      document.getElementById('projLocation').value = p.location || '';
      document.getElementById('projImage').value = p.image || '';
      document.getElementById('projDesc').value = p.description || '';
      document.getElementById('projSpec1').value = p.specs && p.specs[0] ? p.specs[0].val : '';
      document.getElementById('projSpec2').value = p.specs && p.specs[1] ? p.specs[1].val : '';

      if (Array.isArray(p.images) && p.images.length > 0) {
        currentModalProjectImages = [...p.images];
      } else if (p.image) {
        currentModalProjectImages = [p.image];
      }
    }
  } else {
    title.innerText = 'Yeni Proje Ekle';
    document.getElementById('projLocation').value = 'Muratpaşa / Antalya';
    currentModalProjectImages = [];
  }

  renderModalProjectImages();
  modal.classList.remove('hidden');
};

window.closeProjectModal = function() {
  const modal = document.getElementById('projectModal');
  if (modal) modal.classList.add('hidden');
};

window.editProject = function(id) {
  window.openProjectModal(id);
};

window.deleteProject = async function(id) {
  if (confirm('Bu projeyi silmek istediğinize emin misiniz?')) {
    await window.CmsClient.deleteProject(id);
    currentProjects = await window.CmsClient.getProjects();
    renderProjectsTable();
    updateCounts();
    window.showToast?.('Proje başarıyla silindi.', 'info');
  }
};

/* ==========================================================================
   4. HİZMETLER VE SAYFA ALTI GRİD GALERİ YÖNETİMİ
   ========================================================================== */
function renderServicesTable() {
  const tbody = document.getElementById('servicesTableBody');
  if (!tbody) return;

  if (currentServices.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted" style="padding: 30px;">Kayıtlı hizmet bulunamadı.</td></tr>';
    return;
  }

  tbody.innerHTML = currentServices.map(s => {
    const galleryCount = (s.gallery && Array.isArray(s.gallery)) ? s.gallery.length : 0;
    return `
      <tr>
        <td>
          <img src="${s.image || 'images/services/tadilat/tadilat-1.jpg'}" alt="${s.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid var(--admin-border);" onerror="this.src='images/logo.png'">
        </td>
        <td>
          <strong style="color: #FFF; font-size: 0.95rem;">${s.title}</strong>
        </td>
        <td><small class="text-muted">${(s.shortDesc || '').slice(0, 60)}...</small></td>
        <td>
          <span style="color: #00E676; font-size: 0.8rem; font-weight: 600;">${galleryCount} Fotoğraf</span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <button onclick="openServiceGalleryModal('${s.id}')" class="btn btn-sm btn-outline-orange" style="padding: 4px 10px; font-size: 0.78rem;" title="Sayfa altındaki grid galeri fotoğraflarını yönet">
            🖼️ Alt Grid Galeri (${galleryCount})
          </button>
          <button onclick="editService('${s.id}')" class="btn btn-sm btn-outline" style="padding: 4px 10px; font-size: 0.78rem;">Düzenle</button>
          <button onclick="deleteService('${s.id}')" class="btn btn-sm" style="padding: 4px 10px; font-size: 0.78rem; background: #FF3333; color: white;">Sil</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Hizmet Sayfa Altı Grid Galeri Modalı Fonksiyonları
window.openServiceGalleryModal = function(serviceId) {
  const modal = document.getElementById('serviceGalleryModal');
  const s = currentServices.find(item => item.id === serviceId);
  if (!modal || !s) return;

  document.getElementById('servGalleryServiceId').value = s.id;
  document.getElementById('servGalleryTitle').innerText = `${s.title} — Sayfa Altı Grid Galeri Fotoğrafları`;

  renderServiceGalleryGrid(s);
  modal.classList.remove('hidden');
};

window.closeServiceGalleryModal = function() {
  const modal = document.getElementById('serviceGalleryModal');
  if (modal) modal.classList.add('hidden');
};

function renderServiceGalleryGrid(service) {
  const container = document.getElementById('servGalleryGrid');
  if (!container) return;

  const gallery = Array.isArray(service.gallery) ? service.gallery : [];

  if (gallery.length === 0) {
    container.innerHTML = '<div class="text-muted" style="grid-column: 1/-1; padding: 30px; text-align: center;">Bu hizmetin sayfa altı galerisinde henüz fotoğraf yok. Yukarıdaki "+ Fotoğrafları Seç & Yükle" butonunu kullanarak şantiyeden çektiğiniz fotoğrafları ekleyebilirsiniz.</div>';
    return;
  }

  container.innerHTML = gallery.map((imgUrl, idx) => `
    <div style="position: relative; aspect-ratio: 1; border-radius: 8px; overflow: hidden; border: 1px solid var(--admin-border); background: #000;">
      <img src="${imgUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='images/logo.png'">
      <div style="position: absolute; inset: 0; background: rgba(0,0,0,0.6); opacity: 0; transition: opacity 0.2s; display: flex; align-items: center; justify-content: center;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0'">
        <button type="button" onclick="removePhotoFromService('${service.id}', ${idx})" class="btn btn-sm" style="background: #FF3333; color: white; padding: 4px 8px; font-size: 0.75rem;">Fotoğrafı Sil</button>
      </div>
      <span style="position: absolute; bottom: 4px; left: 6px; background: rgba(0,0,0,0.7); color: #FFF; font-size: 10px; padding: 1px 5px; border-radius: 3px;">#${idx+1}</span>
    </div>
  `).join('');
}

window.removePhotoFromService = async function(serviceId, photoIndex) {
  const s = currentServices.find(item => item.id === serviceId);
  if (!s || !Array.isArray(s.gallery)) return;

  if (confirm("Bu fotoğrafı hizmetin sayfasındaki galeriden kaldırmak istediğinize emin misiniz?")) {
    s.gallery.splice(photoIndex, 1);
    await window.CmsClient.saveService(s);
    currentServices = await window.CmsClient.getServices();
    renderServiceGalleryGrid(s);
    renderServicesTable();
    window.showToast?.('Fotoğraf hizmet galerisinden kaldırıldı.', 'info');
  }
};

window.openServiceModal = function(id = null) {
  const modal = document.getElementById('serviceModal');
  const title = document.getElementById('serviceModalTitle');
  const form = document.getElementById('serviceForm');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('servId').value = '';

  if (id) {
    const s = currentServices.find(item => item.id === id);
    if (s) {
      title.innerText = 'Hizmeti Düzenle';
      document.getElementById('servId').value = s.id;
      document.getElementById('servTitle').value = s.title || '';
      document.getElementById('servImage').value = s.image || '';
      document.getElementById('servShortDesc').value = s.shortDesc || '';
      document.getElementById('servFullDesc').value = s.fullDesc || '';
      document.getElementById('servFeatures').value = Array.isArray(s.features) ? s.features.join(', ') : '';
    }
  } else {
    title.innerText = 'Yeni Hizmet Ekle';
  }

  modal.classList.remove('hidden');
};

window.closeServiceModal = function() {
  const modal = document.getElementById('serviceModal');
  if (modal) modal.classList.add('hidden');
};

window.editService = function(id) {
  window.openServiceModal(id);
};

window.deleteService = async function(id) {
  if (confirm('Bu hizmeti silmek istediğinize emin misiniz?')) {
    await window.CmsClient.deleteService(id);
    currentServices = await window.CmsClient.getServices();
    renderServicesTable();
    updateCounts();
    window.showToast?.('Hizmet silindi.', 'info');
  }
};

/* ==========================================================================
   5. BLOG & MAKALELER YÖNETİMİ (CRUD)
   ========================================================================== */
function renderBlogTable() {
  const tbody = document.getElementById('blogTableBody');
  if (!tbody) return;

  if (currentBlog.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 30px;">Henüz blog yazısı eklenmemiş. "+ Yeni Blog Yazısı Ekle" butonuna tıklayarak ilk makalenizi oluşturabilirsiniz.</td></tr>';
    return;
  }

  tbody.innerHTML = currentBlog.map(b => {
    const isPub = (b.status || 'published') === 'published';
    return `
      <tr>
        <td>
          <img src="${b.coverImage || 'images/real/proje-luks-mutfak.jpg'}" alt="${b.title}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid var(--admin-border);" onerror="this.src='images/logo.png'">
        </td>
        <td>
          <strong style="color: #FFF; font-size: 0.95rem;">${b.title}</strong>
        </td>
        <td><span class="badge-service">${b.category || 'Rehber'}</span></td>
        <td><small class="text-muted">${b.date || '-'}</small></td>
        <td>
          <span class="badge-status ${isPub ? 'active' : 'inactive'}">
            ${isPub ? '✓ Yayında' : 'Taslak'}
          </span>
        </td>
        <td style="text-align: right; white-space: nowrap;">
          <a href="blog-detay.html?slug=${b.slug}" target="_blank" class="btn btn-sm btn-outline" style="padding: 4px 10px; font-size: 0.78rem;">Önizle</a>
          <button onclick="editBlog('${b.id}')" class="btn btn-sm btn-outline" style="padding: 4px 10px; font-size: 0.78rem;">Düzenle</button>
          <button onclick="deleteBlog('${b.id}')" class="btn btn-sm" style="padding: 4px 10px; font-size: 0.78rem; background: #FF3333; color: white;">Sil</button>
        </td>
      </tr>
    `;
  }).join('');
}

window.openBlogModal = function(id = null) {
  const modal = document.getElementById('blogModal');
  const title = document.getElementById('blogModalTitle');
  const form = document.getElementById('blogForm');
  if (!modal || !form) return;

  form.reset();
  document.getElementById('blogId').value = '';

  if (id) {
    const b = currentBlog.find(item => item.id === id);
    if (b) {
      title.innerText = 'Blog Yazısını Düzenle';
      document.getElementById('blogId').value = b.id;
      document.getElementById('blogTitle').value = b.title || '';
      document.getElementById('blogCategory').value = b.category || 'Tadilat Rehberi';
      document.getElementById('blogStatus').value = b.status || 'published';
      document.getElementById('blogCoverImage').value = b.coverImage || '';
      document.getElementById('blogExcerpt').value = b.excerpt || '';
      document.getElementById('blogContent').value = b.content || '';
    }
  } else {
    title.innerText = 'Yeni Blog Yazısı Ekle';
    document.getElementById('blogCategory').value = 'Tadilat Rehberi';
  }

  modal.classList.remove('hidden');
};

window.closeBlogModal = function() {
  const modal = document.getElementById('blogModal');
  if (modal) modal.classList.add('hidden');
};

window.editBlog = function(id) {
  window.openBlogModal(id);
};

window.deleteBlog = async function(id) {
  if (confirm('Bu blog yazısını silmek istediğinize emin misiniz?')) {
    await window.CmsClient.deleteBlogPost(id);
    currentBlog = await window.CmsClient.getBlogPosts();
    renderBlogTable();
    updateCounts();
    window.showToast?.('Blog yazısı silindi.', 'info');
  }
};

/* ==========================================================================
   6. SİTE GENEL METİNLERİ
   ========================================================================== */
function populateSiteTexts() {
  if (!currentSettings) return;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.value = val;
  };

  setVal('settingPhone', currentSettings.phone);
  setVal('settingWhatsapp', currentSettings.whatsapp);
  setVal('settingEmail', currentSettings.email);
  setVal('settingAddress', currentSettings.address);
  setVal('settingWorkingHours', currentSettings.workingHours);
  setVal('settingHeroTitle', currentSettings.heroTitle);
  setVal('settingHeroSubtitle', currentSettings.heroSubtitle);
  setVal('settingExperienceYears', currentSettings.experienceYears || '15+ Yıl');
  setVal('settingAboutTitle', currentSettings.aboutTitle);
  setVal('settingAboutExcerpt', currentSettings.aboutExcerpt);
  setVal('settingAboutStoryTitle', currentSettings.aboutStoryTitle);
  setVal('settingAboutStory', currentSettings.aboutStory);
  setVal('settingAboutPhilosophyTitle', currentSettings.aboutPhilosophyTitle);
  setVal('settingAboutPhilosophy', currentSettings.aboutPhilosophy);
}

/* ==========================================================================
   7. FOTOĞRAF / MEDYA YÜKLEYİCİ
   ========================================================================== */
async function loadMediaGallery() {
  const container = document.getElementById('mediaGalleryContainer');
  const countEl = document.getElementById('countMedia');
  if (!container) return;

  const mediaList = await window.CmsClient.getMediaList();
  if (countEl) countEl.innerText = mediaList.length;

  if (mediaList.length === 0) {
    container.innerHTML = '<div class="text-muted" style="grid-column: 1/-1; padding: 20px; font-size: 0.88rem;">Henüz sunucuya yüklenmiş görsel bulunmuyor. Yukarıdaki alandan fotoğraf yükleyebilirsiniz.</div>';
    return;
  }

  container.innerHTML = mediaList.map(item => `
    <div class="media-item">
      <img src="${item.url}" alt="${item.name}" loading="lazy">
      <div class="media-item-overlay">
        <button onclick="copyMediaUrl('${item.url}')" class="btn btn-sm btn-primary" style="padding: 4px 8px; font-size: 0.75rem;">Kopyala</button>
        <button onclick="deleteMediaItem('${item.name}')" class="btn btn-sm" style="padding: 4px 8px; font-size: 0.75rem; background: #DC2626; color: white;">Sil</button>
      </div>
    </div>
  `).join('');
}

window.copyMediaUrl = function(url) {
  navigator.clipboard.writeText(url).then(() => {
    window.showToast?.('Görsel bağlantısı panoya kopyalandı!', 'success');
  });
};

window.deleteMediaItem = async function(filename) {
  if (confirm(`"${filename}" adlı görseli sunucudan kalıcı olarak silmek istediğinize emin misiniz?`)) {
    const res = await window.CmsClient.deleteMedia(filename);
    if (res && res.success) {
      window.showToast?.('Görsel sunucudan silindi.', 'success');
      await loadMediaGallery();
    } else {
      window.showToast?.(res?.message || 'Silme işlemi gerçekleştirilemedi.', 'error');
    }
  }
};

/* ==========================================================================
   8. FORM OLAY DİNLEYİCİLERİ & YÜKLEMELER
   ========================================================================== */
function setupEventListeners() {
  // 1. Proje Formu
  const projForm = document.getElementById('projectForm');
  if (projForm) {
    projForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const id = document.getElementById('projId').value;
      const mainCover = document.getElementById('projImage').value.trim();
      let images = Array.isArray(currentModalProjectImages) ? [...currentModalProjectImages] : [];
      if (mainCover && !images.includes(mainCover)) {
        images.unshift(mainCover);
      }
      if (images.length === 0 && mainCover) {
        images = [mainCover];
      }

      const projectData = {
        id: id || undefined,
        title: document.getElementById('projTitle').value.trim(),
        category: document.getElementById('projCategory').value,
        location: document.getElementById('projLocation').value.trim(),
        image: mainCover || (images[0] || 'images/real/proje-luks-mutfak.jpg'),
        images: images,
        description: document.getElementById('projDesc').value.trim(),
        specs: [
          { label: 'Özellik', val: document.getElementById('projSpec1').value.trim() || 'Kusursuz İşçilik', isPassed: true },
          { label: 'Durum', val: document.getElementById('projSpec2').value.trim() || 'Tamamlandı', isPassed: false }
        ]
      };

      await window.CmsClient.saveProject(projectData);
      currentProjects = await window.CmsClient.getProjects();
      renderProjectsTable();
      updateCounts();
      closeProjectModal();
      window.showToast?.('Proje ve çoklu fotoğrafları kaydedildi!', 'success');
    });
  }

  // Proje Tekil Görsel Yükleme (Anında Önizleme & Çerçeveleyici)
  const projFileInput = document.getElementById('projImageFile');
  if (projFileInput) {
    projFileInput.addEventListener('change', function() {
      if (this.files && this.files[0]) {
        const file = this.files[0];
        const localBlobUrl = URL.createObjectURL(file);
        openImageCropperModal(localBlobUrl, null, file);
      }
    });
  }

  // Çerçeveleyici Butonu (Görsel yoksa dosya seçiciyi anında açar)
  const btnOpenCropper = document.getElementById('btnOpenCropper');
  if (btnOpenCropper) {
    btnOpenCropper.addEventListener('click', function() {
      const currentUrl = document.getElementById('projImage')?.value.trim();
      if (!currentUrl) {
        const fileInput = document.getElementById('projImageFile');
        if (fileInput) fileInput.click();
        return;
      }
      openImageCropperModal(currentUrl);
    });
  }

  // Proje Çoklu Fotoğraf Yükleme (Kaydırmalı Slider İçin)
  const projMultiFiles = document.getElementById('projMultiImageFiles');
  if (projMultiFiles) {
    projMultiFiles.addEventListener('change', async function() {
      if (this.files && this.files.length > 0) {
        window.showToast?.(`${this.files.length} fotoğraf yükleniyor...`, 'info');
        for (let i = 0; i < this.files.length; i++) {
          const res = await window.CmsClient.uploadPhoto(this.files[i]);
          if (res.success && res.url) {
            currentModalProjectImages.push(res.url);
          }
        }
        if (currentModalProjectImages.length > 0) {
          const mainImg = document.getElementById('projImage');
          if (mainImg && !mainImg.value) mainImg.value = currentModalProjectImages[0];
        }
        renderModalProjectImages();
        window.showToast?.('Fotoğraflar projeye eklendi!', 'success');
      }
    });
  }

  // Hizmet Sayfa Altı Grid Galeri Fotoğraf Yükleme
  const servGalleryFileInput = document.getElementById('servGalleryFileInput');
  if (servGalleryFileInput) {
    servGalleryFileInput.addEventListener('change', async function() {
      const serviceId = document.getElementById('servGalleryServiceId')?.value;
      const s = currentServices.find(item => item.id === serviceId);
      if (!s || !this.files || this.files.length === 0) return;

      if (!Array.isArray(s.gallery)) s.gallery = [];

      window.showToast?.(`${this.files.length} fotoğraf hizmet galerisine yükleniyor...`, 'info');
      for (let i = 0; i < this.files.length; i++) {
        const res = await window.CmsClient.uploadPhoto(this.files[i]);
        if (res.success && res.url) {
          s.gallery.push(res.url);
        }
      }

      await window.CmsClient.saveService(s);
      currentServices = await window.CmsClient.getServices();
      renderServiceGalleryGrid(s);
      renderServicesTable();
      window.showToast?.('Fotoğraflar hizmetin alt galerisine başarıyla eklendi!', 'success');
    });
  }

  // 2. Hizmet Formu
  const servForm = document.getElementById('serviceForm');
  if (servForm) {
    servForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const id = document.getElementById('servId').value;
      const featStr = document.getElementById('servFeatures').value.trim();
      const features = featStr ? featStr.split(',').map(s => s.trim()).filter(Boolean) : [];

      const serviceData = {
        id: id || undefined,
        title: document.getElementById('servTitle').value.trim(),
        image: document.getElementById('servImage').value.trim(),
        shortDesc: document.getElementById('servShortDesc').value.trim(),
        fullDesc: document.getElementById('servFullDesc').value.trim(),
        features: features
      };

      await window.CmsClient.saveService(serviceData);
      currentServices = await window.CmsClient.getServices();
      renderServicesTable();
      updateCounts();
      closeServiceModal();
      window.showToast?.('Hizmet kaydedildi!', 'success');
    });
  }

  const servFileInput = document.getElementById('servImageFile');
  if (servFileInput) {
    servFileInput.addEventListener('change', async function() {
      if (this.files && this.files[0]) {
        window.showToast?.('Fotoğraf yükleniyor...', 'info');
        const res = await window.CmsClient.uploadPhoto(this.files[0]);
        if (res.success && res.url) {
          document.getElementById('servImage').value = res.url;
          window.showToast?.('Fotoğraf yüklendi!', 'success');
        }
      }
    });
  }

  // 3. Blog Formu
  const blogForm = document.getElementById('blogForm');
  if (blogForm) {
    blogForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      const id = document.getElementById('blogId').value;
      const blogData = {
        id: id || undefined,
        title: document.getElementById('blogTitle').value.trim(),
        category: document.getElementById('blogCategory').value.trim(),
        status: document.getElementById('blogStatus').value,
        coverImage: document.getElementById('blogCoverImage').value.trim(),
        excerpt: document.getElementById('blogExcerpt').value.trim(),
        content: document.getElementById('blogContent').value.trim()
      };

      await window.CmsClient.saveBlogPost(blogData);
      currentBlog = await window.CmsClient.getBlogPosts();
      renderBlogTable();
      updateCounts();
      closeBlogModal();
      window.showToast?.('Blog yazısı başarıyla kaydedildi!', 'success');
    });
  }

  const blogFileInput = document.getElementById('blogCoverFile');
  if (blogFileInput) {
    blogFileInput.addEventListener('change', async function() {
      if (this.files && this.files[0]) {
        window.showToast?.('Fotoğraf yükleniyor...', 'info');
        const res = await window.CmsClient.uploadPhoto(this.files[0]);
        if (res.success && res.url) {
          document.getElementById('blogCoverImage').value = res.url;
          window.showToast?.('Fotoğraf yüklendi!', 'success');
        }
      }
    });
  }

  // 4. Site Genel Metinleri Kaydet
  const saveTextsBtn = document.getElementById('saveSiteTextsBtn');
  if (saveTextsBtn) {
    saveTextsBtn.addEventListener('click', async function(e) {
      e.preventDefault();
      const updatedSettings = Object.assign({}, currentSettings, {
        phone: document.getElementById('settingPhone')?.value.trim() ?? currentSettings.phone,
        phoneRaw: (document.getElementById('settingPhone')?.value || '').replace(/\D/g, ''),
        whatsapp: document.getElementById('settingWhatsapp')?.value.trim() ?? currentSettings.whatsapp,
        whatsappRaw: '90' + (document.getElementById('settingWhatsapp')?.value || '').replace(/\D/g, '').replace(/^0/, '').replace(/^90/, ''),
        email: document.getElementById('settingEmail')?.value.trim() ?? currentSettings.email,
        address: document.getElementById('settingAddress')?.value.trim() ?? currentSettings.address,
        workingHours: document.getElementById('settingWorkingHours')?.value.trim() ?? currentSettings.workingHours,
        heroTitle: document.getElementById('settingHeroTitle')?.value.trim() ?? currentSettings.heroTitle,
        heroSubtitle: document.getElementById('settingHeroSubtitle')?.value.trim() ?? currentSettings.heroSubtitle,
        experienceYears: document.getElementById('settingExperienceYears')?.value.trim() ?? currentSettings.experienceYears ?? '15+ Yıl',
        aboutTitle: document.getElementById('settingAboutTitle')?.value.trim() ?? currentSettings.aboutTitle,
        aboutExcerpt: document.getElementById('settingAboutExcerpt')?.value.trim() ?? currentSettings.aboutExcerpt,
        aboutStoryTitle: document.getElementById('settingAboutStoryTitle')?.value.trim() ?? currentSettings.aboutStoryTitle,
        aboutStory: document.getElementById('settingAboutStory')?.value.trim() ?? currentSettings.aboutStory,
        aboutPhilosophyTitle: document.getElementById('settingAboutPhilosophyTitle')?.value.trim() ?? currentSettings.aboutPhilosophyTitle,
        aboutPhilosophy: document.getElementById('settingAboutPhilosophy')?.value.trim() ?? currentSettings.aboutPhilosophy
      });

      const res = await window.CmsClient.saveSettings(updatedSettings);
      currentSettings = updatedSettings;
      if (res && res.success) {
        window.showToast?.('Hakkımızda ve tüm site metinleri başarıyla güncellendi & yayınlandı!', 'success');
      } else {
        window.showToast?.(res?.message || 'Ayarlar kaydedildi.', 'info');
      }
    });
  }

  // 5. Medya Sürükle Bırak Dropzone
  const dropzone = document.getElementById('mediaDropzone');
  const mediaFileInput = document.getElementById('mediaFileInput');

  if (dropzone && mediaFileInput) {
    dropzone.addEventListener('click', () => mediaFileInput.click());

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleMediaFiles(e.dataTransfer.files);
      }
    });

    mediaFileInput.addEventListener('change', function() {
      if (this.files && this.files.length > 0) {
        handleMediaFiles(this.files);
      }
    });
  }

  async function handleMediaFiles(fileList) {
    window.showToast?.(`${fileList.length} fotoğraf yükleniyor...`, 'info');
    for (let i = 0; i < fileList.length; i++) {
      await window.CmsClient.uploadPhoto(fileList[i]);
    }
    await loadMediaGallery();
    window.showToast?.('Tüm fotoğraflar başarıyla yüklendi!', 'success');
  }

  // 6. CSV Export & Sayaç Sıfırlama
  initAdminActions();
}

/* ==========================================================================
   9. METRİKLER & DETAYLI ZİYARETÇİ ANALİZİ & TALEPLER
   ========================================================================== */
async function loadMetrics() {
  if (!window.CanYapiAnalytics) return;
  const metrics = window.CanYapiAnalytics.getMetrics();
  const monthly = window.CanYapiAnalytics.getMonthlyStats();
  const detailed = window.CanYapiAnalytics.getDetailedAnalytics ? await window.CanYapiAnalytics.getDetailedAnalytics() : null;

  // 1. Üst Genel Metrik Kartları
  const weeklyEl = document.getElementById('metricWeeklyVisitors');
  if (weeklyEl && detailed) weeklyEl.innerText = detailed.weeklyVisitors ?? 0;

  const monthlyEl = document.getElementById('metricMonthlyVisitors');
  const monthNameEl = document.getElementById('metricMonthName');
  const mVisCount = (detailed ? detailed.monthlyVisitors : monthly.uniqueVisitorsCount) ?? 0;
  const mViewsCount = (detailed ? detailed.monthlyPageViews : monthly.pageViewsCount) ?? 0;

  if (monthlyEl) monthlyEl.innerText = mVisCount;
  if (monthNameEl) monthNameEl.innerText = `${monthly.monthLabel} (${mVisCount} Tekil / ${mViewsCount} Sayfa)`;

  const setInner = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val !== undefined ? val : 0;
  };

  const conv = detailed?.conversions || metrics;
  setInner('metricWhatsapp', conv.whatsapp ?? metrics.whatsapp_clicks ?? 0);
  setInner('metricPhone', conv.phone ?? metrics.phone_calls ?? 0);
  setInner('metricForms', conv.forms ?? metrics.form_submissions ?? 0);

  // 2. Detaylı Gösterge Paneli Analitikleri
  if (detailed) {
    setInner('anlTodayVisitors', detailed.todayVisitors);
    const todaySub = document.getElementById('anlTodayViewsSub');
    if (todaySub) todaySub.innerText = `Bugün: ${detailed.todayPageViews} gösterim`;

    setInner('anlWeeklyVisitors', detailed.weeklyVisitors);
    const weeklySub = document.getElementById('anlWeeklyViewsSub');
    if (weeklySub) weeklySub.innerText = `Son 7 gün: ${detailed.weeklyPageViews} gösterim`;

    setInner('anlMonthlyVisitors', detailed.monthlyVisitors);
    const monthlySub = document.getElementById('anlMonthlyViewsSub');
    if (monthlySub) monthlySub.innerText = `Bu ay: ${detailed.monthlyPageViews} gösterim`;

    setInner('anlTotalViews', detailed.monthlyPageViews);
    
    const convEl = document.getElementById('anlConversionRate');
    if (convEl) convEl.innerText = detailed.conversionRate || '%5.4';

    const durEl = document.getElementById('anlAvgDuration');
    if (durEl) durEl.innerText = detailed.avgDuration || '2 dk 48 sn';

    // Cihaz Dağılım Barları
    const deviceContainer = document.getElementById('anlDeviceBars');
    if (deviceContainer && detailed.devices) {
      const dev = detailed.devices;
      deviceContainer.innerHTML = `
        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 5px;">
            <span style="color: #FFF;">📱 Akıllı Telefon (Mobil)</span>
            <span style="color: #10B981; font-weight: 700;">%${dev.mobile.pct} (${dev.mobile.count} ziyaret)</span>
          </div>
          <div style="background: rgba(255,255,255,0.08); height: 7px; border-radius: 4px; overflow: hidden;">
            <div style="width: ${dev.mobile.pct}%; height: 100%; background: #10B981; border-radius: 4px;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 5px;">
            <span style="color: #FFF;">💻 Bilgisayar (Masaüstü)</span>
            <span style="color: #38BDF8; font-weight: 700;">%${dev.desktop.pct} (${dev.desktop.count} ziyaret)</span>
          </div>
          <div style="background: rgba(255,255,255,0.08); height: 7px; border-radius: 4px; overflow: hidden;">
            <div style="width: ${dev.desktop.pct}%; height: 100%; background: #38BDF8; border-radius: 4px;"></div>
          </div>
        </div>

        <div>
          <div style="display: flex; justify-content: space-between; font-size: 0.82rem; margin-bottom: 5px;">
            <span style="color: #FFF;">📲 Tablet</span>
            <span style="color: #A78BFA; font-weight: 700;">%${dev.tablet.pct} (${dev.tablet.count} ziyaret)</span>
          </div>
          <div style="background: rgba(255,255,255,0.08); height: 7px; border-radius: 4px; overflow: hidden;">
            <div style="width: ${dev.tablet.pct}%; height: 100%; background: #A78BFA; border-radius: 4px;"></div>
          </div>
        </div>
      `;
    }

    // Trafik Kaynakları
    const sourcesContainer = document.getElementById('anlTrafficSources');
    if (sourcesContainer && Array.isArray(detailed.sources)) {
      sourcesContainer.innerHTML = detailed.sources.map(s => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 7px 10px; background: rgba(255,255,255,0.03); border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 1rem;">${s.icon}</span>
            <span style="font-size: 0.82rem; color: #FFF;">${s.name}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.78rem; color: var(--text-muted);">${s.count} giriş</span>
            <span style="font-size: 0.74rem; font-weight: 700; color: ${s.color}; background: rgba(255,255,255,0.06); padding: 2px 7px; border-radius: 10px;">%${s.pct}</span>
          </div>
        </div>
      `).join('');
    }

    // En Çok Ziyaret Edilen Sayfalar
    const pagesTbody = document.getElementById('anlTopPagesBody');
    if (pagesTbody && Array.isArray(detailed.topPages)) {
      pagesTbody.innerHTML = detailed.topPages.map(p => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.04);">
          <td style="padding: 9px 6px;">
            <div style="font-weight: 600; color: #FFF; font-size: 0.84rem;">${p.title}</div>
            <div style="font-size: 0.72rem; color: var(--text-muted);">${p.path}</div>
          </td>
          <td style="padding: 9px 6px; text-align: center; font-weight: 700; color: #38BDF8;">${p.count}</td>
          <td style="padding: 9px 6px; text-align: right;">
            <span style="background: rgba(56, 189, 248, 0.12); color: #38BDF8; font-size: 0.74rem; font-weight: 700; padding: 2px 6px; border-radius: 4px;">%${p.pct}</span>
          </td>
        </tr>
      `).join('');
    }

    // Son Ziyaretçi Etkileşim Akışı
    const feedContainer = document.getElementById('anlRecentActivityFeed');
    if (feedContainer && Array.isArray(detailed.recentActivity)) {
      feedContainer.innerHTML = detailed.recentActivity.map(act => `
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: rgba(255,255,255,0.02); border-left: 3px solid ${act.color || 'var(--primary-orange)'}; border-radius: 4px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 0.84rem; font-weight: 700; color: #FFF;">${act.title}</div>
            <div style="font-size: 0.78rem; color: var(--text-muted);">(${act.page})</div>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 0.75rem; color: var(--text-muted);">${act.device || '📱 Mobil'}</span>
            <span style="font-size: 0.72rem; color: #94A3B8; background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px;">${act.time}</span>
          </div>
        </div>
      `).join('');
    }
  }
}

function loadSocialSettings() {
  const form = document.getElementById('socialLinksForm');
  if (!form) return;

  const social = currentSettings.social || {};
  const platforms = ['instagram', 'facebook', 'tiktok', 'x'];

  platforms.forEach(p => {
    const input = document.getElementById(`input${p.charAt(0).toUpperCase() + p.slice(1)}`);
    const badge = document.getElementById(`badge${p.charAt(0).toUpperCase() + p.slice(1)}`);
    const val = (social[p] || '').trim();

    if (input) input.value = val;
    updateBadgeStatus(badge, val);

    if (input && badge) {
      input.addEventListener('input', () => updateBadgeStatus(badge, input.value.trim()));
    }
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    const updatedSocial = {
      instagram: document.getElementById('inputInstagram')?.value.trim() || '',
      facebook: document.getElementById('inputFacebook')?.value.trim() || '',
      tiktok: document.getElementById('inputTiktok')?.value.trim() || '',
      x: document.getElementById('inputX')?.value.trim() || ''
    };

    currentSettings.social = updatedSocial;
    await window.CmsClient.saveSettings(currentSettings);
    localStorage.setItem('canyapi_social_links', JSON.stringify(updatedSocial));

    platforms.forEach(p => {
      const badge = document.getElementById(`badge${p.charAt(0).toUpperCase() + p.slice(1)}`);
      updateBadgeStatus(badge, updatedSocial[p]);
    });

    if (typeof window.initSocialLinks === 'function') {
      window.initSocialLinks();
    }

    window.showToast?.('Sosyal medya bağlantıları kaydedildi!', 'success');
  });
}

function updateBadgeStatus(badge, value) {
  if (!badge) return;
  if (value && value.length > 5) {
    badge.className = 'badge-status active';
    badge.textContent = '✓ Sitede Aktif';
  } else {
    badge.className = 'badge-status inactive';
    badge.textContent = '✕ Sitede Gizli';
  }
}

let currentAdminLeads = [];

async function loadLeads() {
  const leadsContainer = document.getElementById('leadsTableBody');
  const countBadge = document.getElementById('countLeads');
  if (!leadsContainer) return;

  try {
    currentAdminLeads = await window.CmsClient.getLeads();
  } catch (e) {
    currentAdminLeads = JSON.parse(localStorage.getItem('canyapi_leads') || '[]');
  }

  if (countBadge) {
    countBadge.innerText = currentAdminLeads.length;
  }

  if (!currentAdminLeads || currentAdminLeads.length === 0) {
    leadsContainer.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: #94A3B8;">
          Henüz gelen bir teklif veya keşif talebi bulunmuyor. Web sitesinden form gönderildiğinde burada listelenecektir.
        </td>
      </tr>
    `;
    return;
  }

  leadsContainer.innerHTML = currentAdminLeads.map((lead, index) => `
    <tr>
      <td><strong>${lead.id || ('CY-' + (index + 1))}</strong></td>
      <td>${lead.date || '-'}</td>
      <td>
        <div style="font-weight: 600; color: #FFF;">${lead.name || 'İsimsiz'}</div>
        <div style="font-size: 0.8rem; color: #94A3B8;"><a href="tel:${lead.phone}" style="color: var(--primary-orange);">${lead.phone || '-'}</a></div>
      </td>
      <td><span class="badge-service">${lead.service || 'Genel'}</span></td>
      <td>${lead.location || 'Antalya'}</td>
      <td>${lead.isDiscovery ? '<span style="color:#00E676; font-weight:700;">✓ Keşif İstendi</span>' : 'Teklif'}</td>
      <td>
        <select onchange="updateLeadStatus('${lead.id}', this.value)" style="background: #0B0D11; color: #FFF; border: 1px solid var(--admin-border); padding: 5px 8px; border-radius: 4px;">
          <option value="Yeni" ${lead.status === 'Yeni' ? 'selected' : ''}>Yeni</option>
          <option value="Arandı" ${lead.status === 'Arandı' ? 'selected' : ''}>Arandı</option>
          <option value="Keşif Planlandı" ${lead.status === 'Keşif Planlandı' ? 'selected' : ''}>Keşif Planlandı</option>
          <option value="Teklif Verildi" ${lead.status === 'Teklif Verildi' ? 'selected' : ''}>Teklif Verildi</option>
          <option value="Anlaşıldı" ${lead.status === 'Anlaşıldı' ? 'selected' : ''}>Anlaşıldı</option>
          <option value="İptal" ${lead.status === 'İptal' ? 'selected' : ''}>İptal</option>
        </select>
      </td>
      <td>
        <button onclick="viewLeadDetail('${lead.id}')" class="btn btn-sm btn-outline" style="padding: 4px 8px; font-size: 0.75rem;">Detay</button>
        <button onclick="deleteLead('${lead.id}')" class="btn btn-sm" style="padding: 4px 8px; font-size: 0.75rem; background: #FF3333; color: white;">Sil</button>
      </td>
    </tr>
  `).join('');
}

window.updateLeadStatus = async function(id, newStatus) {
  const res = await window.CmsClient.updateLeadStatus(id, newStatus);
  if (res && res.success) {
    window.showToast?.('Talep durumu güncellendi.', 'success');
  } else {
    window.showToast?.(res?.message || 'Güncellenemedi.', 'error');
  }
};

window.deleteLead = async function(id) {
  if (confirm("Bu talebi kalıcı olarak silmek istediğinize emin misiniz?")) {
    const res = await window.CmsClient.deleteLead(id);
    if (res && res.success) {
      window.showToast?.('Talep başarıyla silindi.', 'info');
      await loadLeads();
    } else {
      window.showToast?.(res?.message || 'Silinemedi.', 'error');
    }
  }
};

window.viewLeadDetail = function(id) {
  const lead = currentAdminLeads.find(l => l.id === id);
  if (!lead) return;

  alert(
    `Talep Detayları (${lead.id})\n` +
    `-----------------------------------\n` +
    `Müşteri: ${lead.name}\n` +
    `Telefon: ${lead.phone}\n` +
    `Hizmet: ${lead.service}\n` +
    `Konum: ${lead.location}\n` +
    `Tarih: ${lead.date}\n` +
    `Ücretsiz Keşif Talebi: ${lead.isDiscovery ? 'Evet' : 'Hayır'}\n` +
    `Mesaj / Detay: ${lead.message || lead.notes || '-'}`
  );
};

function initAdminActions() {
  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn && !exportBtn.dataset.bound) {
    exportBtn.dataset.bound = 'true';
    exportBtn.addEventListener('click', function() {
      const leads = JSON.parse(localStorage.getItem('canyapi_leads') || '[]');
      if (leads.length === 0) {
        alert("Dışa aktarılacak talep bulunamadı.");
        return;
      }

      let csv = "ID,Tarih,Ad Soyad,Telefon,Hizmet,Konum,Keşif,Durum,Açıklama\n";
      leads.forEach(l => {
        csv += `"${l.id}","${l.date}","${l.name}","${l.phone}","${l.service}","${l.location}","${l.isDiscovery ? 'Evet' : 'Hayır'}","${l.status}","${(l.notes || '').replace(/"/g, '""')}"\n`;
      });

      const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `CanYapi_Talepler_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  const resetMetricsBtn = document.getElementById('resetMetricsBtn');
  if (resetMetricsBtn && !resetMetricsBtn.dataset.bound) {
    resetMetricsBtn.dataset.bound = 'true';
    resetMetricsBtn.addEventListener('click', function() {
      if (confirm("Tüm ölçüm sayaçlarını sıfırlamak istediğinize emin misiniz?")) {
        window.CanYapiAnalytics.resetMetrics();
        loadMetrics();
        alert("Sayaçlar sıfırlandı.");
      }
    });
  }
}


/* ==========================================================================
   INSTAGRAM TARZI İNTERAKTİF ÇERÇEVELEME & ODAKLAMA MOTORU (Pan & Zoom Cropper)
   ========================================================================== */

function normalizeImageUrl(url) {
  if (!url) return '';
  url = url.trim();
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  return '/' + url.replace(/^\/+/, '');
}
window.normalizeImageUrl = normalizeImageUrl;

window.selectAndCropProjectImage = function(imgUrl) {
  const projInput = document.getElementById('projImage');
  if (projInput) projInput.value = imgUrl;
  renderModalProjectImages();
  window.openImageCropperModal(imgUrl);
};

window.handleOpenCropperClick = function() {
  let currentUrl = document.getElementById('projImage')?.value.trim();
  if (!currentUrl && Array.isArray(currentModalProjectImages) && currentModalProjectImages.length > 0) {
    currentUrl = currentModalProjectImages[0];
    const projInput = document.getElementById('projImage');
    if (projInput) projInput.value = currentUrl;
  }
  if (!currentUrl) {
    const fileInput = document.getElementById('projImageFile');
    if (fileInput) fileInput.click();
    return;
  }
  window.openImageCropperModal(currentUrl);
};

window.handleCropperDirectFile = function(input) {
  if (input.files && input.files[0]) {
    const file = input.files[0];
    const localBlobUrl = URL.createObjectURL(file);
    window.openImageCropperModal(localBlobUrl, null, file);
  }
};

let cropperState = {
  img: null,
  viewport: null,
  slider: null,
  modal: null,
  scale: 1,
  minScale: 1,
  maxScale: 3.5,
  x: 0,
  y: 0,
  isDragging: false,
  startX: 0,
  startY: 0,
  startImgX: 0,
  startImgY: 0,
  naturalW: 0,
  naturalH: 0,
  originalUrl: '',
  pendingFile: null,
  pinchDistance: 0,
  onComplete: null
};

window.openImageCropperModal = function(imageUrl, onComplete, pendingFileObj) {
  const modal = document.getElementById('imageCropperModal');
  const img = document.getElementById('cropperSourceImg');
  const viewport = document.getElementById('cropperViewport');
  const slider = document.getElementById('cropperZoomSlider');

  if (!modal || !img || !viewport) {
    console.error('Cropper elements missing');
    return;
  }

  cropperState.modal = modal;
  cropperState.img = img;
  cropperState.viewport = viewport;
  cropperState.slider = slider;
  cropperState.originalUrl = imageUrl;
  cropperState.pendingFile = pendingFileObj || null;
  cropperState.onComplete = onComplete;

  modal.classList.remove('hidden');

  // Galeri fotoğraflarından hızlı seçim şeridi
  const cropperThumbStrip = document.getElementById('cropperGalleryThumbnails');
  if (cropperThumbStrip) {
    if (Array.isArray(currentModalProjectImages) && currentModalProjectImages.length > 0) {
      cropperThumbStrip.innerHTML = '<span style="font-size:0.75rem;color:#94A3B8;white-space:nowrap;margin-right:4px;">Proje Fotoğrafları:</span>' + currentModalProjectImages.map((u, idx) => `
        <div onclick="window.openImageCropperModal('${u}')" style="cursor:pointer;width:44px;height:44px;border-radius:4px;overflow:hidden;border:2px solid ${u === imageUrl ? 'var(--primary-orange, #FF5500)' : 'rgba(255,255,255,0.2)'};flex-shrink:0;" title="Fotoğraf ${idx+1}">
          <img src="${normalizeImageUrl(u)}" style="width:100%;height:100%;object-fit:cover;">
        </div>
      `).join('');
      cropperThumbStrip.style.display = 'flex';
    } else {
      cropperThumbStrip.style.display = 'none';
    }
  }

  function setupMetrics() {
    cropperState.naturalW = img.naturalWidth || 800;
    cropperState.naturalH = img.naturalHeight || 600;

    const vw = viewport.clientWidth || 560;
    const vh = viewport.clientHeight || 315;

    const scaleX = vw / cropperState.naturalW;
    const scaleY = vh / cropperState.naturalH;
    cropperState.minScale = Math.max(scaleX, scaleY);
    cropperState.scale = cropperState.minScale;
    cropperState.maxScale = Math.max(cropperState.minScale * 3.5, 2.5);

    if (slider) {
      slider.min = (cropperState.minScale * 0.75).toFixed(4);
      slider.max = cropperState.maxScale.toFixed(4);
      slider.step = ((cropperState.maxScale - cropperState.minScale * 0.75) / 100).toFixed(4);
      slider.value = cropperState.scale.toFixed(4);
    }

    cropperState.x = (vw - cropperState.naturalW * cropperState.scale) / 2;
    cropperState.y = (vh - cropperState.naturalH * cropperState.scale) / 2;

    applyCropperTransform();
    initCropperEventsOnce();
  }

  img.onload = setupMetrics;

  img.onerror = function() {
    console.warn('Görsel yüklenemedi:', imageUrl);
    window.showToast?.('Fotoğraf yüklenemedi. Lütfen "Başka Fotoğraf Seç" butonundan görsel seçin.', 'error');
  };

  img.removeAttribute('crossOrigin');

  const resolved = normalizeImageUrl(imageUrl);
  img.src = resolved;

  if (img.complete && img.naturalWidth > 0) {
    setupMetrics();
  }
};

window.closeImageCropperModal = function() {
  const modal = document.getElementById('imageCropperModal');
  if (modal) modal.classList.add('hidden');
};

function clampCropperBounds() {
  if (!cropperState.viewport || !cropperState.naturalW) return;
  const vw = cropperState.viewport.clientWidth;
  const vh = cropperState.viewport.clientHeight;
  const renderedW = cropperState.naturalW * cropperState.scale;
  const renderedH = cropperState.naturalH * cropperState.scale;

  if (renderedW <= vw) {
    cropperState.x = (vw - renderedW) / 2;
  } else {
    const minX = vw - renderedW;
    const maxX = 0;
    cropperState.x = Math.min(maxX, Math.max(minX, cropperState.x));
  }

  if (renderedH <= vh) {
    cropperState.y = (vh - renderedH) / 2;
  } else {
    const minY = vh - renderedH;
    const maxY = 0;
    cropperState.y = Math.min(maxY, Math.max(minY, cropperState.y));
  }
}

function applyCropperTransform() {
  clampCropperBounds();
  if (cropperState.img) {
    cropperState.img.style.transform = "translate(" + cropperState.x + "px, " + cropperState.y + "px) scale(" + cropperState.scale + ")";
  }
}

let cropperEventsInitialized = false;
function initCropperEventsOnce() {
  if (cropperEventsInitialized) return;
  cropperEventsInitialized = true;

  const viewport = document.getElementById('cropperViewport');
  const slider = document.getElementById('cropperZoomSlider');
  const zoomIn = document.getElementById('cropperZoomIn');
  const zoomOut = document.getElementById('cropperZoomOut');
  const resetBtn = document.getElementById('cropperResetBtn');
  const applyBtn = document.getElementById('cropperApplyBtn');

  const alignTop = document.getElementById('cropAlignTop');
  const alignCenter = document.getElementById('cropAlignCenter');
  const alignBottom = document.getElementById('cropAlignBottom');

  if (!viewport) return;

  if (alignTop) {
    alignTop.addEventListener('click', () => {
      cropperState.y = 0;
      applyCropperTransform();
    });
  }
  if (alignCenter) {
    alignCenter.addEventListener('click', () => {
      const vh = viewport.clientHeight;
      const renderedH = cropperState.naturalH * cropperState.scale;
      cropperState.y = (vh - renderedH) / 2;
      applyCropperTransform();
    });
  }
  if (alignBottom) {
    alignBottom.addEventListener('click', () => {
      const vh = viewport.clientHeight;
      const renderedH = cropperState.naturalH * cropperState.scale;
      cropperState.y = vh - renderedH;
      applyCropperTransform();
    });
  }

  viewport.addEventListener('mousedown', function(e) {
    e.preventDefault();
    cropperState.isDragging = true;
    cropperState.startX = e.clientX;
    cropperState.startY = e.clientY;
    cropperState.startImgX = cropperState.x;
    cropperState.startImgY = cropperState.y;
    viewport.style.cursor = 'grabbing';
  });

  window.addEventListener('mousemove', function(e) {
    if (!cropperState.isDragging) return;
    const dx = e.clientX - cropperState.startX;
    const dy = e.clientY - cropperState.startY;
    cropperState.x = cropperState.startImgX + dx;
    cropperState.y = cropperState.startImgY + dy;
    applyCropperTransform();
  });

  window.addEventListener('mouseup', function() {
    if (cropperState.isDragging) {
      cropperState.isDragging = false;
      viewport.style.cursor = 'grab';
    }
  });

  viewport.addEventListener('touchstart', function(e) {
    if (e.touches.length === 1) {
      cropperState.isDragging = true;
      cropperState.startX = e.touches[0].clientX;
      cropperState.startY = e.touches[0].clientY;
      cropperState.startImgX = cropperState.x;
      cropperState.startImgY = cropperState.y;
    } else if (e.touches.length === 2) {
      cropperState.isDragging = false;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      cropperState.pinchDistance = Math.hypot(dx, dy);
    }
  }, { passive: false });

  viewport.addEventListener('touchmove', function(e) {
    if (e.touches.length === 1 && cropperState.isDragging) {
      if (e.cancelable) e.preventDefault();
      const dx = e.touches[0].clientX - cropperState.startX;
      const dy = e.touches[0].clientY - cropperState.startY;
      cropperState.x = cropperState.startImgX + dx;
      cropperState.y = cropperState.startImgY + dy;
      applyCropperTransform();
    } else if (e.touches.length === 2) {
      if (e.cancelable) e.preventDefault();
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (cropperState.pinchDistance > 0) {
        const factor = dist / cropperState.pinchDistance;
        setCropperZoom(cropperState.scale * factor);
      }
      cropperState.pinchDistance = dist;
    }
  }, { passive: false });

  viewport.addEventListener('touchend', function() {
    cropperState.isDragging = false;
    cropperState.pinchDistance = 0;
  });

  viewport.addEventListener('wheel', function(e) {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setCropperZoom(cropperState.scale * factor);
  }, { passive: false });

  function setCropperZoom(newScale) {
    newScale = Math.min(cropperState.maxScale, Math.max(cropperState.minScale * 0.75, newScale));
    const vw = viewport.clientWidth;
    const vh = viewport.clientHeight;

    const centerViewportX = vw / 2;
    const centerViewportY = vh / 2;

    const imgCenterX = (centerViewportX - cropperState.x) / cropperState.scale;
    const imgCenterY = (centerViewportY - cropperState.y) / cropperState.scale;

    cropperState.scale = newScale;
    cropperState.x = centerViewportX - imgCenterX * cropperState.scale;
    cropperState.y = centerViewportY - imgCenterY * cropperState.scale;

    if (slider) slider.value = cropperState.scale.toFixed(4);
    applyCropperTransform();
  }

  if (slider) {
    slider.addEventListener('input', function() {
      setCropperZoom(parseFloat(this.value));
    });
  }

  if (zoomIn) zoomIn.addEventListener('click', () => setCropperZoom(cropperState.scale * 1.15));
  if (zoomOut) zoomOut.addEventListener('click', () => setCropperZoom(cropperState.scale * 0.85));

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      cropperState.scale = cropperState.minScale;
      const vw = viewport.clientWidth;
      const vh = viewport.clientHeight;
      cropperState.x = (vw - cropperState.naturalW * cropperState.scale) / 2;
      cropperState.y = (vh - cropperState.naturalH * cropperState.scale) / 2;
      if (slider) slider.value = cropperState.scale.toFixed(4);
      applyCropperTransform();
    });
  }

  if (applyBtn) {
    applyBtn.addEventListener('click', async function() {
      applyBtn.disabled = true;
      applyBtn.innerHTML = '<span>⏳ Kaydediliyor...</span>';

      try {
        const vw = viewport.clientWidth;
        const vh = viewport.clientHeight;
        const renderedW = cropperState.naturalW * cropperState.scale;
        const scaleRatio = cropperState.naturalW / renderedW;

        const srcX = Math.max(0, -cropperState.x * scaleRatio);
        const srcY = Math.max(0, -cropperState.y * scaleRatio);
        const srcW = Math.min(cropperState.naturalW - srcX, vw * scaleRatio);
        const srcH = Math.min(cropperState.naturalH - srcY, vh * scaleRatio);

        const canvas = document.createElement('canvas');
        canvas.width = 1280;
        canvas.height = 720;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        ctx.drawImage(cropperState.img, srcX, srcY, srcW, srcH, 0, 0, 1280, 720);

        canvas.toBlob(async function(blob) {
          if (!blob) {
            window.showToast?.('Kırpma işlemi başarısız oldu.', 'error');
            applyBtn.disabled = false;
            applyBtn.innerHTML = '<span>✓ Çerçeveyi Kaydet & Uygula</span>';
            return;
          }

          const file = new File([blob], 'thumb_' + Date.now() + '.webp', { type: 'image/webp' });
          const res = await window.CmsClient.uploadPhoto(file);

          if (res && res.success && res.url) {
            const croppedUrl = res.url;
            const projInput = document.getElementById('projImage');
            if (projInput) projInput.value = croppedUrl;

            if (cropperState.pendingFile) {
              window.CmsClient.uploadPhoto(cropperState.pendingFile).then(origRes => {
                if (origRes && origRes.success && origRes.url) {
                  if (!currentModalProjectImages.includes(origRes.url)) {
                    currentModalProjectImages.unshift(origRes.url);
                    renderModalProjectImages();
                  }
                }
              });
            } else if (cropperState.originalUrl && !cropperState.originalUrl.startsWith('blob:')) {
              if (!currentModalProjectImages.includes(cropperState.originalUrl)) {
                currentModalProjectImages.unshift(cropperState.originalUrl);
                renderModalProjectImages();
              }
            }

            renderModalProjectImages();

            if (typeof cropperState.onComplete === 'function') {
              cropperState.onComplete(croppedUrl, cropperState.originalUrl);
            }

            window.showToast?.('Önizleme çerçevesi başarıyla uygulandı!', 'success');
            closeImageCropperModal();
          } else {
            window.showToast?.('Fotoğraf kaydedilemedi.', 'error');
          }

          applyBtn.disabled = false;
          applyBtn.innerHTML = '<span>✓ Çerçeveyi Kaydet & Uygula</span>';
        }, 'image/webp', 0.88);

      } catch (err) {
        console.error('Cropper error:', err);
        window.showToast?.('Hata: ' + err.message, 'error');
        applyBtn.disabled = false;
        applyBtn.innerHTML = '<span>✓ Çerçeveyi Kaydet & Uygula</span>';
      }
    });
  }
}
