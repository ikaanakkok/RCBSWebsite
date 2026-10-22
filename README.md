# Robert College Business Society

Astro ile üretilen TR/EN kulüp sitesi ve Node.js üzerinde çalışan şifreli içerik yönetimi. Ana sayfalar: Home, About, Newsletter, Blog, Contact.

## Yerel çalıştırma

Node.js 22.16 veya üzeri gerekir.

```bash
npm ci
npm run admin:setup   # İlk sefer: .env oluşturur, rastgele güçlü şifre üretir.
npm run build
npm start            # http://localhost:3000
```

Yönetim: **http://localhost:3000/admin123/**. Kullanıcı adı ve şifre bilgisayarınızdaki `.env` dosyasındadır. Kurulum komutu mevcut dosyayı ezmez. Şifreyi terminale yazdırmaz. Dosya yalnızca sahibinin okuyup yazabileceği izinle oluşturulur ve Git tarafından dışlanır. `.env.example` gizli değer içermeyen şablondur.

`npm run admin` aynı korumalı sunucuyu başlatır. Eski, şifresiz 8081 proxy sunucusu artık kullanılmaz; daha önce açtıysanız durdurun. Ön yüz üzerinde geliştirme için `npm run dev` kullanılabilir; bu Astro geliştirme sunucusunda içerik paneli bulunmaz. Astro dev/preview sunucusunu internete açmayın. Şifreli panel için yukarıdaki Node sunucusunu kullanın.

## Yönetici girişi

- Şifre tarayıcıya gönderilmez; sunucuda scrypt ile doğrulanır.
- Oturum çerezi HttpOnly ve SameSite=Strict kullanır; HTTPS ortamında Secure olarak verilir.
- Oturumlar 30 dakika sonra sona erer. Çıkış yapmak veya sunucuyu yeniden başlatmak oturumu iptal eder.
- Aynı IP üzerinden beş başarısız giriş denemesinden sonra 15 dakika beklenir. Sayaçlar bellektedir; yeniden başlatmada sıfırlanır. Reverse proxy arkasındaki istekler ortak sınıra tabi olur. İstemcinin gönderdiği forwarded-IP başlıkları güvenilir kabul edilmez.
- Panel HTML’i, yapılandırma, içerik okuma/yazma ve yükleme API’si oturum denetiminden geçer. Eski `/admin` adresi 404 döner.
- API yalnızca tanımlanmış sayfa JSON dosyalarını, blog/newsletter Markdown dosyalarını ve izin verilen medya uzantılarını işler. Ortam dosyaları, sunucu kodu ve Git dosyaları bu API ile okunamaz veya değiştirilemez.
- Durum değiştiren isteklerde yapılandırılmış site origin’i kontrol edilir. API herkese açık CORS izni vermez.

Yönetim adresini bilmemek bir güvenlik kontrolü değildir. Adres kaynak kodunda görülebilir; korumayı oturum doğrulaması sağlar. Bu kontroller sıfır güvenlik açığı garantisi değildir; işletim sistemi, reverse proxy, HTTPS, bağımlılıklar ve yedekler de bakım gerektirir.

## Okul sunucusunda yayın

Bu sürümde **yalnızca dist klasörünü statik sunucuya kopyalamak şifreli paneli çalıştırmaz**. Sunucuda kaynak proje, Node.js ve yazılabilir içerik klasörleri bulunmalıdır.

1. GitHub’dan projeyi alın; `npm ci` ve `npm run build` çalıştırın.
2. Sunucuda ayrı bir `.env` oluşturun. Bilgisayardaki şifreyi paylaşmak yerine sunucu için yeni güçlü bir şifre belirleyin.
3. `SITE_ORIGIN` değerini gerçek HTTPS alan adına ayarlayın; sonunda `/` olmamalıdır. Yerel olmayan HTTP origin’leri reddedilir.
4. Node sürecini bir servis yöneticisiyle çalıştırın. `HOST=127.0.0.1` ve `PORT=3000` varsayılanları, aynı makinedeki HTTPS reverse proxy arkasında kullanılmak içindir. Reverse proxy site isteklerini bu Node sunucusuna iletmelidir.
5. Dış erişimde sadece HTTPS reverse proxy’yi açın. Geliştirme sunucusunu veya eski Decap proxy’sini internete açmayın. Sunucu hesabına yalnızca gerekli proje/içerik izinlerini verin.
6. `.env` dosyasını web köküne, e-postaya, GitHub’a veya yayın arşivine koymayın. İçerik ve medya dosyalarını yedekleyin.

