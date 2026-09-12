import { dashboardScript } from '../scripts/dashboard.js';

export function renderDashboardPage(releaseLabel = 'v1.0.6', buildMeta = '') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LandingNL • Panelim</title>
  ${buildMeta}
  <style>
    :root {
      --bg: #080c14;
      --card: #111827;
      --border: rgba(255, 255, 255, 0.08);
      --primary: #3b82f6;
      --mint: #10b981;
      --amber: #fbbf24;
      --purple: #c084fc;
      --text: #ffffff;
      --muted: #94a3b8;
    }

    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); margin: 0; padding: 24px; line-height: 1.5; }
    .container { max-width: 1000px; margin: 0 auto; }
    
    header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .brand { font-size: 1.3rem; font-weight: 800; background: linear-gradient(135deg, #60a5fa, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .v-badge { background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: #60a5fa; font-size: 0.72rem; padding: 2px 8px; border-radius: 12px; margin-left: 8px; font-weight: 600; }
    .btn-reset { background: rgba(239, 68, 68, 0.12); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.25); padding: 8px 16px; border-radius: 16px; font-size: 0.8rem; font-weight: 600; cursor: pointer; }

    .savings-banner {
      background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(59, 130, 246, 0.12));
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 16px;
      padding: 16px 20px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .progress-box { background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 20px; margin-bottom: 24px; }
    .progress-bar-bg { background: rgba(255,255,255,0.06); height: 8px; border-radius: 4px; overflow: hidden; margin: 10px 0 14px 0; }
    .progress-bar-fill { background: linear-gradient(90deg, var(--primary), var(--mint)); height: 100%; width: 20%; transition: width 0.3s ease; }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { background: rgba(255,255,255,0.03); border: 1px solid var(--border); padding: 6px 12px; border-radius: 8px; font-size: 0.78rem; color: var(--muted); }
    .badge.active { border-color: rgba(16,185,129,0.4); color: var(--mint); background: rgba(16,185,129,0.08); font-weight: 600; }

    .tabs { display: flex; background: rgba(255,255,255,0.03); padding: 4px; border-radius: 14px; gap: 6px; margin-bottom: 24px; border: 1px solid var(--border); }
    .tab { flex: 1; padding: 10px; border-radius: 10px; border: none; background: transparent; color: var(--muted); font-weight: 700; cursor: pointer; font-size: 0.85rem; text-align: center; }
    .tab.active { background: var(--primary); color: white; }

    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
    @media (max-width: 800px) { .grid { grid-template-columns: 1fr; } }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 18px; padding: 20px; }
    .col-2 { grid-column: span 2; }
    .col-3 { grid-column: span 3; }
    @media (max-width: 800px) { .col-2, .col-3 { grid-column: span 1; } }

    .card-title { font-size: 1rem; font-weight: 700; margin: 0 0 12px 0; }
    .list { list-style: none; padding: 0; margin: 0; }
    .item { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 0.85rem; }
    .item > span:first-child { flex: 1 1 auto; min-width: 0; }
    
    .tag { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-align: center; display: inline-flex; align-items: center; justify-content: center; flex: 0 1 auto; max-width: 55%; overflow-wrap: anywhere; }
    .tag-mint { background: rgba(16,185,129,0.15); color: #34d399; }
    .tag-amber { background: rgba(251,191,36,0.15); color: #fbbf24; }
    .tag-purple { background: rgba(192,132,252,0.15); color: #c084fc; }

    .btn-act { 
      background: #2563eb; 
      color: white; 
      border: none; 
      padding: 6px 14px; 
      border-radius: 8px; 
      font-size: 0.78rem; 
      font-weight: 700; 
      cursor: pointer; 
      white-space: nowrap; 
      min-width: 105px; 
      text-align: center; 
      display: inline-flex; 
      align-items: center; 
      justify-content: center;
    }
    .btn-act:hover { background: #1d4ed8; }

    .step-state { background: rgba(0,0,0,0.35); border: 1px solid rgba(255,255,255,0.14); color: #e2e8f0; border-radius: 8px; padding: 6px 8px; font-size: 0.78rem; font-weight: 600; max-width: 58%; cursor: pointer; }
    .step-state:disabled { cursor: not-allowed; }

    .btn-act-full {
      width: 100%;
      padding: 10px 14px;
      font-size: 0.82rem;
      white-space: nowrap;
    }

    .swap-card { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 14px; padding: 16px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .swap-tag { display: inline-block; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; font-weight: 700; margin-bottom: 6px; }

    .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 28px; max-width: 420px; width: 90%; text-align: center; }

    .hidden { display: none !important; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">LandingNL • Öğrenci Yolculuğum</div>
      <div style="display:flex; gap:8px; align-items:center;">
        <a class="btn-act" href="/onboarding?edit=1" style="text-decoration:none; background:rgba(255,255,255,0.08); color:#cbd5e1;">Profilimi düzenle</a>
        <button class="btn-reset" id="btn-reset-app">Çıkış Yap ➔</button>
      </div>
    </header>

    <div class="savings-banner">
      <div>
        <div style="font-size:0.78rem; color:var(--mint); font-weight:700; text-transform:uppercase;">💡 Destek ve İndirim Olanakları</div>
        <div style="font-size:1.4rem; font-weight:800; color:#fff;" id="total-savings-text">Kişisel uygunluğuna göre</div>
      </div>
      <span class="tag tag-amber" style="padding:8px 14px; font-size:0.8rem;">Tutar garanti edilmez · resmi kurum hesaplar</span>
    </div>

    <div class="progress-box">
      <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.9rem;">
        <span>🚩 Uyum İlerlemesi (senin beyanına göre)</span>
        <span id="percent-text" style="color:var(--mint);">%0</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="bar-fill"></div>
      </div>
      <div class="badges">
        <span class="badge" id="b-visa">Oturum izni: kontrol et</span>
        <span class="badge" id="b-housing">Konut: kontrol et</span>
        <span class="badge" id="b-bsn">⏳ 1. Belediye kaydı & BSN</span>
        <span class="badge" id="b-digid">🔒 2. DigiD</span>
        <span class="badge" id="b-bank">🔒 3. Banka</span>
        <span class="badge" id="b-gp">🔒 4. Huisarts (GP) Kaydı</span>
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" id="t1">✈️ Phase 1: Landing & Devlet Destekleri</button>
      <button class="tab" id="t2">🎁 Phase 2: Living, İndirimler & Sigorta</button>
      <button class="tab" id="t3">🤝 Student Exchange (Önizleme)</button>
    </div>

    <!-- PHASE 1 -->
    <div id="view-1">
      <div class="card" id="status-route" style="border-left: 4px solid var(--purple); margin-bottom:16px;"></div>
      <div class="card hidden" id="next-phase" style="border-left: 4px solid var(--mint); margin-bottom:16px;"></div>
      <div class="grid">
        <div class="card" style="border-left: 4px solid var(--mint);">
          <div class="card-title">📄 Belediye Kayıt Randevusu</div>
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:12px;">Belediye (BRP) veya RNI kayıt randevu tarihini kaydet. BSN'in kayıttan sonra verilir; aldığında yandaki adımı işaretle. BSN numaranı buraya yazma.</p>
          <input type="date" id="bsn-date" style="width:100%; padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:white; font-size:0.9rem; margin-bottom:10px; outline:none; cursor:pointer;" />
          <button class="btn-act btn-act-full" id="btn-save-bsn-date">Randevu Tarihini Kaydet ➔</button>
          <a class="btn-act btn-act-full" style="display:block; margin-top:8px; text-align:center; text-decoration:none; background:rgba(255,255,255,0.08); color:#cbd5e1;" href="https://www.government.nl/themes/government-and-democracy/personal-data/citizen-service-number-bsn" target="_blank" rel="noopener noreferrer">BSN hakkında resmi kaynak ↗</a>
        </div>

        <div class="card" style="border-left: 4px solid var(--primary);">
          <div class="card-title">🏛️ İdari Adımlar (Phase 1 · Settle)</div>
          <p style="font-size:0.75rem; color:var(--muted); margin:0 0 8px 0;">LandingNL bu adımları senin yerine tamamlamaz veya doğrulamaz. Her adımın durumunu kendin seç: başlamadın, başvurdun ve bekliyorsun, ya da tamamlandı.</p>
          <ul class="list">
            <li class="item">
              <span>1. Belediye kaydı & BSN</span>
              <select class="step-state" id="step-state-1" aria-label="Belediye kaydı ve BSN durumu"></select>
            </li>
            <li class="item">
              <span>2. DigiD</span>
              <select class="step-state" id="step-state-2" aria-label="DigiD durumu"></select>
            </li>
            <li class="item">
              <span>3. Banka hesabı</span>
              <select class="step-state" id="step-state-3" aria-label="Banka hesabı durumu"></select>
            </li>
            <li class="item">
              <span>4. Huisarts (aile hekimi)</span>
              <select class="step-state" id="step-state-4" aria-label="Huisarts durumu"></select>
            </li>
          </ul>
          <div id="status-info" style="display:none; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:10px; border-radius:8px; margin-top:12px; font-size:0.78rem; color:#34d399;"></div>
        </div>

        <div class="card">
          <div class="card-title">💳 Banka Hesabı</div>
          <p style="font-size:0.75rem; color:var(--muted); margin:0 0 8px 0;">Bankaların şartları farklıdır; hesap açmadan önce koşulları bankanın kendi sitesinden kontrol et. LandingNL hiçbir bankayla entegre değildir.</p>
          <ul class="list">
            <li class="item"><span>BSN gerektirmeyen hesaplar</span> <span class="tag tag-purple">Koşulları kontrol et</span></li>
            <li class="item"><span>Hollanda bankaları (ING, ABN AMRO, Rabobank…)</span> <span class="tag tag-amber" id="tag-ing">Genellikle BSN ister</span></li>
          </ul>
        </div>

        <div class="card col-3" style="border-left: 4px solid var(--amber);">
          <div class="card-title">🏛️ Devlet Destekleri (toeslagen)</div>
          <p style="font-size:0.82rem; color:var(--muted); margin-bottom:12px;">Uygunluk ve tutarı Belastingdienst belirler; LandingNL başvuru yapmaz ve tutar garanti etmez. Kendi durumunu resmi hesaplayıcıyla kontrol et:</p>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px;" id="allowance-grid">
          </div>
        </div>

        <div class="card col-3" style="border-left: 4px solid var(--purple);">
          <div class="card-title">💼 Profilin ve Çalışma Koşulların</div>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap:12px; margin-top:12px;" id="profile-grid">
          </div>
        </div>
      </div>
    </div>

    <!-- PHASE 2 -->
    <div id="view-2" class="hidden">
      <div class="grid">
        <div class="card col-3" style="border-left: 4px solid var(--primary);">
          <div class="card-title">🎁 Verified Student Deals & SURFspot İndirimleri</div>
          <p style="font-size:0.82rem; color:var(--muted); margin-bottom:12px;">Üniversite mailin (<code>@student.uva.nl</code> vb.) ve öğrenci kartın tahmin ettiğinden çok daha güçlü!</p>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px;" id="perks-grid">
          </div>
        </div>

        <div class="card col-3" style="border-left: 4px solid var(--mint);">
          <div class="card-title">🏥 Phase 2: Çalışma Statüsü & Sağlık Sigortası Karar Ağacı</div>
          <p style="font-size:0.82rem; color:var(--muted); margin-bottom:16px;">Ücretli işe veya stajyer maaşına başladığında sağlık sigortası yükümlülüğün değişebilir. Durumunu seç:</p>

          <div style="display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
            <button class="btn-act" id="btn-work-no" style="padding:10px 18px; font-size:0.85rem;">❌ Çalışmıyorum (Sadece Öğrenciyim)</button>
            <button class="btn-act" id="btn-work-yes" style="padding:10px 18px; font-size:0.85rem; opacity:0.6; background:rgba(255,255,255,0.08);">🟢 Ücretli Çalışıyorum (Part-time / Full-time)</button>
          </div>

          <div id="insurance-tree-result" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
          </div>
        </div>

        <div class="card col-3">
          <div class="card-title">🎓 BSA & ECTS Takibi</div>
          <p id="prog-text" style="font-size:0.85rem; color:var(--muted);">Yükleniyor...</p>
        </div>
      </div>
    </div>

    <!-- PHASE 3 -->
    <div id="view-3" class="hidden">
      <div class="grid">
        <div class="card" style="border-left: 4px solid var(--mint);">
          <div class="card-title">🌱 İlan Paylaş (Zero-Cash Swap)</div>
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:14px;">Önizleme: ilanların şimdilik yalnızca senin hesabında saklanır, başka öğrenciler göremez. Topluluk panosu moderasyon ve bildirim araçları hazır olunca açılacak.</p>
          
          <label style="font-size:0.75rem; color:var(--muted); display:block; margin-bottom:4px;">Kategori</label>
          <select id="swap-cat" style="width:100%; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:0.85rem; margin-bottom:10px; outline:none;">
            <option value="🍝 Food Exchange">🍝 Food Exchange (Ev Yemeği)</option>
            <option value="🎹 Skill Swap">🎹 Skill Swap (Ders / Enstrüman)</option>
            <option value="🚲 Gear & Tools">🚲 Gear & Tools (Eşya / Kitap)</option>
            <option value="🎁 Give Away">🎁 Give Away (Ücretsiz Ver)</option>
          </select>
          <button type="button" class="btn-act btn-act-full" id="btn-give-away" style="margin:-2px 0 12px; background:rgba(192,132,252,0.16); color:#d8b4fe; border:1px solid rgba(192,132,252,0.3);">🎁 Ücretsiz Ver</button>

          <label style="font-size:0.75rem; color:var(--muted); display:block; margin-bottom:4px;">Ne Sunuyorsun?</label>
          <input type="text" id="swap-title" placeholder="Örn: 2 Porsiyon Ev Yapımı Makarna" style="width:100%; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:0.85rem; margin-bottom:10px; outline:none;" />

          <label style="font-size:0.75rem; color:var(--muted); display:block; margin-bottom:4px;">Karşılığında Ne İstersin?</label>
          <input type="text" id="swap-offer" placeholder="Örn: NT2 Dil Pratiği / Kahve" style="width:100%; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:0.85rem; margin-bottom:14px; outline:none;" />

          <button class="btn-act btn-act-full" id="btn-add-swap" style="background:var(--mint); color:#042f2e;">Taslak Olarak Kaydet ➔</button>
        </div>

        <div class="card col-2">
          <div class="card-title">🤝 <span id="city-board-title">Kampüs</span> Dayanışma Akışı</div>
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:16px;">Senin taslakların ve örnek ilanlar (gerçek kullanıcı ilanı değildir):</p>
          <div id="swap-container"></div>
        </div>
      </div>
    </div>
  </div>

  <footer style="text-align:center; padding:8px 20px 32px; font-size:0.78rem; color:#64748b;"><a href="/privacy" style="color:#94a3b8;">Gizlilik Bildirimi</a> · Hesabının silinmesi için: reichani@gmail.com · <span title="Sürüm">${releaseLabel}</span></footer>

  <div id="modal-box" class="modal hidden">
    <div class="modal-content">
      <div style="font-size:2rem; margin-bottom:8px;">🤝</div>
      <h3 style="margin:0 0 6px 0;" id="modal-title">İlan Sahibiyle Bağlan</h3>
      <p style="font-size:0.8rem; color:var(--muted); margin-bottom:16px;">Mesajlaşma henüz açık değil. Bu şablonu kendi öğrenci grubunda kullanabilirsin:</p>
      
      <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:10px; padding:12px; font-size:0.82rem; text-align:left; color:#cbd5e1; margin-bottom:18px;" id="modal-msg">
        "Hoi! LandingNL Kampüs panosundaki ilanını gördüm. Takas yapmak ister misin?"
      </div>

      <div style="display:flex; gap:10px;">
        <button class="btn-act" id="btn-modal-wa" style="flex:1; padding:10px; background:var(--mint); color:#042f2e;">Mesajı Kopyala</button>
        <button class="btn-act" id="btn-modal-close" style="padding:10px; background:rgba(255,255,255,0.1); min-width:auto;">Kapat</button>
      </div>
    </div>
  </div>

  <script>${dashboardScript}</script>
</body>
</html>`;
}
