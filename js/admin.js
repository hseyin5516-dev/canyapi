/**
 * Can Yapı Antalya - Form, Ölçümleme & Sosyal Medya Yönetim Paneli (Lead & Analytics Admin)
 */

const ADMIN_CREDENTIALS = {
  username: 'canyapi',
  passwords: ['05458320190', '5458320190']
};

document.addEventListener('DOMContentLoaded', function() {
  initAdminAuth();
  if (isUserAuthenticated()) {
    initDashboard();
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
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const user = document.getElementById('adminUsername')?.value.trim().toLowerCase();
      const pass = document.getElementById('adminPassword')?.value.trim();

      if (user === ADMIN_CREDENTIALS.username && ADMIN_CREDENTIALS.passwords.includes(pass)) {
        sessionStorage.setItem('canyapi_admin_auth', 'true');
        if (errorMsg) errorMsg.style.display = 'none';
        if (overlay) overlay.classList.add('hidden');
        initDashboard();
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
    logoutBtn.addEventListener('click', function() {
      sessionStorage.removeItem('canyapi_admin_auth');
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
   2. DASHBOARD BAŞLATMA & VERİ YÜKLEME
   ========================================================================== */
function initDashboard() {
  loadMetrics();
  loadLeads();
  loadSocialSettings();
  initAdminActions();
}

function loadMetrics() {
  if (!window.CanYapiAnalytics) return;
  const metrics = window.CanYapiAnalytics.getMetrics();
  const monthly = window.CanYapiAnalytics.getMonthlyStats();

  // Aylık Ziyaretçi Sayısı
  const monthlyEl = document.getElementById('metricMonthlyVisitors');
  const monthNameEl = document.getElementById('metricMonthName');
  if (monthlyEl) monthlyEl.innerText = monthly.uniqueVisitorsCount || 1;
  if (monthNameEl) monthNameEl.innerText = `${monthly.monthLabel} (${monthly.uniqueVisitorsCount} Tekil Ziyaretçi / ${monthly.pageViewsCount} Sayfa Görüntüleme)`;

  // Diğer Etkileşim Sayaçları
  document.getElementById('metricWhatsapp').innerText = metrics.whatsapp_clicks || 0;
  document.getElementById('metricPhone').innerText = metrics.phone_calls || 0;
  document.getElementById('metricForms').innerText = metrics.form_submissions || 0;
  document.getElementById('metricDiscovery').innerText = metrics.discovery_requests || 0;

  // Olay Geçmişi Listesi
  const historyList = document.getElementById('historyList');
  if (historyList && metrics.history) {
    historyList.innerHTML = metrics.history.map(item => `
      <tr>
        <td><strong>${item.event}</strong></td>
        <td>${JSON.stringify(item.params || {})}</td>
        <td>${item.timestamp}</td>
      </tr>
    `).join('') || '<tr><td colspan="3" class="text-center text-muted">Henüz kayıtlı olay yok.</td></tr>';
  }
}

/* ==========================================================================
   3. SOSYAL MEDYA HESAPLARI YÖNETİMİ
   ========================================================================== */
function loadSocialSettings() {
  const form = document.getElementById('socialLinksForm');
  if (!form) return;

  let social = {};
  try {
    const saved = localStorage.getItem('canyapi_social_links');
    if (saved) {
      social = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Sosyal link yükleme hatası:', e);
  }

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

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    const updatedSocial = {
      instagram: document.getElementById('inputInstagram')?.value.trim() || '',
      facebook: document.getElementById('inputFacebook')?.value.trim() || '',
      tiktok: document.getElementById('inputTiktok')?.value.trim() || '',
      x: document.getElementById('inputX')?.value.trim() || ''
    };

    localStorage.setItem('canyapi_social_links', JSON.stringify(updatedSocial));

    // Badge durumlarını güncelle
    platforms.forEach(p => {
      const badge = document.getElementById(`badge${p.charAt(0).toUpperCase() + p.slice(1)}`);
      updateBadgeStatus(badge, updatedSocial[p]);
    });

    // Varsa sitedeki açık footer alanını da anında güncelle
    if (typeof window.initSocialLinks === 'function') {
      window.initSocialLinks();
    }

    window.showToast?.('Sosyal medya bağlantıları başarıyla güncellendi ve sitede yayınlandı!', 'success');
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

/* ==========================================================================
   4. GELEN TEKLİF & KEŞİF TALEPLERİ
   ========================================================================== */
function loadLeads() {
  const leadsContainer = document.getElementById('leadsTableBody');
  if (!leadsContainer) return;

  const leads = JSON.parse(localStorage.getItem('canyapi_leads') || '[]');

  if (leads.length === 0) {
    leadsContainer.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 40px; color: var(--text-muted);">
          Henüz gelen bir teklif veya keşif talebi bulunmuyor. Web sitesinden form gönderildiğinde burada listelenecektir.
        </td>
      </tr>
    `;
    return;
  }

  leadsContainer.innerHTML = leads.map((lead, index) => `
    <tr>
      <td><strong>${lead.id}</strong></td>
      <td>${lead.date}</td>
      <td>
        <div style="font-weight: 600; color: #FFF;">${lead.name}</div>
        <div style="font-size: 0.8rem; color: var(--text-muted);"><a href="tel:${lead.phone}" style="color: var(--primary-orange);">${lead.phone}</a></div>
      </td>
      <td><span class="badge-service">${lead.service}</span></td>
      <td>${lead.location}</td>
      <td>${lead.isDiscovery ? '<span style="color:#00E676; font-weight:700;">✓ Keşif İstendi</span>' : 'Teklif'}</td>
      <td>
        <select onchange="updateLeadStatus(${index}, this.value)" style="background: var(--bg-dark); color: #FFF; border: 1px solid var(--border-subtle); padding: 5px 8px; border-radius: 4px;">
          <option value="Yeni" ${lead.status === 'Yeni' ? 'selected' : ''}>Yeni</option>
          <option value="Arandı" ${lead.status === 'Arandı' ? 'selected' : ''}>Arandı</option>
          <option value="Keşif Planlandı" ${lead.status === 'Keşif Planlandı' ? 'selected' : ''}>Keşif Planlandı</option>
          <option value="Teklif Verildi" ${lead.status === 'Teklif Verildi' ? 'selected' : ''}>Teklif Verildi</option>
          <option value="Anlaşıldı" ${lead.status === 'Anlaşıldı' ? 'selected' : ''}>Anlaşıldı</option>
          <option value="İptal" ${lead.status === 'İptal' ? 'selected' : ''}>İptal</option>
        </select>
      </td>
      <td>
        <button onclick="viewLeadDetail(${index})" class="btn btn-sm btn-outline" style="padding: 4px 8px; font-size: 0.75rem;">Detay</button>
        <button onclick="deleteLead(${index})" class="btn btn-sm" style="padding: 4px 8px; font-size: 0.75rem; background: #FF3333; color: white;">Sil</button>
      </td>
    </tr>
  `).join('');
}

window.updateLeadStatus = function(index, newStatus) {
  const leads = JSON.parse(localStorage.getItem('canyapi_leads') || '[]');
  if (leads[index]) {
    leads[index].status = newStatus;
    localStorage.setItem('canyapi_leads', JSON.stringify(leads));
    window.showToast?.('Talep durumu güncellendi.', 'success');
  }
};

window.deleteLead = function(index) {
  if (confirm("Bu talebi silmek istediğinize emin misiniz?")) {
    const leads = JSON.parse(localStorage.getItem('canyapi_leads') || '[]');
    leads.splice(index, 1);
    localStorage.setItem('canyapi_leads', JSON.stringify(leads));
    loadLeads();
    window.showToast?.('Talep silindi.', 'info');
  }
};

window.viewLeadDetail = function(index) {
  const leads = JSON.parse(localStorage.getItem('canyapi_leads') || '[]');
  const lead = leads[index];
  if (!lead) return;

  alert(
    `Talep Detayları (${lead.id})\n` +
    `-----------------------------------\n` +
    `Müşteri: ${lead.name}\n` +
    `Telefon: ${lead.phone}\n` +
    `Hizmet: ${lead.service}\n` +
    `Konum: ${lead.location}\n` +
    `Tarih: ${lead.date}\n` +
    `Ücretsiz Keşif: ${lead.isDiscovery ? 'Evet' : 'Hayır'}\n` +
    `Açıklama: ${lead.notes}\n` +
    `Yüklenen Dosyalar: ${lead.files ? lead.files.length : 0} adet`
  );
};

/* ==========================================================================
   5. CSV İNDİRME VE SAYAÇ SIFIRLAMA
   ========================================================================== */
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
