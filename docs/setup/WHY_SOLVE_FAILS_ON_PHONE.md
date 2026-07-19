# Neden telefonda soru çözülmüyor?

## Kısa cevap

Telefon / native build **bozuk değil**. Algoritma telefonda değil; **Firebase Cloud Functions** (`solveQuestion`) üzerinde.

Şu an canlı endpoint **403 Forbidden** dönüyor:

```text
GET https://europe-west1-cozbil-dev-f9583.cloudfunctions.net/ping
→ 403 Your client does not have permission
```

Mobil `httpsCallable(..., 'solveQuestion')` aynı IAM duvarına çarpıyor → UI “çözüm üretilemedi”.

## Neden 403?

GCP **org policy** çoğu projede `allUsers` / public Cloud Functions Invoker’ı yasaklıyor.  
Firebase **callable**’lar HTTP’de önce IAM’den geçer; Auth token fonksiyon *içinde* doğrulanır. Invoker kapalıysa AI hiç çalışmaz.

Bu, UI/polish veya `expo-dev-client` ile ilgili değil.

## Proje sahibi ne yapmalı?

1. [Firebase Console](https://console.firebase.google.com/project/cozbil-dev-f9583/functions) → Functions  
2. Veya GCP → Cloud Functions → her callable için Invoker:
   - Geçici dogfood: `allUsers` + `roles/cloudfunctions.invoker`  
   - Org engelliyorsa: org admin’den **policy exception** (`iam.allowedPolicyMemberDomains` / public invoker kısıtı)
3. Functions’ı güncel kodla deploy et (`COZBIL_USE_VERTEX=1`, Vision key, vs.)

```bash
# Sahip makinesinde (interactive login):
gcloud auth login
firebase deploy --only functions --project cozbil-dev-f9583
# Ardından her function için invoker (org izin veriyorsa):
gcloud functions add-iam-policy-binding solveQuestion \
  --region=europe-west1 --project=cozbil-dev-f9583 \
  --member=allUsers --role=roles/cloudfunctions.invoker
```

`ping` tarayıcıda JSON `{ ok: true, ... }` dönene kadar solve çalışmaz.

## Telefonda doğrulama

1. Metro logunda `solve flow failed` + `functions/permission-denied`  
2. Hata ekranı artık IAM metnini gösterir (`solveFailureMessage`)  
3. `.env` native build anında dolu olmalı (`EXPO_PUBLIC_FIREBASE_*`) — boşsa Firebase demo config’e düşer

## Bu agent’ın limiti

Cloud agent `gcloud` token’ı yenileyemiyor / org policy değiştiremiyor. IAM istisnası **Firebase/GCP proje sahibi** hesabından yapılır.
