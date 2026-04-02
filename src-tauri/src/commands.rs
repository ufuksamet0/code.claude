use serde::{Deserialize, Serialize};
use serde_json::json;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use std::process::Command;
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

use crate::ai::{self, AiStreamParams, ChatMessage};

pub struct ProjectState {
    pub root: Mutex<Option<PathBuf>>,
}

pub struct PcCwdState {
    pub cwd: Mutex<Option<PathBuf>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub openai_api_key: Option<String>,
    pub anthropic_api_key: Option<String>,
    pub ollama_base_url: Option<String>,
    pub google_api_key: Option<String>,
    pub groq_api_key: Option<String>,
    pub mistral_api_key: Option<String>,
    pub openrouter_api_key: Option<String>,
    pub together_api_key: Option<String>,
    pub xai_api_key: Option<String>,
    pub deepseek_api_key: Option<String>,
    pub perplexity_api_key: Option<String>,
    pub qwen_api_key: Option<String>,
    pub default_provider: Option<String>,
    pub default_model_openai: Option<String>,
    pub default_model_anthropic: Option<String>,
    pub default_model_ollama: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            openai_api_key: None,
            anthropic_api_key: None,
            ollama_base_url: Some("http://127.0.0.1:11434".to_string()),
            google_api_key: None,
            groq_api_key: None,
            mistral_api_key: None,
            openrouter_api_key: None,
            together_api_key: None,
            xai_api_key: None,
            deepseek_api_key: None,
            perplexity_api_key: None,
            qwen_api_key: None,
            default_provider: Some("openai".to_string()),
            default_model_openai: Some("gpt-4o-mini".to_string()),
            default_model_anthropic: Some("claude-3-5-sonnet-20241022".to_string()),
            default_model_ollama: Some("llama3.2".to_string()),
        }
    }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("settings.json"))
}

