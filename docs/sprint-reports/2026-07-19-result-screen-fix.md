# Result screen + live OCR solve — 2026-07-19

## Gaps from dogfood screenshots
- Local fallback (not real solve) + deploy shell leak in UI
- Wrong topic (Yüzde) for fraction/order-of-ops question
- Back title `(tabs)`
- Image thumb cropped (`cover`)
- Explain again on offline solutions

## Fixes
- Vision OCR solve proxy + arith engine (choice-aware ·/× OCR repair)
- Mobile: proxy after callable fail; clean fallback copy; KPSS temel/kesir topics
- headerBackTitle Geri; thumb `contain` 220px; hide explain for local/proxy ids
