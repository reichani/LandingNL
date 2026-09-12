export const dashboardScript = `
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
          Store.clear();
          Object.keys(state).forEach(function(key) {
            localStorage.setItem('landingnl_' + key, String(state[key]));
          });
        } catch (e) {}
      }
    };

    function todayIso() {
      return new Date().toISOString().slice(0, 10);
    }

    function cleanIsoDate(val) {
      if (!val) return '';
      var match = val.match(/^\\d{4}-\\d{2}-\\d{2}/);
      return match ? match[0] : '';
    }

    function createSubCard(tagClass, tagText, titleText, descText, actionUrl) {
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

      if (actionUrl) {
        var link = document.createElement('a');
        link.className = 'btn-act';
        link.style.cssText = 'width:100%; padding:6px; font-size:0.75rem; background:rgba(255,255,255,0.08); color:#cbd5e1; text-align:center; text-decoration:none; box-sizing:border-box;';
        link.innerText = 'Kaynağı Aç ↗';
        link.href = actionUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        box.appendChild(link);
      }

      return box;
    }

    // Dutch allowances (huurtoeslag, zorgtoeslag) and the duty to hold your own
    // basic health insurance start at 18. Under 18 a student is insured free via a
    // parent, pays no premium and therefore cannot claim zorgtoeslag.
    var ALLOWANCE_MIN_AGE = 18;

    function studentAge() {
      var age = parseInt(Store.get('age', ''), 10);
      return isNaN(age) ? null : age;
    }

    function isAdultForAllowances() {
      var age = studentAge();
      return age === null || age >= ALLOWANCE_MIN_AGE;
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

    // Non-EU/EEA and EU/EEA students enter the Dutch system through different doors:
    // the non-EU route runs through IND (entry visa + residence permit) before municipal
    // registration, the EU route does not. Both then share the Settle steps.
    function renderStatusRoute() {
      var box = document.getElementById('status-route');
      if (!box) return;
      var isEU = Store.get('status', 'non_eu') === 'eu';
      box.innerHTML = '';

      var title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = isEU ? '🇪🇺 AB/AEA veya İsviçre rotası' : '🛂 AB/AEA dışı rota';
      box.appendChild(title);

      var lead = document.createElement('p');
      lead.style.cssText = 'font-size:0.82rem; color:var(--muted); margin:0 0 12px 0;';
      lead.textContent = isEU
        ? 'Oturum izni başvurusu gerekmez. Hollanda’da dört aydan uzun kalacaksan belediyeye (BRP) kaydolman gerekir; kısa kalışlarda RNI kaydı yapılır. Aşağıdaki adımlarla doğrudan başlayabilirsin.'
        : 'Belediyeye kaydolmadan önce oturum iznin (VVR) tamamlanmalı. Başvuruyu genellikle okulun IND nezdinde senin adına yapar; gerekiyorsa önce giriş vizesi (MVV) alınır. İzin kartını aldıktan sonra aşağıdaki adımlara geç.';
      box.appendChild(lead);

      var list = document.createElement('ul');
      list.className = 'list';
      var items = isEU
        ? [['Oturum izni', 'Gerekmez'], ['Çalışma izni (TWV)', 'Genellikle gerekmez'], ['İlk adım', 'Belediye / RNI kaydı']]
        : [['Oturum izni (VVR)', 'Gerekir – okulun ve IND ile takip et'], ['Giriş vizesi (MVV)', 'Ülkene göre değişir'], ['Çalışma izni (TWV)', 'İşveren başvurur – saat sınırı olabilir'], ['İlk adım', 'İzin kartı, sonra belediye kaydı']];
      items.forEach(function(pair) {
        var li = document.createElement('li');
        li.className = 'item';
        var left = document.createElement('span');
        left.textContent = pair[0];
        var right = document.createElement('span');
        right.className = 'tag ' + (isEU ? 'tag-mint' : 'tag-amber');
        right.textContent = pair[1];
        li.appendChild(left); li.appendChild(right);
        list.appendChild(li);
      });
      box.appendChild(list);

      var link = document.createElement('a');
      link.href = isEU
        ? 'https://ind.nl/en/residence-permits/eu-eea-and-swiss-citizens'
        : 'https://ind.nl/en/residence-permits/study/residence-permit-for-study-purposes';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'btn-act btn-act-full';
      link.style.cssText = 'display:block; margin-top:10px; text-align:center; text-decoration:none;';
      link.textContent = 'IND resmi sayfası ↗';
      box.appendChild(link);
    }

    function renderAllowances() {
      var grid = document.getElementById('allowance-grid');
      if (!grid) return;
      grid.innerHTML = '';

      if (!isAdultForAllowances()) {
        grid.appendChild(createSubCard(
          'tag-amber',
          '\u{1F553} 18 ya\u015F\u0131n\u0131 doldurmadan',
          'Toeslag ba\u015Fvurusu hen\u00FCz m\u00FCmk\u00FCn de\u011Fil',
          'Huurtoeslag ve zorgtoeslag i\u00E7in kural olarak 18 ya\u015F\u0131n\u0131 doldurmu\u015F olman gerekir (\u00E7ok dar istisnalar var). 18\u2019ine girdi\u011Fin ayda kurulumdaki ya\u015F\u0131n\u0131 g\u00FCncelle; kartlar a\u00E7\u0131lacak.',
          'https://www.belastingdienst.nl/wps/wcm/connect/nl/jongeren/content/vanaf-18-jaar-kun-je-toeslagen-krijgen'
        ));
        return;
      }

      var housing = Store.get('housing', 'no');
      var isHouseReady = (housing === 'yes');

      grid.appendChild(createSubCard(
        isHouseReady ? 'tag-mint' : 'tag-amber',
        '\u{1F3E0} Huurtoeslag (Kira Deste\u011Fi)',
        isHouseReady ? 'S\u00F6zle\u015Fmen var \u2013 uygunlu\u011Funu kontrol et' : '\u00D6nce kira s\u00F6zle\u015Fmesi gerekir',
        'Genellikle kendi giri\u015Fi, mutfa\u011F\u0131 ve tuvaleti olan ba\u011F\u0131ms\u0131z bir konut gerekir; ya\u015F, kira ve gelir ko\u015Fullar\u0131 da vard\u0131r. Sonucu Belastingdienst belirler.',
        'https://www.belastingdienst.nl/wps/wcm/connect/nl/huurtoeslag/content/hoe-moet-ik-huurtoeslag-aanvragen'
      ));

      grid.appendChild(createSubCard(
        'tag-purple',
        '\u{1FA7A} Zorgtoeslag (Sigorta Deste\u011Fi)',
        'G\u00FCncel uygunlu\u011Funu kontrol et',
        'Uygunluk; sigorta, gelir, ya\u015F ve ikamet durumuna g\u00F6re resmi kurum taraf\u0131ndan belirlenir.',
        'https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/content/hoe-moet-ik-zorgtoeslag-aanvragen'
      ));
    }

    function renderPerks() {
      var grid = document.getElementById('perks-grid');
      if (!grid) return;
      grid.innerHTML = '';

      grid.appendChild(createSubCard(
        'tag-mint',
        '💻 SURFspot İndirimleri',
        "Adobe, Microsoft, Apple & Laptop (%80'e varan)",
        'Üniversite mail login bilgilerin ile SURFspot.nl adresine girerek lisans indirimlerini kullan.',
        'https://www.surfspot.nl/'
      ));

      grid.appendChild(createSubCard(
        'tag-purple',
        '🎟️ Student Card Deals',
        'Müze, Sinema & Mağazalar',
        'Öğrenci kartınla gittiğin her yerde sor: "Do you have a student discount?" Güncel fırsatları açmadan önce koşulları kontrol et.',
        'https://www.isic.nl/en'
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

      if (!isAdultForAllowances()) {
        container.appendChild(createSubCard('tag-purple', '🏥 18 yaş altı', 'Genellikle ebeveynin üzerinden sigortalısın', 'Hollanda’da 18 yaşına kadar kendi temel sağlık sigortanı yaptırman gerekmez; prim ödemediğin için zorgtoeslag da alamazsın. Yurt dışından geldiysen mevcut poliçenin Hollanda’daki kapsamını sigortacınla doğrula.', 'https://www.studyinnl.org/plan-your-stay/healthcare-insurance'));
        container.appendChild(createSubCard('tag-amber', '⚠️ 18’ine girdiğinde', 'Kendi sigortanı yaptırman gerekir', '18. yaş gününden sonra kendi temel sağlık sigortanı (basisverzekering) yaptırman ve prim ödemen gerekir; aynı anda zorgtoeslag başvurusu da açılır. Kurulumdaki yaşını güncellemeyi unutma.', 'https://www.belastingdienst.nl/wps/wcm/connect/nl/jongeren/content/vanaf-18-jaar-kun-je-toeslagen-krijgen'));
        return;
      }

      if (!isWorking) {
        container.appendChild(createSubCard('tag-purple', '🏥 Yalnızca öğrenciysen', isEU ? 'EHIC veya özel sigorta genellikle yeterli' : 'Özel öğrenci sigortası genellikle gerekir', 'Sadece okuyorsan Hollanda temel sağlık sigortası (basisverzekering) genellikle zorunlu değildir; kendi durumunu resmi kaynaktan doğrula.', 'https://www.studyinnl.org/plan-your-stay/healthcare-insurance'));
        container.appendChild(createSubCard('tag-mint', '💶 Sigorta Durumu', 'Poliçeni ve kapsamını doğrula', 'Mevcut özel/öğrenci sigortanın Hollanda’daki kapsamını sigortacı ve resmi kaynaklarla doğrula.'));
        container.appendChild(createSubCard('tag-amber', '⚠️ Karar Uyarısı', 'Ücretli işe başlarsan değişir', 'Ücretli bir işe veya maaşlı staja başladığında Hollanda temel sağlık sigortası genellikle zorunlu hale gelir. Süreyi ve koşulları resmi kaynaktan kontrol et.'));
      } else {
        container.appendChild(createSubCard('tag-mint', '🚨 STATÜ KONTROLÜ', 'Basiszorgverzekering gerekebilir', 'Ücretli çalışmaya başladığında Hollanda temel sağlık sigortası yükümlülüğünü resmi SVB ve hükümet kaynaklarından kontrol et.', 'https://www.svb.nl/en/the-wlz-scheme/insurance-under-the-wlz-scheme/you-are-a-student-or-doing-an-internship'));
        container.appendChild(createSubCard('tag-purple', '💶 DEVLET DESTEĞİ', 'Zorgtoeslag uygunluğunu kontrol et', 'Gelir, yaş, ikamet ve sigorta durumuna göre destek hakkın doğabilir. Güncel sonucu Belastingdienst hesaplar.', 'https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/content/hoe-moet-ik-zorgtoeslag-aanvragen'));
        container.appendChild(createSubCard('tag-mint', '🩺 Aile Hekimi (Huisarts)', 'Sigorta değişince hekimine bildir', 'Yeni sigorta bilgilerini kayıtlı olduğun huisarts pratiğiyle paylaş.'));
      }
    }

    function completeStep(targetStep) {
      var currentStep = parseInt(Store.get('step', '0'));
      if (targetStep === 1) {
        Store.set('step', '1');
      } else if (targetStep === 2) {
        if (currentStep < 1) return alert('Önce BSN adımını işaretle.');
        Store.set('step', '2');
      } else if (targetStep === 3) {
        if (currentStep < 2) return alert('Önce DigiD adımını işaretle.');
        Store.set('step', '3');
      } else if (targetStep === 4) {
        if (currentStep < 3) return alert('Önce banka hesabı adımını işaretle.');
        Store.set('step', '4');
      }
      render();
    }

    function setActionState(button, disabled) {
      if (!button) return;
      button.disabled = disabled;
      button.setAttribute('aria-disabled', disabled ? 'true' : 'false');
      button.style.cursor = disabled ? 'not-allowed' : 'pointer';
      button.style.pointerEvents = disabled ? 'none' : 'auto';
    }

    function updateBsnSaveButton() {
      var button = document.getElementById('btn-save-bsn-date');
      var input = document.getElementById('bsn-date');
      if (!button || !input) return;
      var saved = cleanIsoDate(Store.get('bsn_date', ''));
      var completed = Boolean(saved);
      var changed = Boolean(input.value) && cleanIsoDate(input.value) !== saved;
      var enabled = changed;
      setActionState(button, !enabled);
      button.style.opacity = enabled ? '1' : '0.55';
      button.innerText = completed
        ? (changed ? 'Değişikliği Kaydet ➔' : '✓ Tarih Kaydedildi')
        : 'Randevu Tarihini Kaydet ➔';
    }

    function render() {
      var step = parseInt(Store.get('step', '0'));
      var savedDate = cleanIsoDate(Store.get('bsn_date', ''));

      var dateElem = document.getElementById('bsn-date');
      if (dateElem && document.activeElement !== dateElem) dateElem.value = savedDate;

      // Progress reflects the four user-confirmed Settle milestones only.
      var score = step * 25;
      var percentElem = document.getElementById('percent-text');
      var fillElem = document.getElementById('bar-fill');
      if (percentElem) percentElem.innerText = '%' + score;
      if (fillElem) fillElem.style.width = score + '%';

      var isEU = Store.get('status', 'non_eu') === 'eu';
      var hasHousing = Store.get('housing', 'no') === 'yes';
      var bVisa = document.getElementById('b-visa');
      var bHousing = document.getElementById('b-housing');
      if (bVisa) { bVisa.className = isEU ? 'badge active' : 'badge'; bVisa.innerText = isEU ? 'AB/AEA: oturum izni gerekmez' : 'Oturum izni: IND ile doğrula'; }
      if (bHousing) { bHousing.className = hasHousing ? 'badge active' : 'badge'; bHousing.innerText = hasHousing ? '✓ Konut (beyan)' : '⏳ Konut arıyorsun'; }

      var bBsn = document.getElementById('b-bsn');
      var bDigid = document.getElementById('b-digid');
      var bBank = document.getElementById('b-bank');
      var bGp = document.getElementById('b-gp');

      var btn1 = document.getElementById('btn-step-1');
      var btn2 = document.getElementById('btn-step-2');
      var btn3 = document.getElementById('btn-step-3');
      var btn4 = document.getElementById('btn-step-4');

      setActionState(btn1, step >= 1);
      setActionState(btn2, step < 1 || step >= 2);
      setActionState(btn3, step < 2 || step >= 3);
      setActionState(btn4, step < 3 || step >= 4);

      var tagIng = document.getElementById('tag-ing');
      var info = document.getElementById('status-info');
      if (info) info.style.display = 'block';

      function setInfo(text) { if (info) info.textContent = text; }

      if (step >= 1) {
        if (bBsn) { bBsn.className = 'badge active'; bBsn.innerText = '✓ BSN (beyan)'; }
        if (btn1) { btn1.className = 'tag tag-mint'; btn1.innerText = '✓ İşaretlendi'; }
        if (tagIng) { tagIng.className = 'tag tag-mint'; tagIng.innerText = 'BSN hazır – şartları kontrol et'; }
        if (btn2) { btn2.style.opacity = '1'; btn2.innerText = 'Aktifleştirdim ➔'; }
        setInfo('Sıradaki adım DigiD: BSN ve kayıtlı adresinle digid.nl üzerinden başvur. Aktivasyon mektubu posta ile adresine gelir; aktifleştirdiğinde işaretle.');
      } else {
        if (bBsn) { bBsn.className = 'badge'; bBsn.innerText = '⏳ 1. Belediye kaydı & BSN'; }
        if (btn1) { btn1.className = 'btn-act'; btn1.innerText = "BSN'imi aldım ➔"; }
        if (tagIng) { tagIng.className = 'tag tag-amber'; tagIng.innerText = 'Genellikle BSN ister'; }
        if (btn2) { btn2.style.opacity = '0.5'; btn2.innerText = '🔒 Önce BSN'; }
        var firstStep = isEU
          ? 'İlk adım: belediye (BRP) veya RNI kaydı. Randevu tarihini kaydet; BSN verildiğinde adımı işaretle.'
          : 'İlk adım: oturum izni kartın (VVR) hazır olduğunda belediye kaydı. Randevu tarihini kaydet; BSN verildiğinde adımı işaretle.';
        setInfo(savedDate
          ? 'Belediye randevun kayıtlı (' + savedDate + '). BSN numaran verildiğinde “BSN’imi aldım” adımını işaretle.'
          : firstStep);
      }

      if (step >= 2) {
        if (bDigid) { bDigid.className = 'badge active'; bDigid.innerText = '✓ DigiD (beyan)'; }
        if (btn2) { btn2.className = 'tag tag-mint'; btn2.innerText = '✓ İşaretlendi'; }
        if (btn3) { btn3.style.opacity = '1'; btn3.innerText = 'Hesabımı açtım ➔'; }
        setInfo(isEU
          ? 'Sıradaki adım banka hesabı: kimlik ve BSN ile başvurabilirsin; bankanın istediği belgeleri kendi sitesinden kontrol et.'
          : 'Sıradaki adım banka hesabı: kimliğin yanında oturum izni kartın da istenebilir; bankanın koşullarını kendi sitesinden kontrol et.');
      } else {
        if (bDigid) { bDigid.className = 'badge'; bDigid.innerText = '🔒 2. DigiD'; }
        if (btn3) { btn3.style.opacity = '0.5'; btn3.innerText = '🔒 Önce DigiD'; }
      }

      if (step >= 3) {
        if (bBank) { bBank.className = 'badge active'; bBank.innerText = '✓ Banka hesabı (beyan)'; }
        if (btn3) { btn3.className = 'tag tag-mint'; btn3.innerText = '✓ İşaretlendi'; }
        if (btn4) { btn4.style.opacity = '1'; btn4.innerText = 'Kaydoldum ➔'; }
        setInfo('Sıradaki adım huisarts: yakınındaki pratikleri ara ve yeni hasta kabul edip etmediklerini doğrudan sor. Merkezi bir kapasite listesi yoktur. Kaydın onaylandığında işaretle.');
      } else {
        if (bBank) { bBank.className = 'badge'; bBank.innerText = '🔒 3. Banka'; }
        if (btn4) { btn4.style.opacity = '0.5'; btn4.innerText = '🔒 Önce banka'; }
      }

      if (step >= 4) {
        if (bGp) { bGp.className = 'badge active'; bGp.innerText = '✓ Huisarts (beyan)'; }
        if (btn4) { btn4.className = 'tag tag-mint'; btn4.innerText = '✓ İşaretlendi'; }
        setInfo(isEU
          ? 'Settle adımlarının dördünü de işaretledin. Çalışmaya veya staja başlarsan Phase 2 sekmesinden sigorta durumunu yeniden kontrol et.'
          : 'Settle adımlarının dördünü de işaretledin. Çalışmaya başlamadan önce oturum iznindeki çalışma koşullarını ve işverenin TWV yükümlülüğünü doğrula; sigorta durumunu Phase 2 sekmesinden kontrol et.');
      } else {
        if (bGp) { bGp.className = 'badge'; bGp.innerText = '🔒 4. Huisarts'; }
      }
      updateBsnSaveButton();
    }

    var defaultPosts = [
      { id: 1, cat: '🍝 Food Exchange', title: '3 Porsiyon İtalyan Makarnası', offer: 'Bulaşıkları yıkayacak ev arkadaşı', tagClass: 'tag-purple', sample: true },
      { id: 2, cat: '🎹 Skill Swap', title: 'Piyano Dersi / Pratik Eşliği', offer: 'NT2 Temel Hollandaca konuşma pratiği', tagClass: 'tag-mint', sample: true },
      { id: 3, cat: '🚲 Gear & Tools', title: 'Swapfiets Anahtarı & Yağlama Seti', offer: '1 Bardak Filtre Kahve', tagClass: 'tag-amber', sample: true }
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
        category.textContent = String(post.cat || '') + (post.sample ? ' · Örnek' : ' · Taslağın');
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
            var wa = document.getElementById('btn-modal-wa');
            if (wa) wa.innerText = 'Mesajı Kopyala';
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
      var val = cleanIsoDate(dateInput ? dateInput.value : '');
      if (!val) return alert('Randevu tarihini seç.');
      if (val < todayIso()) return alert('Geçmiş bir tarih seçilemez. Randevu tarihini kontrol et.');
      Store.set('bsn_date', val);
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
        dateInput.min = todayIso();
        dateInput.value = cleanIsoDate(Store.get('bsn_date', ''));
        dateInput.addEventListener('input', updateBsnSaveButton);
        dateInput.addEventListener('change', updateBsnSaveButton);
      }

      var btnSaveDate = document.getElementById('btn-save-bsn-date');
      if (btnSaveDate) {
        btnSaveDate.onclick = function() {
          triggerBsnSave();
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
      var btnGiveAway = document.getElementById('btn-give-away');
      if (btnGiveAway) {
        btnGiveAway.onclick = function() {
          var category = document.getElementById('swap-cat');
          var title = document.getElementById('swap-title');
          var offer = document.getElementById('swap-offer');
          if (category) category.value = '🎁 Give Away';
          if (offer) { offer.value = ''; offer.placeholder = 'Karşılık gerekmez'; }
          if (title) title.focus();
        };
      }
      if (btnAddSwap) {
        btnAddSwap.onclick = function() {
          var cat = document.getElementById('swap-cat').value;
          var title = document.getElementById('swap-title').value;
          var offer = document.getElementById('swap-offer').value;

          if (cat === '🎁 Give Away' && !offer) offer = 'Ücretsiz – karşılık beklemiyorum';

          if (!title || !offer) return alert('Lütfen tüm alanları doldurun.');

          var userPosts = [];
          try { userPosts = JSON.parse(Store.get('user_swaps', '[]')); } catch(e) {}
          userPosts.unshift({ id: Date.now(), cat: cat, title: title, offer: offer, tagClass: 'tag-mint' });
          Store.set('user_swaps', JSON.stringify(userPosts));

          document.getElementById('swap-title').value = '';
          document.getElementById('swap-offer').value = '';

          renderSwaps();
          alert('Taslağın kaydedildi. Topluluk panosu açılana kadar yalnızca sen görebilirsin.');
        };
      }

      var btnWa = document.getElementById('btn-modal-wa');
      if (btnWa) {
        btnWa.onclick = function() {
          var msg = document.getElementById('modal-msg');
          var text = msg ? msg.innerText : '';
          var done = function() { btnWa.innerText = '✓ Kopyalandı'; };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function() { alert('Kopyalanamadı; metni elle seçip kopyala.'); });
          } else {
            alert('Kopyalanamadı; metni elle seçip kopyala.');
          }
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
        renderStatusRoute();
        renderAllowances();
        renderPerks();
        renderInsuranceTree();
        render();
        renderSwaps();
      });
    });
  `;
