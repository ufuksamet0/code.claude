use futures_util::StreamExt;
use reqwest::header::{HeaderMap, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiStreamParams {
    pub provider: String,
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub system_prompt: Option<String>,
    pub openai_api_key: Option<String>,
    pub anthropic_api_key: Option<String>,
    pub ollama_base_url: Option<String>,
    pub request_id: String,
}

pub async fn stream_chat(app: AppHandle, params: AiStreamParams) -> Result<(), String> {
    let request_id = params.request_id.clone();
    let result = match params.provider.as_str() {
        "openai" => stream_openai(app.clone(), params).await,
        "anthropic" => stream_anthropic(app.clone(), params).await,
        "ollama" => stream_ollama(app.clone(), params).await,
        _ => Err(format!("Bilinmeyen sağlayıcı: {}", params.provider)),
    };
    if let Err(ref e) = result {
        let _ = app.emit(
            "ai-error",
            json!({ "requestId": request_id, "error": e }),
        );
    }
    result
}

async fn stream_openai(app: AppHandle, params: AiStreamParams) -> Result<(), String> {
    let key = params
        .openai_api_key
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "OpenAI API anahtarı gerekli.".to_string())?;

    let mut messages: Vec<serde_json::Value> = vec![];
    if let Some(sys) = &params.system_prompt {
        if !sys.is_empty() {
            messages.push(json!({"role": "system", "content": sys}));
        }
    }
    for m in &params.messages {
        messages.push(json!({"role": m.role, "content": m.content}));
    }

    let body = json!({
        "model": params.model,
        "messages": messages,
        "stream": true,
    });

    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer {}", key)).map_err(|e| e.to_string())?,
    );
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let res = client
        .post("https://api.openai.com/v1/chat/completions")
        .headers(headers)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let t = res.text().await.unwrap_or_default();
        return Err(format!("OpenAI hata: {}", t));
    }

    let mut stream = res.bytes_stream();
    let mut buf = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        let s = String::from_utf8_lossy(&chunk);
        buf.push_str(&s);

        while let Some(pos) = buf.find("\n\n") {
            let line = buf[..pos].to_string();
            buf = buf[pos + 2..].to_string();
            for part in line.split('\n') {
                let part = part.trim();
                if part.is_empty() {
                    continue;
                }
                if let Some(data) = part.strip_prefix("data: ") {
                    if data == "[DONE]" {
                        let _ = app.emit(
                            "ai-done",
                            json!({ "requestId": params.request_id }),
                        );
                        return Ok(());
                    }
                    if let Ok(v) = serde_json::from_str::<serde_json::Value>(data) {
                        if let Some(delta) = v["choices"][0]["delta"]["content"].as_str() {
                            if !delta.is_empty() {
                                let _ = app.emit(
                                    "ai-chunk",
                                    json!({
                                        "requestId": params.request_id,
                                        "delta": delta,
                                    }),
                                );
                            }
                        }
                    }
                }
            }
        }
    }

    let _ = app.emit(
        "ai-done",
        json!({ "requestId": params.request_id }),
    );
    Ok(())
}

async fn stream_anthropic(app: AppHandle, params: AiStreamParams) -> Result<(), String> {
    let key = params
        .anthropic_api_key
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "Anthropic API anahtarı gerekli.".to_string())?;

    let mut messages: Vec<serde_json::Value> = vec![];
    for m in &params.messages {
        messages.push(json!({"role": m.role, "content": m.content}));
    }

    let system = params
        .system_prompt
        .unwrap_or_default();

    let body = json!({
        "model": params.model,
        "max_tokens": 8192,
        "stream": true,
        "system": system,
        "messages": messages,
    });

    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert("x-api-key", HeaderValue::from_str(&key).map_err(|e| e.to_string())?);
    headers.insert(
        "anthropic-version",
        HeaderValue::from_static("2023-06-01"),
    );
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let res = client
        .post("https://api.anthropic.com/v1/messages")
        .headers(headers)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let t = res.text().await.unwrap_or_default();
        return Err(format!("Anthropic hata: {}", t));
    }

    let mut stream = res.bytes_stream();
    let mut buf = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        let s = String::from_utf8_lossy(&chunk);
        buf.push_str(&s);

        while let Some(pos) = buf.find('\n') {
            let line = buf[..pos].to_string();
            buf = buf[pos + 1..].to_string();
            let line = line.trim();
            if line.starts_with("data: ") {
                let data = &line[6..];
                if data == "[DONE]" {
                    continue;
                }
                if let Ok(v) = serde_json::from_str::<serde_json::Value>(data) {
                    if let Some(t) = v["delta"]["text"].as_str() {
                        if !t.is_empty() {
                            let _ = app.emit(
                                "ai-chunk",
                                json!({
                                    "requestId": params.request_id,
                                    "delta": t,
                                }),
                            );
                        }
                    }
                }
            }
        }
    }

    let _ = app.emit(
        "ai-done",
        json!({ "requestId": params.request_id }),
    );
    Ok(())
}

async fn stream_ollama(app: AppHandle, params: AiStreamParams) -> Result<(), String> {
    let base = params
        .ollama_base_url
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "http://127.0.0.1:11434".to_string());
    let base = base.trim_end_matches('/').to_string();

    let mut messages: Vec<serde_json::Value> = vec![];
    if let Some(sys) = &params.system_prompt {
        if !sys.is_empty() {
            messages.push(json!({"role": "system", "content": sys}));
        }
    }
    for m in &params.messages {
        messages.push(json!({"role": m.role, "content": m.content}));
    }

    let body = json!({
        "model": params.model,
        "messages": messages,
        "stream": true,
    });

    let client = reqwest::Client::new();
    let url = format!("{}/api/chat", base);

    let res = client
        .post(&url)
        .header(CONTENT_TYPE, "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Ollama bağlantı hatası: {}", e))?;

    if !res.status().is_success() {
        let t = res.text().await.unwrap_or_default();
        return Err(format!("Ollama hata: {}", t));
    }

    let mut stream = res.bytes_stream();
    let mut buf = String::new();
    let mut prev_content_len: usize = 0;

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| e.to_string())?;
        let s = String::from_utf8_lossy(&chunk);
        buf.push_str(&s);

        while let Some(pos) = buf.find('\n') {
            let line = buf[..pos].to_string();
            buf = buf[pos + 1..].to_string();
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(line) {
                if let Some(t) = v["message"]["content"].as_str() {
                    if t.len() > prev_content_len {
                        let delta = &t[prev_content_len..];
                        prev_content_len = t.len();
                        if !delta.is_empty() {
                            let _ = app.emit(
                                "ai-chunk",
                                json!({
                                    "requestId": params.request_id,
                                    "delta": delta,
                                }),
                            );
                        }
                    }
                }
                if v["done"].as_bool() == Some(true) {
                    let _ = app.emit(
                        "ai-done",
                        json!({ "requestId": params.request_id }),
                    );
                    return Ok(());
                }
            }
        }
    }

    let _ = app.emit(
        "ai-done",
        json!({ "requestId": params.request_id }),
    );
    Ok(())
}
