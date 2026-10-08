use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder};
use serde::Serialize;

#[derive(Default)]
struct FocusTimer {
    version: u64,
    title: String,
    deadline: Option<Instant>,
}

#[derive(Serialize)]
struct FocusSummary {
    title: String,
    completed: bool,
}

fn show_reminder(app: AppHandle, version: u64) {
    let valid = {
        let state = app.state::<Mutex<FocusTimer>>();
        let timer = state.lock().unwrap();
        timer.version == version && timer.deadline.is_some()
    };
    if !valid { return; }
    let _ = app.run_on_main_thread(move || {
        let reminder = match app.get_webview_window("focus-reminder") {
            Some(existing) => existing,
            None => match WebviewWindowBuilder::new(
                &app, "focus-reminder", WebviewUrl::App("reminder.html".into())
            )
            .title("PHONG WORK · Nhắc tập trung")
            .fullscreen(true)
            .always_on_top(true)
            .focused(true)
            .build() {
                Ok(created) => created,
                Err(e) => { eprintln!("Cannot open Focus reminder: {e}"); return; }
            }
        };
        let _ = reminder.set_always_on_top(true);
        let _ = reminder.set_fullscreen(true);
        let _ = reminder.show();
        let _ = reminder.set_focus();
        let _ = reminder.emit("pw-reminder-refresh", ());
    });
}

fn schedule(app: AppHandle, version: u64, delay_ms: u64) {
    std::thread::spawn(move || {
        std::thread::sleep(Duration::from_millis(delay_ms));
        show_reminder(app, version);
    });
}

#[tauri::command]
fn sync_focus(
    app: AppHandle,
    state: State<'_, Mutex<FocusTimer>>,
    title: String,
    remaining_ms: u64,
    reminder_ms: u64,
    paused: bool,
) {
    let mut timer = state.lock().unwrap();
    timer.version = timer.version.wrapping_add(1);
    let version = timer.version;
    timer.title = title.chars().take(180).collect();
    timer.deadline = if paused { None } else { Some(Instant::now() + Duration::from_millis(remaining_ms)) };
    drop(timer);
    if paused || remaining_ms == 0 { return; }
    if reminder_ms > 0 && reminder_ms < remaining_ms {
        schedule(app.clone(), version, reminder_ms);
    }
    schedule(app, version, remaining_ms);
}

#[tauri::command]
fn cancel_focus(state: State<'_, Mutex<FocusTimer>>) {
    let mut timer = state.lock().unwrap();
    timer.version = timer.version.wrapping_add(1);
    timer.deadline = None;
}

fn hide_reminder(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("focus-reminder") {
        let _ = w.hide();
        let _ = w.set_always_on_top(false);
    }
}

#[tauri::command]
fn dismiss_focus(app: AppHandle) { hide_reminder(&app); }

#[tauri::command]
fn snooze_focus(app: AppHandle) {
    hide_reminder(&app);
    let state = app.state::<Mutex<FocusTimer>>();
    let timer = state.lock().unwrap();
    if timer.deadline.is_some() {
        let version = timer.version;
        drop(timer);
        schedule(app, version, 300_000);
    }
}

#[tauri::command]
fn return_to_focus(app: AppHandle) {
    hide_reminder(&app);
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.show();
        let _ = main.unminimize();
        let _ = main.set_focus();
    }
    let _ = app.emit_to("main", "pw-open-focus", ());
}

#[tauri::command]
fn focus_summary(state: State<'_, Mutex<FocusTimer>>) -> FocusSummary {
    let timer = state.lock().unwrap();
    FocusSummary {
        title: timer.title.clone(),
        completed: timer.deadline.map(|d| Instant::now() >= d).unwrap_or(false),
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::<FocusTimer>::default())
        .invoke_handler(tauri::generate_handler![
            sync_focus, cancel_focus, dismiss_focus, snooze_focus, return_to_focus, focus_summary
        ])
        .run(tauri::generate_context!())
        .expect("error running PHONG WORK Desktop");
}
