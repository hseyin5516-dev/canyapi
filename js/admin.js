/**
 * Can Yapı Antalya - Form ve Ölçümleme Yönetim Paneli (Lead & Analytics Admin)
 */

document.addEventListener('DOMContentLoaded', function() {
  loadMetrics();
  loadLeads();
  initAdminActions();
});

function loadMetrics() {
  if (!window.CanYapiAnalytics) return;
  const metrics = window.CanYapiAnalytics.getMetrics();

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

  const filesHtml = lead.files && lead.files.length > 0 
    ? lead.files.map(f => `<li>📎 ${f.name} (${f.size})</li>`).join('') 
    : '<li>Fotoğraf eklenmemiş</li>';

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

function initAdminActions() {
  const exportBtn = document.getElementById('exportCsvBtn');
  if (exportBtn) {
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
  if (resetMetricsBtn) {
    resetMetricsBtn.addEventListener('click', function() {
      if (confirm("Tüm ölçüm sayaçlarını sıfırlamak istediğinize emin misiniz?")) {
        window.CanYapiAnalytics.resetMetrics();
        loadMetrics();
        alert("Sayaçlar sıfırlandı.");
      }
    });
  }
}
