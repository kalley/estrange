use anyhow::{Context, Result};
use chrono::Utc;
use clap::{Parser, Subcommand};
use rusqlite::{Connection, params};
use std::env;
use std::fs;
use std::io::Write;
use std::path::PathBuf;
use std::process::Command;
use tempfile::NamedTempFile;

#[derive(Parser)]
#[command(name = "riff")]
#[command(about = "A CLI tool for daily creative riffs on random prompts")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Add a new creative prompt and response
    Add,
    /// List recent entries
    List {
        /// Number of entries to show (default: 10)
        #[arg(short, long, default_value = "10")]
        limit: u32,
    },
    /// Search entries by prompt or response content
    Search {
        /// Search term
        query: String,
    },
    /// Show statistics about your creative entries
    Stats,
    /// Export all data as JSON
    Export,
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
                prompt TEXT NOT NULL,
                response TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )",
            [],
        )?;

        Ok(Database { conn })
    }

    fn add_entry(&self, prompt: &str, response: &str) -> Result<()> {
        let now = Utc::now().format("%Y-%m-%d %H:%M:%S UTC").to_string();

        self.conn.execute(
            "INSERT INTO creative_prompts (prompt, response, created_at) VALUES (?1, ?2, ?3)",
            params![prompt, response, now],
        )?;

        println!("✓ Creative entry added successfully!");
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

            path.push("riff");
            path.push("riff.db");
    Ok(path)
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

fn main() -> Result<()> {
    let cli = Cli::parse();
    let db = Database::new()?;

    match cli.command {
        Commands::Add => {
            println!("Enter the creative prompt you received:");
            let mut prompt = String::new();
            std::io::stdin().read_line(&mut prompt)?;
            let prompt = prompt.trim().to_string();

            if prompt.is_empty() {
                anyhow::bail!("Prompt cannot be empty");
            }

            let template = format!(
                "# Creative Response Entry\n# Prompt: {}\n# Date: {}\n#\n# Enter your creative response below:\n# Lines starting with # will be ignored\n\n",
                prompt,
                Utc::now().format("%Y-%m-%d %H:%M:%S UTC")
            );

            let response = get_editor_input(&template)?;

            if response.is_empty() {
                anyhow::bail!("Response cannot be empty");
            }

            db.add_entry(&prompt, &response)?;
        }

        Commands::List { limit } => {
            let entries = db.list_entries(limit)?;

            if entries.is_empty() {
                println!("No entries found. Use 'riff add' to create your first entry!");
                return Ok(());
            }

            println!("Recent {} creative entries:\n", entries.len());
            for entry in entries {
                print_entry(&entry);
            }
        }

        Commands::Search { query } => {
            let entries = db.search_entries(&query)?;

            if entries.is_empty() {
                println!("No entries found matching '{}'", query);
                return Ok(());
            }

            println!("Found {} entries matching '{}':\n", entries.len(), query);
            for entry in entries {
                print_entry(&entry);
            }
        }

        Commands::Stats => {
            let (total, first, last) = db.get_stats()?;

            println!("📊 Riff Statistics");
            println!("═══════════════════════════════");
            println!("Total entries: {}", total);
            println!("First entry: {}", first);
            println!("Latest entry: {}", last);

            if total > 0 {
                println!("\n💡 Keep the creative momentum going!");
            } else {
                println!("\n🌱 Ready to start your creative journey? Use 'add' to create your first entry!");
            }
        }

        Commands::Export => {
            let json = db.export_all()?;
            println!("{}", json);
        }
    }

    Ok(())
}
