# Sprint report — 2026-08-02 (solve Firestore PERMISSION_DENIED)

## Root cause

TestFlight upload succeeds → `onSolveUploadFinalized` fires → fails on
`claimSolveRequest` / Firestore Admin with:

`Error: 7 PERMISSION_DENIED: Missing or insufficient permissions`

Gen2 runtime SA (`…-compute@developer.gserviceaccount.com`) lacked
`roles/datastore.user` (and Storage). Not an app/IPA bug; not callable 403.

## Fix

`scripts/fix-solve-runtime-iam.sh` — grant datastore/storage/aiplatform +
Eventarc Run invoker. Also harden `gcp-startup-live-setup.sh`.

## Owner

```bash
cd ~/agent && git pull
bash scripts/fix-solve-runtime-iam.sh
# TestFlight fotoğraf — yeni build yok
firebase functions:log --project cozbil-dev-f9583 --only onSolveUploadFinalized -n 20
```

## Sprint Agent Raporu

**Koordinatör:** Auto  
**Kullanılan ekipler:** backend, mobile, qa  
**Skill:** `cozbil-team-skills`, `cozbil-expo-mobile`, `cozbil-guardian`  
**Skill bypass:** Context7  
**QA Gate:** script syntax / docs (no mobile typecheck delta)  
**Sonraki:** Owner IAM script → TestFlight smoke
