# AGENTS.md — Tauri App Build Notes

This file captures practical, hard-won lessons for building and shipping this
Tauri v2 desktop app (Rust + React + TypeScript + Vite). It is meant for
future agents/developers working on this repo.

Project: **PromptCraft Studio** — a local-first prompt-management workspace that
talks to a local **Ollama** instance (no cloud API keys). Identifier:
`com.promptcraft.studio`.

---

## 1. Critical gotcha: `custom-protocol` feature (causes "localhost refused")

**Symptom:** The app window (which looks like a Chromium/Edge tab) shows
`localhost refused to connect` / `ERR_CONNECTION_REFUSED`.

**Root cause:** Tauri v2 decides between "embed the frontend" vs "load from dev
server" using the `custom-protocol` feature. In `tauri`'s build script:

```rust
let custom_protocol = has_feature("custom-protocol");
let dev = !custom_protocol;   // dev=true => load devUrl (http://localhost:1420)
```

- `tauri` CLI (`npm run tauri build` / `tauri dev`) toggles this automatically.
- A **plain `cargo build`** does NOT enable it → `dev = true` → Tauri embeds
  **no frontend** and loads `devUrl` instead → the window tries
  `http://localhost:1420`, which isn't running → "localhost refused".

**Fix:** Always build `tauri` with the `custom-protocol` feature in
`src-tauri/Cargo.toml`:

```toml
tauri = { version = "2", features = ["custom-protocol"] }
```

**How to verify the frontend is actually embedded** (do this after every build,
especially cross-compiles):

```bash
EXE=src-tauri/target/x86_64-pc-windows-gnu/release/prompts-management-workspace-tauri.exe
strings -n 6 "$EXE" | grep -oE "index-[A-Z0-9]+\.(js|css)" | sort -u
# If the hashed asset name from dist/index.html appears, embedding worked.
# If it is empty, the app will fall back to devUrl and fail on launch.
```

The production `dist/index.html` must reference hashed `/assets/*.js` (not
`/src/main.tsx` or `/@vite/client`). Re-run `npm run build` before any
`cargo build` so the embedded assets are current.

---

## 2. Cross-compiling the Windows `.exe` from Linux

Tauri's own bundler only emits the host OS's packages (`npm run tauri build` on
Linux → `.deb`/`.rpm`/`.AppImage`). To produce a Windows installer without a
Windows machine, cross-compile:

### Toolchain (Debian/Ubuntu)
```bash
sudo apt-get install mingw-w64 nsis
rustup target add x86_64-pc-windows-gnu
```
- `mingw-w64` provides the cross C compiler/linker (`x86_64-w64-mingw32-gcc`).
- `nsis` provides native `makensis` (builds a Windows `.exe` installer on Linux,
  **no Wine needed**).

### Linker / CC config — `src-tauri/.cargo/config.toml`
```toml
[target.x86_64-pc-windows-gnu]
linker = "x86_64-w64-mingw32-gcc"
ar = "x86_64-w64-mingw32-ar"

[env]
CC_x86_64_pc_windows_gnu = "x86_64-w64-mingw32-gcc"
AR_x86_64_pc_windows_gnu = "x86_64-w64-mingw32-ar"
CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER = "x86_64-w64-mingw32-gcc"
```

### Build
```bash
npm run build                 # build the frontend -> dist/
cd src-tauri
cargo build --target x86_64-pc-windows-gnu --release
# -> target/x86_64-pc-windows-gnu/release/prompts-management-workspace-tauri.exe
```

