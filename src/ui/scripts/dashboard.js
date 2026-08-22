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
        'https://www.belastingdienst.nl/wps/wcm/connect/nl/huurtoeslag/content/hoe-moet-ik-huurtoeslag-aanvragen'
      ));

      grid.appendChild(createSubCard(
        'tag-purple',
        '🩺 Zorgtoeslag (Sigorta Desteği)',
        'Güncel uygunluğunu kontrol et',
        'Uygunluk; sigorta, gelir, yaş ve ikamet durumuna göre resmi kurum tarafından belirlenir.',
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
        'Öğrenci kartınla gittiğin her yerde sor: "Do you have a student discount?" (Rijksmuseum, Pathé vb.)'
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
        container.appendChild(createSubCard('tag-purple', '🏥 Geçerli Sigortan', isEU ? 'EHIC / Özel Sigorta Yeterli' : 'Özel Öğrenci Sigortası (Aon / InsureToStudy)', 'Sadece eğitim aldığınız sürece zorunlu Hollanda Temel Sağlık Sigortası (Basiszorgverzekering) yapmanıza gerek yoktur.', 'https://www.aonstudentinsurance.com/en/home'));
        container.appendChild(createSubCard('tag-mint', '💶 Sigorta Durumu', 'Poliçeni ve kapsamını doğrula', 'Mevcut özel/öğrenci sigortanın Hollanda’daki kapsamını sigortacı ve resmi kaynaklarla doğrula.'));
        container.appendChild(createSubCard('tag-amber', '⚠️ Karar Uyarısı', 'İşe Girdiğin An Değişir', 'Part-time veya resmi kontratlı bir işe başladığınız ilk gün Temel Sigortaya geçmek yasal zorunluluktur.'));
      } else {
        container.appendChild(createSubCard('tag-mint', '🚨 STATÜ KONTROLÜ', 'Basiszorgverzekering gerekebilir', 'Ücretli çalışmaya başladığında Hollanda temel sağlık sigortası yükümlülüğünü resmi SVB ve hükümet kaynaklarından kontrol et.', 'https://www.svb.nl/en/the-wlz-scheme/insurance-under-the-wlz-scheme/you-are-a-student-or-doing-an-internship'));
        container.appendChild(createSubCard('tag-purple', '💶 DEVLET DESTEĞİ', 'Zorgtoeslag uygunluğunu kontrol et', 'Gelir, yaş, ikamet ve sigorta durumuna göre destek hakkın doğabilir. Güncel sonucu Belastingdienst hesaplar.', 'https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/content/hoe-moet-ik-zorgtoeslag-aanvragen'));
        container.appendChild(createSubCard('tag-mint', '🩺 Aile Hekimi (Huisarts)', 'Huisarts Kaydınız Geçerli', "Phase 1'de kaydolduğunuz Huisarts hekiminiz üzerinden sevk ve sağlık erişimi devam eder."));
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
      var completed = parseInt(Store.get('step', '0')) >= 1;
      var changed = cleanIsoDate(input.value) !== cleanIsoDate(Store.get('bsn_date', '2026-08-19'));
      var enabled = !completed || changed;
      setActionState(button, !enabled);
      button.style.opacity = enabled ? '1' : '0.55';
      button.innerText = completed
        ? (changed ? 'Değişikliği Kaydet ➔' : '✓ Tarih Kaydedildi')
        : 'Tarihi Onayla & BSN Tamamla ➔';
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

      setActionState(btn1, step >= 1);
      setActionState(btn2, step < 1 || step >= 2);
      setActionState(btn3, step < 2 || step >= 3);
      setActionState(btn4, step < 3 || step >= 4);

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
      updateBsnSaveButton();
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
  `;
