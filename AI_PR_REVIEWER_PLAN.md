# Plan: AI PR Reviewer (GitHub Action)

## Ziel
Eine selbst-hostbare GitHub Action, die Pull Requests automatisch mit Claude reviewt und inline-Kommentare an den relevanten Zeilen postet. User bringt eigenen Anthropic-API-Key mit.

## Tech-Stack
- **Sprache**: TypeScript (Node 20+)
- **Runtime**: GitHub Actions (Docker oder Node Action)
- **SDKs**: `@anthropic-ai/sdk`, `@octokit/rest`
- **Build**: `tsup` oder `ncc` (bündelt zu einer Datei für die Action)
- **Tests**: `vitest`
- **Lint/Format**: `biome` (schnell, ein Tool statt ESLint+Prettier)

## Repo-Struktur
```
ai-pr-reviewer/
├── .github/workflows/
│   ├── ci.yml              # Lint + Test bei Push
│   └── self-review.yml     # Dogfooding: Action reviewt eigene PRs
├── src/
│   ├── index.ts            # Entry-Point (liest ENV, orchestriert)
│   ├── github.ts           # PR-Files holen, Kommentare posten
│   ├── reviewer.ts         # Claude-API-Call + Prompt
│   ├── prompt.ts           # System-Prompt (gecacht)
│   ├── parser.ts           # LLM-JSON-Output validieren (zod)
│   └── config.ts           # .ai-reviewer.yml einlesen
├── tests/
│   ├── parser.test.ts
│   └── github.test.ts      # mit nock
├── action.yml              # Action-Metadaten
├── dist/index.js           # gebündelter Output (committed!)
├── README.md
├── LICENSE                 # MIT
├── package.json
├── tsconfig.json
└── biome.json
```

## Implementierungs-Schritte

### Schritt 1: Projekt-Setup
- `npm init`, TypeScript + Dependencies installieren
- `tsconfig.json` strict-mode
- `biome.json` konfigurieren
- `.gitignore` (node_modules, aber **nicht** dist/)
- MIT-Lizenz

### Schritt 2: Config-Loader (`src/config.ts`)
Liest optional `.ai-reviewer.yml` aus dem Repo:
```yaml
model: claude-sonnet-4-6
max_files: 20
exclude:
  - "**/*.lock"
  - "dist/**"
severity_threshold: medium  # low | medium | high
custom_instructions: |
  Wir nutzen Vitest, keine Jest-Patterns vorschlagen.
```
Defaults wenn Datei fehlt. Validierung mit `zod`.

### Schritt 3: GitHub-Client (`src/github.ts`)
- `getPRFiles(owner, repo, prNumber)` → Array von `{filename, patch, status}`
- Filter: `status !== "removed"`, Excludes aus Config anwenden
- `postReviewComments(comments[])` → ein einziges Review mit allen Comments via `POST /pulls/{n}/reviews`
- **Wichtig**: Zeilennummern aus Patch-Hunks parsen (`@@ -10,7 +10,8 @@`), damit Kommentare an die richtige Zeile gepinnt werden

### Schritt 4: Prompt (`src/prompt.ts`)
System-Prompt mit `cache_control: ephemeral`:
- Rolle: "Senior Code Reviewer"
- Fokus: Bugs, Security, Performance, unklare Logik
- **Nicht**: Style/Formatierung (macht der Linter)
- Output-Format: striktes JSON-Schema
- Custom-Instructions aus Config anhängen

User-Message = Diff selbst (nicht cachen, ändert sich).

### Schritt 5: Reviewer (`src/reviewer.ts`)
- Diff pro Datei an Claude schicken (parallel mit `Promise.all`, Limit 5)
- Bei >20 Dateien: warnen und abbrechen (Config-Limit)
- Response parsen (`parser.ts` mit zod-Schema)
- Nach Severity filtern

### Schritt 6: Entry-Point (`src/index.ts`)
```
1. ENV lesen (GITHUB_TOKEN, ANTHROPIC_API_KEY, GITHUB_EVENT_PATH)
2. Event-JSON lesen → PR-Nummer extrahieren
3. Config laden
4. PR-Files holen
5. Pro Datei: Claude reviewen
6. Alle Kommentare sammeln
7. Ein GitHub-Review posten (event: "COMMENT")
8. Summary auf stdout (für Action-Log)
```

### Schritt 7: `action.yml`
```yaml
name: 'AI PR Reviewer'
description: 'Self-hosted AI review with your own Anthropic key'
inputs:
  anthropic-api-key:
    required: true
  github-token:
    default: ${{ github.token }}
runs:
  using: 'node20'
  main: 'dist/index.js'
```

### Schritt 8: Build-Pipeline
- `npm run build` → `ncc build src/index.ts -o dist`
- CI prüft: `dist/` ist aktuell (sonst Fehler)

### Schritt 9: Tests
- `parser.test.ts`: LLM-Output-Varianten (valid, malformed, leer)
- `github.test.ts`: Patch-Zeilen-Parsing (Edge-Cases: mehrere Hunks, gelöschte Zeilen)
- Kein E2E nötig für MVP

### Schritt 10: README
- Quickstart (3 Zeilen YAML zum Einbinden)
- Screenshot eines Review-Kommentars
- Config-Referenz
- Kosten-Hinweis (ca. $0.01–0.05 pro PR)
- Vergleich zu CodeRabbit/Copilot (self-hosted, eigener Key, MIT)

### Schritt 11: Dogfooding
`self-review.yml` aktivieren, damit das Repo selbst die Action nutzt. Bester Bug-Finder.

## Wichtige Details für Claude Code
- **Keine Kommentare im Code** außer bei nicht-offensichtlichem Warum
- **Strict TypeScript**, keine `any`
- **Fehler früh werfen**, keine Silent-Fallbacks
- **Prompt Caching nutzen** (System-Prompt mit `cache_control`)
- **Modell**: `claude-sonnet-4-6` als Default (gutes Preis/Leistung)
- **Keine externen Services** außer GitHub + Anthropic
- `dist/` muss committed werden (GitHub-Action-Konvention für Node-Actions)

## Definition of Done (MVP)
- [ ] Action läuft in einem Test-Repo und postet Kommentare an korrekte Zeilen
- [ ] `.ai-reviewer.yml` wird respektiert
- [ ] README mit Quickstart
- [ ] CI grün (Lint, Tests, Build-Check)
- [ ] Self-Review aktiv
- [ ] MIT-Lizenz, v0.1.0 getaggt

## Nicht im MVP (späteres Backlog)
- Incremental Reviews (nur neue Commits seit letztem Review)
- Multi-Provider (OpenAI, Gemini, lokale Modelle via Ollama)
- Custom Rules pro Dateityp
- Severity-Badges im PR-Body
- Marketplace-Listing

---

**Verwendung**: Diese Datei ins neue Repo legen und Claude Code anweisen:
> *"Lies PLAN.md und setze Schritt 1–3 um, dann stoppe für Review."*