#[tauri::command]
pub fn load_settings(app: AppHandle) -> Result<AppSettings, String> {
    let p = settings_path(&app)?;
    if !p.exists() {
        return Ok(AppSettings::default());
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_settings(app: AppHandle, settings: AppSettings) -> Result<(), String> {
    let p = settings_path(&app)?;
    let raw = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(&p, raw).map_err(|e| e.to_string())
}

fn memory_dir(app: &AppHandle, mode: &str) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let m = dir.join("memory").join(mode);
    fs::create_dir_all(&m).map_err(|e| e.to_string())?;
    Ok(m)
}

#[tauri::command]
pub fn memory_read_index(app: AppHandle, mode: String) -> Result<serde_json::Value, String> {
    let dir = memory_dir(&app, &mode)?;
    let p = dir.join("index.json");
    if !p.exists() {
        return Ok(json!({ "summary": "", "tags": [], "updatedAt": null }));
    }
    let raw = fs::read_to_string(&p).map_err(|e| e.to_string())?;
    serde_json::from_str(&raw).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn memory_write_index(
    app: AppHandle,
    mode: String,
    index: serde_json::Value,
) -> Result<(), String> {
    let dir = memory_dir(&app, &mode)?;
    let p = dir.join("index.json");
    let raw = serde_json::to_string_pretty(&index).map_err(|e| e.to_string())?;
    fs::write(&p, raw).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn memory_list_facts(app: AppHandle, mode: String) -> Result<Vec<String>, String> {
    let dir = memory_dir(&app, &mode)?.join("facts");
    if !dir.exists() {
        return Ok(vec![]);
    }
    let mut names = vec![];
    for e in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let e = e.map_err(|e| e.to_string())?;
        let p = e.path();
        if p.extension().map(|x| x == "md").unwrap_or(false) {
            if let Some(s) = p.file_name().and_then(|n| n.to_str()) {
                names.push(s.to_string());
            }
        }
    }
    names.sort();
    Ok(names)
}

#[tauri::command]
pub fn memory_read_fact(app: AppHandle, mode: String, name: String) -> Result<String, String> {
    if name.contains("..") || name.contains('/') || name.contains('\\') {
        return Err("Geçersiz dosya adı.".into());
    }
    let p = memory_dir(&app, &mode)?.join("facts").join(&name);
    fs::read_to_string(&p).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn memory_write_fact(
    app: AppHandle,
    mode: String,
    name: String,
    content: String,
) -> Result<(), String> {
    if name.contains("..") || name.contains('/') || name.contains('\\') {
        return Err("Geçersiz dosya adı.".into());
    }
    let facts = memory_dir(&app, &mode)?.join("facts");
    fs::create_dir_all(&facts).map_err(|e| e.to_string())?;
    let p = facts.join(name);
    fs::write(&p, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_project_root(
    state: State<'_, ProjectState>,
    path: Option<String>,
) -> Result<(), String> {
    let mut g = state.root.lock().map_err(|e| e.to_string())?;
    *g = path.map(PathBuf::from);
    Ok(())
}

#[tauri::command]
pub fn get_project_root(state: State<'_, ProjectState>) -> Result<Option<String>, String> {
    let g = state.root.lock().map_err(|e| e.to_string())?;
    Ok(g.as_ref().and_then(|p| p.to_str().map(|s| s.to_string())))
}

fn safe_under_root(root: &Path, rel: &str) -> Result<PathBuf, String> {
    let rel = rel.trim().trim_start_matches(['/', '\\']);
    if rel.contains("..") {
        return Err("Yol '..' içeremez.".into());
    }
    let root = root
        .canonicalize()
        .map_err(|e| format!("Kök dizin okunamadı: {}", e))?;
    let mut out = root.clone();
    for part in Path::new(rel).components() {
        if let std::path::Component::Normal(p) = part {
            out.push(p);
        }
    }
    let out = out.canonicalize().unwrap_or(out);
    if !out.starts_with(&root) {
        return Err("Yol proje kökünün dışına çıkamaz.".into());
    }
    Ok(out)
}

#[tauri::command]
pub fn fs_read_file(state: State<'_, ProjectState>, relative_path: String) -> Result<String, String> {
    let root = state
        .root
        .lock()
        .map_err(|e| e.to_string())?
        .clone()
        .ok_or_else(|| "Önce proje kökü seçin.".to_string())?;
    let path = safe_under_root(&root, &relative_path)?;
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fs_write_file(
    state: State<'_, ProjectState>,
    relative_path: String,
    content: String,
) -> Result<(), String> {
    let root = state
        .root
        .lock()
        .map_err(|e| e.to_string())?
        .clone()
        .ok_or_else(|| "Önce proje kökü seçin.".to_string())?;
    let path = safe_under_root(&root, &relative_path)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn fs_delete_path(state: State<'_, ProjectState>, relative_path: String) -> Result<(), String> {
    let root = state
        .root
        .lock()
        .map_err(|e| e.to_string())?
        .clone()
        .ok_or_else(|| "Önce proje kökü seçin.".to_string())?;
    let path = safe_under_root(&root, &relative_path)?;
    if path.is_dir() {
        fs::remove_dir_all(&path).map_err(|e| e.to_string())?;
    } else {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn fs_mkdir(state: State<'_, ProjectState>, relative_path: String) -> Result<(), String> {
    let root = state
        .root
        .lock()
        .map_err(|e| e.to_string())?
        .clone()
        .ok_or_else(|| "Önce proje kökü seçin.".to_string())?;
    let path = safe_under_root(&root, &relative_path)?;
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DirEntryDto {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

#[tauri::command]
pub fn fs_list_dir(
    state: State<'_, ProjectState>,
    relative_path: String,
) -> Result<Vec<DirEntryDto>, String> {
    let root = state
        .root
        .lock()
        .map_err(|e| e.to_string())?
        .clone()
        .ok_or_else(|| "Önce proje kökü seçin.".to_string())?;
    let dir = if relative_path.is_empty() {
        root.clone()
    } else {
        safe_under_root(&root, &relative_path)?
    };
    let mut out = vec![];
    for e in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let e = e.map_err(|e| e.to_string())?;
        let meta = e.metadata().map_err(|e| e.to_string())?;
        let name = e.file_name().to_string_lossy().to_string();
        if name.starts_with('.') {
            continue;
        }
        let rel = if relative_path.is_empty() {
            name.clone()
        } else {
            format!("{}/{}", relative_path.trim_end_matches('/'), name)
        };
        out.push(DirEntryDto {
            name,
            path: rel,
            is_dir: meta.is_dir(),
        });
    }
    out.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(out)
}

#[tauri::command]
pub fn run_shell_in_project(
    state: State<'_, ProjectState>,
    command: String,
) -> Result<String, String> {
    let root = state
        .root
        .lock()
        .map_err(|e| e.to_string())?
        .clone()
        .ok_or_else(|| "Önce proje kökü seçin.".to_string())?;
    run_shell_command_impl(Some(root), command)
}

#[tauri::command]
pub fn set_pc_cwd(state: State<'_, PcCwdState>, path: Option<String>) -> Result<(), String> {
    let mut g = state.cwd.lock().map_err(|e| e.to_string())?;
    *g = path.map(PathBuf::from);
    Ok(())
}

#[tauri::command]
pub fn get_pc_cwd(state: State<'_, PcCwdState>) -> Result<Option<String>, String> {
    let g = state.cwd.lock().map_err(|e| e.to_string())?;
    Ok(g.as_ref().and_then(|p| p.to_str().map(|s| s.to_string())))
}

#[tauri::command]
pub fn run_shell_pc(
    state: State<'_, PcCwdState>,
    command: String,
) -> Result<String, String> {
    let cwd = {
        let g = state.cwd.lock().map_err(|e| e.to_string())?;
        g.clone()
    };
    let cwd = cwd.or_else(|| dirs::home_dir());
    run_shell_command_impl(cwd, command)
}

fn run_shell_command_impl(cwd: Option<PathBuf>, command: String) -> Result<String, String> {
    #[cfg(unix)]
    {
        let mut c = Command::new("/bin/sh");
        c.arg("-c").arg(&command);
        if let Some(d) = cwd {
            c.current_dir(d);
        }
        let out = c.output().map_err(|e| e.to_string())?;
        let mut s = String::new();
        if !out.stdout.is_empty() {
            s.push_str(&String::from_utf8_lossy(&out.stdout));
        }
        if !out.stderr.is_empty() {
            if !s.is_empty() {
                s.push('\n');
            }
            s.push_str("--- stderr ---\n");
            s.push_str(&String::from_utf8_lossy(&out.stderr));
        }
        if !out.status.success() {
            s.push_str(&format!("\n(exit: {:?})", out.status.code()));
        }
        Ok(s)
    }
    #[cfg(windows)]
    {
        let mut c = Command::new("cmd");
        c.arg("/C").arg(&command);
        if let Some(d) = cwd {
            c.current_dir(d);
        }
        let out = c.output().map_err(|e| e.to_string())?;
        let mut s = String::new();
        s.push_str(&String::from_utf8_lossy(&out.stdout));
        if !out.stderr.is_empty() {
            s.push_str(&String::from_utf8_lossy(&out.stderr));
        }
        Ok(s)
    }
}

#[tauri::command]
pub fn agents_run_applescript(script: String) -> Result<String, String> {
    #[cfg(target_os = "macos")]
    {
        let out = Command::new("osascript")
            .arg("-e")
            .arg(&script)
            .output()
            .map_err(|e| format!("osascript çalıştırılamadı: {}", e))?;
        let mut s = String::from_utf8_lossy(&out.stdout).to_string();
        if !out.stderr.is_empty() {
            s.push_str(&String::from_utf8_lossy(&out.stderr));
        }
        if !out.status.success() {
            return Err(s);
        }
        Ok(s)
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = script;
        Err("AppleScript yalnızca macOS üzerinde desteklenir.".into())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiChatRequest {
    pub provider: String,
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub system_prompt: Option<String>,
    pub request_id: String,
}

#[tauri::command]
pub async fn ai_chat_stream(app: AppHandle, req: AiChatRequest) -> Result<(), String> {
    let settings = load_settings(app.clone())?;
    let params = AiStreamParams {
        provider: req.provider,
        model: req.model,
        messages: req.messages,
        system_prompt: req.system_prompt,
        openai_api_key: settings.openai_api_key,
        anthropic_api_key: settings.anthropic_api_key,
        ollama_base_url: settings.ollama_base_url,
        google_api_key: settings.google_api_key,
        groq_api_key: settings.groq_api_key,
        mistral_api_key: settings.mistral_api_key,
        openrouter_api_key: settings.openrouter_api_key,
        together_api_key: settings.together_api_key,
        xai_api_key: settings.xai_api_key,
        deepseek_api_key: settings.deepseek_api_key,
        perplexity_api_key: settings.perplexity_api_key,
        qwen_api_key: settings.qwen_api_key,
        request_id: req.request_id,
    };
    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        let _ = ai::stream_chat(handle, params).await;
    });
    Ok(())
}

#[tauri::command]
pub async fn openai_image_generate(
    app: AppHandle,
    prompt: String,
    size: Option<String>,
) -> Result<String, String> {
    let settings = load_settings(app.clone())?;
    let key = settings
        .openai_api_key
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "OpenAI API anahtarı gerekli (Ayarlar).".to_string())?;

    let client = reqwest::Client::new();
    let body = json!({
        "model": "dall-e-3",
        "prompt": prompt,
        "n": 1,
        "size": size.unwrap_or_else(|| "1024x1024".to_string()),
        "response_format": "b64_json",
    });

    let res = client
        .post("https://api.openai.com/v1/images/generations")
        .header("Authorization", format!("Bearer {}", key))
        .header("Content-Type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let t = res.text().await.unwrap_or_default();
        return Err(format!("Görüntü API hatası: {}", t));
    }

    let v: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let b64 = v["data"][0]["b64_json"]
        .as_str()
        .ok_or_else(|| "Yanıtta b64_json yok.".to_string())?;

    let name = format!(
        "multimod-image-{}.png",
        uuid::Uuid::new_v4().to_string().split('-').next().unwrap_or("out")
    );
    media_save_bytes(app, name, b64.to_string())
}

#[tauri::command]
pub fn media_save_bytes(
    app: AppHandle,
    suggested_name: String,
    bytes_base64: String,
) -> Result<String, String> {
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    let raw = STANDARD
        .decode(bytes_base64.as_bytes())
        .map_err(|e| e.to_string())?;
    let path = app
        .path()
        .download_dir()
        .or_else(|_| app.path().document_dir())
        .map_err(|e| e.to_string())?
        .join(&suggested_name);
    let mut f = fs::File::create(&path).map_err(|e| e.to_string())?;
    f.write_all(&raw).map_err(|e| e.to_string())?;
    path
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Yol dönüştürülemedi.".into())
}
