# Sprint Agent Raporu — 2026-07-21 solve answer pipeline

**Koordinatör:** Auto  
**İstek:** Pipeline çalışmıyor; şık/cevap çıkmıyor (tüm modlar)  
**Ekipler:** mobile, backend, qa, guardian  
**Skill:** `cozbil-team-skills` → `cozbil-expo-mobile`, `senior-fullstack`, `cozbil-guardian`, `$analyze`

## Gerçek kök neden (önceki “fix” iddiaları yanlış hedefe gitmişti)

| Önceki iddia | Gerçek |
|--------------|--------|
| Timeout / org-policy / loading %90 | Beklemeyi açtı ama **cevap alanı hiç üretilmiyordu** |
| Exam mode block | Cross-exam UX; same-mode şık kaybını açıklamaz |
| Vertex deploy | Canlı adımlar gelebilir ama **`answer` contract’ta yoktu** |

Functions prompt/parse/success **yalnızca `steps`** döndürüyordu. Mobile UI `answer` (veya title=`Cevap` step) bekliyor → DOĞRU CEVAP boş. Proxy eskiden `answer` yazıyordu; proxy kapalı olunca kırıldı.

## Düzeltmeler

1. Functions: `SolutionAnswer` contract + prompt zorunlu `answer` + parse + cache/persist  
2. Mobile: güçlü şık/sonuç çıkarımı (untitled last-step patterns, tip metinleri değil)  
3. Few-shot’larda Cevap + answer örneği  

## Owner — Functions redeploy ZORUNLU

```bash
cd ~/Desktop/cozbil
git fetch && git checkout cursor/solve-answer-pipeline-6767 && git pull
bash scripts/deploy-firestore-solve.sh
```

Metro reload sonrası: şıklı soruda DOĞRU CEVAP; şıksızda net Sonuç metni.

## QA Gate

- functions: parseSolution / solveQuestion / prompts / executeSolve PASS  
- mobile: solutionAnswer PASS · typecheck PASS  
- guardian: abartılı doğruluk iddiası yok; LGS+YGS+KPSS+Ehliyet  
