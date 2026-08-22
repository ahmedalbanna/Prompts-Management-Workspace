# PromptCraft Studio

A desktop prompt-management workspace built with **Tauri v2** (Rust + React + TypeScript).

This is the desktop migration of the original `Prompts-Management-Workspace`. It runs fully
offline against a **local Ollama** instance — no cloud API keys required.

## Features
- Prompt catalog with categories, tags, descriptions, and version history
- AI optimizer (rewrites/improves prompts via Ollama)
- Evaluations lab (rubric scoring + quick LLM test runs)
- Analytics panel (category/tag distribution, version counts)
- Local SQLite persistence (Tauri SQL plugin) — prompts survive restarts
- Offline-first: all LLM calls go to `http://localhost:11434` (Ollama)

## Prerequisites
- **Ollama** running locally with at least one model pulled.
  The default model is **`gemma:2b`** (already configured in `src/ollama.ts`).
  Pull it with: `ollama pull gemma:2b`
- **Node.js 18+** and **Rust toolchain** (for building from source).
- Linux: `libwebkit2gtk-4.1-dev`, `librsvg2-dev`, `build-essential` (see Tauri docs).
- macOS / Windows: standard Tauri prerequisites.

## Run in development
```bash
npm install
npm run tauri dev
```

## Build installers
```bash
npm run tauri build
# Outputs in src-tauri/target/release/bundle/  (.deb, .rpm, .AppImage, .msi, .dmg)
```

## Cross-compile the Windows installer from Linux
Tauri's own bundler only emits the host platform's packages, so a `.msi`/`.exe`
must be built on Windows *or* cross-compiled. The steps below produce a Windows
`.exe` installer from a Linux machine.

1. Install the cross toolchain:
   ```bash
   sudo apt-get install mingw-w64 nsis
   rustup target add x86_64-pc-windows-gnu
   ```
2. Build the release binary for Windows:
   ```bash
   cd src-tauri
   cargo build --target x86_64-pc-windows-gnu --release
   ```
   (Linker/CC configuration lives in `src-tauri/.cargo/config.toml`.)

   > **Important:** `tauri` must be built with the `custom-protocol` feature
   > (set in `Cargo.toml`). Without it, Tauri treats the build as *dev* mode and
   > embeds no frontend, so the app's window loads `devUrl`
   > (`http://localhost:1420`) and shows "localhost refused to connect".
   > The `npm run tauri build` CLI enables this automatically, but a plain
   > `cargo build` does not — hence the explicit feature.
3. Package it with the NSIS script:
   ```bash
   cd installer-win
   makensis installer.nsi
   # -> installer-win/PromptCraftStudio-Setup-0.1.0-x64.exe
   ```
The installer puts the app under `C:\Program Files\PromptCraft Studio\`, adds
Start Menu + Desktop shortcuts, and a Control Panel uninstall entry.

> **WebView2 runtime:** Tauri v2 on Windows renders the UI with the **Microsoft
> Edge WebView2** runtime, which is *not* bundled in the app binary. The NSIS
> installer (see `EnsureWebView2` in `installer-win/installer.nsi`) detects whether
> the runtime is present and, if missing, silently downloads and installs the
> evergreen WebView2 Runtime during setup. This requires internet access at
> install time. If the auto-install fails (e.g. offline), the installer shows a
> message pointing to the manual download:
> https://go.microsoft.com/fwlink/p/?LinkId=2124703

## Project layout
- `src/` — React frontend (components, `db.ts`, `ollama.ts`, `types.ts`, `initialPrompts.ts`)
- `src-tauri/` — Rust backend
  - `src/lib.rs` — Tauri setup, SQLite migrations, plugin registration
  - `src/commands.rs` — Tauri command handlers (`chat_with_ollama`, `run_ollama_test`,
    `optimize_prompt`, `list_ollama_models`)
  - `src/ollama.rs` — Ollama HTTP client (reqwest + tokio)
- `src-tauri/tauri.conf.json` — app config (identifier `com.promptcraft.studio`)
- `src-tauri/capabilities/default.json` — permissions (sql, clipboard-manager)

## Configuration
- Change the default model: edit `DEFAULT_MODEL` in `src/ollama.ts`.
- Change the Ollama base URL: edit `OLLAMA_BASE` in `src-tauri/src/ollama.rs`.
