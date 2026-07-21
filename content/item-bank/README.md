# Item Bank — özgün soru / anahtar / anlatım

Telifli kitapçık veya dershane bankası **yok**.  
Kurallar: `docs/architecture/item-bank.md`

## MVP 1.0

- Hedef: ~50–60 madde (LGS + YGS + KPSS)
- Manifest: `manifests/mvp-1.0.json`
- Her JSON: `source: original`, `license: owned`

## Yeni madde

1. Doğru `examType` / `subject` klasörüne dosya ekle  
2. `topicId` = `functions/src/data/topics.ts` ile eşleşsin  
3. `review.similarityCheck: pass`  
4. Manifest’e `id` ekle  
