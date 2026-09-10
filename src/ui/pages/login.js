export function renderLoginPage(googleClientId, releaseLabel = 'v1.0.6 · local', options = {}) {
  const { emailLoginEnabled = false, closedBeta = true } = options;
  const betaNotice = closedBeta
    ? '<p class="notice" id="beta-notice">LandingNL kapalı beta aşamasında. Şu an yalnızca davet edilen hesaplar giriş yapabilir; kayıtlar gizlilik bildirimi yayımlandığında açılacak.</p>'
    : '';
  const emailForm = emailLoginEnabled
    ? `<input type="email" id="email" placeholder="ornek@student.uva.nl" required />
    <button class="btn" id="btn-email-login">E-posta ile Devam Et</button>`
    : '';
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LandingNL • Giriş ${releaseLabel}</title>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
  <style>
    :root { --primary: #3b82f6; --bg: #080c14; --card: #111827; --text: #f8fafc; --muted: #94a3b8; --border: rgba(255,255,255,0.08); }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 40px; max-width: 400px; width: 100%; text-align: center; }
    h2 { font-size: 1.6rem; margin: 0 0 8px 0; color: #fff; }
    p { color: var(--muted); font-size: 0.9rem; margin-bottom: 24px; }
    input { width: 100%; padding: 12px 16px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: white; font-size: 0.9rem; margin-bottom: 12px; outline: none; }
    .btn { width: 100%; padding: 12px; background: var(--primary); color: white; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .legal { font-size: 0.75rem; color: var(--muted); margin: 16px 0 0 0; }
    .legal a { color: #93c5fd; }
    .notice { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); color: #fcd34d; border-radius: 10px; padding: 10px 12px; font-size: 0.8rem; text-align: left; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Giriş Yap <span style="font-size:0.7rem; color:#94a3b8;">${releaseLabel}</span></h2>
    <p>Profilini oluştur veya mevcut hesabına eriş.</p>
    ${betaNotice}

    <div id="g_id_onload" data-client_id="${googleClientId}" data-context="signin" data-ux_mode="popup" data-callback="handleGoogleCredential" data-auto_prompt="false"></div>
    <div class="g_id_signin" data-type="standard" data-size="large" data-theme="filled_blue" data-shape="rectangular" style="margin-bottom:16px; display:flex; justify-content:center;"></div>

    ${emailForm}
    <p class="legal" id="privacy-link">Giriş yaparak hesabının oluşturulacağını kabul edersin. Verilerinin nasıl işlendiğini <a href="/privacy">Gizlilik Bildirimi</a>'nde okuyabilirsin.</p>
  </div>

  <script>
    async function postLogin(path, body) {
      var response = await fetch(path, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      var result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Giriş işlemi tamamlanamadı.');
      return result;
    }
    async function handleGoogleCredential(response) {
      try {
        var result = await postLogin('/api/auth/google', { credential: response.credential });
        location.href = result.next || '/onboarding';
      } catch (error) {
        alert(error.message);
      }
    }
    document.addEventListener('DOMContentLoaded', function() {
      var btn = document.getElementById('btn-email-login');
      if (btn) {
        btn.onclick = async function() {
          var email = document.getElementById('email').value;
          if (!email || !email.includes('@')) return alert('Geçerli bir e-posta girin.');
          btn.disabled = true;
          try {
            var result = await postLogin('/api/auth/email/start', { email: email });
            alert(result.message);
          } catch (error) {
            alert(error.message);
          } finally {
            btn.disabled = false;
          }
        };
      }
    });
  </script>
</body>
</html>`;
}
