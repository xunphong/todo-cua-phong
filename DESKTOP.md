# PHONG WORK Desktop (Windows)

Separate Windows build branch. The original web app remains unchanged on main.

## Build via GitHub Actions
Open **Actions → Build PHONG WORK Windows → Run workflow** on this branch. After the build, download **PHONG-WORK-Windows-Installer** from Artifacts. Or on Windows with Node, Rust and Visual Studio C++ Build Tools: `npm install && npx tauri icon desktop/icon.svg && npm run tauri build`.

## What it does
It bundles the current PHONG WORK HTML, Focus and reminders locally in a Tauri 2 window. When Focus is started, native Rust timers can open a fullscreen always-on-top reminder even if the app is minimized (the process must still be running). Actions: return to focus, snooze 5 minutes or dismiss/Esc. Sensitive data stays in the web app: the native bridge sends only task title and timer values, not the PIN.

## Important
This is source for an experimental desktop build. It has not yet been compiled or tested on a Windows machine. PIN and Supabase still require internet; existing desktop browser login sessions do not transfer automatically to the installed app. Never change production RLS to make desktop login easier. The reminder is not a forced lock and may not display over privileged Windows surfaces or exclusive fullscreen applications.
