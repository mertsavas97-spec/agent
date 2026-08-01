# Cloud agent cannot produce iOS IPA

This Cursor Cloud Agent runs on **Linux** without Xcode.

- Local script `scripts/build-ios-ipa-local.sh` exits on non-Darwin.
- No `EXPO_TOKEN` / Firebase secrets in this pod env.
- `gh workflow run` for "iOS production IPA" → HTTP 403 (read-only token).

## Owner Mac (required)

Push-fix branch is ready: `cursor/inactive-push-weekly-2914` (PR #29, CI green).

```bash
cd /path/to/agent
git fetch origin && git checkout cursor/inactive-push-weekly-2914
export EXPO_PUBLIC_FIREBASE_API_KEY=...
export EXPO_PUBLIC_FIREBASE_APP_ID=...
bash scripts/mac-build-ipa-with-push.sh
# IPA → ~/Desktop/cozbil-production.ipa
```

Same path previously produced a working IPA after OpenIAP Xcode compat.
