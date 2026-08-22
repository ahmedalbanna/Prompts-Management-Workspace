use serde::{Deserialize, Serialize};
use serde_json::Value;

/// Default Ollama base URL (local instance).
pub const OLLAMA_BASE_URL: &str = "http://localhost:11434/api";

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OllamaChatRequest {
    pub model: String,
    pub messages: Vec<OllamaMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub format: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub options: Option<OllamaOptions>,
    #[serde(default = "default_false")]
    pub stream: bool,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct OllamaOptions {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_predict: Option<u32>,
}

fn default_false() -> bool {
    false
}

#[derive(Debug, Deserialize)]
struct OllamaChatResponse {
    message: OllamaMessage,
}

#[derive(Debug, Deserialize)]
struct OllamaTagsResponse {
    models: Vec<OllamaModelEntry>,
}

#[derive(Debug, Deserialize, Clone, Serialize)]
pub struct OllamaModelEntry {
    pub name: String,
    #[serde(default)]
    pub size: Option<u64>,
    #[serde(default)]
    pub digest: Option<String>,
}

/// Result returned to the frontend after a single prompt test.
#[derive(Debug, Serialize, Deserialize)]
pub struct TestResult {
    pub success: bool,
    pub output: String,
    pub duration_ms: u64,
    pub tokens: TokenUsage,
    #[serde(default)]
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct TokenUsage {
    pub prompt: u32,
    pub candidates: u32,
    pub total: u32,
}

/// Perform a chat completion against Ollama and return the assistant message content.
pub async fn chat(
    model: &str,
    system: Option<&str>,
    user_prompt: &str,
    temperature: Option<f32>,
    max_tokens: Option<u32>,
    format: Option<Value>,
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let mut messages: Vec<OllamaMessage> = Vec::new();
    if let Some(sys) = system {
        if !sys.trim().is_empty() {
            messages.push(OllamaMessage {
                role: "system".to_string(),
                content: sys.to_string(),
            });
        }
    }
    messages.push(OllamaMessage {
        role: "user".to_string(),
        content: user_prompt.to_string(),
    });

    let options = match (temperature, max_tokens) {
        (None, None) => None,
        _ => Some(OllamaOptions {
            temperature,
            num_predict: max_tokens,
        }),
    };

    let req_body = OllamaChatRequest {
        model: model.to_string(),
        messages,
        format,
        options,
        stream: false,
    };

    let url = format!("{}/chat", OLLAMA_BASE_URL);
    let resp = client
        .post(&url)
        .json(&req_body)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Ollama error ({}): {}", status, body));
    }

    let data: OllamaChatResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    Ok(data.message.content)
}

/// Run a prompt test (used by the Workstation Editor playground).
pub async fn run_test(
    system: &str,
    template: &str,
    model: &str,
    temperature: f32,
    max_tokens: u32,
) -> TestResult {
    let start = std::time::Instant::now();
    match chat(model, Some(system), template, Some(temperature), Some(max_tokens), None).await {
        Ok(output) => {
            let elapsed = start.elapsed().as_millis() as u64;
            TestResult {
                success: true,
                output,
                duration_ms: elapsed,
                tokens: TokenUsage {
                    prompt: 0,
                    candidates: 0,
                    total: 0,
                },
                error: None,
            }
        }
        Err(e) => TestResult {
            success: false,
            output: String::new(),
            duration_ms: start.elapsed().as_millis() as u64,
            tokens: TokenUsage::default(),
            error: Some(e),
        },
    }
}

/// Optimize a raw prompt draft into a structured template via Ollama (JSON mode).
pub async fn optimize_prompt(
    draft_template: &str,
    system_context: &str,
    optimization_goal: &str,
) -> TestResult {
    let start = std::time::Instant::now();
    let system_instruction = "You are an expert prompt engineer. Transform a draft prompt into a highly professional, well-structured prompt. Return ONLY a JSON object with keys: systemInstruction (string), optimizedTemplate (string), explanation (string). No other text.";

    let user_prompt = format!(
        "Optimize the following draft prompt template.\nDraft Prompt Template:\n\"{}\"\n\n{}{}\n\nReturn a JSON object with systemInstruction, optimizedTemplate, and explanation.",
        draft_template,
        if system_context.trim().is_empty() {
            String::new()
        } else {
            format!("Context or Role constraints:\n\"{}\"\n", system_context)
        },
        if optimization_goal.trim().is_empty() {
            String::new()
        } else {
            format!("Primary Optimization Goal:\n\"{}\"\n", optimization_goal)
        }
    );

    let format_schema = serde_json::json!({
        "type": "object",
        "properties": {
            "systemInstruction": { "type": "string" },
            "optimizedTemplate": { "type": "string" },
            "explanation": { "type": "string" }
        },
        "required": ["systemInstruction", "optimizedTemplate", "explanation"]
    });

    match chat(
        "gemma:2b",
        Some(system_instruction),
        &user_prompt,
        Some(0.6),
        Some(2048),
        Some(format_schema),
    )
    .await
    {
        Ok(raw) => {
            // Strip markdown code fences if present, then parse.
            let cleaned = strip_code_fence(&raw);
            match serde_json::from_str::<Value>(&cleaned) {
                Ok(v) => {
                    let output = serde_json::to_string_pretty(&v).unwrap_or(raw);
                    TestResult {
                        success: true,
                        output,
                        duration_ms: start.elapsed().as_millis() as u64,
                        tokens: TokenUsage::default(),
                        error: None,
                    }
                }
                Err(e) => TestResult {
                    success: false,
                    output: String::new(),
                    duration_ms: start.elapsed().as_millis() as u64,
                    tokens: TokenUsage::default(),
                    error: Some(format!("Failed to parse optimizer JSON: {}", e)),
                },
            }
        }
        Err(e) => TestResult {
            success: false,
            output: String::new(),
            duration_ms: start.elapsed().as_millis() as u64,
            tokens: TokenUsage::default(),
            error: Some(e),
        },
    }
}

/// List locally available Ollama models.
pub async fn list_models() -> Result<Vec<OllamaModelEntry>, String> {
    let client = reqwest::Client::new();
    let url = format!("{}/tags", OLLAMA_BASE_URL);
    let resp = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Ollama tags request failed: {}", e))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("Ollama error ({}): {}", status, body));
    }

    let data: OllamaTagsResponse = resp
        .json()
        .await
        .map_err(|e| format!("Failed to parse Ollama tags: {}", e))?;

    Ok(data.models)
}

/// Remove ```json ... ``` fences if the model wrapped the response.
fn strip_code_fence(s: &str) -> String {
    let trimmed = s.trim();
    if let Some(stripped) = trimmed.strip_prefix("```json") {
        return stripped
            .trim_start()
            .trim_end_matches("```")
            .trim()
            .to_string();
    }
    if let Some(stripped) = trimmed.strip_prefix("```") {
        return stripped.trim_end_matches("```").trim().to_string();
    }
    trimmed.to_string()
}
