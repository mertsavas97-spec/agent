# Sprint report — 2026-07-22 · Demo free override + dogfood wake

## Özet

Ayarlar’a **demo-only** “Ücretsiz plana geç / Premium’a dön” eklendi (Premium kaydı silinmez). Metro + solve-proxy localhost.run tünelleri uyandırıldı; deep link `:443` ile yazıldı.

## Sprint Agent Raporu

**Koordinatör:** Auto  
**Kullanılan ekipler:** mobile, qa, guardian  
**Kullanılan skill/agent setleri:**
- `cozbil-team-skills`
- `cozbil-expo-mobile`
- `cozbil-guardian` (demo copy abartısız)

**Çalıştırılan lane'ler:**
- `demoForceFree` entitlement override
- Settings DEMO kartı
- Metro/proxy LHR wake (CF DNS flaky)

**Skill bypass:** Context7

**QA Gate:**
- typecheck: PASS
- lint: N/A
- smoke: PASS (proxy `/solve`, Jest demoForceFree)
- errors: temiz
- guardian: PASS (yalnız `__DEV__` / sandbox)

**Sonraki önerilen adım:** Telefonda deep link ile bağlan → Ayarlar → Ücretsiz plana geç (demo) → çoklu çöz / çözüm çıkışı reklam kapılarını dene.
