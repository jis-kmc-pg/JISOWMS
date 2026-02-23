use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

use tauri_plugin_autostart::MacosLauncher;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .setup(|app| {
            // ── 시스템 트레이 우클릭 메뉴: 열기 / 로그아웃 / 종료 ──
            let show_i = MenuItem::with_id(app, "show", "열기", true, None::<&str>)?;
            let logout_i = MenuItem::with_id(app, "logout", "로그아웃", true, None::<&str>)?;
            let quit_i = MenuItem::with_id(app, "quit", "종료", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &logout_i, &quit_i])?;

            let _tray = TrayIconBuilder::with_id("tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("OWMS System Tray")
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    // 열기: 메인 창 표시
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    // 로그아웃: 프론트엔드에 이벤트 전달 후 창 숨김
                    "logout" => {
                        let _ = app.emit("tray-logout", ());
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.hide();
                        }
                    }
                    // 종료: 앱 완전 종료
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                })
                // 트레이 아이콘 좌클릭: 창 토글 (숨김/표시)
                .on_tray_icon_event(|tray, event| match event {
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } => {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("main") {
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        // 창 닫기 버튼 클릭 시 숨김 처리 (트레이로 최소화)
        .on_window_event(|window, event| match event {
            tauri::WindowEvent::CloseRequested { api, .. } => {
                window.hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
