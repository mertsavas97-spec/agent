# Neden telefonda soru çözülmüyor?

## Kısa cevap

Telefon / native build **bozuk değil**. Klasik `solveQuestion` **callable** GCP **Domain Restricted Sharing** yüzünden 403.

Kanıt: `allUsers is not in permitted organization`.

## Çözüm (kod)

Storage trigger (birincil): `onSolveUploadFinalized`  
Firestore yedek: `onSolveRequestCreatedV2`  
Detay: [`ORG_POLICY_SOLVE_BYPASS.md`](./ORG_POLICY_SOLVE_BYPASS.md)

```bash
bash scripts/deploy-firestore-solve.sh
bash scripts/phone-dev-build.sh metro
```

## Eski callable yolu

Org Policy Admin istisnası olmadan `fix-functions-invoker.sh` **çalışmaz** (senin log’da doğrulandı).
