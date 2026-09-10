export function renderOnboardingPage(releaseLabel = 'v1.0.6 · local') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LandingNL • Kurulum ${releaseLabel}</title>
  <style>
    :root { --primary: #3b82f6; --bg: #080c14; --card: #111827; --text: #f8fafc; --muted: #94a3b8; --border: rgba(255,255,255,0.08); }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 32px; max-width: 440px; width: 100%; }
    .step { font-size: 0.75rem; font-weight: 700; color: #60a5fa; text-transform: uppercase; margin-bottom: 6px; }
    h2 { font-size: 1.4rem; margin: 0 0 8px 0; color: #fff; }
    p { color: var(--muted); font-size: 0.85rem; margin-bottom: 20px; }
    label { display: block; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; margin-bottom: 6px; }
    input, select { width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: white; font-size: 0.9rem; margin-bottom: 16px; outline: none; }
    .btn { width: 100%; padding: 12px; background: var(--primary); color: white; border: none; border-radius: 10px; font-weight: 700; cursor: pointer; }
    .hidden { display: none; }
  </style>
</head>
<body>
  <div class="card">
    <div style="font-size:0.68rem; color:var(--muted); text-align:right; margin-bottom:8px;">${releaseLabel}</div>
    <div id="step-1">
      <div class="step">Adım 1 / 4</div>
      <h2>Doğum Tarihin</h2>
      <p>Hollanda'da yaşa bağlı kurallar (ör. asgari ücret kademesi) için gerekir. LandingNL 16 yaş ve üzeri öğrenciler içindir.</p>
      <label for="dob">Doğum Tarihi</label>
      <input type="date" id="dob" required />
      <button class="btn" id="btn-ob-1">Devam ➔</button>
      <p style="font-size:0.72rem; margin:12px 0 0 0;"><a href="/privacy" style="color:#94a3b8;">Gizlilik Bildirimi</a></p>
    </div>

    <div id="step-2" class="hidden">
      <div class="step">Adım 2 / 4</div>
      <h2>Vatandaşlık Statün</h2>
      <p>Hollanda'ya giriş, oturum izni ve çalışma izni kuralları pasaportuna göre değişir. Bu seçim yolculuk adımlarını belirler.</p>
      <label for="status">Pasaport</label>
      <select id="status">
        <option value="non_eu">AB/AEA veya İsviçre dışı pasaport (oturum izni gerekir)</option>
        <option value="eu">AB/AEA veya İsviçre pasaportu (oturum izni gerekmez)</option>
      </select>
      <button class="btn" id="btn-ob-2">Devam ➔</button>
    </div>

    <div id="step-3" class="hidden">
      <div class="step">Adım 3 / 4</div>
      <h2>Eğitim Şehri & Okul</h2>
      <p>Şehrinizi ve üniversitenizi seçin.</p>
      <label>Şehir</label>
      <select id="city">
        <option value="Amsterdam">Amsterdam</option>
        <option value="Rotterdam">Rotterdam</option>
        <option value="Eindhoven">Eindhoven</option>
        <option value="Utrecht">Utrecht</option>
        <option value="Leiden">Leiden</option>
        <option value="Delft">Delft</option>
        <option value="Groningen">Groningen</option>
      </select>
      <label>Okul / Program</label>
      <select id="program"></select>
      <button class="btn" id="btn-ob-3">Devam ➔</button>
    </div>

    <div id="step-4" class="hidden">
      <div class="step">Adım 4 / 4</div>
      <h2>Konaklama Statün</h2>
      <p>Kalacak yeriniz hazır mı?</p>
      <label>Durum</label>
      <select id="housing">
        <option value="yes">Evet, evim hazır (Kira Sözleşmem var)</option>
        <option value="no">Henüz bulamadım / Geçici konaklama</option>
      </select>
      <button class="btn" id="btn-ob-finish">Panele Git ➔</button>
    </div>
  </div>

  <script>
    var schoolsMap = {
      'Amsterdam': ['University of Amsterdam (UvA) - PPLE', 'VU Amsterdam - Computer Science', 'Amsterdam University of Applied Sciences'],
      'Rotterdam': ['Erasmus University Rotterdam (EUR) - Economics', 'Erasmus University Rotterdam (EUR) - IBA', 'Rotterdam University of Applied Sciences'],
      'Eindhoven': ['Eindhoven University of Technology (TU/e) - Data Science', 'Fontys University of Applied Sciences - IT'],
      'Utrecht': ['Utrecht University - Economics', 'HU University of Applied Sciences Utrecht'],
      'Leiden': ['Leiden University - International Relations', 'Leiden University - Law'],
      'Delft': ['TU Delft - Computer Science', 'TU Delft - Aerospace Engineering'],
      'Groningen': ['University of Groningen - International Business', 'Hanze University of Applied Sciences']
    };

    function updateSchools() {
      var city = document.getElementById('city').value;
      var programSelect = document.getElementById('program');
      programSelect.innerHTML = '';
      var list = schoolsMap[city] || ['Genel Lisans Programı'];
      for (var i = 0; i < list.length; i++) {
        var opt = document.createElement('option');
        opt.value = list[i];
        opt.innerText = list[i];
        programSelect.appendChild(opt);
      }
    }

    document.addEventListener('DOMContentLoaded', function() {
      var maxDob = new Date();
      maxDob.setUTCFullYear(maxDob.getUTCFullYear() - 16);
      document.getElementById('dob').max = maxDob.toISOString().slice(0, 10);
      document.getElementById('city').addEventListener('change', updateSchools);
      updateSchools();

      document.getElementById('btn-ob-1').onclick = function() {
        var dob = document.getElementById('dob').value;
        if (!dob) return alert('Doğum tarihini seçin.');
        var birth = new Date(dob + 'T00:00:00Z');
        var today = new Date();
        var age = today.getUTCFullYear() - birth.getUTCFullYear();
        var hadBirthday = (today.getUTCMonth() > birth.getUTCMonth()) ||
          (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() >= birth.getUTCDate());
        if (!hadBirthday) age -= 1;
        if (!(age >= 16 && age <= 100)) return alert('LandingNL 16 yaş ve üzeri öğrenciler içindir. Doğum tarihini kontrol et.');
        localStorage.setItem('landingnl_age', age);
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
      };

      document.getElementById('btn-ob-2').onclick = function() {
        localStorage.setItem('landingnl_status', document.getElementById('status').value);
        document.getElementById('step-2').classList.add('hidden');
        document.getElementById('step-3').classList.remove('hidden');
      };

      document.getElementById('btn-ob-3').onclick = function() {
        localStorage.setItem('landingnl_city', document.getElementById('city').value);
        localStorage.setItem('landingnl_program', document.getElementById('program').value);
        document.getElementById('step-3').classList.add('hidden');
        document.getElementById('step-4').classList.remove('hidden');
      };

      document.getElementById('btn-ob-finish').onclick = async function() {
        localStorage.setItem('landingnl_housing', document.getElementById('housing').value);
        var state = {
          age: localStorage.getItem('landingnl_age') || '',
          status: localStorage.getItem('landingnl_status') || '',
          city: localStorage.getItem('landingnl_city') || '',
          program: localStorage.getItem('landingnl_program') || '',
          housing: localStorage.getItem('landingnl_housing') || ''
        };
        try {
          var response = await fetch('/api/onboarding/complete', {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(state)
          });
          if (!response.ok) {
            var failure = await response.json().catch(function() { return {}; });
            throw new Error(failure.error || 'Profil kaydedilemedi.');
          }
          var result = await response.json();
          location.href = result.next || '/dashboard';
        } catch (error) {
          alert(error.message || 'Profil kaydedilemedi. Lütfen tekrar deneyin.');
        }
      };
    });
  </script>
</body>
</html>`;
}