### Package with NSIS — `installer-win/installer.nsi`
```bash
cd installer-win
makensis installer.nsi
# -> installer-win/PromptCraftStudio-Setup-0.1.0-x64.exe
```
The installer places the app under `C:\Program Files\PromptCraft Studio\`, adds
Start Menu + Desktop shortcuts, and a Control Panel uninstall entry. The app
icon is `src-tauri/icons/icon.ico`.

**Notes / pitfalls:**
- `tauri-build` embeds the frontend on Windows via a resource file compiled with
  `windres` (provided by `mingw-w64` as `x86_64-w64-mingw32-windres`). It is
  required for embedding to succeed during cross-compile.
- The Windows binary is a self-contained `PE32+ executable (GUI) x86-64`. You
  cannot launch/run it on Linux (no display, no WebView2). Verification here is
  limited to: valid PE header + confirmed embedded assets via `strings`.
- The Windows app requires the system **WebView2** runtime (normally preinstalled
  on Windows 10/11). The binary embeds the Microsoft download URL for it.

---

## 3. Use `rustls` for HTTP, not OpenSSL

`reqwest` defaults to `native-tls` (OpenSSL), which is painful to cross-compile.
Keep it on `rustls-tls` and disable default features:

```toml
reqwest = { version = "0.12", features = ["json", "rustls-tls"], default-features = false }
```

This builds cleanly on both Linux and the windows-gnu cross target. The app uses
`reqwest` + `tokio` to call Ollama at `http://localhost:11434`.

---

## 4. Architecture of this app

- **Frontend** (`src/`): React + TypeScript (Vite). Components:
  `PromptCatalog`, `PromptEditor`, `VersionHistory`, `AiOptimizer`,
  `EvaluationsLab`, `AnalyticsPanel`.
  - `db.ts` — wraps `@tauri-apps/plugin-sql` (SQLite); loads/creates prompts and
    seeds the 3 original prompts if the DB is empty.
  - `ollama.ts` — invokes the Rust commands via `@tauri-apps/api`.
  - `types.ts`, `initialPrompts.ts` — shared types and seed data.
  - Fonts are bundled locally via `@fontsource` packages (no network at runtime).
- **Backend** (`src-tauri/src/`):
  - `lib.rs` — Tauri setup, SQLite schema/migration, plugin registration
    (`tauri-plugin-sql`, `tauri-plugin-clipboard-manager`, `tauri-plugin-opener`).
  - `commands.rs` — Tauri commands: `chat_with_ollama`, `run_ollama_test`,
    `optimize_prompt`, `list_ollama_models`.
  - `ollama.rs` — Ollama HTTP client (reqwest + tokio).
- **Config**: `src-tauri/tauri.conf.json` — `identifier`, window size,
  `frontendDist: "../dist"`, `devUrl: "http://localhost:1420"`.

---

## 5. Capabilities / permissions

`src-tauri/capabilities/default.json` must grant the frontend what it needs:
`core:default`, `sql:default`, `clipboard-manager:default`, `opener:default`.
Do **not** reference non-existent permission identifiers (e.g. `sql:allow-insert`
does not exist — use `sql:default`). The `sql:default` permission covers
`select`, `execute`, `load`, `close`.

---

## 6. Local dev vs. bundle

- **Dev:** `npm run tauri dev` (runs Vite dev server on :1420 and opens the
  app window). This is the only mode that opens a browser to `localhost:1420` —
  that is expected and correct.
- **Bundle:** `npm run tauri build` (host platform only). On Linux →
  `src-tauri/target/release/bundle/{deb,rpm,appimage}`.
- A browser tab showing "localhost refused" after launching the **installed
  `.exe`** is always a bug (see §1), never expected behavior.

---

## 7. Build verification checklist

1. `npm run build` succeeds and `dist/index.html` references hashed assets.
2. `cargo build --target x86_64-pc-windows-gnu --release` compiles clean.
3. `strings` on the `.exe` shows the hashed asset name (embedding worked).
4. `file` on the `.exe` reports `PE32+ executable (GUI) x86-64`.
5. `makensis installer.nsi` produces the installer with no warnings.
6. On Windows: install, confirm the app window shows the UI (not localhost
   error), and that Ollama is reachable at `localhost:11434` for AI features.
