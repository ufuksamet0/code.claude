use futures_util::StreamExt;
use reqwest::header::{HeaderMap, HeaderName, HeaderValue, AUTHORIZATION, CONTENT_TYPE};
use reqwest::Url;
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
    pub google_api_key: Option<String>,
    pub groq_api_key: Option<String>,
    pub mistral_api_key: Option<String>,
    pub openrouter_api_key: Option<String>,
    pub together_api_key: Option<String>,
    pub xai_api_key: Option<String>,
    pub deepseek_api_key: Option<String>,
    pub perplexity_api_key: Option<String>,
    pub qwen_api_key: Option<String>,
    pub request_id: String,
}

pub async fn stream_chat(app: AppHandle, params: AiStreamParams) -> Result<(), String> {
    let request_id = params.request_id.clone();
    let result = match params.provider.as_str() {
        "openai" => stream_openai_compatible(
            app.clone(),
            &params,
            "https://api.openai.com/v1/chat/completions",
            params
                .openai_api_key
                .clone()
                .filter(|s| !s.is_empty())
                .ok_or_else(|| "OpenAI API anahtarı gerekli (Ayarlar).".to_string())?,
            &[],
        )
        .await,
        "anthropic" => stream_anthropic(app.clone(), params).await,
        "ollama" => stream_ollama(app.clone(), params).await,
        "google" => stream_gemini(app.clone(), params).await,
        "groq" => {
            stream_openai_compatible(
                app.clone(),
                &params,
                "https://api.groq.com/openai/v1/chat/completions",
                params
                    .groq_api_key
                    .clone()
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| "Groq API anahtarı gerekli (Ayarlar).".to_string())?,
                &[],
            )
            .await
        }
        "mistral" => {
            stream_openai_compatible(
                app.clone(),
                &params,
                "https://api.mistral.ai/v1/chat/completions",
                params
                    .mistral_api_key
                    .clone()
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| "Mistral API anahtarı gerekli (Ayarlar).".to_string())?,
                &[],
            )
            .await
        }
        "openrouter" => {
            let extra: [(&str, &str); 2] = [
                ("referer", "https://github.com/ufuksamet0/code.claude"),
                ("x-title", "MultiMod AI"),
            ];
            stream_openai_compatible(
                app.clone(),
                &params,
                "https://openrouter.ai/api/v1/chat/completions",
                params
                    .openrouter_api_key
                    .clone()
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| "OpenRouter API anahtarı gerekli (Ayarlar).".to_string())?,
                &extra,
            )
            .await
        }
        "together" => {
            stream_openai_compatible(
                app.clone(),
                &params,
                "https://api.together.xyz/v1/chat/completions",
                params
                    .together_api_key
                    .clone()
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| "Together API anahtarı gerekli (Ayarlar).".to_string())?,
                &[],
            )
            .await
        }
        "xai" => {
            stream_openai_compatible(
                app.clone(),
                &params,
                "https://api.x.ai/v1/chat/completions",
                params
                    .xai_api_key
                    .clone()
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| "xAI API anahtarı gerekli (Ayarlar).".to_string())?,
                &[],
            )
            .await
        }
        "deepseek" => {
            stream_openai_compatible(
                app.clone(),
                &params,
                "https://api.deepseek.com/v1/chat/completions",
                params
                    .deepseek_api_key
                    .clone()
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| "DeepSeek API anahtarı gerekli (Ayarlar).".to_string())?,
                &[],
            )
            .await
        }
        "perplexity" => {
            stream_openai_compatible(
                app.clone(),
                &params,
                "https://api.perplexity.ai/v1/chat/completions",
                params
                    .perplexity_api_key
                    .clone()
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| "Perplexity API anahtarı gerekli (Ayarlar).".to_string())?,
                &[],
            )
            .await
        }
        "llama" => {
            stream_openai_compatible(
                app.clone(),
                &params,
                "https://api.together.xyz/v1/chat/completions",
                params
                    .together_api_key
                    .clone()
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| {
                        "Llama (Together) API anahtarı gerekli (Ayarlar).".to_string()
                    })?,
                &[],
            )
            .await
        }
        "qwen" => {
            stream_openai_compatible(
                app.clone(),
                &params,
                "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions",
                params
                    .qwen_api_key
                    .clone()
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| {
                        "Qwen (DashScope) API anahtarı gerekli (Ayarlar).".to_string()
                    })?,
                &[],
            )
            .await
        }
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

