# Sprint report — 2026-07-30 — Secret scrub (PR #31)

## Özet

GitHub secret scanning: **Google API Key** exposed in PR **#31** description (not in committed source). Current body already placeholder-only, but PR **edit history** still retained the live Firebase Web API key. Contaminated PR closed; work reopened on a clean PR. Owner must **rotate/restrict** that key.

## Actions taken

1. Confirmed no `AIza…` values in git tree / branch commits.
2. Closed PR #31 (edit history still contains the old body; GitHub does not purge description history).
3. Opened a replacement PR with placeholder-only instructions.
4. Added `.github/PULL_REQUEST_TEMPLATE.md` security checklist.

## Owner must do (alert will stay open until this)

1. [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials) → Firebase / Browser API key used by ÇözBil web config.
2. **Rotate** (or restrict + recreate) the leaked key; update Cursor Cloud secrets + EAS production `EXPO_PUBLIC_FIREBASE_API_KEY`.
3. In GitHub → Security → Secret scanning alerts → mark the PR #31 alert as **Revoked**.

## Sprint Agent Raporu

**Koordinatör:** Auto (ÇözBil)  
**Kullanılan ekipler:** security, mobile  
**Kullanılan skill/agent setleri:** `cozbil-guardian` (scope: no exam drift); security scrub  
**Skill bypass:** Spec Kit (security incident hygiene)  
**QA Gate:** typecheck N/A (docs/.github only) / lint N/A / smoke: no `AIza` in tree + PR body  
**Sonraki önerilen adım:** Owner key rotation + dismiss alert; continue AdMob IPA on the new PR
