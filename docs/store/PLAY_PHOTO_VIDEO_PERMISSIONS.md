# Play Console — Fotoğraf ve video izinleri (READ_MEDIA_*)

**Tarih:** 2026-07-23  
**Karar:** ÇözBil **geniş galeri erişimi istemez** → izinleri kaldır + Android **Photo Picker**.

## Ne yapma (yanlış yol)

Play’de “Medya görsellerini oku / sık erişim” beyanı doldurma.  
ÇözBil galeri uygulaması değil; ara sıra soru fotoğrafı seçer. Beyan reddedilir / politika riski.

## Doğru yol

1. Manifest’ten `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` kalkmış yeni AAB yükle  
   (kod: `app.json` → `blockedPermissions` + galeri akışı Photo Picker).
2. Play uyarısında **sistem fotoğraf seçiciye geçildi** / izin kaldırıldı yolunu seç.
3. Tüm track’lerde (Internal dahil) eski AAB kalmasın — Play herhangi bir aktif sürümde izin görürse uyarır.

## Owner komutları (Mac)

```bash
cd ~/agent/apps/mobile   # veya repo path
eas build --platform android --profile production
# bitince Internal’a yükle (veya eas submit)
```

## Formda kısa açıklama gerekirse (TR)

> Uygulama yalnızca ara sıra sınav sorusu çözmek için tek/birkaç görsel seçer.  
> Android sistem Fotoğraf Seçici (Photo Picker / PickVisualMedia) kullanılır;  
> `READ_MEDIA_IMAGES` / `READ_MEDIA_VIDEO` beyan edilmez ve yeni sürümde kaldırılmıştır.  
> Geniş galeri taraması veya kalıcı medya kütüphanesi erişimi yoktur.

## Kod referansı

- `apps/mobile/app.json` — `android.permissions` (CAMERA + POST_NOTIFICATIONS only)  
- `apps/mobile/app.json` — `android.blockedPermissions` (READ_MEDIA_*)  
- `apps/mobile/src/features/solve/image.ts` — Android’de media-library permission atlanır
