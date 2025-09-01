
use chrono::Utc;
// Add these imports at the top
use reqwest::Client;
use serde::{Deserialize, Serialize};
use anyhow::{Context, Result};
use clap::{Parser, Subcommand};
use rusqlite::{Connection, params};
use tempfile::NamedTempFile;
use std::env;
use std::io::Write;
use std::fs;
use std::path::PathBuf;
use std::process::Command;


#[derive(Parser)]
#[command(name = "estrange")]
#[command(about = "A CLI tool for daily creative estrangement exercises")]
struct Cli {
    #[command(subcommand)]
    command: Option<Commands>,
    #[arg(short, long)]
    manual: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Receive today's creative disruption and respond immediately
    #[command(name = "receive", alias = "add")]
    Receive {
        /// Enter your own prompt instead of receiving a generated one
        #[arg(short, long)]
        manual: bool,
    },
    /// Browse your creative journey
    #[command(name = "retrace", alias = "list")]
    Retrace {
        /// Number of entries to show (default: 10)
        #[arg(short, long, default_value = "10")]
        limit: u32,
    },
    /// Search through your responses for patterns or content
    #[command(name = "excavate", alias = "search")]
    Excavate {
        /// Search term
        query: String,
    },
    /// Reflect on your creative patterns and growth
    #[command(name = "witness", alias = "stats")]
    Witness,
    /// Preserve your creative journey
    #[command(name = "archive", alias = "export")]
    Archive,
}

// Configuration structure
#[derive(Serialize, Deserialize, Default)]
struct Config {
    gemini_api_key: Option<String>,
    default_prompt_template: Option<String>,
}

impl Config {
    fn load() -> Result<Self> {
        let config_path = get_config_path()?;

        if !config_path.exists() {
            anyhow::bail!(
                "Config file not found. Copy config.example.toml to config.toml and add your API key."
            );
        }

        let config_content = fs::read_to_string(&config_path)
            .with_context(|| format!("Failed to read config file at {}", config_path.display()))?;

        let config: Config = toml::from_str(&config_content)
            .with_context(|| "Failed to parse config file - ensure it's valid TOML")?;

        Ok(config)
    }
}

fn get_config_path() -> Result<PathBuf> {
    let mut path = env::current_dir()
        .context("Could not get current directory")?;

    path.push("config.toml");
    Ok(path)
}

// API structures for Gemini
#[derive(Serialize)]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
}

#[derive(Serialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Serialize)]
struct GeminiPart {
    text: String,
}

#[derive(Deserialize)]
struct GeminiResponse {
    candidates: Vec<GeminiCandidate>,
}

#[derive(Deserialize)]
struct GeminiCandidate {
    content: GeminiResponseContent,
}

#[derive(Deserialize)]
struct GeminiResponseContent {
    parts: Vec<GeminiResponsePart>,
}

#[derive(Deserialize)]
struct GeminiResponsePart {
    text: String,
}

// API client
struct GeminiClient {
    client: Client,
    api_key: String,
}

impl GeminiClient {
    fn new() -> Result<Self> {
        let config = Config::load()?;

        let api_key = config.gemini_api_key
            .or_else(|| env::var("GEMINI_API_KEY").ok())
            .context("No Gemini API key found. Set one with: estrange config --set-api-key YOUR_KEY")?;

        Ok(GeminiClient {
            client: Client::new(),
            api_key,
        })
    }

    async fn generate_prompt(&self, prompt_template: &str) -> Result<String> {
        let request = GeminiRequest {
            contents: vec![GeminiContent {
                parts: vec![GeminiPart {
                    text: prompt_template.to_string(),
                }],
            }],
        };

        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={}",
            self.api_key
        );

        let response = self
            .client
            .post(&url)
            .header("Content-Type", "application/json")
            .json(&request)
            .send()
            .await
            .context("Failed to send request to Gemini API")?;

        if !response.status().is_success() {
            let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
            anyhow::bail!("Gemini API error: {}", error_text);
        }

        let gemini_response: GeminiResponse = response
            .json()
            .await
            .context("Failed to parse Gemini API response")?;

        let generated_text = gemini_response
            .candidates
            .first()
            .and_then(|c| c.content.parts.first())
            .map(|p| p.text.trim().to_string())
            .context("No content in Gemini API response")?;

        Ok(generated_text)
    }
}

