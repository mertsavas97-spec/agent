# Firestore “Missing or insufficient permissions” (solveRequests)

## Ne anlama geliyor?

Mobil `users/{uid}/solveRequests` yazamıyor. Bu **neredeyse her zaman** canlıdaki rules’ın
henüz `solveRequests` satırını içermemesi demek (CLI deploy yarım kaldı).

Callable 403 ayrı konu; önce rules publish şart.

## En hızlı fix — Console’dan Publish (önerilen)

1. Aç: https://console.firebase.google.com/project/cozbil-dev-f9583/firestore/rules  
2. Editördeki metni **sil**  
3. Repo’daki `firebase/firestore.rules` dosyasının **tamamını** yapıştır  
4. **Publish**  
5. “Rules published successfully” bekle  

Kritik blok (içinde olmalı):

```
match /solveRequests/{requestId} {
  allow read: if isOwner(uid);
  allow create: if isOwner(uid)
    && request.resource.data.keys().hasAll(['imagePath', 'status'])
    && request.resource.data.status == 'pending'
    && request.resource.data.imagePath is string;
  allow update, delete: if false;
}
```

## CLI alternatifi

```bash
cd ~/Desktop/cozbil
git pull origin cursor/cozbil-polish-capture-loading-9131
sudo chown -R "$(whoami)" ~/.npm   # gerekirse

bash scripts/publish-firestore-rules.sh

# Trigger fonksiyonu (bir kez):
npx firebase-tools@latest deploy --project cozbil-dev-f9583 --only functions:onSolveRequestCreated
```

Deploy log’unda `✔ Deploy complete` / `firestore: released rules` görmeden Metro’da deneme.

## Sonra telefon

```bash
bash scripts/phone-dev-build.sh metro
```

Uygulamayı kill + aç → tekrar fotoğraf.

## Hâlâ permission-denied ise

Firebase Console → Authentication → Users: anonymous uid var mı?  
Firestore → Data → `users/{uid}` dokümanı oluşuyor mu?
