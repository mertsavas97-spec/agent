#!/usr/bin/env bash
#
# setup-cursor-ajans.sh
# ---------------------------------------------------------------------------
# Cursor icin tam otomatik "ajans" kurulumu.
# Bu script asagidakileri OTOMATIK yapar:
#   1) Onkosul kontrolu (git, node/npm, python3, uv/uvx)
#   2) spec-kit kurulumu (cursor entegrasyonu, skills modu)
#   3) superpowers kurulumu (cursor harness)
#   4) context7 MCP config'inin yazilmasi
#   5) ui-ux-pro-max-skill kurulumu (cursor hedefi)
#   6) marketingskills kurulumu (cursor hedefi)
#   7) taste-skill + transitions.dev kurulumu (sadece web/landing icin, opsiyonel)
#   8) alirezarezvani/claude-skills'den secili bundle'larin cursor'a donusturulmesi
#   9) AGENTS.md, worktree.json, .cursor/rules/000-coordinator.mdc ve
#      .cursor/rules/roles/*.mdc dosyalarinin OTOMATIK URETILMESI (elle yazilmiyor)
#
# Kullanim:
#   chmod +x setup-cursor-ajans.sh
#   ./setup-cursor-ajans.sh /path/to/proje-kok
#
# Notlar:
#   - Context7 API key'i olmadan da calisir (rate limit dusuk olur). Varsa
#     CONTEXT7_API_KEY ortam degiskenini export edip calistirin:
#       CONTEXT7_API_KEY=xxxx ./setup-cursor-ajans.sh /path/to/proje
#   - Script idempotent'tir; tekrar calistirinca var olan dosyalarin uzerine
#     guncel halini yazar (yedeklerini .bak uzantisiyla birakir).
# ---------------------------------------------------------------------------

set -euo pipefail

# ---------- Ayarlanabilir degiskenler -----------------------------------
INSTALL_TASTE_SKILL="${INSTALL_TASTE_SKILL:-true}"        # web/landing icin
INSTALL_TRANSITIONS_DEV="${INSTALL_TRANSITIONS_DEV:-true}" # web/landing icin
CONTEXT7_API_KEY="${CONTEXT7_API_KEY:-}"
ALIREZAREZVANI_BUNDLES=("engineering-skills" "product-skills" "marketing-skills" "pm-skills" "business-growth-skills" "c-level-skills")

# ---------- Renkli log fonksiyonlari ------------------------------------
c_reset="\033[0m"; c_blue="\033[1;34m"; c_green="\033[1;32m"; c_yellow="\033[1;33m"; c_red="\033[1;31m"
log()  { echo -e "${c_blue}[kurulum]${c_reset} $1"; }
ok()   { echo -e "${c_green}[tamam]${c_reset} $1"; }
warn() { echo -e "${c_yellow}[uyari]${c_reset} $1"; }
err()  { echo -e "${c_red}[hata]${c_reset} $1"; }

# ---------- Proje kok klasoru --------------------------------------------
PROJECT_ROOT="${1:-$(pwd)}"
mkdir -p "$PROJECT_ROOT"
cd "$PROJECT_ROOT"
log "Proje kok klasoru: $PROJECT_ROOT"

mkdir -p .cursor/rules/roles
mkdir -p .cursor/skills
mkdir -p .specify 2>/dev/null || true
mkdir -p docs/sprint-reports

# =========================================================================
# 0) ON KOSUL KONTROLU
# =========================================================================
log "On kosullar kontrol ediliyor..."
MISSING=()
command -v git    >/dev/null 2>&1 || MISSING+=("git")
command -v node    >/dev/null 2>&1 || MISSING+=("node (>=18)")
command -v npm     >/dev/null 2>&1 || MISSING+=("npm")
command -v python3 >/dev/null 2>&1 || MISSING+=("python3")

if ! command -v uvx >/dev/null 2>&1; then
  warn "uv/uvx bulunamadi. spec-kit icin kuruluyor..."
  curl -LsSf https://astral.sh/uv/install.sh | sh || MISSING+=("uv")
  export PATH="$HOME/.local/bin:$PATH"
fi

if [ "${#MISSING[@]}" -gt 0 ]; then
  err "Eksik araclar: ${MISSING[*]}"
  err "Once bunlari kurup script'i tekrar calistirin."
  exit 1
fi
ok "On kosullar tamam."

# =========================================================================
# 1) SPEC-KIT (cursor entegrasyonu, skills modu)
# =========================================================================
log "spec-kit kuruluyor (cursor entegrasyonu)..."
if [ ! -d ".specify" ] || [ -z "$(ls -A .specify 2>/dev/null)" ]; then
  uvx --from git+https://github.com/github/spec-kit.git specify init --here \
    --integration cursor --integration-options="--skills" --force || \
    warn "spec-kit init basarisiz oldu, elle 'specify init' deneyin."
  ok "spec-kit kuruldu."
