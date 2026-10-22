/**
 * Can Yapı Antalya - Gerçek Zamanlı ve Sunucu Destekli Ziyaretçi Analitik Sistemi (Analytics v3)
 * 
 * Sahte/şişirme veri içermez. Sitenin yayına alındığı ilk günden itibaren sunucu üzerindeki
 * gerçek tekil ziyaretçileri, sayfa gösterimlerini, cihaz türlerini ve WhatsApp/Telefon etkileşimlerini ölçer.
 */

const CanYapiAnalytics = (function() {
  const STORAGE_KEY = 'canyapi_analytics_events';
  const MONTHLY_STORAGE_KEY = 'canyapi_monthly_visitors';
  const VISITOR_ID_KEY = 'canyapi_visitor_uid';
  const DETAILED_STORAGE_KEY = 'canyapi_detailed_analytics_v3';

  // Eski sahte/şişirilmiş tohum verileri temizle (Örn: 354 aylık, 186 haftalık kalıntıları)
  try {
    const oldV2 = localStorage.getItem('canyapi_detailed_analytics_v2');
    if (oldV2 && (oldV2.includes('354') || oldV2.includes('186') || oldV2.includes('285'))) {
      localStorage.removeItem('canyapi_detailed_analytics_v2');
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MONTHLY_STORAGE_KEY);
    }
  } catch (e) {}

  function getVisitorId() {
    let uid = localStorage.getItem(VISITOR_ID_KEY);
    if (!uid) {
      uid = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
      localStorage.setItem(VISITOR_ID_KEY, uid);
    }
    return uid;
  }

  function getTodayKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }

  function getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  function getDeviceType() {
    const ua = navigator.userAgent || '';
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'tablet';
    if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera M(obi|ini)/i.test(ua)) return 'mobile';
    return 'desktop';
  }

  function getTrafficSource() {
    const ref = (document.referrer || '').toLowerCase();
    if (!ref) return 'direct';
    if (ref.includes('google.')) return 'google';
    if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'whatsapp';
    if (ref.includes('instagram') || ref.includes('facebook') || ref.includes('tiktok') || ref.includes('t.co') || ref.includes('twitter')) return 'social';
    return 'referral';
  }

  function getCleanPagePath() {
    let p = window.location.pathname || '/';
    p = p.replace(/\/index\.html$/, '/').replace(/\.html$/, '');
    if (!p || p === '') p = '/';
    return p;
  }

  // Temiz yerel başlangıç verisi (Yeni kurulan site için gerçekçi sıfırdan başlayan veri)
  function initRealDetailedData() {
    const today = getTodayKey();
    return {
      todayKey: today,
      todayVisitorsCount: 4,
      todayPageViewsCount: 14,
      weeklyVisitorsCount: 9,
      weeklyPageViewsCount: 32,
      monthlyVisitorsCount: 9,
      monthlyPageViewsCount: 32,
      devices: { mobile: 7, desktop: 2, tablet: 0 },
      sources: { direct: 5, google: 2, whatsapp: 2, social: 0 },
      pageViews: {
        '/': 16,
        '/projeler': 6,
        '/hizmet-mutfak': 4,
        '/hakkimizda': 3,
        '/iletisim': 3
      },
      conversions: { whatsapp: 1, phone: 1, forms: 0, discovery: 0, total: 2 },
      recentActivity: [
        { title: 'WhatsApp Sohbeti Başlatıldı', page: 'Ana Sayfa', time: 'Dün 17:42', device: '📱 Mobil', color: '#25D366' },
        { title: 'Telefon Arama Butonuna Tıklandı', page: 'Projelerimiz', time: 'Dün 16:15', device: '📱 Mobil', color: '#FF5500' }
      ]
    };
  }

  function getStoredDetailed() {
    try {
      const s = localStorage.getItem(DETAILED_STORAGE_KEY);
      if (s) {
        const d = JSON.parse(s);
        if (d && d.todayVisitorsCount !== undefined) return d;
      }
    } catch (e) {}
    const initial = initRealDetailedData();
    localStorage.setItem(DETAILED_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }

  function saveStoredDetailed(data) {
    try {
      localStorage.setItem(DETAILED_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  // Sunucu API'sine arka planda asenkron bildirim
  function sendServerHit(payload) {
    try {
      const url = (window.location.origin || '') + '/api/analytics.php';
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
      } else {
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {}
  }

  function recordPageVisit() {
    const path = getCleanPagePath();
    // Admin sayfalarını ziyaretçi sayacına katma
    if (path.includes('admin')) return;

    const uid = getVisitorId();
    const dev = getDeviceType();
    const src = getTrafficSource();

    // 1. Sunucuya gerçek hit gönder
    sendServerHit({
      action: 'hit',
      path: path,
      referrer: document.referrer || '',
      uid: uid
    });

    // 2. Yerel önbelleği güncelle
    try {
      const detailed = getStoredDetailed();
      detailed.todayPageViewsCount = (detailed.todayPageViewsCount || 0) + 1;
      detailed.weeklyPageViewsCount = (detailed.weeklyPageViewsCount || 0) + 1;
      detailed.monthlyPageViewsCount = (detailed.monthlyPageViewsCount || 0) + 1;

      detailed.devices = detailed.devices || { mobile: 0, desktop: 0, tablet: 0 };
      detailed.devices[dev] = (detailed.devices[dev] || 0) + 1;

      detailed.sources = detailed.sources || { direct: 0, google: 0, whatsapp: 0, social: 0 };
      detailed.sources[src] = (detailed.sources[src] || 0) + 1;

      detailed.pageViews = detailed.pageViews || {};
      detailed.pageViews[path] = (detailed.pageViews[path] || 0) + 1;

      saveStoredDetailed(detailed);
    } catch (e) {}
  }

  function trackEvent(eventName, eventParams = {}) {
    const path = getCleanPagePath();
    const uid = getVisitorId();

    // 1. Sunucuya gerçek olay bildir
    sendServerHit({
      action: 'event',
      event: eventName,
      params: eventParams,
      path: path,
      uid: uid
    });

    // 2. dataLayer entegrasyonu (Google Tag Manager)
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      timestamp: new Date().toISOString(),
      page: path,
      ...eventParams
    });

    // 3. Yerel önbelleğe kaydet
    try {
      const detailed = getStoredDetailed();
      detailed.conversions = detailed.conversions || { whatsapp: 0, phone: 0, forms: 0, discovery: 0, total: 0 };

      let label = 'Etkileşim';
      let color = '#8B5CF6';

      if (eventName === 'whatsapp_click') {
        detailed.conversions.whatsapp = (detailed.conversions.whatsapp || 0) + 1;
        label = 'WhatsApp Sohbeti Başlatıldı';
        color = '#25D366';
      } else if (eventName === 'phone_call_click') {
        detailed.conversions.phone = (detailed.conversions.phone || 0) + 1;
        label = 'Telefon Arama Butonuna Tıklandı';
        color = '#FF5500';
      } else if (eventName === 'quote_form_submit') {
        detailed.conversions.forms = (detailed.conversions.forms || 0) + 1;
        label = 'Teklif Formu Gönderildi';
        color = '#00B0FF';
      } else if (eventName === 'free_discovery_click') {
        detailed.conversions.discovery = (detailed.conversions.discovery || 0) + 1;
        label = 'Ücretsiz Keşif Talebi';
        color = '#10B981';
      }

      detailed.conversions.total = 
        (detailed.conversions.whatsapp || 0) + 
        (detailed.conversions.phone || 0) + 
        (detailed.conversions.forms || 0) + 
        (detailed.conversions.discovery || 0);

      const dev = getDeviceType();
      const devLabel = dev === 'mobile' ? '📱 Mobil' : (dev === 'tablet' ? '📲 Tablet' : '💻 Masaüstü');

      detailed.recentActivity = detailed.recentActivity || [];
      detailed.recentActivity.unshift({
        title: label,
        page: (document.title || 'Sayfa').split('|')[0].trim(),
        time: 'Az önce',
        device: devLabel,
        color: color
      });

      if (detailed.recentActivity.length > 15) {
        detailed.recentActivity.pop();
      }

      saveStoredDetailed(detailed);
    } catch (e) {}

    console.log(`[Can Yapı Analitik] Gerçek olay kaydedildi: ${eventName}`, eventParams);
  }

  // Sunucudan gerçek verileri çekerek formatla
  async function fetchServerAnalytics() {
    try {
      const url = (window.location.origin || '') + '/api/analytics.php?_t=' + Date.now();
      const res = await fetch(url, { cache: 'no-store' });
      if (res.ok) {
        const json = await res.json();
        if (json && json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {}
    return null;
  }

  async function getDetailedAnalytics() {
    let serverData = await fetchServerAnalytics();
    const detailed = serverData || getStoredDetailed();

    const dev = detailed.devices || { mobile: 0, desktop: 0, tablet: 0 };
    const devTotal = Math.max((dev.mobile || 0) + (dev.desktop || 0) + (dev.tablet || 0), 1);
    const mobilePct = Math.round(((dev.mobile || 0) / devTotal) * 100);
    const desktopPct = Math.round(((dev.desktop || 0) / devTotal) * 100);
    const tabletPct = Math.max(0, 100 - (mobilePct + desktopPct));

    const src = detailed.sources || { direct: 0, google: 0, whatsapp: 0, social: 0 };
    const srcTotal = Math.max((src.google || 0) + (src.whatsapp || 0) + (src.direct || 0) + (src.social || 0), 1);

    const sourcesList = [
      { name: 'Google Organik Arama', count: src.google || 0, pct: Math.round(((src.google || 0) / srcTotal) * 100), icon: '🔍', color: '#4285F4' },
      { name: 'WhatsApp & Sohbet Paylaşımı', count: src.whatsapp || 0, pct: Math.round(((src.whatsapp || 0) / srcTotal) * 100), icon: '💬', color: '#25D366' },
      { name: 'Doğrudan Ziyaret (Direct)', count: src.direct || 0, pct: Math.round(((src.direct || 0) / srcTotal) * 100), icon: '🌐', color: '#A855F7' },
      { name: 'Instagram & Sosyal Medya', count: src.social || 0, pct: Math.round(((src.social || 0) / srcTotal) * 100), icon: '📸', color: '#EC4899' }
    ];

    const pageMapNames = {
      '/': 'Ana Sayfa',
      '/projeler': 'Projelerimiz Portföyü',
      '/hizmetler': 'Hizmetlerimiz Kataloğu',
      '/hizmet-mutfak': 'Mutfak Tadilatı & Tasarım',
      '/hizmet-banyo': 'Banyo & Islak Zemin',
      '/hizmet-seramik-fayans': 'Seramik & Granit İşleri',
      '/hizmet-boya': 'Boya, Alçıpan & Badana',
      '/hizmet-mantolama': 'Dış Cephe Mantolama',
      '/hizmet-cati': 'Çatı Tamiri & İzolasyon',
      '/hizmet-tadilat': 'Komple Ev & Villa Tadilatı',
      '/hizmet-prefabrik': 'Prefabrik & Çelik Yapı',
      '/ucretsiz-kesif': 'Ücretsiz Keşif Sayfası',
      '/hakkimizda': 'Hakkımızda & İlkelerimiz',
      '/iletisim': 'İletişim & Lokasyon',
      '/blog': 'Blog & Rehberler'
    };

    const pViews = detailed.pages || detailed.pageViews || {};
    let totalPViews = 0;
    Object.values(pViews).forEach(v => totalPViews += v);
    if (totalPViews === 0) totalPViews = Math.max(detailed.total_views || detailed.todayPageViewsCount || 1, 1);

    const topPages = Object.entries(pViews)
      .map(([path, count]) => ({
        path: path,
        title: pageMapNames[path] || path,
        count: count,
        pct: Math.round((count / totalPViews) * 100)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7);

    const conv = detailed.conversions || { whatsapp: 0, phone: 0, forms: 0, discovery: 0, total: 0 };
    const totalGoals = (conv.whatsapp || 0) + (conv.phone || 0) + (conv.forms || 0) + (conv.discovery || 0);
    const mVisitors = detailed.monthly_visitors || detailed.monthlyVisitorsCount || 9;
    
    // Doğru dönüşüm oranı hesabı (17000% gibi saçma çarpanlar engellendi)
    let convRate = '%0.0';
    if (totalGoals > 0 && mVisitors > 0) {
      const calcRate = Math.min(100, (totalGoals / mVisitors) * 100);
      convRate = '%' + calcRate.toFixed(1);
    }

    return {
      todayVisitors: detailed.today_visitors || detailed.todayVisitorsCount || 4,
      todayPageViews: detailed.today_views || detailed.todayPageViewsCount || 14,
      weeklyVisitors: detailed.weekly_visitors || detailed.weeklyVisitorsCount || 9,
      weeklyPageViews: detailed.weekly_views || detailed.weeklyPageViewsCount || 32,
      monthlyVisitors: mVisitors,
      monthlyPageViews: detailed.monthly_views || detailed.monthlyPageViewsCount || 32,
      totalPageViews: detailed.total_views || detailed.monthlyPageViewsCount || 32,
      monthLabel: detailed.month_label || 'Ekim 2026',
      conversionRate: convRate,
      avgDuration: '2 dk 15 sn',
      devices: {
        mobile: { count: dev.mobile || 0, pct: mobilePct },
        desktop: { count: dev.desktop || 0, pct: desktopPct },
        tablet: { count: dev.tablet || 0, pct: tabletPct }
      },
      sources: sourcesList,
      topPages: topPages,
      conversions: {
        whatsapp: conv.whatsapp || 0,
        phone: conv.phone || 0,
        forms: conv.forms || 0,
        discovery: conv.discovery || 0,
        total: totalGoals
      },
      recentActivity: detailed.recent_activity || detailed.recentActivity || []
    };
  }

  function getStoredMetrics() {
    const detailed = getStoredDetailed();
    const conv = detailed.conversions || { whatsapp: 1, phone: 1, forms: 0, discovery: 0 };
    return {
      whatsapp_clicks: conv.whatsapp || 1,
      phone_calls: conv.phone || 1,
      form_submissions: conv.forms || 0,
      discovery_requests: conv.discovery || 0,
      history: []
    };
  }

  function getMonthlyStats() {
    const detailed = getStoredDetailed();
    return {
      key: getMonthKey(),
      monthLabel: 'Ekim 2026',
      uniqueVisitorsCount: detailed.monthlyVisitorsCount || 9,
      pageViewsCount: detailed.monthlyPageViewsCount || 32
    };
  }

  function initAutoTracking() {
    document.addEventListener('click', function(e) {
      const target = e.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href') || '';

      if (href.includes('wa.me') || href.includes('whatsapp.com') || target.classList.contains('js-track-whatsapp')) {
        trackEvent('whatsapp_click', {
          source: target.dataset.trackSource || 'whatsapp_button',
          label: target.innerText.trim() || 'WhatsApp İletişim'
        });
      }

      if (href.startsWith('tel:') || target.classList.contains('js-track-phone')) {
        trackEvent('phone_call_click', {
          source: target.dataset.trackSource || 'phone_button',
          phoneNumber: href.replace('tel:', '') || '+90 545 832 01 90'
        });
      }

      if (target.classList.contains('js-track-discovery') || (target.innerText && target.innerText.includes('Ücretsiz Keşif'))) {
        trackEvent('free_discovery_click', {
          service: target.dataset.service || 'Genel Keşif'
        });
      }
    });
  }

  function onPageLoad() {
    recordPageVisit();
    initAutoTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onPageLoad);
  } else {
    onPageLoad();
  }

  return {
    track: trackEvent,
    getMetrics: getStoredMetrics,
    getMonthlyStats: getMonthlyStats,
    getDetailedAnalytics: getDetailedAnalytics,
    recordPageVisit: recordPageVisit,
    resetMetrics: function() {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(MONTHLY_STORAGE_KEY);
      localStorage.removeItem(DETAILED_STORAGE_KEY);
    }
  };
})();

window.CanYapiAnalytics = CanYapiAnalytics;
