# Robert College Business Society

Astro tabanlı, Türkçe ve İngilizce bir kulüp sitesi. Tasarım referansı: https://rcds.robcol.k12.tr/. Koyu arka plan, üstte logo ve menü, ana sayfada büyük görsel ve kayan kulüp adı; iç sayfalarda ortalanmış başlıklar korunur.

Ana menü: **Home, About, Newsletter, Blog, Contact** (Türkçe sayfalarda Türkçe adlarıyla). Community Outreach bölümü yoktur.

## Çalıştırma

```bash
npm install
npm run dev       # http://localhost:4321
npm run check     # Astro ve TypeScript kontrolü
npm run build     # Statik yayın dosyaları: dist/
```

## Metin, fotoğraf ve yazı düzenleme

İki terminal açın:

```bash
npm run dev
```

```bash
npm run admin
```

`http://localhost:4321/admin/` adresini açın ve yerel panele giriş yapın. Yerel panel bilgisayarınızdaki dosyaları değiştirir. Panele erişim localhost ile sınırlandırılmıştır; internete açmayın. Yerel değişiklikler otomatik olarak internette yayımlanmaz.

Panelde:

- **Sayfa metinleri ve fotoğrafları → Home**: toplu fotoğraf, fotoğrafın kırpma odağı, kayan başlık, giriş paragrafları ve buton.
- **About**: metinler, ana fotoğraf/logo ve fotoğraf albümü.
- **Newsletter sayfası**: giriş metinleri ve isteğe bağlı sayfa fotoğrafı.
- **Blog sayfası**: giriş metni, sayfa fotoğrafı ve bağlantı metinleri.
- **Contact**: başlıklar, açıklama ve isteğe bağlı sayfa fotoğrafı.
- **Kulüp bilgileri ve logo**: kulüp adı, logo, e-posta, sosyal hesaplar, adres, harita ve yönetim kurulu fotoğrafları.
- **Blog yazıları (TR/EN)**: yeni yazı ekleme, kapak fotoğrafı, kategori, yazar, tarih ve Markdown içerik.
- **Newsletter sayıları (TR/EN)**: sayı başlığı, tarih, açıklama, PDF ve isteğe bağlı kapak fotoğrafı.

TR ve EN içerikleri ayrı ayrı düzenlenir. Yüklenen fotoğrafı iki dilde de kullanmak için her iki alanı da aynı fotoğrafa ayarlayın. Fotoğraflar ve PDF’ler `public/uploads/` içinde saklanır. Panelde **Taslak** açık olan blog yazıları ve newsletter sayıları yayımlanmış sayfalara dahil edilmez. Bu bir erişim kontrolü değildir: `public/uploads/` altındaki dosyalar doğrudan bağlantıyla erişilebilir. Gizli dosya yüklemeyin.

Toplu fotoğraf henüz eklenmediği için ana sayfa mevcut Business Society logosunu gösterir. Fotoğraf geldiğinde Home içindeki **Ana sayfa toplu fotoğrafı** alanına yükleyin. En az 1600 piksel genişliğinde yatay fotoğraf önerilir; odak noktasını üst/orta/alt olarak seçebilirsiniz.

Gerçek iletişim adresleri önceki projede yer tutucuydu. E-posta ve sosyal hesaplar bu yüzden şimdilik boş; panelde girildiğinde üst menüde, alt bilgide ve Contact sayfasında görünür. Örnek yönetim kurulu adları sitede gösterilmez; gerçek isimleri panelde girin.

## Blog yazıları

Mevcut yazılar korunur; dosyalar hâlâ `src/content/magazine/tr/` ve `src/content/magazine/en/` altındadır. Sitedeki adresleri `/tr/blog/yazi-adi/` ve `/en/blog/article-name/` şeklindedir. Eski `/magazine/` adresleri yeni Blog adreslerine yönlenir. Önceki Markets ve Network adresleri About sayfasına yönlenir.

```yaml
---
title: "Yazının başlığı"
author: "Yazarın adı"
date: 2026-10-21
category: Girişimcilik
excerpt: "Yazının kısa özeti."
cover: /uploads/kapak.jpg
coverAlt: "Kapak fotoğrafının açıklaması"
translationKey: ortak-ceviri-anahtari
draft: false
---
```

Altına yazıyı Markdown olarak yazın. `cover` ve `translationKey` isteğe bağlıdır. TR ve EN çevirilerinde aynı `translationKey` kullanıldığında dil değiştirici doğrudan çeviriyi açar; çeviri yoksa diğer dildeki Blog listesine gider.

Projede bulunan **Örnek Yazar / Sample Author** yazıları gösterim içindir; panelden düzenleyebilir veya silebilirsiniz.

## Newsletter

Newsletter, referans sitedeki gibi dönemlik PDF arşividir. Panelden bir sayı oluşturun ve PDF yükleyin. E-posta aboneliği veya otomatik e-posta gönderimi içermez. Henüz gerçek sayı eklenmediği için arşivde hazırlık mesajı görünür. Panelde her dil için bir başlangıç taslağı vardır; PDF ekleyip Taslak alanını kapatarak ilk sayınızı yayımlayabilirsiniz. Taslakta PDF boş kalabilir; yayımlanan bir sayıda boşsa derleme açıklayıcı hata verir. Elle dosya eklemek için `src/content/newsletter/README.md` içindeki örneği kullanın.

## Yayına alma

```bash
npm run check
npm run build
```

`dist/` klasörünü bir statik site sağlayıcısında yayımlayabilirsiniz. `astro.config.mjs` içindeki alan adı henüz doğrulanmış bir yayın adresi değildir; gerçek alan adı belli olduğunda güncelleyin. Statik yönlendirmeler HTML meta refresh olarak üretilir; HTTP 301 için sağlayıcınızda yönlendirme kuralları kullanın.

**Yayındaki admin paneli henüz yapılandırılmadı.** `public/admin/config.yml` içindeki `backend.repo` alanına gerçek GitHub reposunu girin ve yayın sağlayıcınızda Decap/GitHub OAuth bağlantısını yapılandırın. Yerel panel bu bağlantı kurulmadan çalışır. Yayın ortamında yerel Decap sunucusu çalıştırılmaz.

## Dosya düzeni

- `src/layouts/Base.astro`: ortak üst menü ve alt bilgi.
- `src/styles/global.css`: renkler, yazı tipleri ve ortak stiller.
- `src/data/pages/*.json`: beş sayfanın TR/EN metinleri ve fotoğrafları.
- `src/data/site.json`: logo, kulüp ve iletişim bilgileri.
- `src/content/magazine/`: mevcut ve yeni blog yazıları.
- `src/content/newsletter/`: newsletter sayıları.
- `public/admin/config.yml`: düzenleme panelinin alanları.
- `public/uploads/`: yüklenen fotoğraf ve PDF dosyaları.
