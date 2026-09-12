export function renderOnboardingPage(releaseLabel = 'v1.0.6', buildMeta = '') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LandingNL • Kurulum</title>
  ${buildMeta}
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
      <p>Şehrini ve okulunu seç. Listede yoksa "Diğer" seçip kendin yazabilirsin.</p>
      <label for="city">Şehir</label>
      <select id="city">
        <option value="Amsterdam">Amsterdam</option>
        <option value="Rotterdam">Rotterdam</option>
        <option value="Den Haag">Den Haag</option>
        <option value="Utrecht">Utrecht</option>
        <option value="Eindhoven">Eindhoven</option>
        <option value="Groningen">Groningen</option>
        <option value="Leiden">Leiden</option>
        <option value="Delft">Delft</option>
        <option value="Maastricht">Maastricht</option>
        <option value="Nijmegen">Nijmegen</option>
        <option value="Tilburg">Tilburg</option>
        <option value="Enschede">Enschede</option>
        <option value="Wageningen">Wageningen</option>
        <option value="Breda">Breda</option>
        <option value="Arnhem">Arnhem</option>
        <option value="Zwolle">Zwolle</option>
        <option value="Haarlem">Haarlem</option>
        <option value="Leeuwarden">Leeuwarden</option>
        <option value="__other__">Diğer şehir…</option>
      </select>
      <input type="text" id="city-other" class="hidden" placeholder="Şehrini yaz" />
      <label for="school">Okul</label>
      <select id="school"></select>
      <input type="text" id="school-other" class="hidden" placeholder="Okulunun adını yaz" />
      <label for="program">Bölüm / Program <span style="color:#94a3b8; font-weight:400;">(istersen)</span></label>
      <input type="text" id="program" placeholder="Ör. Computer Science" />
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
    // Hollanda'daki başlıca araştırma üniversiteleri (WO) ve uygulamalı bilimler
    // üniversiteleri (HBO). Liste kapsayıcı değildir; bu yüzden her şehirde
    // "Diğer" seçeneğiyle öğrenci okulunu kendisi yazabilir.
    var schoolsMap = {
      'Amsterdam': ['Universiteit van Amsterdam (UvA)', 'Vrije Universiteit Amsterdam (VU)', 'Hogeschool van Amsterdam (HvA)', 'Amsterdam University College', 'Hogeschool Inholland Amsterdam', 'Gerrit Rietveld Academie', 'Amsterdamse Hogeschool voor de Kunsten'],
      'Rotterdam': ['Erasmus Universiteit Rotterdam (EUR)', 'Hogeschool Rotterdam', 'Hogeschool Inholland Rotterdam', 'Codarts Rotterdam', 'Erasmus University College'],
      'Den Haag': ['Universiteit Leiden – Campus Den Haag', 'De Haagse Hogeschool (THUAS)', 'Hogeschool Inholland Den Haag', 'Koninklijke Academie van Beeldende Kunsten'],
      'Utrecht': ['Universiteit Utrecht (UU)', 'Hogeschool Utrecht (HU)', 'University College Utrecht', 'Hogeschool voor de Kunsten Utrecht (HKU)'],
      'Eindhoven': ['Technische Universiteit Eindhoven (TU/e)', 'Fontys Hogescholen Eindhoven', 'Design Academy Eindhoven', 'Summa College'],
      'Groningen': ['Rijksuniversiteit Groningen (RUG)', 'Hanzehogeschool Groningen', 'University College Groningen'],
      'Leiden': ['Universiteit Leiden', 'Hogeschool Leiden', 'Leiden University College'],
      'Delft': ['Technische Universiteit Delft (TU Delft)', 'De Haagse Hogeschool – Delft', 'Inholland Delft'],
      'Maastricht': ['Universiteit Maastricht (UM)', 'Zuyd Hogeschool', 'Maastricht University College', 'Hotelschool Maastricht'],
      'Nijmegen': ['Radboud Universiteit', 'Hogeschool van Arnhem en Nijmegen (HAN)'],
      'Tilburg': ['Tilburg University', 'Fontys Hogescholen Tilburg', 'Avans Hogeschool Tilburg'],
      'Enschede': ['Universiteit Twente (UT)', 'Saxion Hogeschool Enschede', 'ArtEZ Enschede'],
      'Wageningen': ['Wageningen University & Research (WUR)', 'Aeres Hogeschool Wageningen'],
      'Breda': ['Breda University of Applied Sciences (BUas)', 'Avans Hogeschool Breda'],
      'Arnhem': ['Hogeschool van Arnhem en Nijmegen (HAN)', 'ArtEZ University of the Arts'],
      'Zwolle': ['Hogeschool Windesheim', 'Katholieke Pabo Zwolle'],
      'Haarlem': ['Hogeschool Inholland Haarlem', 'Hogeschool van Amsterdam – Haarlem'],
      'Leeuwarden': ['NHL Stenden Hogeschool', 'Van Hall Larenstein']
    };

    var OTHER = '__other__';

    function toggleOtherInput(inputId, show) {
      var input = document.getElementById(inputId);
      if (!input) return;
      input.classList.toggle('hidden', !show);
      if (!show) input.value = '';
    }

    function updateSchools() {
      var citySelect = document.getElementById('city');
      var schoolSelect = document.getElementById('school');
      var isOtherCity = citySelect.value === OTHER;
      toggleOtherInput('city-other', isOtherCity);

      schoolSelect.innerHTML = '';
      var list = isOtherCity ? [] : (schoolsMap[citySelect.value] || []);
      for (var i = 0; i < list.length; i++) {
        var opt = document.createElement('option');
        opt.value = list[i];
        opt.textContent = list[i];
        schoolSelect.appendChild(opt);
      }
      var other = document.createElement('option');
      other.value = OTHER;
      other.textContent = list.length ? 'Diğer (listede yok)…' : 'Okulumu yazacağım…';
      schoolSelect.appendChild(other);
      if (!list.length) schoolSelect.value = OTHER;
      toggleOtherInput('school-other', schoolSelect.value === OTHER);
    }

    document.addEventListener('DOMContentLoaded', function() {
      var maxDob = new Date();
      maxDob.setUTCFullYear(maxDob.getUTCFullYear() - 16);
      document.getElementById('dob').max = maxDob.toISOString().slice(0, 10);
      document.getElementById('city').addEventListener('change', updateSchools);
      document.getElementById('school').addEventListener('change', function() {
        toggleOtherInput('school-other', this.value === OTHER);
      });
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
        var citySelect = document.getElementById('city');
        var city = citySelect.value === OTHER
          ? document.getElementById('city-other').value.trim()
          : citySelect.value;
        if (!city) return alert('Şehrini yaz.');

        var schoolSelect = document.getElementById('school');
        var school = schoolSelect.value === OTHER
          ? document.getElementById('school-other').value.trim()
          : schoolSelect.value;
        if (!school) return alert('Okulunun adını yaz.');

        var program = document.getElementById('program').value.trim();
        localStorage.setItem('landingnl_city', city);
        localStorage.setItem('landingnl_program', program ? school + ' – ' + program : school);
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
