/**
 * Can Yapı Antalya - CMS Veri İstemcisi (PHP Hosting & Yerel Çift Mod Desteği)
 * 
 * Hosting üzerinde çalışırken /api/*.php uç noktaları ile veritabanı/dosya yazma işlemini yapar.
 * Statik önizleme veya test ortamında localStorage & data/ dosyalarını kullanarak kesintisiz çalışır.
 */

(function(window) {
  'use strict';

  let hasServerApi = null; // null: test edilmedi, true: PHP API aktif, false: yerel mod
  const TOKEN_STORAGE_KEY = 'canyapi_cms_token';

  async function detectServerApi() {
    if (hasServerApi !== null) return hasServerApi;
    try {
      const res = await fetch('api/settings.php', { method: 'GET', cache: 'no-store' });
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
    const useApi = await detectServerApi();
    if (useApi) {
      try {
        const res = await fetch('api/settings.php', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && json.data) {
          localStorage.setItem('canyapi_cms_settings', JSON.stringify(json.data));
          return json.data;
        }
      } catch (e) {
        console.warn('API settings fetch failed, falling back:', e);
      }
    }

    // Yerel mod veya fallback
    const local = localStorage.getItem('canyapi_cms_settings');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }

    // data/settings.json dosyasından oku
    try {
      const res = await fetch('data/settings.json');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('canyapi_cms_settings', JSON.stringify(data));
        return data;
      }
    } catch (e) {}

    return {};
  }

  async function saveSettings(settings) {
    const useApi = await detectServerApi();
    localStorage.setItem('canyapi_cms_settings', JSON.stringify(settings));

    if (useApi) {
      const res = await fetch('api/settings.php', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(settings)
      });
      return await res.json();
    }

    return { success: true, message: 'Ayarlar yerel olarak kaydedildi.', data: settings };
  }

  // --- 2. PROJELER ---
  async function getProjects() {
    const useApi = await detectServerApi();
    if (useApi) {
      try {
        const res = await fetch('api/projects.php', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          localStorage.setItem('canyapi_cms_projects', JSON.stringify(json.data));
          return json.data;
        }
      } catch (e) {
        console.warn('API projects fetch failed:', e);
      }
    }

    const local = localStorage.getItem('canyapi_cms_projects');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }

    try {
      const res = await fetch('data/projects.json');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('canyapi_cms_projects', JSON.stringify(data));
        return data;
      }
    } catch (e) {}

    return [];
  }

  async function saveProject(project) {
    const useApi = await detectServerApi();
    if (useApi) {
      const res = await fetch('api/projects.php', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(project)
      });
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem('canyapi_cms_projects', JSON.stringify(data.data));
      }
      return data;
    }

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
    return { success: true, message: 'Proje kaydedildi (Yerel Mod).', data: projects };
  }

  async function deleteProject(id) {
    const useApi = await detectServerApi();
    if (useApi) {
      const res = await fetch('api/projects.php', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ action: 'delete', id: id })
      });
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem('canyapi_cms_projects', JSON.stringify(data.data));
      }
      return data;
    }

    let projects = await getProjects();
    projects = projects.filter(p => p.id !== id);
    localStorage.setItem('canyapi_cms_projects', JSON.stringify(projects));
    return { success: true, message: 'Proje silindi.', data: projects };
  }

  // --- 3. HİZMETLER ---
  async function getServices() {
    const useApi = await detectServerApi();
    if (useApi) {
      try {
        const res = await fetch('api/services.php', { cache: 'no-store' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          localStorage.setItem('canyapi_cms_services', JSON.stringify(json.data));
          return json.data;
        }
      } catch (e) {}
    }

    const local = localStorage.getItem('canyapi_cms_services');
    if (local) {
      try { return JSON.parse(local); } catch (e) {}
    }

    try {
      const res = await fetch('data/services.json');
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('canyapi_cms_services', JSON.stringify(data));
        return data;
      }
    } catch (e) {}

    return [];
  }

  async function saveService(service) {
    const useApi = await detectServerApi();
    if (useApi) {
      const res = await fetch('api/services.php', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(service)
      });
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem('canyapi_cms_services', JSON.stringify(data.data));
      }
      return data;
    }

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
    const useApi = await detectServerApi();
    if (useApi) {
      const res = await fetch('api/services.php', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ action: 'delete', id: id })
      });
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem('canyapi_cms_services', JSON.stringify(data.data));
      }
      return data;
    }

    let services = await getServices();
    services = services.filter(s => s.id !== id);
    localStorage.setItem('canyapi_cms_services', JSON.stringify(services));
    return { success: true, message: 'Hizmet silindi.', data: services };
  }

  // --- 4. BLOG YAZILARI ---
  async function getBlogPosts(slug = null) {
    const useApi = await detectServerApi();
    if (useApi) {
      try {
        const url = slug ? `api/blog.php?slug=${encodeURIComponent(slug)}` : 'api/blog.php?all=1';
        const res = await fetch(url, { cache: 'no-store' });
        const json = await res.json();
        if (json.success && json.data) {
          if (!slug && Array.isArray(json.data)) {
            localStorage.setItem('canyapi_cms_blog', JSON.stringify(json.data));
          }
          return json.data;
        }
      } catch (e) {}
    }

    let blog = [];
    const local = localStorage.getItem('canyapi_cms_blog');
    if (local) {
      try { blog = JSON.parse(local); } catch (e) {}
    }

    if (blog.length === 0) {
      try {
        const res = await fetch('data/blog.json');
        if (res.ok) {
          blog = await res.json();
          localStorage.setItem('canyapi_cms_blog', JSON.stringify(blog));
        }
      } catch (e) {}
    }

    if (slug) {
      return blog.find(b => b.slug === slug || b.id === slug) || null;
    }

    return blog;
  }

  async function saveBlogPost(post) {
    const useApi = await detectServerApi();
    if (useApi) {
      const res = await fetch('api/blog.php', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(post)
      });
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem('canyapi_cms_blog', JSON.stringify(data.data));
      }
      return data;
    }

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
    const useApi = await detectServerApi();
    if (useApi) {
      const res = await fetch('api/blog.php', {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ action: 'delete', id: id })
      });
      const data = await res.json();
      if (data.success && data.data) {
        localStorage.setItem('canyapi_cms_blog', JSON.stringify(data.data));
      }
      return data;
    }

    let blog = await getBlogPosts();
    blog = blog.filter(b => b.id !== id);
    localStorage.setItem('canyapi_cms_blog', JSON.stringify(blog));
    return { success: true, message: 'Blog yazısı silindi.', data: blog };
  }

  // --- 5. FOTOĞRAF & MEDYA YÜKLEME ---
  async function uploadPhoto(file) {
    const useApi = await detectServerApi();
    if (useApi) {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('api/upload.php', {
        method: 'POST',
        headers: {
          'X-Admin-Token': sessionStorage.getItem(TOKEN_STORAGE_KEY) || '05458320190'
        },
        body: formData
      });
      return await res.json();
    }

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
    const useApi = await detectServerApi();
    if (useApi) {
      try {
        const res = await fetch('api/media.php', {
          headers: getAuthHeader(),
          cache: 'no-store'
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      } catch (e) {}
    }
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
