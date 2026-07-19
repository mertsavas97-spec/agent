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

### B) Kod yolu (önerilen dogfood) — Firestore trigger

Public HTTP invoker **gerekmez**. Akış:

1. Mobil Storage’a görsel yükler  
2. `users/{uid}/solveRequests/{id}` dokümanı oluşturur (`status: pending`)  
3. `onSolveRequestCreated` (Admin SDK, Firestore trigger) çözümü üretir  
4. Aynı dokümana `status: done` + `response` yazar  
5. Mobil `onSnapshot` ile sonucu alır  

Deploy (Mac, `hello@summify.app`):

```bash
cd ~/Desktop/cozbil
git pull origin cursor/cozbil-polish-capture-loading-9131
bash scripts/deploy-firestore-solve.sh
```

Sonra telefonda:

```bash
bash scripts/phone-dev-build.sh metro
```

## Not

History / explainAgain hâlâ callable ise 403 olabilir; ana solve B ile çalışır.  
Vertex/Vision env Functions’ta tanımlı olmalı (`COZBIL_USE_VERTEX=1`, Vision key).
