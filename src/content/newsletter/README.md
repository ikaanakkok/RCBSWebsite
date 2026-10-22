# Newsletter arşivi

Panelden TR veya EN klasörüne yeni bir sayı ekleyin. Her sayı bir Markdown dosyasıdır:

```yaml
---
title: "2026–2027 Birinci Dönem"
date: 2026-12-20
description: "Dönem boyunca Business Society’de olup bitenler."
file: /uploads/newsletter-2026-2027-1.pdf
cover: /uploads/newsletter-kapak.jpg
coverAlt: "Newsletter kapağı"
draft: false
---
```

PDF ve kapak dosyalarını `public/uploads/` içine koyun. `cover` isteğe bağlıdır. `draft: true` olan sayılar sitede görünmez. TR ve EN için ayrı dosyalar oluşturun.
