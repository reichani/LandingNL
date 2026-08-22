export function renderDashboardPage() {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LandingNL • Dashboard v1.0.4</title>
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
    
    .tag { padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; min-width: 105px; text-align: center; display: inline-flex; align-items: center; justify-content: center; }
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
      <div class="brand">LandingNL • Student Journey <span class="v-badge">v1.0.4</span></div>
      <button class="btn-reset" id="btn-reset-app">Sıfırla & Çıkış ➔</button>
    </header>

    <div class="savings-banner">
      <div>
        <div style="font-size:0.78rem; color:var(--mint); font-weight:700; text-transform:uppercase;">💡 Hak Kazandığın Yıllık Tasarruf / İade Potansiyeli</div>
        <div style="font-size:1.4rem; font-weight:800; color:#fff;" id="total-savings-text">Kişisel uygunluğuna göre</div>
      </div>
      <span class="tag tag-mint" style="padding:8px 14px; font-size:0.8rem;">Devlet Desteği & İndirimler Dahil</span>
    </div>

    <div class="progress-box">
      <div style="display:flex; justify-content:space-between; font-weight:700; font-size:0.9rem;">
        <span>🚩 Uyum İlerlemesi</span>
        <span id="percent-text" style="color:var(--mint);">%20</span>
      </div>
      <div class="progress-bar-bg">
        <div class="progress-bar-fill" id="bar-fill"></div>
      </div>
      <div class="badges">
        <span class="badge active">✓ Vize</span>
        <span class="badge active" id="b-housing">✓ Kalacak Yer</span>
        <span class="badge" id="b-bsn">⏳ 1. BSN Kaydı</span>
        <span class="badge" id="b-digid">🔒 2. DigiD</span>
        <span class="badge" id="b-bank">🔒 3. Banka</span>
        <span class="badge" id="b-gp">🔒 4. Huisarts (GP) Kaydı</span>
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" id="t1">✈️ Phase 1: Landing & Devlet Destekleri</button>
      <button class="tab" id="t2">🎁 Phase 2: Living, İndirimler & Sigorta</button>
      <button class="tab" id="t3">🤝 Student Exchange Board</button>
    </div>

    <!-- PHASE 1 -->
    <div id="view-1">
      <div class="grid">
        <div class="card" style="border-left: 4px solid var(--mint);">
          <div class="card-title">📄 Evrak & BSN Tarihi</div>
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:12px;">BSN / Randevu tarihini seçin (otomatik kaydedilir).</p>
          <input type="date" id="bsn-date" style="width:100%; padding:10px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.12); border-radius:8px; color:white; font-size:0.9rem; margin-bottom:10px; outline:none; cursor:pointer;" />
          <button class="btn-act btn-act-full" id="btn-save-bsn-date">Tarihi Onayla & BSN Tamamla ➔</button>
        </div>

        <div class="card" style="border-left: 4px solid var(--primary);">
          <div class="card-title">🏛️ İdari Adımlar (Phase 1)</div>
          <ul class="list">
            <li class="item">
              <span>1. Belediye BSN</span>
              <button class="btn-act" id="btn-step-1">Tamamla ➔</button>
            </li>
            <li class="item">
              <span>2. DigiD Aktivasyon</span>
              <button class="btn-act" id="btn-step-2" style="opacity:0.5;">🔒 Kilitli</button>
            </li>
            <li class="item">
              <span>3. Banka & Twelve</span>
              <button class="btn-act" id="btn-step-3" style="opacity:0.5;">🔒 Kilitli</button>
            </li>
            <li class="item">
              <span>4. Huisarts (GP) Kaydı</span>
              <button class="btn-act" id="btn-step-4" style="opacity:0.5;">🔒 Kilitli</button>
            </li>
          </ul>
          <div id="status-info" style="display:none; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:10px; border-radius:8px; margin-top:12px; font-size:0.78rem; color:#34d399;"></div>
        </div>

        <div class="card">
          <div class="card-title">💳 Finans & Entegrasyonlar</div>
          <ul class="list">
            <li class="item"><span>Revolut (BSN'siz)</span> <span class="tag tag-purple">✓ Aktif</span></li>
            <li class="item"><span>ING / ABN Banka</span> <span class="tag tag-amber" id="tag-ing">BSN Bekliyor</span></li>
            <li class="item"><span>Twelve Öğrenci Kartı</span> <span class="tag tag-amber" id="tag-twelve">Banka Bekliyor</span></li>
          </ul>
        </div>

        <div class="card col-3" style="border-left: 4px solid var(--amber);">
          <div class="card-title">🏛️ Government Free Money: Devlet Destekleri</div>
          <p style="font-size:0.82rem; color:var(--muted); margin-bottom:12px;">Birçok öğrenci bu karşılıksız devlet ödemelerine başvurabileceğini bilmiyor. Uygunluğunu kontrol et:</p>
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:12px;" id="allowance-grid">
          </div>
        </div>

        <div class="card col-3" style="border-left: 4px solid var(--purple);">
          <div class="card-title">💼 Giriş Hakları & Genel Profil Özetin</div>
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
          <p style="font-size:0.82rem; color:var(--muted); margin-bottom:16px;">Hollanda kanunlarına göre çalışmaya başladığınız an sağlık sigortası statünüz değişir:</p>

          <div style="display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap;">
            <button class="btn-act" id="btn-work-no" style="padding:10px 18px; font-size:0.85rem;">❌ Çalışmıyorum (Sadece Öğrenciyim)</button>
            <button class="btn-act" id="btn-work-yes" style="padding:10px 18px; font-size:0.85rem; opacity:0.6; background:rgba(255,255,255,0.08);">🟢 Sigortalı Çalışıyorum (Part-time / Full-time)</button>
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
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:14px;">Parasız dairesel kampüs pazarı: Yemek, yetenek veya eşya takası yap.</p>
          
          <label style="font-size:0.75rem; color:var(--muted); display:block; margin-bottom:4px;">Kategori</label>
          <select id="swap-cat" style="width:100%; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:0.85rem; margin-bottom:10px; outline:none;">
            <option value="🍝 Food Exchange">🍝 Food Exchange (Ev Yemeği)</option>
            <option value="🎹 Skill Swap">🎹 Skill Swap (Ders / Enstrüman)</option>
            <option value="🚲 Gear & Tools">🚲 Gear & Tools (Eşya / Kitap)</option>
          </select>

          <label style="font-size:0.75rem; color:var(--muted); display:block; margin-bottom:4px;">Ne Sunuyorsun?</label>
          <input type="text" id="swap-title" placeholder="Örn: 2 Porsiyon Ev Yapımı Makarna" style="width:100%; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:0.85rem; margin-bottom:10px; outline:none;" />

          <label style="font-size:0.75rem; color:var(--muted); display:block; margin-bottom:4px;">Karşılığında Ne İstersin?</label>
          <input type="text" id="swap-offer" placeholder="Örn: NT2 Dil Pratiği / Kahve" style="width:100%; padding:8px; background:rgba(0,0,0,0.3); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:white; font-size:0.85rem; margin-bottom:14px; outline:none;" />

          <button class="btn-act btn-act-full" id="btn-add-swap" style="background:var(--mint); color:#042f2e;">Panoya Ekle ➔</button>
        </div>

        <div class="card col-2">
          <div class="card-title">🤝 <span id="city-board-title">Kampüs</span> Dayanışma Akışı</div>
          <p style="font-size:0.8rem; color:var(--muted); margin-bottom:16px;">Şehrindeki öğrencilerin yayındaki parasız takas ilanları:</p>
          <div id="swap-container"></div>
        </div>
      </div>
    </div>
  </div>

  <div id="modal-box" class="modal hidden">
    <div class="modal-content">
      <div style="font-size:2rem; margin-bottom:8px;">🤝</div>
      <h3 style="margin:0 0 6px 0;" id="modal-title">İlan Sahibiyle Bağlan</h3>
      <p style="font-size:0.8rem; color:var(--muted); margin-bottom:16px;">Kampüs içi doğrudan hızlı iletişim şablonu:</p>
      
      <div style="background:rgba(0,0,0,0.3); border:1px solid var(--border); border-radius:10px; padding:12px; font-size:0.82rem; text-align:left; color:#cbd5e1; margin-bottom:18px;" id="modal-msg">
        "Hoi! LandingNL Kampüs panosundaki ilanını gördüm. Takas yapmak ister misin?"
      </div>

      <div style="display:flex; gap:10px;">
        <button class="btn-act" id="btn-modal-wa" style="flex:1; padding:10px; background:var(--mint); color:#042f2e;">WhatsApp / Discord ➔</button>
        <button class="btn-act" id="btn-modal-close" style="padding:10px; background:rgba(255,255,255,0.1); min-width:auto;">Kapat</button>
      </div>
    </div>
  </div>

  <script>
    var Store = {
      get: function(key, fallback) {
        try { return localStorage.getItem('landingnl_' + key) || fallback; }
        catch (e) { return fallback; }
      },
      set: function(key, val) {
        try { localStorage.setItem('landingnl_' + key, val); }
        catch (e) {}
        fetch('/api/state', {
          method: 'PATCH',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify((function() { var p = {}; p[key] = String(val); return p; })())
        }).catch(function() {});
      },
      clear: function() {
        try {
          var keys = [];
          for (var i = 0; i < localStorage.length; i++) {
            var key = localStorage.key(i);
            if (key && key.indexOf('landingnl_') === 0) keys.push(key);
          }
          for (var j = 0; j < keys.length; j++) localStorage.removeItem(keys[j]);
        }
        catch (e) {}
      },
      hydrate: async function() {
        try {
          var response = await fetch('/api/state', { credentials: 'same-origin' });
          if (!response.ok) return;
          var result = await response.json();
          var state = result.state || {};
          Object.keys(state).forEach(function(key) {
            localStorage.setItem('landingnl_' + key, String(state[key]));
          });
        } catch (e) {}
      }
    };

    function cleanIsoDate(val) {
      if (!val) return '2026-08-19';
      var match = val.match(/^\\d{4}-\\d{2}-\\d{2}/);
      return match ? match[0] : '2026-08-19';
    }

    function createSubCard(tagClass, tagText, titleText, descText, actionMsg) {
      var box = document.createElement('div');
      box.style.cssText = 'background:rgba(0,0,0,0.25); padding:12px; border-radius:12px; border:1px solid var(--border); display:flex; flex-direction:column; justify-content:space-between;';
      
      var topDiv = document.createElement('div');
      var tagSpan = document.createElement('span');
      tagSpan.className = 'tag ' + tagClass;
      tagSpan.innerText = tagText;
      
      var h4 = document.createElement('h4');
      h4.style.cssText = 'margin:6px 0 2px 0; font-size:0.88rem; color:#fff;';
      h4.innerText = titleText;

      var p = document.createElement('p');
      p.style.cssText = 'margin:0 0 10px 0; font-size:0.75rem; color:var(--muted);';
      p.innerText = descText;

      topDiv.appendChild(tagSpan);
      topDiv.appendChild(h4);
      topDiv.appendChild(p);
      box.appendChild(topDiv);

      if (actionMsg) {
        var btn = document.createElement('button');
        btn.className = 'btn-act';
        btn.style.cssText = 'width:100%; padding:6px; font-size:0.75rem; background:rgba(255,255,255,0.08); color:#cbd5e1;';
        btn.innerText = 'Detay & Başvuru ➔';
        btn.onclick = function() { alert(actionMsg); };
        box.appendChild(btn);
      }

      return box;
    }

    function renderProfileGrid() {
      var grid = document.getElementById('profile-grid');
      if (!grid) return;
      grid.innerHTML = '';

      var age = parseInt(Store.get('age', '18'));
      var city = Store.get('city', 'Amsterdam');
      var status = Store.get('status', 'non_eu');
      var program = Store.get('program', 'University of Amsterdam (UvA)');

      var isEU = (status === 'eu');
      var isAdult = age >= 21;

      grid.appendChild(createSubCard('tag-purple', '📌 Özet Profil', city + ' • ' + age + ' Yaş', program));
      grid.appendChild(createSubCard(isEU ? 'tag-mint' : 'tag-amber', isEU ? 'AB/AEA çalışma statüsü' : 'Çalışma izni kontrolü gerekli', isEU ? 'Genellikle TWV gerekmez' : 'İşveren ve izin koşullarını doğrula', 'Güncel hakkını resmi IND ve hükümet kaynaklarından doğrula.'));
      grid.appendChild(createSubCard('tag-mint', '💶 Asgari Ücret Skalası', isAdult ? 'Tam Asgari Ücret Skalası' : age + ' Yaş Jeugdloon Skalası', '21 yaş altı öğrenciler için yaşa bağlı resmi kademeli ücret uygulanır.'));
    }

    function renderAllowances() {
      var grid = document.getElementById('allowance-grid');
      if (!grid) return;
      grid.innerHTML = '';

      var housing = Store.get('housing', 'no');
      var isHouseReady = (housing === 'yes');

      grid.appendChild(createSubCard(
        isHouseReady ? 'tag-mint' : 'tag-amber',
        '🏠 Huurtoeslag (Kira Desteği)',
        isHouseReady ? 'Kira Sözleşmen Var - Başvurabilirsin' : 'Geçici Konaklama - Sözleşme Bekliyor',
        'Kendi kapısı ve mutfağı olan bağımsız odalarda kalan öğrencilere devlet aylık kira yardımı yapar.',
        'DigiD ile Belastingdienst Huurtoeslag başvuru portalına yönlendiriliyorsunuz.'
      ));

      grid.appendChild(createSubCard(
        'tag-purple',
        '🩺 Zorgtoeslag (Sigorta Desteği)',
        'Güncel uygunluğunu kontrol et',
        'Uygunluk; sigorta, gelir, yaş ve ikamet durumuna göre resmi kurum tarafından belirlenir.',
        'DigiD ile Belastingdienst Zorgtoeslag başvuru portalına yönlendiriliyorsunuz.'
      ));
    }

    function renderPerks() {
      var grid = document.getElementById('perks-grid');
      if (!grid) return;
      grid.innerHTML = '';

      grid.appendChild(createSubCard(
        'tag-mint',
        '💻 SURFspot İndirimleri',
        'Adobe, Microsoft, Apple & Laptop (%80\'e varan)',
        'Üniversite mail login bilgilerin ile SURFspot.nl adresine girerek lisans indirimlerini kullan.',
        'SURFspot.nl resmi öğrenci indirim portalına yönlendiriliyorsunuz.'
      ));

      grid.appendChild(createSubCard(
        'tag-purple',
        '🎟️ Student Card Deals',
        'Müze, Sinema & Mağazalar',
        'Öğrenci kartınla gittiğin her yerde sor: "Do you have a student discount?" (Rijksmuseum, Pathé vb.)',
        'Öğrenci kartı geçen noktalar listesine yönlendiriliyorsunuz.'
      ));
    }

    function renderInsuranceTree() {
      var container = document.getElementById('insurance-tree-result');
      if (!container) return;
      container.innerHTML = '';

      var isWorking = Store.get('is_working', 'no') === 'yes';
      var status = Store.get('status', 'non_eu');
      var isEU = (status === 'eu');

      var btnNo = document.getElementById('btn-work-no');
      var btnYes = document.getElementById('btn-work-yes');

      if (btnNo && btnYes) {
        if (isWorking) {
          btnYes.style.cssText = 'padding:10px 18px; font-size:0.85rem; background:var(--mint); color:#042f2e; font-weight:700;';
          btnNo.style.cssText = 'padding:10px 18px; font-size:0.85rem; opacity:0.6; background:rgba(255,255,255,0.08); color:var(--muted);';
        } else {
          btnNo.style.cssText = 'padding:10px 18px; font-size:0.85rem; background:var(--primary); color:white; font-weight:700;';
          btnYes.style.cssText = 'padding:10px 18px; font-size:0.85rem; opacity:0.6; background:rgba(255,255,255,0.08); color:var(--muted);';
        }
      }

      if (!isWorking) {
        container.appendChild(createSubCard('tag-purple', '🏥 Geçerli Sigortan', isEU ? 'EHIC / Özel Sigorta Yeterli' : 'Özel Öğrenci Sigortası (Aon / InsureToStudy)', 'Sadece eğitim aldığınız sürece zorunlu Hollanda Temel Sağlık Sigortası (Basiszorgverzekering) yapmanıza gerek yoktur.', 'Aon Student Insurance portalına yönlendiriliyorsunuz.'));
        container.appendChild(createSubCard('tag-mint', '💶 Sigorta Durumu', 'Poliçeni ve kapsamını doğrula', 'Mevcut özel/öğrenci sigortanın Hollanda’daki kapsamını sigortacı ve resmi kaynaklarla doğrula.'));
        container.appendChild(createSubCard('tag-amber', '⚠️ Karar Uyarısı', 'İşe Girdiğin An Değişir', 'Part-time veya resmi kontratlı bir işe başladığınız ilk gün Temel Sigortaya geçmek yasal zorunluluktur.'));
      } else {
        container.appendChild(createSubCard('tag-mint', '🚨 STATÜ KONTROLÜ', 'Basiszorgverzekering gerekebilir', 'Ücretli çalışmaya başladığında Hollanda temel sağlık sigortası yükümlülüğünü resmi SVB ve hükümet kaynaklarından kontrol et.', 'Temel Sağlık Sigortası resmi bilgi sayfasına yönlendiriliyorsunuz.'));
        container.appendChild(createSubCard('tag-purple', '💶 DEVLET DESTEĞİ', 'Zorgtoeslag uygunluğunu kontrol et', 'Gelir, yaş, ikamet ve sigorta durumuna göre destek hakkın doğabilir. Güncel sonucu Belastingdienst hesaplar.', 'Zorgtoeslag resmi uygunluk sayfasına yönlendiriliyorsunuz.'));
        container.appendChild(createSubCard('tag-mint', '🩺 Aile Hekimi (Huisarts)', 'Huisarts Kaydınız Geçerli', 'Phase 1\'de kaydolduğunuz Huisarts hekiminiz üzerinden sevk ve sağlık erişimi devam eder.'));
      }
    }

    function completeStep(targetStep) {
      var currentStep = parseInt(Store.get('step', '0'));
      if (targetStep === 1) {
        Store.set('step', '1');
      } else if (targetStep === 2) {
        if (currentStep < 1) return alert('Önce BSN kaydını tamamlayın.');
        Store.set('step', '2');
      } else if (targetStep === 3) {
        if (currentStep < 2) return alert('Önce DigiD aktivasyonunu tamamlayın.');
        Store.set('step', '3');
      } else if (targetStep === 4) {
        if (currentStep < 3) return alert('Önce Banka entegrasyonunu tamamlayın.');
        Store.set('step', '4');
      }
      render();
    }

    function render() {
      var step = parseInt(Store.get('step', '0'));
      var rawDate = Store.get('bsn_date', '2026-08-19');
      var savedDate = cleanIsoDate(rawDate);

      var dateElem = document.getElementById('bsn-date');
      if (dateElem) dateElem.value = savedDate;

      var score = 20 + (step * 20);
      var percentElem = document.getElementById('percent-text');
      var fillElem = document.getElementById('bar-fill');
      if (percentElem) percentElem.innerText = '%' + score;
      if (fillElem) fillElem.style.width = score + '%';

      var bBsn = document.getElementById('b-bsn');
      var bDigid = document.getElementById('b-digid');
      var bBank = document.getElementById('b-bank');
      var bGp = document.getElementById('b-gp');

      var btn1 = document.getElementById('btn-step-1');
      var btn2 = document.getElementById('btn-step-2');
      var btn3 = document.getElementById('btn-step-3');
      var btn4 = document.getElementById('btn-step-4');

      var tagIng = document.getElementById('tag-ing');
      var tagTwelve = document.getElementById('tag-twelve');
      var info = document.getElementById('status-info');

      if (info) info.style.display = 'block';

      if (step >= 1) {
        if (bBsn) { bBsn.className = 'badge active'; bBsn.innerText = '✓ BSN Tamam'; }
        if (btn1) { btn1.className = 'tag tag-mint'; btn1.innerText = '✓ Alındı'; }
        if (tagIng) { tagIng.className = 'tag tag-mint'; tagIng.innerText = '✓ Hesabı Aç'; }
        if (btn2) { btn2.style.opacity = '1'; btn2.innerText = 'Aktifleştir ➔'; }
        if (info) info.innerHTML = '✅ <strong>BSN Kaydedildi (' + savedDate + ')!</strong> Şimdi DigiD mektubunu onaylamak için "2. DigiD" butonuna basın.';
      } else {
        if (bBsn) { bBsn.className = 'badge'; bBsn.innerText = '⏳ 1. BSN Kaydı'; }
        if (btn1) { btn1.className = 'btn-act'; btn1.innerText = 'Tamamla ➔'; }
        if (tagIng) { tagIng.className = 'tag tag-amber'; tagIng.innerText = 'BSN Bekliyor'; }
        if (btn2) { btn2.style.opacity = '0.5'; btn2.innerText = '🔒 Kilitli'; }
        if (info) info.innerHTML = 'ℹ️ BSN randevu tarihinizi kaydederek idari adımları sırayla açın.';
      }

      if (step >= 2) {
        if (bDigid) { bDigid.className = 'badge active'; bDigid.innerText = '✓ DigiD Aktif'; }
        if (btn2) { btn2.className = 'tag tag-mint'; btn2.innerText = '✓ Aktifleşti'; }
        if (tagTwelve) { tagTwelve.className = 'tag tag-mint'; tagTwelve.innerText = '✓ Kart Bağla'; }
        if (btn3) { btn3.style.opacity = '1'; btn3.innerText = 'Entegre Et ➔'; }
        if (info) info.innerHTML = '✅ <strong>DigiD Aktifleşti!</strong> Son olarak Banka & Twelve entegrasyonuna tıklayın.';
      } else if (step < 2) {
        if (bDigid) { bDigid.className = 'badge'; bDigid.innerText = '🔒 2. DigiD'; }
        if (tagTwelve) { tagTwelve.className = 'tag tag-amber'; tagTwelve.innerText = 'Banka Bekliyor'; }
        if (btn3) { btn3.style.opacity = '0.5'; btn3.innerText = '🔒 Kilitli'; }
      }

      if (step >= 3) {
        if (bBank) { bBank.className = 'badge active'; bBank.innerText = '✓ Banka Entegre'; }
        if (btn3) { btn3.className = 'tag tag-mint'; btn3.innerText = '✓ Entegre Edildi'; }
        if (tagIng) { tagIng.className = 'tag tag-mint'; tagIng.innerText = '✓ Aktif'; }
        if (tagTwelve) { tagTwelve.className = 'tag tag-mint'; tagTwelve.innerText = '✓ Tanımlandı'; }
        if (btn4) { btn4.style.opacity = '1'; btn4.innerText = 'Hekim Seç ➔'; }
        if (info) info.innerHTML = '✅ <strong>Banka Entegre Edildi!</strong> Son olarak BSN ve Adresinizle mahalle Huisarts (Aile Hekimi) kaydınızı tamamlayın.';
      } else if (step < 3) {
        if (bBank) { bBank.className = 'badge'; bBank.innerText = '🔒 3. Banka'; }
        if (btn4) { btn4.style.opacity = '0.5'; btn4.innerText = '🔒 Kilitli'; }
      }

      if (step >= 4) {
        if (bGp) { bGp.className = 'badge active'; bGp.innerText = '✓ Huisarts Kayıtlı'; }
        if (btn4) { btn4.className = 'tag tag-mint'; btn4.innerText = '✓ Kayıtlı'; }
        if (info) info.innerHTML = '🎉 <strong>Tebrikler!</strong> Phase 1 Uyum Süreci %100 tamamlandı. Phase 2 akademik ve sigorta karar ağacı modülüne geçebilirsiniz.';
      } else if (step < 4) {
        if (bGp) { bGp.className = 'badge'; bGp.innerText = '🔒 4. Huisarts (GP) Kaydı'; }
      }
    }

    var defaultPosts = [
      { id: 1, cat: '🍝 Food Exchange', title: '3 Porsiyon İtalyan Makarnası', offer: 'Bulaşıkları yıkayacak ev arkadaşı', tagClass: 'tag-purple' },
      { id: 2, cat: '🎹 Skill Swap', title: 'Piyano Dersi / Pratik Eşliği', offer: 'NT2 Temel Hollandaca konuşma pratiği', tagClass: 'tag-mint' },
      { id: 3, cat: '🚲 Gear & Tools', title: 'Swapfiets Anahtarı & Yağlama Seti', offer: '1 Bardak Filtre Kahve', tagClass: 'tag-amber' }
    ];

    function renderSwaps() {
      var container = document.getElementById('swap-container');
      if (!container) return;
      container.innerHTML = '';

      var userPosts = [];
      try { userPosts = JSON.parse(Store.get('user_swaps', '[]')); } catch(e) {}
      var allPosts = userPosts.concat(defaultPosts);

      for (var i = 0; i < allPosts.length; i++) {
        var post = allPosts[i];
        var div = document.createElement('div');
        div.className = 'swap-card';
        var content = document.createElement('div');
        var category = document.createElement('span');
        category.className = 'swap-tag ' + (post.tagClass || 'tag-mint');
        category.textContent = String(post.cat || '');
        var title = document.createElement('h4');
        title.style.cssText = 'margin:2px 0; font-size:0.9rem; color:#fff;';
        title.textContent = String(post.title || '');
        var offer = document.createElement('p');
        offer.style.cssText = 'margin:0; font-size:0.78rem; color:var(--muted);';
        offer.appendChild(document.createTextNode('Karşılığında: '));
        var offerStrong = document.createElement('strong');
        offerStrong.style.color = '#cbd5e1';
        offerStrong.textContent = String(post.offer || '');
        offer.appendChild(offerStrong);
        content.appendChild(category);
        content.appendChild(title);
        content.appendChild(offer);
        div.appendChild(content);
        
        var btnConn = document.createElement('button');
        btnConn.className = 'btn-act';
        btnConn.style.cssText = 'background:rgba(16,185,129,0.15); color:#34d399; min-width:auto;';
        btnConn.innerText = 'İletişim ➔';
        (function(t) {
          btnConn.onclick = function() {
            document.getElementById('modal-title').innerText = '"' + t + '"';
            document.getElementById('modal-msg').innerText = 'Hoi! LandingNL kampüs panosundaki "' + t + '" ilanını gördüm. Takas yapmak ister misin?';
            document.getElementById('modal-box').classList.remove('hidden');
          };
        })(post.title);

        div.appendChild(btnConn);
        container.appendChild(div);
      }
    }

    // DIRECT STEP UPDATE FUNCTION FOR BSN DATE
    function triggerBsnSave() {
      var dateInput = document.getElementById('bsn-date');
      var val = cleanIsoDate(dateInput ? dateInput.value : '2026-08-19');
      Store.set('bsn_date', val);
      Store.set('step', '1');
      render();
    }

    window.addEventListener('DOMContentLoaded', function() {
      var city = Store.get('city', 'Amsterdam');
      var program = Store.get('program', 'University of Amsterdam (UvA)');

      var progElem = document.getElementById('prog-text');
      var cityElem = document.getElementById('city-board-title');

      if (progElem) progElem.innerText = 'Seçilen Okul / Bölüm: ' + program;
      if (cityElem) cityElem.innerText = city;

      var dateInput = document.getElementById('bsn-date');
      if (dateInput) {
        dateInput.value = cleanIsoDate(Store.get('bsn_date', '2026-08-19'));
        dateInput.addEventListener('change', function() {
          triggerBsnSave();
        });
      }

      var btnSaveDate = document.getElementById('btn-save-bsn-date');
      if (btnSaveDate) {
        btnSaveDate.onclick = function() {
          triggerBsnSave();
          alert('✅ BSN Randevu Tarihi Kaydedildi ve Adım 1 Tamamlandı!');
        };
      }

      var b1 = document.getElementById('btn-step-1');
      if (b1) b1.onclick = function() { completeStep(1); };

      var b2 = document.getElementById('btn-step-2');
      if (b2) b2.onclick = function() { completeStep(2); };

      var b3 = document.getElementById('btn-step-3');
      if (b3) b3.onclick = function() { completeStep(3); };

      var b4 = document.getElementById('btn-step-4');
      if (b4) b4.onclick = function() { completeStep(4); };

      var btnWorkNo = document.getElementById('btn-work-no');
      if (btnWorkNo) {
        btnWorkNo.onclick = function() {
          Store.set('is_working', 'no');
          renderInsuranceTree();
        };
      }

      var btnWorkYes = document.getElementById('btn-work-yes');
      if (btnWorkYes) {
        btnWorkYes.onclick = function() {
          Store.set('is_working', 'yes');
          renderInsuranceTree();
        };
      }

      var btnReset = document.getElementById('btn-reset-app');
      if (btnReset) {
        btnReset.onclick = function() {
          Store.clear();
          fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
            .finally(function() { location.href = "/"; });
        };
      }

      var btnAddSwap = document.getElementById('btn-add-swap');
      if (btnAddSwap) {
        btnAddSwap.onclick = function() {
          var cat = document.getElementById('swap-cat').value;
          var title = document.getElementById('swap-title').value;
          var offer = document.getElementById('swap-offer').value;

          if (!title || !offer) return alert('Lütfen tüm alanları doldurun.');

          var userPosts = [];
          try { userPosts = JSON.parse(Store.get('user_swaps', '[]')); } catch(e) {}
          userPosts.unshift({ id: Date.now(), cat: cat, title: title, offer: offer, tagClass: 'tag-mint' });
          Store.set('user_swaps', JSON.stringify(userPosts));

          document.getElementById('swap-title').value = '';
          document.getElementById('swap-offer').value = '';

          renderSwaps();
          alert('🌱 İlanınız kampüs panosuna eklendi!');
        };
      }

      var btnWa = document.getElementById('btn-modal-wa');
      if (btnWa) {
        btnWa.onclick = function() {
          alert('Mesaj kopyalandı! Öğrenci sohbet grubuna yönlendiriliyorsunuz.');
          document.getElementById('modal-box').classList.add('hidden');
        };
      }

      var btnClose = document.getElementById('btn-modal-close');
      if (btnClose) {
        btnClose.onclick = function() {
          document.getElementById('modal-box').classList.add('hidden');
        };
      }

      var tabs = [1, 2, 3];
      for (var i = 0; i < tabs.length; i++) {
        (function(num) {
          var tBtn = document.getElementById('t' + num);
          if (tBtn) {
            tBtn.onclick = function() {
              for (var j = 0; j < tabs.length; j++) {
                var k = tabs[j];
                var b = document.getElementById('t' + k);
                var v = document.getElementById('view-' + k);
                if (b) b.classList.toggle('active', k === num);
                if (v) v.classList.toggle('hidden', k !== num);
              }
            };
          }
        })(tabs[i]);
      }

      Store.hydrate().finally(function() {
        renderProfileGrid();
        renderAllowances();
        renderPerks();
        renderInsuranceTree();
        render();
        renderSwaps();
      });
    });
  </script>
</body>
</html>`;
}

