# Sprint report — 2026-07-27 — MPT Vertex auto-setup

## Sprint Agent Raporu

**Koordinatör:** Auto (Cloud)
**Kullanılan ekipler:** Executor (MPT patch/scripts), Architect (Vertex vs AI Studio billing)
**Kullanılan skill/agent setleri:** cozbil-team-skills (map), cozbil-guardian (scope: MPT is outside ÇözBil product; docs only in repo)
**Skill bypass:** Superpowers TDD N/A (ops tooling outside app); Context7 N/A for google-genai Client signature verified via local install inspect
**QA Gate:** typecheck N/A (Python ops outside workspace package) / lint N/A / smoke: `gemini_client` import OK; Vertex live smoke blocked on ADC / guardian: no exam-scope drift; MPT isolated from `/workspace`
**Sonraki önerilen adım:** Owner completes one `remote-bootstrap` auth; agent runs `auto_setup_vertex.sh` + script smoke; then add Pexels key for full renders