`SITE_ORIGIN`, tarayıcıda kullanılan origin ile aynı olmalıdır. Yerelde `localhost:3000` için oluşturulan ayarla `127.0.0.1:3000` üzerinden giriş yapmak reddedilir.

## İçerik düzenleme ve yayına yansıtma

Panelden önce yönetici hesabıyla giriş yapın. Decap daha sonra kendi bağlantı ekranını gösterirse **Giriş** düğmesiyle içerik düzenleyicisini açın; bu düğmeye ulaşmak için önce sunucudaki şifre doğrulaması tamamlanmış olur.

- Sayfa metinleri ve fotoğrafları: beş sayfanın TR/EN alanları.
- Kulüp bilgileri: logo, yönetim kurulu, fotoğraflar, sosyal bağlantılar ve iletişim.
- Blog: mevcut ve yeni yazılar, kapak fotoğrafı, kategori, tarih ve yazar.
- Newsletter: dönemlik PDF sayıları ve isteğe bağlı kapak görselleri. Taslaklar sitede görünmez.

**Panelde kaydetmek sunucudaki kaynak dosyalarını değiştirir. GitHub’a otomatik commit/push veya otomatik yayın yapmaz.** Yayındaki statik sayfalara yansıtmak için `npm run build` çalıştırılmalıdır. Bu yayın adımını hocanızın yönetiminde yapın; bu sürümde otomatik deploy kurulmadı. Sunucuda değişmiş içerik dosyalarını GitHub’daki güncellemeyle ezerken kaybetmeyin; önce yedekleyin/senkronize edin.

Medya `public/uploads/` içinde tutulur ve yayımlanan dosyalar doğrudan bağlantıyla herkese açık olabilir. Taslak ayarı bir dosya gizlilik kontrolü değildir; gizli belge yüklemeyin. PDF, JPG, PNG, WebP, GIF, AVIF ve HEIC uzantıları kabul edilir. Tarayıcıda gösterim için HEIC yerine JPG/PNG kullanın. HTML/JS/SVG yüklemeleri kabul edilmez.

Mevcut blog dosyaları `src/content/magazine/` içinde korunur ve `/tr/blog/` veya `/en/blog/` altında yayımlanır. Newsletter örneği `src/content/newsletter/README.md` içindedir. Gerçek e-posta ve sosyal hesapları panelden ekleyebilirsiniz.

## Kontroller

```bash
npm test
npm run check
npm run build
```

Oturumsuz erişim, yanlış şifre, giriş limiti, oturum süresi, çıkış, origin kontrolü, cookie bayrakları ve dosya erişim sınırları entegrasyon testleriyle kontrol edilir. Bağımlılık denetiminde Decap CLI’nin Joi bağımlılığından gelen düşük önem dereceli bildirimler bulunmaktadır; sürüm yükseltmelerini ayrıca takip edin.

## Dosyalar

- `server/app.mjs`: şifre doğrulama, oturumlar, korumalı içerik API’si ve yayın dosyalarının sunumu.
- `server/admin.html`, `server/cms.yml`: herkese açık statik klasör dışında tutulan panel ve yapılandırması.
- `scripts/server.mjs`, `scripts/setup-admin.mjs`: sunucu ve yerel hesap kurulumu.
- `src/data/pages/`, `src/data/site.json`: düzenlenebilir sayfa ve kulüp içerikleri.
- `src/content/magazine/`, `src/content/newsletter/`: blog ve newsletter kaynakları.
- `public/uploads/`: medya dosyaları.
