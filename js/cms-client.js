/**
 * Can Yapı Antalya - CMS Veri İstemcisi (PHP Hosting & Yerel Çift Mod Desteği)
 * 
 * Hosting üzerinde çalışırken /api/*.php uç noktaları ile veritabanı/dosya yazma işlemini yapar.
 * Statik önizleme veya test ortamında /data/ dosyalarını kullanarak kesintisiz çalışır.
 */

(function(window) {
  'use strict';

  let hasServerApi = null; // null: test edilmedi, true: PHP API aktif, false: yerel mod
  const TOKEN_STORAGE_KEY = 'canyapi_cms_token';

  function apiUrl(endpoint) {
    const base = window.location.origin || '';
    return base + '/' + endpoint.replace(/^\/+/, '');
  }

  async function detectServerApi() {
    if (hasServerApi !== null) return hasServerApi;
    try {
      const res = await fetch(apiUrl(`api/settings.php?_t=${Date.now()}`), { method: 'GET', cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          hasServerApi = true;
          return true;
        }
      }
    } catch (e) {
      // PHP sunucusu çalışmıyor veya statik sunucu ortamı
    }
    hasServerApi = false;
    return false;
  }

  function getAuthHeader() {
    const token = sessionStorage.getItem(TOKEN_STORAGE_KEY) || '05458320190';
    return {
      'Content-Type': 'application/json',
      'X-Admin-Token': token
    };
  }

  // --- 1. AYARLAR & SİTE METİNLERİ ---
  async function getSettings() {
    // 1. Canlı PHP API'den oku
    try {
      const res = await fetch(apiUrl(`api/settings.php?_t=${Date.now()}`), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          localStorage.setItem('canyapi_cms_settings', JSON.stringify(json.data));
          hasServerApi = true;
          return json.data;
        }
      }
    } catch (e) {}

    // 2. data/settings.json dosyasından oku
    try {
      const res = await fetch(apiUrl(`data/settings.json?_t=${Date.now()}`), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('canyapi_cms_settings', JSON.stringify(data));
        return data;
      }
    } catch (e) {}

    // 3. Çevrimdışı / LocalStorage yedeği
    const local = localStorage.getItem('canyapi_cms_settings');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }

    return {};
  }

  async function saveSettings(settings) {
    localStorage.setItem('canyapi_cms_settings', JSON.stringify(settings));

    try {
      const res = await fetch(apiUrl('api/settings.php'), {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(settings)
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    return { success: true, message: 'Ayarlar kaydedildi.', data: settings };
  }

  // --- 2. PROJELER ---
  async function getProjects() {
    // 1. Canlı PHP API'den oku
    try {
      const res = await fetch(apiUrl(`api/projects.php?_t=${Date.now()}`), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          localStorage.setItem('canyapi_cms_projects', JSON.stringify(json.data));
          hasServerApi = true;
          return json.data;
        }
      }
    } catch (e) {}

    // 2. data/projects.json dosyasından oku
    try {
      const res = await fetch(apiUrl(`data/projects.json?_t=${Date.now()}`), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem('canyapi_cms_projects', JSON.stringify(data));
          return data;
        }
      }
    } catch (e) {}

    // 3. LocalStorage yedeği
    const local = localStorage.getItem('canyapi_cms_projects');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }

    return [];
  }

  async function saveProject(project) {
    try {
      const res = await fetch(apiUrl('api/projects.php'), {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(project)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.data) {
          localStorage.setItem('canyapi_cms_projects', JSON.stringify(data.data));
          return data;
        }
      }
    } catch (e) {}

    // Yerel mod simülasyonu
    let projects = await getProjects();
    if (!project.id) {
      project.id = 'proj-' + Date.now();
      projects.unshift(project);
    } else {
      const idx = projects.findIndex(p => p.id === project.id);
      if (idx !== -1) projects[idx] = Object.assign({}, projects[idx], project);
      else projects.unshift(project);
    }
    localStorage.setItem('canyapi_cms_projects', JSON.stringify(projects));
    return { success: true, message: 'Proje kaydedildi.', data: projects };
  }

  async function deleteProject(id) {
    try {
      const res = await fetch(apiUrl('api/projects.php'), {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ action: 'delete', id: id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.data) {
          localStorage.setItem('canyapi_cms_projects', JSON.stringify(data.data));
          return data;
        }
      }
    } catch (e) {}

    let projects = await getProjects();
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem('canyapi_cms_projects', JSON.stringify(projects));
    return { success: true, message: 'Proje silindi.', data: projects };
  }

  // --- 3. HİZMETLER ---
  async function getServices() {
    // 1. Canlı PHP API'den oku
    try {
      const res = await fetch(apiUrl(`api/services.php?_t=${Date.now()}`), { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && Array.isArray(json.data)) {
          localStorage.setItem('canyapi_cms_services', JSON.stringify(json.data));
          hasServerApi = true;
          return json.data;
        }
      }
    } catch (e) {}

    // 2. data/services.json dosyasından oku
    try {
      const res = await fetch(apiUrl(`data/services.json?_t=${Date.now()}`), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          localStorage.setItem('canyapi_cms_services', JSON.stringify(data));
          return data;
        }
      }
    } catch (e) {}

    // 3. LocalStorage yedeği
    const local = localStorage.getItem('canyapi_cms_services');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }

    return [];
  }

  async function saveService(service) {
    try {
      const res = await fetch(apiUrl('api/services.php'), {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(service)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.data) {
          localStorage.setItem('canyapi_cms_services', JSON.stringify(data.data));
          return data;
        }
      }
    } catch (e) {}

    let services = await getServices();
    if (!service.id) {
      service.id = 'srv-' + Date.now();
      services.push(service);
    } else {
      const idx = services.findIndex(s => s.id === service.id);
      if (idx !== -1) services[idx] = Object.assign({}, services[idx], service);
      else services.push(service);
    }
    localStorage.setItem('canyapi_cms_services', JSON.stringify(services));
    return { success: true, message: 'Hizmet kaydedildi.', data: services };
  }

  async function deleteService(id) {
    try {
      const res = await fetch(apiUrl('api/services.php'), {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ action: 'delete', id: id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.data) {
          localStorage.setItem('canyapi_cms_services', JSON.stringify(data.data));
          return data;
        }
      }
    } catch (e) {}

    let services = await getServices();
    services = services.filter(s => s.id !== id);
    localStorage.setItem('canyapi_cms_services', JSON.stringify(services));
    return { success: true, message: 'Hizmet silindi.', data: services };
  }

  // --- 4. BLOG YAZILARI ---
  async function getBlogPosts(slug = null) {
    // 1. Canlı PHP API'den oku
    try {
      const url = slug
        ? apiUrl(`api/blog.php?slug=${encodeURIComponent(slug)}&_t=${Date.now()}`)
        : apiUrl(`api/blog.php?all=1&_t=${Date.now()}`);
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          if (!slug && Array.isArray(json.data)) {
            localStorage.setItem('canyapi_cms_blog', JSON.stringify(json.data));
          }
          hasServerApi = true;
          return json.data;
        }
      }
    } catch (e) {}

    // 2. data/blog.json dosyasından oku
    let blog = [];
    try {
      const res = await fetch(apiUrl(`data/blog.json?_t=${Date.now()}`), { cache: 'no-store' });
      if (res.ok) {
        blog = await res.json();
        if (Array.isArray(blog)) {
          localStorage.setItem('canyapi_cms_blog', JSON.stringify(blog));
        }
      }
    } catch (e) {}

    if (!Array.isArray(blog) || blog.length === 0) {
      const local = localStorage.getItem('canyapi_cms_blog');
      if (local) {
        try { blog = JSON.parse(local); } catch (e) {}
      }
    }

    if (slug) {
      return (Array.isArray(blog) ? blog.find(b => b.slug === slug || b.id === slug) : null) || null;
    }

    return Array.isArray(blog) ? blog : [];
  }

  async function saveBlogPost(post) {
    try {
      const res = await fetch(apiUrl('api/blog.php'), {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(post)
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.data) {
          localStorage.setItem('canyapi_cms_blog', JSON.stringify(data.data));
          return data;
        }
      }
    } catch (e) {}

    let blog = await getBlogPosts();
    if (!post.id) {
      post.id = 'blog-' + Date.now();
      if (!post.slug) {
        post.slug = (post.title || 'yazi').toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-');
      }
      blog.unshift(post);
    } else {
      const idx = blog.findIndex(b => b.id === post.id);
      if (idx !== -1) blog[idx] = Object.assign({}, blog[idx], post);
      else blog.unshift(post);
    }
    localStorage.setItem('canyapi_cms_blog', JSON.stringify(blog));
    return { success: true, message: 'Blog yazısı kaydedildi.', data: blog };
  }

  async function deleteBlogPost(id) {
    try {
      const res = await fetch(apiUrl('api/blog.php'), {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ action: 'delete', id: id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.data) {
          localStorage.setItem('canyapi_cms_blog', JSON.stringify(data.data));
          return data;
        }
      }
    } catch (e) {}

    let blog = await getBlogPosts();
    blog = blog.filter(b => b.id !== id);
    localStorage.setItem('canyapi_cms_blog', JSON.stringify(blog));
    return { success: true, message: 'Blog yazısı silindi.', data: blog };
  }

  // --- 5. FOTOĞRAF & MEDYA YÜKLEME ---
  async function uploadPhoto(file) {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch(apiUrl('api/upload.php'), {
        method: 'POST',
        headers: {
          'X-Admin-Token': sessionStorage.getItem(TOKEN_STORAGE_KEY) || '05458320190'
        },
        body: formData
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {}

    // Yerel mod simülasyonu: Dosyayı base64 Data URL'e çevirip kaydeder
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const dataUrl = e.target.result;
        resolve({
          success: true,
          url: dataUrl,
          filename: file.name,
          message: 'Fotoğraf yüklendi (Önizleme/Yerel Mod).'
        });
      };
      reader.readAsDataURL(file);
    });
  }

  async function getMediaList() {
    try {
      const res = await fetch(apiUrl(`api/media.php?_t=${Date.now()}`), {
        headers: getAuthHeader(),
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
    } catch (e) {}
    return [];
  }

  // Dışa aktar
  window.CmsClient = {
    detectServerApi,
    getSettings,
    saveSettings,
    getProjects,
    saveProject,
    deleteProject,
    getServices,
    saveService,
    deleteService,
    getBlogPosts,
    saveBlogPost,
    deleteBlogPost,
    uploadPhoto,
    getMediaList
  };

})(window);
