/**
 * Can Yapı Antalya - Ölçümleme ve Olay Takip Sistemi (Analytics & Event Tracker)
 * WhatsApp tıklamaları, telefon aramaları, teklif formları ve ücretsiz keşif taleplerini ölçümler.
 * Hem Google Tag Manager (dataLayer) hem de yerel yönetim paneli (localStorage) ile senkronize çalışır.
 */

const CanYapiAnalytics = (function() {
  const STORAGE_KEY = 'canyapi_analytics_events';

  // Varsayılan metrik sayaçları
  function getStoredMetrics() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.warn('Analytics storage read error:', e);
    }
    return {
      whatsapp_clicks: 0,
      phone_calls: 0,
      form_submissions: 0,
      discovery_requests: 0,
      history: []
    };
  }

  function saveMetrics(metrics) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
    } catch (e) {
      console.warn('Analytics storage write error:', e);
    }
  }

  // dataLayer entegrasyonu (Google Tag Manager / GA4 için)
  window.dataLayer = window.dataLayer || [];

  function trackEvent(eventName, eventParams = {}) {
    const timestamp = new Date().toISOString();
    const eventData = {
      event: eventName,
      timestamp: timestamp,
      page: window.location.pathname,
      ...eventParams
    };

    // 1. Google Tag Manager / GA4 dataLayer'a push et
    window.dataLayer.push(eventData);

    // 2. Can Yapı yerel paneline kaydet
    const metrics = getStoredMetrics();
    if (eventName === 'whatsapp_click') {
      metrics.whatsapp_clicks = (metrics.whatsapp_clicks || 0) + 1;
    } else if (eventName === 'phone_call_click') {
      metrics.phone_calls = (metrics.phone_calls || 0) + 1;
    } else if (eventName === 'quote_form_submit') {
      metrics.form_submissions = (metrics.form_submissions || 0) + 1;
    } else if (eventName === 'free_discovery_click') {
      metrics.discovery_requests = (metrics.discovery_requests || 0) + 1;
    }

    // Son 100 olayı detaylı tarihçe olarak sakla
    metrics.history = metrics.history || [];
    metrics.history.unshift({
      event: eventName,
      params: eventParams,
      timestamp: new Date().toLocaleString('tr-TR'),
      url: window.location.href
    });

    if (metrics.history.length > 100) {
      metrics.history.pop();
    }

    saveMetrics(metrics);
    console.log(`[Can Yapı Ölçümleme] Olay kaydedildi: ${eventName}`, eventParams);
  }

  // Otomatik Link Dinleyicileri (WhatsApp ve Telefon Linkleri)
  function initAutoTracking() {
    document.addEventListener('click', function(e) {
      const target = e.target.closest('a, button');
      if (!target) return;

      const href = target.getAttribute('href') || '';

      // WhatsApp Tıklaması
      if (href.includes('wa.me') || href.includes('whatsapp.com') || target.classList.contains('js-track-whatsapp')) {
        trackEvent('whatsapp_click', {
          source: target.dataset.trackSource || 'whatsapp_button',
          label: target.innerText.trim() || 'WhatsApp İletişim'
        });
      }

      // Telefon Araması
      if (href.startsWith('tel:') || target.classList.contains('js-track-phone')) {
        trackEvent('phone_call_click', {
          source: target.dataset.trackSource || 'phone_button',
          phoneNumber: href.replace('tel:', '') || '+90 532 000 00 00'
        });
      }

      // Ücretsiz Keşif Butonu
      if (target.classList.contains('js-track-discovery') || (target.innerText && target.innerText.includes('Ücretsiz Keşif'))) {
        trackEvent('free_discovery_click', {
          service: target.dataset.service || 'Genel Keşif'
        });
      }
    });
  }

  // Sayfa yüklendiğinde başlat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutoTracking);
  } else {
    initAutoTracking();
  }

  return {
    track: trackEvent,
    getMetrics: getStoredMetrics,
    resetMetrics: function() {
      localStorage.removeItem(STORAGE_KEY);
    }
  };
})();

window.CanYapiAnalytics = CanYapiAnalytics;