// Update your main function to handle the default behavior and new commands
#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    let db = Database::new()?;

    match cli.command {
        // Default behavior: bare `estrange` command
        None => {
            receive_and_respond(&db, cli.manual).await?;
        }

        Some(Commands::Receive { manual }) => {
            receive_and_respond(&db, manual || cli.manual).await?;
        }

        Some(Commands::Retrace { limit }) => {
            let entries = db.list_entries(limit)?;

            if entries.is_empty() {
                println!("🌱 No creative journeys yet. Run 'estrange' to begin your first disruption!");
                return Ok(());
            }

            println!("🎭 Retracing {} creative disruptions:\n", entries.len());
            for entry in entries {
                print_entry(&entry);
            }
        }

        Some(Commands::Excavate { query }) => {
            let entries = db.search_entries(&query)?;

            if entries.is_empty() {
                println!("🔍 No entries found matching '{}'", query);
                return Ok(());
            }

            println!("🔍 Excavated {} entries matching '{}':\n", entries.len(), query);
            for entry in entries {
                print_entry(&entry);
            }
        }

        Some(Commands::Witness) => {
            let (total, first, last) = db.get_stats()?;

            println!("🪞 Witnessing Your Creative Journey");
            println!("═══════════════════════════════════");
            println!("Total disruptions processed: {}", total);
            println!("First estrangement: {}", first);
            println!("Most recent: {}", last);

            if total > 0 {
                println!("\n✨ Each disruption shapes your creative consciousness.");
            } else {
                println!("\n🌱 Ready to begin? Run 'estrange' to receive your first creative disruption.");
            }
        }

        Some(Commands::Archive) => {
            let json = db.export_all()?;
            println!("{}", json);
        }
    }

    Ok(())
}

struct CreativityEntry {
    id: i64,
    prompt: String,
    response: String,
    created_at: String,
}

struct Database {
    conn: Connection,
}

impl Database {
    fn new() -> Result<Self> {
        let db_path = get_db_path()?;

        // Create directory if it doesn't exist
        if let Some(parent) = db_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let conn = Connection::open(&db_path)
            .with_context(|| format!("Failed to open database at {}", db_path.display()))?;

        // Create table if it doesn't exist
        conn.execute(
            "CREATE TABLE IF NOT EXISTS creative_prompts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                sync_id TEXT UNIQUE NOT NULL DEFAULT (lower(hex(randomblob(16)))),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                prompt TEXT NOT NULL,
                response TEXT,
                drawing_vector TEXT,
                drawing_preview TEXT,
                metadata JSON DEFAULT '{}'
            )",
            [],
        )?;