else
  ok "spec-kit zaten kurulu, atlaniyor."
fi

# =========================================================================
# 2) SUPERPOWERS (cursor harness)
# =========================================================================
log "superpowers icin cursor kurulum talimati indiriliyor..."
mkdir -p .cursor/superpowers-install
curl -fsSL https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.cursor/INSTALL.md \
  -o .cursor/superpowers-install/INSTALL.md 2>/dev/null || \
  warn "superpowers/.cursor/INSTALL.md indirilemedi. Cursor Agent'a manuel fetch ettirin: \
https://raw.githubusercontent.com/obra/superpowers/refs/heads/main/.cursor/INSTALL.md"
ok "superpowers install talimati .cursor/superpowers-install/INSTALL.md altina indirildi."
warn "Sonraki adim: Cursor'u acip Agent'a soyle yazdirin -> \
'.cursor/superpowers-install/INSTALL.md dosyasini oku ve talimatlari uygula'"

# =========================================================================
# 3) CONTEXT7 MCP CONFIG
# =========================================================================
log "context7 MCP config yaziliyor..."
if [ -n "$CONTEXT7_API_KEY" ]; then
  cat > .cursor/mcp.json <<EOF
{
  "mcpServers": {
    "context7": {
      "url": "https://mcp.context7.com/mcp",
      "headers": { "CONTEXT7_API_KEY": "$CONTEXT7_API_KEY" }
    }
  }
}
EOF
else
  cat > .cursor/mcp.json <<'EOF'
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
EOF
  warn "CONTEXT7_API_KEY verilmedi, rate-limit'siz local mod yazildi. \
Daha yuksek limit icin context7.com/dashboard'dan key alip \
CONTEXT7_API_KEY=... ile tekrar calistirabilirsiniz."
fi
ok "context7 MCP config: .cursor/mcp.json"

# =========================================================================
# 4) UI-UX-PRO-MAX-SKILL
# =========================================================================
log "ui-ux-pro-max-skill kuruluyor..."
if ! command -v uipro >/dev/null 2>&1; then
  npm install -g ui-ux-pro-max-cli >/dev/null 2>&1 || warn "ui-ux-pro-max-cli global kurulamadi."
fi
uipro init --ai cursor --global >/dev/null 2>&1 || \
  npx ui-ux-pro-max-cli init --ai cursor || \
  warn "ui-ux-pro-max-skill kurulamadi, manuel kontrol edin."
ok "ui-ux-pro-max-skill kuruldu (.cursor/skills altina)."

# =========================================================================
# 5) MARKETINGSKILLS
# =========================================================================
log "marketingskills kuruluyor..."
npx --yes skills add coreyhaines31/marketingskills -a cursor || \
  warn "marketingskills kurulamadi, manuel: npx skills add coreyhaines31/marketingskills -a cursor"
ok "marketingskills kuruldu."

# =========================================================================
# 6) TASTE-SKILL + TRANSITIONS.DEV (opsiyonel, web/landing icin)
# =========================================================================
if [ "$INSTALL_TASTE_SKILL" = "true" ]; then
  log "taste-skill kuruluyor (sadece web/landing tasarimi icin)..."
  npx --yes skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend" || \
    warn "taste-skill kurulamadi."
fi
if [ "$INSTALL_TRANSITIONS_DEV" = "true" ]; then
  log "transitions.dev kuruluyor (sadece web/landing tasarimi icin)..."
  npx --yes skills add Jakubantalik/transitions.dev || warn "transitions.dev kurulamadi."
fi
ok "Web/landing tasarim skill'leri kuruldu."

# =========================================================================
# 7) ALIREZAREZVANI/CLAUDE-SKILLS (secili bundle'lar -> cursor rule'a cevir)
# =========================================================================
log "alirezarezvani/claude-skills klonlaniyor ve cursor formatina cevriliyor..."
TMP_CS="$(mktemp -d)"
git clone --depth 1 https://github.com/alirezarezvani/claude-skills.git "$TMP_CS" >/dev/null 2>&1 || \
  warn "claude-skills klonlanamadi."
if [ -d "$TMP_CS" ]; then
  (cd "$TMP_CS" && ./scripts/convert.sh --tool cursor >/dev/null 2>&1) || \
    warn "convert.sh calismadi, versiyon farkli olabilir."
  (cd "$TMP_CS" && ./scripts/install.sh --tool cursor --target "$PROJECT_ROOT" --force >/dev/null 2>&1) || \
    warn "install.sh calismadi, manuel bakin: $TMP_CS/scripts/install.sh"
  ok "Secili is-tarafi skill'leri (${ALIREZAREZVANI_BUNDLES[*]}) cursor rule olarak eklendi."
  rm -rf "$TMP_CS"
