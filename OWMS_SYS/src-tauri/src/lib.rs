use tauri::{
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    Emitter, Manager,
};

use tauri_plugin_autostart::MacosLauncher;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(Serialize, Deserialize)]
struct LoginResponse {
    #[serde(rename = "accessToken")]
    access_token: String,
    user: serde_json::Value,
}

#[derive(Deserialize)]
struct ApiRequestOptions {
    method: String,
    url: String,
    headers: Option<HashMap<String, String>>,
    body: Option<serde_json::Value>,
}

#[derive(Serialize)]
struct ApiResponse {
    status: u16,
    #[serde(rename = "statusText")]
    status_text: String,
    data: serde_json::Value,
}

#[tauri::command]
async fn login_command(url: String, user_id: String, password: String) -> Result<LoginResponse, String> {
    let client = reqwest::Client::new();

    let body = serde_json::json!({
        "userId": user_id,
        "password": password
    });

    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status();

    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("HTTP {}: {}", status, error_text));
    }

    let login_response: LoginResponse = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    Ok(login_response)
}

#[tauri::command]
async fn api_request(options: ApiRequestOptions) -> Result<ApiResponse, String> {
    let client = reqwest::Client::new();

    // Build request
    let mut request = match options.method.to_uppercase().as_str() {
        "GET" => client.get(&options.url),
        "POST" => client.post(&options.url),
        "PUT" => client.put(&options.url),
        "DELETE" => client.delete(&options.url),
        "PATCH" => client.patch(&options.url),
        _ => return Err(format!("Unsupported HTTP method: {}", options.method)),
    };

    // Add headers
    if let Some(headers) = options.headers {
        for (key, value) in headers {
            request = request.header(&key, &value);
        }
    }

    // Add body for POST/PUT/PATCH
    if let Some(body) = options.body {
        request = request.json(&body);
    }

    // Send request
    let response = request
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let status = response.status().as_u16();
    let status_text = response.status().canonical_reason().unwrap_or("").to_string();

    // Parse response
    let data = if response.status().is_success() {
        response
            .json::<serde_json::Value>()
            .await
            .unwrap_or(serde_json::json!(null))
    } else {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        // Try to parse as JSON, otherwise return as string
        serde_json::from_str(&error_text).unwrap_or(serde_json::json!({ "message": error_text }))
    };

    Ok(ApiResponse {
        status,
        status_text,
        data,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
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
        .invoke_handler(tauri::generate_handler![greet, login_command, api_request])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