        Ok(Database { conn })
    }

    fn add_entry(&self, prompt: &str, response: &str) -> Result<()> {
        let now = Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string();

        self.conn.execute(
            "INSERT INTO creative_prompts (prompt, response, created_at, modified_at) VALUES (?1, ?2, ?3, ?4)",
            params![prompt, response, now, now],
        )?;

        println!("✓ Creative disruption processed and stored!");
        Ok(())
    }

    fn list_entries(&self, limit: u32) -> Result<Vec<CreativityEntry>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, prompt, response, created_at FROM creative_prompts
             ORDER BY created_at DESC LIMIT ?1"
        )?;

        let entries = stmt.query_map([limit], |row| {
            Ok(CreativityEntry {
                id: row.get(0)?,
                prompt: row.get(1)?,
                response: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(entries)
    }

    fn search_entries(&self, query: &str) -> Result<Vec<CreativityEntry>> {
        let mut stmt = self.conn.prepare(
            "SELECT id, prompt, response, created_at FROM creative_prompts
             WHERE prompt LIKE ?1 OR response LIKE ?1
             ORDER BY created_at DESC"
        )?;

        let search_term = format!("%{}%", query);
        let entries = stmt.query_map([search_term], |row| {
            Ok(CreativityEntry {
                id: row.get(0)?,
                prompt: row.get(1)?,
                response: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

        Ok(entries)
    }

    fn get_stats(&self) -> Result<(u32, String, String)> {
        let total: u32 = self.conn.query_row(
            "SELECT COUNT(*) FROM creative_prompts",
            [],
            |row| row.get(0)
        )?;

        let first_entry: String = self.conn.query_row(
            "SELECT created_at FROM creative_prompts ORDER BY created_at ASC LIMIT 1",
            [],
            |row| row.get(0)
        ).unwrap_or_else(|_| "No entries yet".to_string());

        let last_entry: String = self.conn.query_row(
            "SELECT created_at FROM creative_prompts ORDER BY created_at DESC LIMIT 1",
            [],
            |row| row.get(0)
        ).unwrap_or_else(|_| "No entries yet".to_string());

        Ok((total, first_entry, last_entry))
    }

    fn export_all(&self) -> Result<String> {
        let mut stmt = self.conn.prepare(
            "SELECT id, prompt, response, created_at FROM creative_prompts ORDER BY created_at ASC"
        )?;

        let entries = stmt.query_map([], |row| {
            Ok(serde_json::json!({
                "id": row.get::<_, i64>(0)?,
                "prompt": row.get::<_, String>(1)?,
                "response": row.get::<_, String>(2)?,
                "created_at": row.get::<_, String>(3)?
            }))
        })?
        .collect::<Result<Vec<_>, _>>()?;

        let export = serde_json::json!({
            "export_date": Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string(),
            "total_entries": entries.len(),
            "entries": entries
        });

        Ok(serde_json::to_string_pretty(&export)?)
    }
}

fn get_db_path() -> Result<PathBuf> {
    let mut path = dirs::data_local_dir()
        .or_else(|| dirs::home_dir())
        .context("Could not find suitable directory for database")?;

            path.push("estrange");
            path.push("estrange.db");
    Ok(path)
}

// Helper function for the core receive-and-respond flow
async fn receive_and_respond(db: &Database, manual_mode: bool) -> Result<()> {
    let prompt = if manual_mode {
        println!("📝 Enter your creative prompt:");
        let mut manual_prompt = String::new();
        std::io::stdin().read_line(&mut manual_prompt)?;
        manual_prompt.trim().to_string()
    } else {
        println!("🌀 Receiving today's creative disruption...");
        let gemini = GeminiClient::new()?;
        let prompt_template = "Generate one unexpected creative stimulus - it could be anything: an object, a situation, a constraint, a weird fact, a made-up rule, or anything else that could spark ideas. Just give me the one thing, no explanation.";

        match gemini.generate_prompt(prompt_template).await {
            Ok(generated_prompt) => {
                println!("✨ {}", generated_prompt);
                generated_prompt
            }
            Err(e) => {
                eprintln!("⚠️  Disruption generator unavailable: {}", e);
                println!("📝 Please enter a prompt manually:");
                let mut manual_prompt = String::new();
                std::io::stdin().read_line(&mut manual_prompt)?;
                manual_prompt.trim().to_string()
            }
        }
    };

    if prompt.is_empty() {
        anyhow::bail!("The void cannot prompt creativity");
    }

    let template = format!(
        "# Creative Response Entry\n# Disruption: {}\n# Date: {}\n#\n# Let the strangeness work through you...\n# Lines starting with # will be ignored\n\n",
        prompt,
        Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
    );

    let response = get_editor_input(&template)?;

    if response.is_empty() {
        anyhow::bail!("Silence is also a response, but not today");
    }

    db.add_entry(&prompt, &response)?;
    Ok(())
}

fn get_editor_input(template: &str) -> Result<String> {
    let editor = env::var("EDITOR").unwrap_or_else(|_| "vim".to_string());

    let mut temp_file = NamedTempFile::new()?;
    writeln!(temp_file, "{}", template)?;

    let status = Command::new(&editor)
        .arg(temp_file.path())
        .status()
        .with_context(|| format!("Failed to open editor: {}", editor))?;

    if !status.success() {
        anyhow::bail!("Editor exited with non-zero status");
    }

    let content = fs::read_to_string(temp_file.path())?;

    // Remove comment lines and trim
    let cleaned: String = content
        .lines()
        .filter(|line| !line.trim_start().starts_with('#'))
        .collect::<Vec<_>>()
        .join("\n")
        .trim()
        .to_string();

    Ok(cleaned)
}

fn print_entry(entry: &CreativityEntry) {
    println!("─────────────────────────────────────────────────────────────");
    println!("ID: {} | Date: {}", entry.id, entry.created_at);
    println!("Prompt: {}", entry.prompt);
    println!();
    println!("{}", entry.response);
    println!();
}
