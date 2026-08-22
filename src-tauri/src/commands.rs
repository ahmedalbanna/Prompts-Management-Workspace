use crate::ollama::{self, OllamaModelEntry, TestResult};
use serde_json::Value;

/// Run a single prompt test against Ollama.
#[tauri::command]
pub async fn run_test(
    system_instruction: String,
    template: String,
    model: String,
    temperature: f64,
    max_output_tokens: i64,
) -> Result<TestResult, String> {
    Ok(ollama::run_test(
        &system_instruction,
        &template,
        &model,
        temperature as f32,
        max_output_tokens as u32,
    )
    .await)
}

/// Optimize a raw draft prompt via Ollama (JSON mode).
#[tauri::command]
pub async fn optimize_prompt(
    draft_template: String,
    system_context: String,
    optimization_goal: String,
) -> Result<TestResult, String> {
    Ok(ollama::optimize_prompt(&draft_template, &system_context, &optimization_goal).await)
}

/// Evaluate prompt across multiple test cases (parallel).
#[tauri::command]
pub async fn evaluate_prompts(
    system_instruction: String,
    template: String,
    model: String,
    temperature: f64,
    test_cases: Vec<Value>,
) -> Result<Vec<TestResult>, String> {
    let mut handles = Vec::new();
    for tc in test_cases {
        let variables: Value = tc
            .get("variables")
            .cloned()
            .unwrap_or(Value::Object(serde_json::Map::new()));
        let tmpl = template.clone();
        let sys = system_instruction.clone();
        let mdl = model.clone();

        let substituted = substitute_variables(&tmpl, &variables);

        let handle = tokio::spawn(async move {
            ollama::run_test(&sys, &substituted, &mdl, temperature as f32, 2048).await
        });
        handles.push(handle);
    }

    let mut results = Vec::new();
    for h in handles {
        match h.await {
            Ok(r) => results.push(r),
            Err(e) => results.push(TestResult {
                success: false,
                output: String::new(),
                duration_ms: 0,
                tokens: crate::ollama::TokenUsage::default(),
                error: Some(format!("task failed: {}", e)),
            }),
        }
    }
    Ok(results)
}

/// List available Ollama models.
#[tauri::command]
pub async fn list_ollama_models() -> Result<Vec<OllamaModelEntry>, String> {
    ollama::list_models().await
}

/// Substitute {{variable}} placeholders using the provided variables map.
fn substitute_variables(template: &str, variables: &Value) -> String {
    let obj = match variables.as_object() {
        Some(o) => o,
        None => return template.to_string(),
    };
    let mut result = template.to_string();
    for (key, value) in obj {
        let val = value.as_str().unwrap_or("");
        let pattern = format!("{{\\s*{}\\s*}}", regex::escape(key));
        if let Ok(re) = regex::Regex::new(&pattern) {
            result = re.replace_all(&result, val).to_string();
        }
    }
    result
}
