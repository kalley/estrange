use worker::*;
use crate::wasm_bindgen::JsValue;
use serde::{Deserialize, Serialize};
use base64::Engine;
use serde_json::json;

#[derive(Debug, Serialize, Deserialize)]
struct PromptData {
    prompt: String,
    tags: Vec<String>,
    generated_at: String,
    id: String,
    version: String,
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Vec<GeminiCandidate>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
    content: GeminiContent,
}

#[derive(Debug, Deserialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Deserialize)]
struct GeminiPart {
    text: String,
}

#[derive(Debug, Deserialize)]
struct GeminiPromptContent {
    prompt: String,
    tags: Vec<String>,
}

#[event(scheduled)]
pub async fn scheduled(_event: ScheduledEvent, env: Env, _ctx: ScheduleContext) {
    console_log!("Starting daily prompt generation");

    match generate_daily_prompt(&env).await {
        Ok(prompt_data) => {
            console_log!("Generated prompt: {}", prompt_data.prompt);

            // Store current prompt in KV
            if let Err(e) = store_current_prompt(&env, &prompt_data).await {
                console_error!("Failed to store prompt in KV: {:?}", e);
                return; // Early return on critical failure
            }

            // Archive to git repo
            if let Err(e) = archive_to_git(&env, &prompt_data).await {
                console_error!("Failed to archive to git: {:?}", e);
                // Don't fail the whole job if git archival fails
            }

            console_log!("Daily prompt generation completed successfully");
        }
        Err(e) => {
            console_error!("Prompt generation failed: {:?}", e);
            return; // Early return on failure
        }
    }
}

async fn generate_daily_prompt(env: &Env) -> Result<PromptData> {
    let api_key = env.secret("GEMINI_API_KEY")?.to_string();

    let prompt_request = json!({
        "contents": [{
            "parts": [{
                "text": "Generate one unexpected creative stimulus - it could be anything: an object, a situation, a constraint, a weird fact, a made-up rule, or anything else that could spark ideas. Just give me the one thing, no explanation."
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": {
                "type": "OBJECT",
                "properties": {
                    "prompt": { "type": "STRING" },
                    "tags": { "type": "ARRAY", "items": { "type": "STRING" } }
                }
            }
        }
    });

    let mut headers = Headers::new();
    headers.set("x-goog-api-key", &api_key)?;
    headers.set("Content-Type", "application/json")?;

    let request = Request::new_with_init(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
        RequestInit::new()
            .with_method(Method::Post)
            .with_headers(headers)
            .with_body(Some(JsValue::from_str(&prompt_request.to_string()))),
    )?;

    let mut response = Fetch::Request(request).send().await?;

    if !(200..300).contains(&response.status_code()) {
        let error_text = response.text().await.unwrap_or_default();
        console_error!("Gemini API error: {} - {}", response.status_code(), error_text);
        return Err(Error::from("Gemini API request failed"));
    }

    let gemini_response: GeminiResponse = response.json().await?;

    let content_text = gemini_response
        .candidates
        .first()
        .ok_or("No candidates in Gemini response")?
        .content
        .parts
        .first()
        .ok_or("No parts in Gemini response")?
        .text
        .clone();

    let prompt_content: GeminiPromptContent = serde_json::from_str(&content_text)
        .map_err(|e| Error::from(format!("Failed to parse prompt content: {}", e)))?;

    let now = js_sys::Date::new_0();
    Ok(PromptData {
        prompt: prompt_content.prompt,
        tags: prompt_content.tags,
        generated_at: now.to_iso_string().as_string().unwrap(),
        id: (now.get_time() as u64).to_string(),
        version: "worker-v1".to_string(),
    })
}

async fn store_current_prompt(env: &Env, prompt_data: &PromptData) -> Result<()> {
    let kv = env.kv("PROMPTS")?;
    let prompt_json = serde_json::to_string(prompt_data)?;

    kv.put("current-prompt", prompt_json)?
        .execute()
        .await?;

    console_log!("Stored prompt in KV store");
    Ok(())
}

async fn archive_to_git(env: &Env, prompt_data: &PromptData) -> Result<()> {
    let github_token = env.secret("GITHUB_TOKEN")?.to_string();
    let repo = env.var("PROMPTS_REPO")?.to_string(); // e.g., "username/estrange-prompts"

    // Get current date for file path
    let date = js_sys::Date::new_0();
    let year = date.get_full_year();
    let month = format!("{:02}", date.get_month() + 1); // JS months are 0-based
    let day = format!("{:02}", date.get_date());
    let date_string = format!("{}-{}-{}", year, month, day);
    let hours = format!("{:02}", date.get_hours());
    let minutes = format!("{:02}", date.get_minutes());
    let seconds = format!("{:02}", date.get_seconds());
    let time_string = format!("{}{}{}", hours, minutes, seconds);

    let file_path = format!("prompts/{}/{}/{}-{}.json", year, month, day, time_string);
    let commit_message = format!("✨ Daily creative prompt {}", date_string);

    // Create the JSON content for the file
    let file_content = serde_json::to_string_pretty(prompt_data)?;
    let encoded_content = base64::engine::general_purpose::STANDARD.encode(file_content);

    // GitHub API request to create/update file
    let api_url = format!("https://api.github.com/repos/{}/contents/{}", repo, file_path);

    let mut headers = Headers::new();
    headers.set("Authorization", &format!("Bearer {}", github_token))?;
    headers.set("Content-Type", "application/json")?;
    headers.set("User-Agent", "estrange-worker")?;

    let body = json!({
        "message": commit_message,
        "content": encoded_content,
        "branch": "main"
    });

    let request = Request::new_with_init(
        &api_url,
        RequestInit::new()
            .with_method(Method::Put)
            .with_headers(headers)
            .with_body(Some(JsValue::from_str(&body.to_string()))),
    )?;

    let mut response = Fetch::Request(request).send().await?;

    if (200..300).contains(&response.status_code()) {
        console_log!("Successfully archived prompt to git: {}", file_path);
        Ok(())
    } else {
        let error_text = response.text().await.unwrap_or_default();
        console_error!("GitHub API error: {} - {}", response.status_code(), error_text);
        Err(Error::from("Failed to archive to git"))
    }
}
