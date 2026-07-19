# Org policy: Domain Restricted Sharing → callable 403

## Ne kanıtlandı?

```
User allUsers is not in permitted organization.
orgpolicy:…/solveQuestion?configvalue=allUsers
```

Bu **Domain Restricted Sharing** (`iam.allowedPolicyMemberDomains`).  
`allUsers` / `allAuthenticatedUsers` Invoker **yasak** → klasik Firebase callable telefon uygulamasından açılamaz.

## İki yol

### A) Org Policy Admin istisnası (kalıcı “callable”)

Organization Policy Admin gerekir (proje Owner yetmez).

1. Cloud Console → IAM → Organization policies  
2. **Domain restricted sharing** (`iam.allowedPolicyMemberDomains`)  
3. Bu proje için exception: `allUsers` izin ver **veya** policy’yi projede kapat  
4. Sonra: `bash scripts/fix-functions-invoker.sh`

### B) Kod yolu (önerilen dogfood) — Storage + Firestore triggers

Public HTTP invoker **gerekmez**. Akış:

1. Mobil Storage’a görsel yükler (`users/{uid}/uploads/{id}.jpg`, metadata `cozbilSolve=1`)  
2. **`onSolveUploadFinalized`** (Gen2 Storage) çözümü üretir → `users/{uid}/solveRequests/{id}`  
3. Yedek: mobil `solveRequests/{id}` pending yazar → **`onSolveRequestCreatedV2`**  
4. Mobil `onSnapshot` ile `status: done` + `response` alır  

Deploy (Mac, `hello@summify.app`):

```bash
cd ~/Desktop/cozbil
git pull origin cursor/cozbil-polish-capture-loading-9131
bash scripts/deploy-firestore-solve.sh
```

Sadece Functions:

```bash
./.tools/node_modules/.bin/firebase deploy --project cozbil-dev-f9583 \
  --only functions:onSolveUploadFinalized,functions:onSolveRequestCreatedV2
```

Sonra telefonda:

```bash
bash scripts/phone-dev-build.sh metro
```

## Doğrulama

Firebase Console → Functions → `onSolveUploadFinalized` **Active**.  
Telefon: fotoğraf çek → bir kaç saniyede stub çözüm (Vertex kapalıysa).  
Hâlâ `SOLVE_TIMEOUT` → Functions log: Eventarc / Storage trigger.

## Not

History / explainAgain hâlâ callable ise 403 olabilir; ana solve B ile çalışır.  
Canlı AI için Functions env: `COZBIL_USE_VERTEX=1` + Vision key.

## SOLVE_TIMEOUT ise

1. `git pull` + `bash scripts/deploy-firestore-solve.sh`  
2. Metro yeniden: `bash scripts/phone-dev-build.sh metro`  
3. Console’da `onSolveUploadFinalized` logunda `executeSolvePipeline aiBackend demo|vertex`  
4. Firestore `users/{uid}/solveRequests/{id}` — `pending` takılıysa trigger çalışmıyor; `error` ise mesaja bak.