fn build_openai_style_messages(params: &AiStreamParams) -> Vec<serde_json::Value> {
    let mut messages: Vec<serde_json::Value> = vec![];
    if let Some(sys) = &params.system_prompt {
        if !sys.is_empty() {
            messages.push(json!({"role": "system", "content": sys}));
        }
    }
    for m in &params.messages {
        messages.push(json!({"role": m.role, "content": m.content}));
    }
    messages
}

async fn stream_openai_compatible(
    app: AppHandle,
    params: &AiStreamParams,
    url: &str,
    api_key: String,
    extra_headers: &[(&str, &str)],
) -> Result<(), String> {
    let messages = build_openai_style_messages(params);
    let body = json!({
        "model": params.model,
        "messages": messages,
        "stream": true,
    });

    let client = reqwest::Client::new();
    let mut headers = HeaderMap::new();
    headers.insert(
        AUTHORIZATION,
        HeaderValue::from_str(&format!("Bearer {}", api_key)).map_err(|e| e.to_string())?,
    );
    headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));
    for (name, value) in extra_headers {
        let hn = HeaderName::from_bytes(name.as_bytes()).map_err(|e| e.to_string())?;
        let hv = HeaderValue::from_str(value).map_err(|e| e.to_string())?;
        headers.insert(hn, hv);
    }

    let res = client
        .post(url)
        .headers(headers)
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    if !status.is_success() {
        let t = res.text().await.unwrap_or_default();
        return Err(format!("API hata ({}): {}", status, t));
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

    let system = params.system_prompt.unwrap_or_default();

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

async fn stream_gemini(app: AppHandle, params: AiStreamParams) -> Result<(), String> {
    let key = params
        .google_api_key
        .filter(|s| !s.is_empty())
        .ok_or_else(|| "Google AI (Gemini) API anahtarı gerekli (Ayarlar).".to_string())?;

    let model = params.model.trim();
    if model.is_empty() {
        return Err("Model adı boş olamaz.".into());
    }

    let mut url = Url::parse(&format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:streamGenerateContent",
        model
    ))
    .map_err(|e| e.to_string())?;
    url.query_pairs_mut().append_pair("key", &key);

    let mut contents: Vec<serde_json::Value> = vec![];
    for m in &params.messages {
        let role = match m.role.as_str() {
            "assistant" => "model",
            _ => "user",
        };
        contents.push(json!({
            "role": role,
            "parts": [{"text": m.content}]
        }));
    }

    let mut body = json!({ "contents": contents });
    if let Some(sys) = &params.system_prompt {
        if !sys.is_empty() {
            body["systemInstruction"] = json!({ "parts": [{ "text": sys }] });
        }
    }

    let client = reqwest::Client::new();
    let res = client
        .post(url.as_str())
        .header(CONTENT_TYPE, "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let t = res.text().await.unwrap_or_default();
        return Err(format!("Gemini hata: {}", t));
    }

    let mut stream = res.bytes_stream();
    let mut buf = String::new();
    let mut prev_text_len: usize = 0;

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
            let json_line = line
                .strip_prefix("data: ")
                .unwrap_or(line);
            if json_line == "[DONE]" {
                continue;
            }
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(json_line) {
                if let Some(text) = v["candidates"][0]["content"]["parts"][0]["text"].as_str() {
                    if text.len() > prev_text_len {
                        let delta = &text[prev_text_len..];
                        prev_text_len = text.len();
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

    let _ = app.emit(
        "ai-done",
        json!({ "requestId": params.request_id }),
    );
    Ok(())
}
