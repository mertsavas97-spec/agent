# app-ads.txt — AdMob verification checklist

## Canlı (beklenen)

`https://cozbil-dev-f9583.web.app/app-ads.txt`

İçerik **yalnızca** (yorum yok):

```
google.com, pub-4628962707131944, DIRECT, f08c47fec0942fa0
```

## ASC (zorunlu eşleşme)

App Store Connect → App Information:

- **Marketing URL** = `https://cozbil-dev-f9583.web.app`  
  (kök; path yok; `github.io/...` değil)
- Support URL aynı domain olabilir

AdMob crawler **mağaza listing’deki** developer website’e bakar.

## Deploy (owner Mac)

```bash
cd ~/agent
git fetch origin && git checkout cursor/app-ads-txt-admob-2914 && git pull
bash scripts/check-app-ads-txt.sh
npx firebase-tools login --reauth   # gerekirse
bash scripts/deploy-hosting-legal.sh
APP_ADS_LIVE=1 bash scripts/check-app-ads-txt.sh
```

## AdMob

1. Apps → ÇözBil iOS → app-ads.txt → **güncellemeleri kontrol et**
2. Uygulama App Store’da listelenmiş olmalı (crawler store’dan URL alır)
3. 24 saat bekleyin; hâlâ fail ise ASC URL’yi ekran görüntüsüyle doğrulayın

## Sık hata

| Belirti | Neden |
|---------|--------|
| Eşleşmiyor | ASC hâlâ github.io / yanlış domain |
| Eşleşmiyor | Unicode yorum satırları / yanlış pub-id |
| Dosya yok | Hosting deploy edilmemiş |
| Gecikme | Crawl 24s+ |
