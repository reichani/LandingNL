export function renderWelcomePage() {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LandingNL • Student Journey v1.0.4</title>
  <style>
    :root { --primary: #3b82f6; --bg: #080c14; --card: #111827; --text: #f8fafc; --muted: #94a3b8; --border: rgba(255,255,255,0.08); }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); margin: 0; padding: 0; line-height: 1.6; }
    nav { background: rgba(17, 24, 39, 0.8); backdrop-filter: blur(12px); border-bottom: 1px solid var(--border); padding: 18px 8%; display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 100; }
    .logo { font-size: 1.3rem; font-weight: 800; background: linear-gradient(135deg, #60a5fa, #34d399); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .v-badge { background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 6px; font-size: 0.7rem; color: #94a3b8; margin-left: 8px; font-weight: normal; }
    .btn { background: var(--primary); color: white; border: none; padding: 10px 20px; border-radius: 10px; font-weight: 600; cursor: pointer; }
    .hero { text-align: center; padding: 100px 20px 60px 20px; max-width: 800px; margin: 0 auto; }
    .badge { background: rgba(52, 211, 153, 0.12); color: #34d399; border: 1px solid rgba(52, 211, 153, 0.25); padding: 6px 16px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; display: inline-block; margin-bottom: 20px; }
    h1 { font-size: 2.8rem; font-weight: 800; color: #fff; margin: 0 0 16px 0; letter-spacing: -1px; }
    p { font-size: 1.15rem; color: var(--muted); margin-bottom: 36px; }
    .cta { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; border: none; padding: 16px 36px; border-radius: 14px; font-size: 1rem; font-weight: 700; cursor: pointer; box-shadow: 0 10px 25px rgba(37, 99, 235, 0.3); }
  </style>
</head>
<body>
  <nav>
    <div class="logo">LandingNL <span class="v-badge">v1.0.4</span></div>
    <button class="btn" id="btn-nav-login">Giriş Yap ➔</button>
  </nav>

  <section class="hero">
    <span class="badge">Sürdürülebilir Kampüs Ekosistemi</span>
    <h1>Hollanda Öğrenci Yolculuğunu Minimalist Yönet</h1>
    <p>Landing, Living ve Parasız Dayanışma Paneli (Student Exchange) tek bir sade platformda.</p>
    <button class="cta" id="btn-hero-login">Yolculuğu Başlat ➔</button>
  </section>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      var b1 = document.getElementById('btn-nav-login');
      var b2 = document.getElementById('btn-hero-login');
      if (b1) b1.onclick = function() { location.href = '/login'; };
      if (b2) b2.onclick = function() { location.href = '/login'; };
    });
  </script>
</body>
</html>`;
}