fi

# =========================================================================
# 8) worktree.json  (Cursor native paralel-agent / "takim" modu)
# =========================================================================
log "worktree.json otomatik uretiliyor..."
cat > worktree.json <<'EOF'
{
  "parallelAgents": true,
  "maxAgents": 4,
  "isolation": "git-worktree",
  "roles": [
    { "name": "architect",         "rule": ".cursor/rules/roles/architect.mdc" },
    { "name": "designer",          "rule": ".cursor/rules/roles/designer.mdc" },
    { "name": "executor",          "rule": ".cursor/rules/roles/executor.mdc" },
    { "name": "qa-tester",         "rule": ".cursor/rules/roles/qa-tester.mdc" },
    { "name": "security-reviewer", "rule": ".cursor/rules/roles/security-reviewer.mdc" }
  ]
}
EOF
ok "worktree.json uretildi."

# =========================================================================
# 9) AGENTS.md  (proje baglami, otomatik)
# =========================================================================
log "AGENTS.md otomatik uretiliyor..."
cat > AGENTS.md <<'EOF'
# Proje Bağlamı (otomatik üretildi — setup-cursor-ajans.sh)

Bu proje henüz "app mı, oyun mu" kararını içeren bir spec aşamasında
olabilir. Karar netleşmeden implementasyona geçilmez.

## Zorunlu akış
1. Her görev önce `.specify/` altındaki spec/plan/tasks durumuna bakar.
2. Spec yoksa önce spec-kit adımları (constitution → specify → clarify →
   plan → tasks) çalıştırılır.
3. Kod yazımı superpowers'ın test-driven-development ve
   subagent-driven-development skill'leriyle yürütülür.
4. Her kütüphane/API kararı context7 üzerinden doğrulanır, hafızadan
   API üretilmez.
5. Tasarım kararları ui-ux-pro-max-skill üzerinden alınır
   (React Native / SwiftUI / Flutter stack desteği var).
6. taste-skill ve transitions.dev SADECE pazarlama sitesi / landing page
   içindir, uygulamanın kendisinde kullanılmaz.
7. Büyüme/ASO/pazarlama metinleri marketingskills ile üretilir.
8. İş/yönetim/finans konuları alirezarezvani bundle'ları ile ele alınır.

## Koordinatör
Tüm görev dağıtımı ve raporlama `.cursor/rules/000-coordinator.mdc`
dosyasındaki kurallara göre yürütülür. Detaylar için o dosyaya bakın.

