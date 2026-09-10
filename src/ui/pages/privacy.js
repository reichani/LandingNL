export const PRIVACY_NOTICE_VERSION = '1.0 · 10 Eylül 2026';

export function renderPrivacyPage(releaseLabel = 'v1.0.6 · local') {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LandingNL • Gizlilik Bildirimi</title>
  <style>
    :root { --bg: #080c14; --card: #111827; --text: #f8fafc; --muted: #94a3b8; --border: rgba(255,255,255,0.08); }
    * { box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: var(--bg); color: var(--text); margin: 0; padding: 20px; line-height: 1.6; }
    main { max-width: 720px; margin: 0 auto; background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 28px; }
    h1 { font-size: 1.5rem; margin: 0 0 4px 0; }
    h2 { font-size: 1.05rem; margin: 24px 0 6px 0; color: #fff; }
    p, li { color: #cbd5e1; font-size: 0.9rem; }
    .meta { color: var(--muted); font-size: 0.78rem; }
    a { color: #93c5fd; }
  </style>
</head>
<body>
  <main>
    <h1>Gizlilik Bildirimi</h1>
    <p class="meta">Sürüm ${PRIVACY_NOTICE_VERSION} · ${releaseLabel}</p>

    <h2>Veri sorumlusu</h2>
    <p>LandingNL, Reyhan Açar tarafından işletilir. Gizlilikle ilgili tüm talepler için: <a href="mailto:reichani@gmail.com">reichani@gmail.com</a></p>

    <h2>Hangi verileri işliyoruz</h2>
    <ul>
      <li>Google ile girişte: e-posta adresin, adın ve Google hesap kimliğin.</li>
      <li>Kurulumda verdiğin bilgiler: yaşın, AB/AEA statün, şehrin, okulun/programın ve konut durumun.</li>
      <li>Yolculuk kayıtların: işaretlediğin adımlar, belediye randevu tarihin ve takas taslakların. BSN numaranı istemeyiz; lütfen hiçbir alana yazma.</li>
      <li>Oturum bilgisi: girişini açık tutan zorunlu bir çerez. Sunucuda yalnızca bu çerezin şifrelenmiş (hash) değeri saklanır.</li>
      <li>Teknik kayıtlar: güvenlik ve hata tespiti için barındırma altyapısının tuttuğu IP adresi, tarayıcı bilgisi ve istek zamanı.</li>
    </ul>

    <h2>Neden ve hangi hukuki dayanakla</h2>
    <p>Hesabını oluşturmak ve sana kişisel yolculuk planını göstermek için verilerini, senin istediğin hizmeti sunmak amacıyla işleriz (GDPR m. 6/1-b). Güvenlik, kötüye kullanımın önlenmesi ve hata giderme için teknik kayıtları meşru menfaate dayanarak işleriz (GDPR m. 6/1-f). Verilerini satmayız, reklam veya profil çıkarma için kullanmayız.</p>

    <h2>Kimlerle paylaşılır</h2>
    <p>Barındırma ve veritabanı için Cloudflare, giriş için Google hizmet sağlayıcı olarak kullanılır. Bu şirketler verileri Avrupa Ekonomik Alanı dışında da işleyebilir; bu aktarımlar AB standart sözleşme maddeleri veya AB-ABD Veri Gizliliği Çerçevesi gibi güvencelere dayanır. Google ile giriş yaptığında Google kendi gizlilik politikasına göre çerez kullanabilir.</p>

    <h2>Ne kadar süre saklanır</h2>
    <p>Hesap verilerin, hesabın açık olduğu sürece saklanır. Oturumlar en fazla 30 gün, e-posta giriş bağlantıları 15 dakika geçerlidir. Hesabının silinmesini istediğinde verilerin 30 gün içinde silinir.</p>

    <h2>Hakların</h2>
    <p>Verilerine erişme, düzeltme, silme, işlemeye itiraz etme ve verilerini taşınabilir biçimde alma hakların vardır. Talebini kayıtlı e-posta adresinden <a href="mailto:reichani@gmail.com">reichani@gmail.com</a> adresine gönder. Hollanda'da veri koruma otoritesi Autoriteit Persoonsgegevens'e şikayette bulunma hakkın da vardır.</p>

    <h2>Yaş sınırı</h2>
    <p>LandingNL 16 yaş ve üzeri öğrenciler içindir.</p>

    <h2>Çerezler</h2>
    <p>Yalnızca girişin için zorunlu olan oturum çerezini kullanırız. İzleme veya reklam çerezi kullanmayız.</p>

    <p class="meta"><a href="/">← Ana sayfa</a> · <a href="/login">Giriş</a></p>
  </main>
</body>
</html>`;
}
