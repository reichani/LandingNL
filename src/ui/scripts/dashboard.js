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

    // Municipal appointments are often weeks out, so the wait itself is worth
    // showing: it is the reason to come back to the dashboard.
    function daysUntil(isoDate) {
      if (!isoDate) return null;
      var target = Date.parse(isoDate + 'T00:00:00Z');
      if (isNaN(target)) return null;
      var today = Date.parse(todayIso() + 'T00:00:00Z');
      return Math.round((target - today) / 86400000);
    }

    function countdownText(isoDate) {
      var days = daysUntil(isoDate);
      if (days === null) return '';
      if (days > 1) return 'Your municipal appointment is in ' + days + ' days (' + isoDate + ').';
      if (days === 1) return 'Your municipal appointment is tomorrow (' + isoDate + ').';
      if (days === 0) return 'Your municipal appointment is today.';
      return 'Your appointment was on ' + isoDate + '.';
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
        link.innerText = 'Open source ↗';
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

      grid.appendChild(createSubCard('tag-purple', '📌 Profile', city + ' • age ' + age, program));
      grid.appendChild(createSubCard(isEU ? 'tag-mint' : 'tag-amber', isEU ? 'EU/EEA work status' : 'Work permit check needed', isEU ? 'A TWV is usually not required' : 'Verify the employer and permit conditions', 'Confirm what you are entitled to with IND and official government sources.'));
      grid.appendChild(createSubCard('tag-mint', '💶 Minimum wage bracket', isAdult ? 'Full statutory minimum wage' : 'Youth minimum wage (jeugdloon), age ' + age, 'Below 21 the statutory minimum wage is set in age-based brackets.'));
    }

    // Non-EU/EEA and EU/EEA students enter the Dutch system through different doors:
    // the non-EU route runs through IND (entry visa + residence permit) before municipal
    // registration, the EU route does not. Both then share the Settle steps.
    function renderStatusRoute() {
      var box = document.getElementById('status-route');
      if (!box) return;
      var isEU = Store.get('status', 'non_eu') === 'eu';
      box.innerHTML = '';

      // Once the first step is done this is reference material, so it collapses.
      var states = readStepStates();
      var details = document.createElement('details');
      details.open = states[0] !== 'done';
      var title = document.createElement('summary');
      title.className = 'card-title';
      title.style.cursor = 'pointer';
      title.textContent = isEU ? '🇪🇺 EU/EEA or Swiss route' : '🛂 Non-EU/EEA route';
      details.appendChild(title);
      box.appendChild(details);
      box = details;

      var lead = document.createElement('p');
      lead.style.cssText = 'font-size:0.82rem; color:var(--muted); margin:0 0 12px 0;';
      lead.textContent = isEU
        ? 'You do not apply for a residence permit. If you stay longer than four months you register with your municipality (BRP); for shorter stays you are registered in the RNI. You can start with the steps below straight away.'
        : 'Your residence permit (VVR) has to be sorted before you register with the municipality. Your school usually files the application with the IND on your behalf, and an entry visa (MVV) may be needed first. Move on to the steps below once you have your permit card.';
      box.appendChild(lead);

      var list = document.createElement('ul');
      list.className = 'list';
      var items = isEU
        ? [['Residence permit', 'Not required'], ['Work permit (TWV)', 'Usually not required'], ['First step', 'Municipal or RNI registration']]
        : [['Residence permit (VVR)', 'Required – track it with your school and IND'], ['Entry visa (MVV)', 'Depends on your nationality'], ['Work permit (TWV)', 'Employer applies – hour limits may apply'], ['First step', 'Permit card, then municipal registration']];
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
      link.textContent = 'Official IND page ↗';
      box.appendChild(link);
    }

    function renderAllowances() {
      var grid = document.getElementById('allowance-grid');
      if (!grid) return;
      grid.innerHTML = '';

      if (!isAdultForAllowances()) {
        grid.appendChild(createSubCard(
          'tag-amber',
          '🕓 Under 18',
          'Allowances are not available yet',
          'As a rule you must be 18 to claim huurtoeslag or zorgtoeslag; only narrow exceptions exist. Update your age in your profile the month you turn 18 and these cards will open up.',
          'https://www.belastingdienst.nl/wps/wcm/connect/nl/jongeren/content/vanaf-18-jaar-kun-je-toeslagen-krijgen'
        ));
        return;
      }

      var housing = Store.get('housing', 'no');
      var isHouseReady = (housing === 'yes');

      grid.appendChild(createSubCard(
        isHouseReady ? 'tag-mint' : 'tag-amber',
        '🏠 Huurtoeslag (rent allowance)',
        isHouseReady ? 'You have a contract – check your eligibility' : 'A rental contract comes first',
        'It normally requires self-contained housing with its own entrance, kitchen and toilet, plus age, rent and income conditions. The Belastingdienst decides.',
        'https://www.belastingdienst.nl/wps/wcm/connect/nl/huurtoeslag/content/hoe-moet-ik-huurtoeslag-aanvragen'
      ));

      grid.appendChild(createSubCard(
        'tag-purple',
        '🩺 Zorgtoeslag (healthcare allowance)',
        'Check your current eligibility',
        'Eligibility depends on your insurance, income, age and residence, and is decided by the Belastingdienst.',
        'https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/content/hoe-moet-ik-zorgtoeslag-aanvragen'
      ));
    }

    function renderPerks() {
      var grid = document.getElementById('perks-grid');
      if (!grid) return;
      grid.innerHTML = '';

      grid.appendChild(createSubCard(
        'tag-mint',
        '💻 SURFspot discounts',
        'Software and hardware for students',
        'Sign in at SURFspot.nl with your university account to see the licence discounts available to you.',
        'https://www.surfspot.nl/'
      ));

      grid.appendChild(createSubCard(
        'tag-purple',
        '🎟️ Student card deals',
        'Museums, cinemas and shops',
        'Ask “do you have a student discount?” wherever you go, and check the conditions before you count on one.',
        'https://www.isic.nl/en'
      ));
    }

    function renderInsuranceTree() {
      var container = document.getElementById('insurance-tree-result');
      if (!container) return;
      container.innerHTML = '';

      var isWorking = Store.get('is_working', 'no') === 'yes';
      var isEU = Store.get('status', 'non_eu') === 'eu';

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
        container.appendChild(createSubCard('tag-purple', '🏥 Under 18', 'Usually insured through a parent', 'Until you turn 18 you do not need your own Dutch basic health insurance, and because you pay no premium you cannot claim zorgtoeslag. If you moved from abroad, confirm your existing policy’s cover in the Netherlands with your insurer.', 'https://www.studyinnl.org/plan-your-stay/healthcare-insurance'));
        container.appendChild(createSubCard('tag-amber', '⚠️ When you turn 18', 'You will need your own insurance', 'From your 18th birthday you must take out Dutch basic health insurance (basisverzekering) and pay the premium; at that point you can also apply for zorgtoeslag. Remember to update your age in your profile.', 'https://www.belastingdienst.nl/wps/wcm/connect/nl/jongeren/content/vanaf-18-jaar-kun-je-toeslagen-krijgen'));
        return;
      }

      if (!isWorking) {
        container.appendChild(createSubCard('tag-purple', '🏥 If you only study', isEU ? 'An EHIC or private policy is usually enough' : 'Private student insurance is usually needed', 'If you only study, Dutch basic health insurance is usually not compulsory. Verify your own situation with an official source.', 'https://www.studyinnl.org/plan-your-stay/healthcare-insurance'));
        container.appendChild(createSubCard('tag-mint', '💶 Your policy', 'Check what it actually covers', 'Confirm the Dutch cover of your current private or student policy with your insurer and official sources.'));
        container.appendChild(createSubCard('tag-amber', '⚠️ This changes if you work', 'Paid work usually makes it compulsory', 'Once you start paid work or a paid internship, Dutch basic health insurance usually becomes compulsory. Check the timing and conditions with an official source.'));
      } else {
        container.appendChild(createSubCard('tag-mint', '🚨 Check your status', 'Basic insurance may now be compulsory', 'Now that you work for pay, check your Dutch basic health insurance obligation with the SVB and official government sources.', 'https://www.svb.nl/en/the-wlz-scheme/insurance-under-the-wlz-scheme/you-are-a-student-or-doing-an-internship'));
        container.appendChild(createSubCard('tag-purple', '💶 Allowance', 'Check your zorgtoeslag eligibility', 'Depending on income, age, residence and insurance you may be entitled to support. The Belastingdienst calculates the result.', 'https://www.belastingdienst.nl/wps/wcm/connect/nl/zorgtoeslag/content/hoe-moet-ik-zorgtoeslag-aanvragen'));
        container.appendChild(createSubCard('tag-mint', '🩺 Huisarts (GP)', 'Tell your practice about the change', 'Share your new insurance details with the huisarts practice you are registered with.'));
      }
    }

    // Each Settle milestone has three honest states, because "marked" hid the
    // difference between not started, waiting on an institution, and finished.
    var STATES = ['todo', 'doing', 'done'];
    var STEP_NAMES = ['Municipality & BSN', 'DigiD', 'Bank account', 'Huisarts'];
    var STATE_LABELS = {
      todo: 'Not started',
      doing: 'Applied, waiting',
      done: 'Done'
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
        return alert('Mark “' + STEP_NAMES[index - 1] + '” as done first.');
      }
      if (states[index] !== 'done' && value !== 'done') {
        states[index] = value;
        writeStepStates(states);
        return render();
      }
      // Stepping back from done also clears the later steps: the journey is sequential.
      if (states[index] === 'done' && value !== 'done') {
        var laterStarted = states.slice(index + 1).some(function(state) { return state !== 'todo'; });
        if (laterStarted && !confirm('Moving this step back also resets the steps after it. Continue?')) {
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

    // The dashboard opens with the one thing the student has to do next, not with
    // a status summary. Everything else on the page is secondary to this card.
    function renderNextAction(states, guidance, focus) {
      var title = document.getElementById('next-action-title');
      var text = document.getElementById('next-action-text');
      var select = document.getElementById('next-action-state');
      var link = document.getElementById('next-action-link');
      var label = document.querySelector('.next-action-status');
      if (!title || !text || !select) return;

      var SOURCES = [
        'https://www.government.nl/themes/government-and-democracy/personal-data/citizen-service-number-bsn',
        'https://www.digid.nl/en',
        '',
        ''
      ];

      if (focus === -1) {
        title.textContent = 'You are through the settling-in steps';
        text.textContent = 'Keep going under “Daily life & insurance”: set your work status, check your allowances and student discounts.';
        select.classList.add('hidden');
        if (label) label.classList.add('hidden');
        if (link) link.classList.add('hidden');
        return;
      }

      select.classList.remove('hidden');
      if (label) label.classList.remove('hidden');

      var started = states.some(function(state) { return state !== 'todo'; });
      title.textContent = (started ? '' : 'Start here · ') + (focus + 1) + '. ' + STEP_NAMES[focus];
      var body = guidance[focus][states[focus] === 'doing' ? 'doing' : 'todo'];
      if (focus === 0) {
        var countdown = countdownText(cleanIsoDate(Store.get('bsn_date', '')));
        if (countdown) body = countdown + ' ' + body;
      }
      text.textContent = body;

      select.innerHTML = '';
      STATES.forEach(function(state) {
        var option = document.createElement('option');
        option.value = state;
        option.textContent = STATE_LABELS[state];
        select.appendChild(option);
      });
      select.value = states[focus];
      select.onchange = function() { setStepState(focus, this.value); };

      if (link) {
        if (SOURCES[focus]) {
          link.href = SOURCES[focus];
          link.classList.remove('hidden');
        } else {
          link.classList.add('hidden');
        }
      }
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
          select.title = unlocked ? '' : 'Finish the previous step first';
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
        ? (changed ? 'Save change ➔' : '✓ Date saved')
        : 'Save appointment date ➔';
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
          ? '%' + score + ' · ' + doingCount + ' in progress'
          : '%' + score;
      }
      if (fillElem) fillElem.style.width = score + '%';

      var isEU = Store.get('status', 'non_eu') === 'eu';
      var hasHousing = Store.get('housing', 'no') === 'yes';
      var bVisa = document.getElementById('b-visa');
      var bHousing = document.getElementById('b-housing');
      if (bVisa) { bVisa.className = isEU ? 'badge active' : 'badge'; bVisa.innerText = isEU ? 'EU/EEA: no permit needed' : 'Residence permit: verify with IND'; }
      if (bHousing) { bHousing.className = hasHousing ? 'badge active' : 'badge'; bHousing.innerText = hasHousing ? '✓ Housing (self-reported)' : '⏳ Looking for housing'; }

      var badgeIds = ['b-bsn', 'b-digid', 'b-bank', 'b-gp'];
      var badgeNames = ['Municipality & BSN', 'DigiD', 'Bank account', 'Huisarts'];
      for (var i = 0; i < 4; i++) {
        var badge = document.getElementById(badgeIds[i]);
        if (!badge) continue;
        var order = (i + 1) + '. ';
        if (states[i] === 'done') {
          badge.className = 'badge active';
          badge.innerText = '✓ ' + badgeNames[i] + ' (self-reported)';
        } else if (states[i] === 'doing') {
          badge.className = 'badge';
          badge.innerText = '⏳ ' + order + badgeNames[i] + ' · in progress';
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
        tagIng.innerText = bsnDone ? 'You have a BSN' : 'Usually ask for a BSN';
      }

      var info = document.getElementById('status-info');
      if (info) info.style.display = 'block';
      function setInfo(text) { if (info) info.textContent = text; }

      var guidance = [
        {
          todo: savedDate
            ? 'Your appointment is saved (' + savedDate + '). Once you have been, set this step to “Applied, waiting”; mark it “Done” when your BSN arrives.'
            : (isEU
                ? 'First step: register with your municipality (BRP) or in the RNI. Book an appointment, save the date and set this step to “Applied, waiting”.'
                : 'First step: register with your municipality once your residence permit card (VVR) is ready. Book an appointment, save the date and set this step to “Applied, waiting”.'),
          doing: 'You have registered and are waiting for your BSN. Mark this step “Done” once the number arrives.'
        },
        {
          todo: 'Next: DigiD. Apply at digid.nl with your BSN and registered address, then set this step to “Applied, waiting”.',
          doing: 'Your DigiD application is in; the activation code comes by post. Mark this “Done” once you have activated your account.'
        },
        {
          todo: (isEU
            ? 'Next: a bank account. You can apply with your ID and BSN; check the required documents on the bank’s own site.'
            : 'Next: a bank account. Besides your ID you may be asked for your residence permit card; check the bank’s conditions on its own site.'),
          doing: 'Your bank application is in progress. Mark this “Done” once you have your IBAN and card.'
        },
        {
          todo: 'Next: a huisarts (GP). Call practices near you and ask directly whether they accept new patients — there is no central capacity list.',
          doing: 'You have asked to register and are waiting for confirmation. Mark this “Done” once the practice confirms.'
        }
      ];

      var focus = -1;
      for (var k = 0; k < 4; k++) {
        if (states[k] !== 'done') { focus = k; break; }
      }

      renderNextAction(states, guidance, focus);

      if (focus === -1) {
        renderNextPhase(isEU);
        setInfo(isEU
          ? 'All four settling-in steps are done. If you start work or an internship, re-check your insurance under “Daily life & insurance”.'
          : 'All four settling-in steps are done. Before you start working, verify the work conditions on your residence permit and your employer’s TWV obligation, and re-check your insurance under “Daily life & insurance”.');
      } else {
        setInfo(guidance[focus][states[focus] === 'doing' ? 'doing' : 'todo']);
      }

      var countdownElem = document.getElementById('bsn-countdown');
      if (countdownElem) {
        var line = countdownText(savedDate);
        countdownElem.textContent = line;
        countdownElem.classList.toggle('hidden', !line);
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
      title.textContent = '➡️ What’s next: daily life';
      box.appendChild(title);

      var lead = document.createElement('p');
      lead.style.cssText = 'font-size:0.82rem; color:var(--muted); margin:0 0 12px 0;';
      lead.textContent = 'You have finished settling in. Here is what comes next:';
      box.appendChild(lead);

      var list = document.createElement('ul');
      list.className = 'list';
      var items = [
        ['Health insurance', 'Set your work status and see your obligation'],
        ['Allowances', 'Check your huurtoeslag and zorgtoeslag eligibility'],
        ['Student discounts', 'Look at SURFspot and student card deals']
      ];
      if (!isEU) items.push(['Work conditions', 'Verify the hour limit on your permit and the TWV obligation']);
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
      button.textContent = 'Go to daily life & insurance ➔';
      button.onclick = function() {
        var tab = document.getElementById('t2');
        if (tab) { tab.click(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
      };
      box.appendChild(button);
    }

    var defaultPosts = [
      { id: 1, cat: '🍝 Food', title: 'Three portions of pasta', offer: 'A flatmate who does the dishes', tagClass: 'tag-purple', sample: true },
      { id: 2, cat: '🎹 Skills', title: 'Piano lesson or practice session', offer: 'Basic Dutch conversation practice', tagClass: 'tag-mint', sample: true },
      { id: 3, cat: '🚲 Gear', title: 'Bike keys and a lubrication kit', offer: 'One filter coffee', tagClass: 'tag-amber', sample: true }
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
        category.textContent = String(post.cat || '') + (post.sample ? ' · Sample' : ' · Your draft');
        var title = document.createElement('h4');
        title.style.cssText = 'margin:2px 0; font-size:0.9rem; color:#fff;';
        title.textContent = String(post.title || '');
        var offer = document.createElement('p');
        offer.style.cssText = 'margin:0; font-size:0.78rem; color:var(--muted);';
        offer.appendChild(document.createTextNode('In return: '));
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
        btnConn.innerText = 'Contact ➔';
        (function(t) {
          btnConn.onclick = function() {
            document.getElementById('modal-title').innerText = '"' + t + '"';
            document.getElementById('modal-msg').innerText = 'Hoi! I saw your "' + t + '" post on the LandingNL board. Would you like to swap?';
            var wa = document.getElementById('btn-modal-wa');
            if (wa) wa.innerText = 'Copy message';
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
      if (!val) return alert('Choose an appointment date.');
      if (val < todayIso()) return alert('A past date cannot be used. Please check the appointment date.');
      Store.set('bsn_date', val);
      render();
    }

    window.addEventListener('DOMContentLoaded', function() {
      var city = Store.get('city', 'Amsterdam');
      var program = Store.get('program', 'University of Amsterdam (UvA)');

      var progElem = document.getElementById('prog-text');
      var cityElem = document.getElementById('city-board-title');

      if (progElem) progElem.innerText = 'School and programme: ' + program;
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

      var btnShare = document.getElementById('btn-share');
      if (btnShare) {
        btnShare.onclick = async function() {
          var shareData = {
            title: 'LandingNL',
            text: 'A step-by-step guide to your first months in the Netherlands: municipal registration and BSN, DigiD, a bank account and a huisarts.',
            url: location.origin
          };
          try {
            if (navigator.share) {
              await navigator.share(shareData);
              return;
            }
            if (navigator.clipboard && navigator.clipboard.writeText) {
              await navigator.clipboard.writeText(shareData.url);
              btnShare.innerText = '✓ Link copied';
              setTimeout(function() { btnShare.innerText = 'Share'; }, 2500);
              return;
            }
            alert(shareData.url);
          } catch (error) {
            // The user dismissed the share sheet; nothing to report.
          }
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
          if (offer) { offer.value = ''; offer.placeholder = 'Nothing in return'; }
          if (title) title.focus();
        };
      }
      if (btnAddSwap) {
        btnAddSwap.onclick = function() {
          var cat = document.getElementById('swap-cat').value;
          var title = document.getElementById('swap-title').value;
          var offer = document.getElementById('swap-offer').value;

          if (cat === '🎁 Give away' && !offer) offer = 'Free — nothing expected in return';

          if (!title || !offer) return alert('Please fill in every field.');

          var userPosts = [];
          try { userPosts = JSON.parse(Store.get('user_swaps', '[]')); } catch(e) {}
          userPosts.unshift({ id: Date.now(), cat: cat, title: title, offer: offer, tagClass: 'tag-mint' });
          Store.set('user_swaps', JSON.stringify(userPosts));

          document.getElementById('swap-title').value = '';
          document.getElementById('swap-offer').value = '';

          renderSwaps();
          alert('Draft saved. Only you can see it until the community board opens.');
        };
      }

      var btnWa = document.getElementById('btn-modal-wa');
      if (btnWa) {
        btnWa.onclick = function() {
          var msg = document.getElementById('modal-msg');
          var text = msg ? msg.innerText : '';
          var done = function() { btnWa.innerText = '✓ Copied'; };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(done, function() { alert('Could not copy — select the text and copy it manually.'); });
          } else {
            alert('Could not copy — select the text and copy it manually.');
          }
        };
      }

      var btnClose = document.getElementById('btn-modal-close');
      if (btnClose) {
        btnClose.onclick = function() {
          document.getElementById('modal-box').classList.add('hidden');
        };
      }

      var tabs = [1, 2];
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