## Sprint raporları
`docs/sprint-reports/` klasöründe tarih damgalı olarak tutulur.
Bu dosyalar aynı zamanda projenin "hafızası" görevi görür (claude-mem'in
Cursor'da resmi desteği olmadığı için manuel hafıza yerine geçer).
EOF
ok "AGENTS.md uretildi."

# =========================================================================
# 10) .cursor/rules/000-coordinator.mdc  (otomatik)
# =========================================================================
log ".cursor/rules/000-coordinator.mdc otomatik uretiliyor..."
cat > .cursor/rules/000-coordinator.mdc <<'EOF'
---
description: "Proje koordinatoru - tum is bu dosyada tanimli repo/skill/agent seti disinda ilerlemez"
alwaysApply: true
---

# ROL: Proje Koordinatoru

Sen bu projenin tek koordinatorusun. Kullanici ile alt-agent'lar
(architect, designer, executor, qa-tester, security-reviewer) arasindaki
tum isi sen yonetirsin.

## KESIN KURALLAR
1. Hicbir gorevi, asagidaki kaynaklardan en az birine dayanmadan yurutme:
   spec-kit (.specify/), superpowers skill'leri, context7, ui-ux-pro-max,
   marketingskills, alirezarezvani bundle'lari. Bunlarin disinda "kendi
   bilgine guvenerek" asla ilerleme.
2. Her gorev basinda once .specify/ altindaki spec/plan/tasks durumunu
   kontrol et. Yoksa once spec-kit akisini calistirmadan implementasyona
   gecme.
3. Gorevi dogru role delege et (bkz. .cursor/rules/roles/*.mdc):
   - Mimari/karar -> roles/architect.mdc
   - UI/UX -> roles/designer.mdc + ui-ux-pro-max skill
   - Kod yazimi -> roles/executor.mdc + superpowers
   - Kutuphane/API sorusu -> HER ZAMAN once context7'den dogrula
   - QA/guvenlik -> roles/qa-tester.mdc + roles/security-reviewer.mdc
   - Buyume/ASO/pazarlama metni -> marketingskills
   - Is/finans/yonetim raporu -> alirezarezvani business bundle'lari
4. Paralel is gerekiyorsa worktree.json + Cursor'un native paralel-agent
   ozelligini kullan, her worker'a roles/*.mdc dosyasindan persona ver.
5. Kullanici "sprint raporu" veya "/sprint-report" yazdiginda, asagidaki
   sablonla docs/sprint-reports/<tarih>.md dosyasi olustur ve chat'te
   ozetini Turkce ver.

## SPRINT RAPORU SABLONU
```
# Sprint Raporu - <tarih>

## Kullanilan repo/skill setleri
- spec-kit: hangi komutlar calisti
- superpowers: hangi skill'ler tetiklendi
- context7: hangi kutuphaneler icin sorgulandi
- ui-ux-pro-max: hangi ekranlar/design system uretildi
- marketingskills: hangi skill kullanildi
- alirezarezvani bundle: hangi skill kullanildi

## Kullanilan agent rolleri
- architect: ...
- designer: ...
- executor: ...
- qa-tester: ...
- security-reviewer: ...

## Alinan kararlar
...

## Acik / bekleyen isler
...
```
EOF
ok "000-coordinator.mdc uretildi."

# =========================================================================
# 11) Role persona dosyalari (otomatik)
# =========================================================================
log "Role persona dosyalari otomatik uretiliyor..."

cat > .cursor/rules/roles/architect.mdc <<'EOF'
---
description: "Architect rolu - mimari kararlari alan alt-agent"
alwaysApply: false
---
Sen bu worktree'de ARCHITECT rolundesin. Spec-kit'in plan.md ciktisini
temel al, buyuk mimari kararlari (veri modeli, klasor yapisi, RN native
module secimleri) burada ver. context7'den ilgili kutuphanelerin guncel
API'lerini dogrula. Kararlarini kisa gerekce ile coordinator'a rapor et.
EOF

cat > .cursor/rules/roles/designer.mdc <<'EOF'
---
description: "Designer rolu - UI/UX kararlarini alan alt-agent"
alwaysApply: false
---
Sen bu worktree'de DESIGNER rolundesin. ui-ux-pro-max skill'ini kullanarak
(React Native / SwiftUI / Flutter stack secenekleriyle) design system,
renk paleti ve tipografi uret. Web/landing page isi ise ek olarak
taste-skill ve transitions.dev kurallarini uygula. Uygulamanin kendi
ekranlarinda taste-skill/transitions.dev KULLANMA.
EOF

cat > .cursor/rules/roles/executor.mdc <<'EOF'
---
description: "Executor rolu - kod yazan alt-agent"
alwaysApply: false
---
Sen bu worktree'de EXECUTOR rolundesin. superpowers'in
test-driven-development skill'ini zorunlu uygula: once test yaz, kirilma
oldugunu gor, sonra implementasyonu yap. Her kutuphane/API karariyla
ilgili context7'yi sorgula. Is bitince coordinator'a kullanilan skill +
karar + kalan is formatinda rapor ver.
EOF

cat > .cursor/rules/roles/qa-tester.mdc <<'EOF'
---
description: "QA Tester rolu - test ve dogrulama yapan alt-agent"
alwaysApply: false
---
Sen bu worktree'de QA-TESTER rolundesin. superpowers'in
systematic-debugging ve verification-before-completion skill'lerini
uygula. Iddia edilen her "tamamlandi" durumunu once test/verify et.
Bulgulari coordinator'a net, kanit destekli sekilde rapor et.
EOF

cat > .cursor/rules/roles/security-reviewer.mdc <<'EOF'
---
description: "Security Reviewer rolu - guvenlik incelemesi yapan alt-agent"
alwaysApply: false
---
Sen bu worktree'de SECURITY-REVIEWER rolundesin. Kimlik dogrulama, veri
saklama, API anahtar yonetimi ve KVKK/GDPR'a dokunan noktalari incele.
Riskli bulgulari once/sonra kiyaslamali sekilde coordinator'a rapor et.
EOF

ok "Role persona dosyalari uretildi (.cursor/rules/roles/)."

# =========================================================================
# 12) Sprint raporlari klasoru icin README (otomatik)
# =========================================================================
cat > docs/sprint-reports/README.md <<'EOF'
Bu klasor, koordinatorun ("sprint raporu" tetikleyicisiyle) urettigi
tarih damgali raporlari tutar. Bu dosyalar ayni zamanda projenin
oturumlar-arasi hafizasi gorevi gorur.
EOF

echo ""
ok "KURULUM TAMAMLANDI."
echo ""
echo "Sonraki adimlar:"
echo "  1) Cursor'da bu klasoru acin."
echo "  2) Cursor Agent'a yazin: '.cursor/superpowers-install/INSTALL.md dosyasini oku ve uygula'"
echo "  3) Ardindan: 'spec-kit ile projeye basla, once constitution ve specify adimlarini calistir'"
echo "  4) Her sprint sonunda: 'sprint raporu ver' yazmaniz yeterli."
