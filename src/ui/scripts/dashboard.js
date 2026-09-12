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

    // Each Settle milestone has three honest states, because "marked" hid the
    // difference between not started, waiting on an institution, and finished.
    var STATES = ['todo', 'doing', 'done'];
    var STEP_NAMES = ['Belediye kaydı & BSN', 'DigiD', 'Banka hesabı', 'Huisarts'];
    var STATE_LABELS = {
      todo: 'Başlamadım',
      doing: 'Başladım, bekliyorum',
      done: 'Tamamlandı'
    };

    function readStepStates() {
      var states = ['todo', 'todo', 'todo', 'todo'];
      var stored = Store.get('step_states', '');
      if (stored) {
        try {
          var parsed = JSON.parse(stored);
          for (var i = 0; i < 4; i++) {
            if (STATES.indexOf(parsed[i]) !== -1) states[i] = parsed[i];
          }
          return states;
        } catch (e) {}
      }
      // Legacy accounts stored a single completed-step counter.
      var legacy = parseInt(Store.get('step', '0'), 10) || 0;
      for (var j = 0; j < legacy && j < 4; j++) states[j] = 'done';
      return states;
    }

    function writeStepStates(states) {
      Store.set('step_states', JSON.stringify(states));
      var done = 0;
      while (done < 4 && states[done] === 'done') done += 1;
      // Keep the legacy counter in sync so nothing else regresses.
      Store.set('step', String(done));
    }

    function stepUnlocked(states, index) {
      return index === 0 || states[index - 1] === 'done';
    }

    function setStepState(index, value) {
      var states = readStepStates();
      if (!stepUnlocked(states, index)) {
        return alert('Önce “' + STEP_NAMES[index - 1] + '” adımını tamamlandı olarak işaretle.');
      }
      if (states[index] !== 'done' && value !== 'done') {
        states[index] = value;
        writeStepStates(states);
        return render();
      }
      // Stepping back from done also clears the later steps: the journey is sequential.
      if (states[index] === 'done' && value !== 'done') {
        var laterStarted = states.slice(index + 1).some(function(state) { return state !== 'todo'; });
        if (laterStarted && !confirm('Bu adımı geri alırsan sonraki adımların durumu da sıfırlanır. Devam edilsin mi?')) {
          return render();
        }
        states[index] = value;
        for (var i = index + 1; i < 4; i++) states[i] = 'todo';
        writeStepStates(states);
        return render();
      }
      states[index] = value;
      writeStepStates(states);
      render();
    }

    function renderStepControls(states) {
      for (var i = 0; i < 4; i++) {
        (function(index) {
          var select = document.getElementById('step-state-' + (index + 1));
          if (!select) return;
          var unlocked = stepUnlocked(states, index);
          select.innerHTML = '';
          STATES.forEach(function(state) {
            var option = document.createElement('option');
            option.value = state;
            option.textContent = STATE_LABELS[state];
            select.appendChild(option);
          });
          select.value = states[index];
          select.disabled = !unlocked;
          select.style.opacity = unlocked ? '1' : '0.45';
          select.title = unlocked ? '' : 'Önce önceki adımı tamamla';
          select.onchange = function() { setStepState(index, this.value); };
        })(i);
      }
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
      var savedDate = cleanIsoDate(Store.get('bsn_date', ''));

      var dateElem = document.getElementById('bsn-date');
      if (dateElem && document.activeElement !== dateElem) dateElem.value = savedDate;

      var states = readStepStates();
      var doneCount = states.filter(function(state) { return state === 'done'; }).length;
      var doingCount = states.filter(function(state) { return state === 'doing'; }).length;

      // Progress counts only finished milestones; steps in progress are shown separately.
      var score = doneCount * 25;
      var percentElem = document.getElementById('percent-text');
      var fillElem = document.getElementById('bar-fill');
      if (percentElem) {
        percentElem.innerText = doingCount
          ? '%' + score + ' · ' + doingCount + ' adım sürüyor'
          : '%' + score;
      }
      if (fillElem) fillElem.style.width = score + '%';

      var isEU = Store.get('status', 'non_eu') === 'eu';
      var hasHousing = Store.get('housing', 'no') === 'yes';
      var bVisa = document.getElementById('b-visa');
      var bHousing = document.getElementById('b-housing');
      if (bVisa) { bVisa.className = isEU ? 'badge active' : 'badge'; bVisa.innerText = isEU ? 'AB/AEA: oturum izni gerekmez' : 'Oturum izni: IND ile doğrula'; }
      if (bHousing) { bHousing.className = hasHousing ? 'badge active' : 'badge'; bHousing.innerText = hasHousing ? '✓ Konut (beyan)' : '⏳ Konut arıyorsun'; }

      var badgeIds = ['b-bsn', 'b-digid', 'b-bank', 'b-gp'];
      var badgeNames = ['Belediye kaydı & BSN', 'DigiD', 'Banka hesabı', 'Huisarts'];
      for (var i = 0; i < 4; i++) {
        var badge = document.getElementById(badgeIds[i]);
        if (!badge) continue;
        var order = (i + 1) + '. ';
        if (states[i] === 'done') {
          badge.className = 'badge active';
          badge.innerText = '✓ ' + badgeNames[i] + ' (beyan)';
        } else if (states[i] === 'doing') {
          badge.className = 'badge';
          badge.innerText = '⏳ ' + order + badgeNames[i] + ' · sürüyor';
        } else if (stepUnlocked(states, i)) {
          badge.className = 'badge';
          badge.innerText = '○ ' + order + badgeNames[i];
        } else {
          badge.className = 'badge';
          badge.innerText = '🔒 ' + order + badgeNames[i];
        }
      }

      renderStepControls(states);

      var tagIng = document.getElementById('tag-ing');
      if (tagIng) {
        var bsnDone = states[0] === 'done';
        tagIng.className = bsnDone ? 'tag tag-mint' : 'tag tag-amber';
        tagIng.innerText = bsnDone ? 'BSN hazır' : 'Genellikle BSN ister';
      }

      var info = document.getElementById('status-info');
      if (info) info.style.display = 'block';
      function setInfo(text) { if (info) info.textContent = text; }

      var guidance = [
        {
          todo: savedDate
            ? 'Belediye randevun kayıtlı (' + savedDate + '). Randevuya gittiysen adımı “Başladım, bekliyorum” yap; BSN numaran geldiğinde “Tamamlandı” olarak işaretle.'
            : (isEU
                ? 'İlk adım: belediye (BRP) veya RNI kaydı. Randevu al, tarihini kaydet ve adımı “Başladım, bekliyorum” olarak işaretle.'
                : 'İlk adım: oturum izni kartın (VVR) hazır olduğunda belediye kaydı. Randevu al, tarihini kaydet ve adımı “Başladım, bekliyorum” olarak işaretle.'),
          doing: 'Belediye kaydını yaptın, BSN numaranı bekliyorsun. Numara geldiğinde adımı “Tamamlandı” yap.'
        },
        {
          todo: 'Sıradaki adım DigiD: BSN ve kayıtlı adresinle digid.nl üzerinden başvur, sonra adımı “Başladım, bekliyorum” yap.',
          doing: 'DigiD başvurun yapıldı; aktivasyon kodu posta ile adresine gelir. Kodu girip hesabını aktifleştirdiğinde “Tamamlandı” yap.'
        },
        {
          todo: (isEU
            ? 'Sıradaki adım banka hesabı: kimlik ve BSN ile başvurabilirsin; bankanın istediği belgeleri kendi sitesinden kontrol et.'
            : 'Sıradaki adım banka hesabı: kimliğin yanında oturum izni kartın da istenebilir; bankanın koşullarını kendi sitesinden kontrol et.'),
          doing: 'Banka başvurun sürüyor. Hesap numaran (IBAN) ve kartın eline geçtiğinde adımı “Tamamlandı” yap.'
        },
        {
          todo: 'Sıradaki adım huisarts: yakınındaki pratikleri ara ve yeni hasta kabul edip etmediklerini doğrudan sor. Merkezi bir kapasite listesi yoktur.',
          doing: 'Huisarts kaydın için başvurdun, onay bekliyorsun. Pratik kaydını onayladığında adımı “Tamamlandı” yap.'
        }
      ];

      var focus = -1;
      for (var k = 0; k < 4; k++) {
        if (states[k] !== 'done') { focus = k; break; }
      }

      if (focus === -1) {
        renderNextPhase(isEU);
        setInfo(isEU
          ? 'Settle adımlarının dördünü de tamamladın. Çalışmaya veya staja başlarsan Phase 2 sekmesinden sigorta durumunu yeniden kontrol et.'
          : 'Settle adımlarının dördünü de tamamladın. Çalışmaya başlamadan önce oturum iznindeki çalışma koşullarını ve işverenin TWV yükümlülüğünü doğrula; sigorta durumunu Phase 2 sekmesinden kontrol et.');
      } else {
        setInfo(guidance[focus][states[focus] === 'doing' ? 'doing' : 'todo']);
      }

      updateBsnSaveButton();
      var nextBox = document.getElementById('next-phase');
      if (nextBox && focus !== -1) nextBox.classList.add('hidden');
    }

    // After the four Settle milestones the journey continues in Phase 2; spell the
    // next actions out instead of leaving the student on a finished checklist.
    function renderNextPhase(isEU) {
      var box = document.getElementById('next-phase');
      if (!box) return;
      box.classList.remove('hidden');
      box.innerHTML = '';

      var title = document.createElement('div');
      title.className = 'card-title';
      title.textContent = '➡️ Sırada ne var: Phase 2 · Living';
      box.appendChild(title);

      var lead = document.createElement('p');
      lead.style.cssText = 'font-size:0.82rem; color:var(--muted); margin:0 0 12px 0;';
      lead.textContent = 'Settle adımlarını bitirdin. Yerleşme sonrası işler burada devam ediyor:';
      box.appendChild(lead);

      var list = document.createElement('ul');
      list.className = 'list';
      var items = [
        ['Sağlık sigortası', 'Çalışma durumunu seç, yükümlülüğünü gör'],
        ['Devlet destekleri', 'Huurtoeslag ve zorgtoeslag uygunluğunu kontrol et'],
        ['Öğrenci indirimleri', 'SURFspot ve öğrenci kartı fırsatlarına bak']
      ];
      if (!isEU) items.push(['Çalışma koşulları', 'İzin kartındaki saat sınırını ve TWV yükümlülüğünü doğrula']);
      items.forEach(function(pair) {
        var li = document.createElement('li');
        li.className = 'item';
        var left = document.createElement('span');
        left.textContent = pair[0];
        var right = document.createElement('span');
        right.style.cssText = 'font-size:0.78rem; color:var(--muted); text-align:right;';
        right.textContent = pair[1];
        li.appendChild(left); li.appendChild(right);
        list.appendChild(li);
      });
      box.appendChild(list);

      var button = document.createElement('button');
      button.className = 'btn-act btn-act-full';
      button.style.marginTop = '10px';
      button.textContent = 'Phase 2 sekmesine geç ➔';
      button.onclick = function() {
        var tab = document.getElementById('t2');
        if (tab) { tab.click(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      };
      box.appendChild(button);
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
