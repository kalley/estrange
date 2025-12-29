// Add these to your Cargo.toml dependencies:
// prometheus = "0.13"
// serde_json = "1.0"

use anyhow::{Context, Result};
use prometheus::{proto::MetricFamily, Counter, Gauge, Histogram, Registry};
use serde::{Deserialize, Serialize};
use prometheus_reqwest_remote_write::WriteRequest;
use std::sync::OnceLock;
use std::time::Instant;

use crate::{user_agent::{build_user_agent}, Config, Database};

// Global metrics registry
static METRICS: OnceLock<EstrangeMetrics> = OnceLock::new();

pub struct EstrangeMetrics {
    registry: Registry,

    // Core engagement
    prompts_generated: Counter,
    prompts_manual: Counter,
    responses_completed: Counter,
    responses_abandoned: Counter,
    session_completed: Counter,

    // Command usage
    command_usage: prometheus::CounterVec,

    // Creative depth
    response_word_count: Histogram,
    response_duration_seconds: Histogram,
    session_duration_seconds: Histogram,

    // Journey tracking
    search_queries: Counter,
    archive_exports: Counter,
    current_streak: Gauge,
    total_entries: Gauge,
}

impl EstrangeMetrics {
    fn new() -> Result<Self> {
        let registry = Registry::new();

        let prompts_generated = Counter::new(
            "estrange_prompts_generated_total",
            "Total number of AI-generated creative prompts"
        )?;

        let prompts_manual = Counter::new(
            "estrange_prompts_manual_total",
            "Total number of manually entered prompts"
        )?;

        let responses_completed = Counter::new(
            "estrange_responses_completed_total",
            "Total number of completed creative responses"
        )?;

        let responses_abandoned = Counter::new(
            "estrange_responses_abandoned_total",
            "Total number of abandoned creative sessions"
        )?;

        let command_usage = prometheus::CounterVec::new(
            prometheus::Opts::new("estrange_command_usage_total", "Usage count by command"),
            &["command"]
        )?;

        let response_word_count = Histogram::with_opts(
            prometheus::HistogramOpts::new("estrange_response_words", "Word count distribution of responses")
                .buckets(vec![10.0, 25.0, 50.0, 100.0, 250.0, 500.0, 1000.0])
        )?;

        let response_duration_seconds = Histogram::with_opts(
            prometheus::HistogramOpts::new("estrange_response_duration_seconds", "Time spent writing responses")
                .buckets(vec![30.0, 60.0, 300.0, 600.0, 1200.0, 1800.0]) // 30s to 30min
        )?;

        let session_duration_seconds = Histogram::with_opts(
            prometheus::HistogramOpts::new("estrange_session_duration_seconds", "Duration of creative sessions")
                .buckets(vec![30.0, 60.0, 300.0, 600.0, 1200.0, 1800.0]) // 30s to 30min
        )?;

        let session_completed = Counter::new(
            "estrange_sessions_completed_total",
            "Total number of completed creative sessions"
        )?;

        let search_queries = Counter::new(
            "estrange_search_queries_total",
            "Total number of excavate/search queries"
        )?;

        let archive_exports = Counter::new(
            "estrange_archive_exports_total",
            "Total number of journey exports"
        )?;

        let current_streak = Gauge::new(
            "estrange_current_streak_days",
            "Current consecutive days of creative disruption"
        )?;

        let total_entries = Gauge::new(
            "estrange_total_entries",
            "Total number of creative entries in database"
        )?;

        // Register all metrics
        registry.register(Box::new(prompts_generated.clone()))?;
        registry.register(Box::new(prompts_manual.clone()))?;
        registry.register(Box::new(responses_completed.clone()))?;
        registry.register(Box::new(responses_abandoned.clone()))?;
        registry.register(Box::new(command_usage.clone()))?;
        registry.register(Box::new(response_word_count.clone()))?;
        registry.register(Box::new(response_duration_seconds.clone()))?;
        registry.register(Box::new(search_queries.clone()))?;
        registry.register(Box::new(archive_exports.clone()))?;
        registry.register(Box::new(current_streak.clone()))?;
        registry.register(Box::new(total_entries.clone()))?;
        registry.register(Box::new(session_duration_seconds.clone()))?;

        Ok(EstrangeMetrics {
            registry,
            prompts_generated,
            prompts_manual,
            responses_completed,
            responses_abandoned,
            command_usage,
            response_word_count,
            response_duration_seconds,
            search_queries,
            archive_exports,
            current_streak,
            total_entries,
            session_completed,
            session_duration_seconds,
        })
    }

    // Increment methods
    pub fn prompt_generated(&self, length: usize) {
        self.prompts_generated.inc_by(length as f64);
    }

    pub fn prompt_manual(&self, length: usize) {
        self.prompts_manual.inc_by(length as f64);
    }

    pub fn response_completed(&self, word_count: usize, duration_secs: u64) {
        self.responses_completed.inc();
        self.response_word_count.observe(word_count as f64);
        self.response_duration_seconds.observe(duration_secs as f64);
    }

    pub fn session_completed(&self, total_session_secs: u64) {
        self.session_completed.inc();
        self.session_duration_seconds.observe(total_session_secs as f64);
    }

    pub fn response_abandoned(&self) {
        self.responses_abandoned.inc();
    }

    pub fn command_used(&self, command: &str) {
        self.command_usage.with_label_values(&[command]).inc();
    }

    pub fn search_performed(&self) {
        self.search_queries.inc();
    }

    pub fn archive_exported(&self) {
        self.archive_exports.inc();
    }

    pub fn update_streak(&self, days: i64) {
        self.current_streak.set(days as f64);
    }

    pub fn update_total_entries(&self, count: i64) {
        self.total_entries.set(count as f64);
    }

    // Export metrics for sending to Grafana
    pub fn export_metrics(&self) -> Vec<MetricFamily> {
        self.registry.gather()
    }
}

// Initialize metrics (call this in main)
pub fn init_metrics() -> Result<()> {
    let metrics = EstrangeMetrics::new()?;
    METRICS.set(metrics).map_err(|_| anyhow::anyhow!("Metrics already initialized"))?;
    Ok(())
}

// Get metrics instance
pub fn metrics() -> Option<&'static EstrangeMetrics> {
    METRICS.get()
}

// Async function to send metrics to Grafana Cloud
pub async fn send_metrics_to_grafana() -> Result<()> {
    let config = Config::load()?;

    let Some(metrics_config) = config.metrics else {
        return Ok(());
    };

    if let Some(metrics_enabled) = metrics_config.metrics_enabled {
        if !metrics_enabled {
            return Ok(());
        }
    }

    let grafana_url = metrics_config.grafana_push_url
        .ok_or_else(|| anyhow::anyhow!("grafana_push_url not configured"))?;
    let grafana_user = metrics_config.grafana_user
        .ok_or_else(|| anyhow::anyhow!("grafana_user not configured"))?;
    let grafana_token = metrics_config.grafana_token
        .ok_or_else(|| anyhow::anyhow!("grafana_token not configured"))?;

    let metrics_data = if let Some(m) = metrics() {
        m.export_metrics()
    } else {
        return Ok(());
    };

    // Compress the metrics data with snappy
    let write_request = WriteRequest::from_metric_families(metrics_data, None).map_err(|e| {
        anyhow::anyhow!("Failed to create WriteRequest: {}", e)
    })?;

    let client = reqwest::Client::new();
    let http_request = write_request.build_http_request(client.clone(), &grafana_url, &build_user_agent("estrange", "0.1.1"))?;

    let response = reqwest::RequestBuilder::from_parts(client, http_request).basic_auth(&grafana_user, Some(&grafana_token))
        .send()
        .await
        .context("Failed to send HTTP request to Grafana")?;

    let status = response.status();

    if !status.is_success() {
        let error_body = response.text().await
            .unwrap_or_else(|_| "Could not read error response".to_string());
        anyhow::bail!("Grafana API error {}: {}", status, error_body);
    }

    println!("✅ Metrics successfully sent to Grafana");
    Ok(())
}

// Timer helper for measuring both response time and total session time
pub struct SessionTimer {
    session_start: Instant,
    response_start: Option<Instant>,
}

impl SessionTimer {
    pub fn new() -> Self {
        Self {
            session_start: Instant::now(),
            response_start: None,
        }
    }

    pub fn start_response(&mut self) {
        self.response_start = Some(Instant::now());
    }

    pub fn finish_with_response(&self, response: &str) {
        let session_duration = self.session_start.elapsed().as_secs();
        let response_duration = self.response_start
            .map(|start| start.elapsed().as_secs())
            .unwrap_or(0);

        let word_count = response.split_whitespace().count();

        if let Some(m) = metrics() {
            m.response_completed(word_count, response_duration);
            m.session_completed(session_duration);
        }
    }

    pub fn abandon(&self) {
        if let Some(m) = metrics() {
            m.response_abandoned();
        }
        // Still record session time for abandoned sessions
        let session_duration = self.session_start.elapsed().as_secs();
        if let Some(m) = metrics() {
            m.session_completed(session_duration);
        }
    }
}

// Drop implementation to ensure gauges get updated even on crashes/panics
impl Drop for SessionTimer {
    fn drop(&mut self) {
        // Only update if we haven't already recorded completion/abandonment
        // This catches cases where the process exits unexpectedly
        if let Some(m) = metrics() {
            let session_duration = self.session_start.elapsed().as_secs();
            if session_duration > 0 {
                m.session_completed(session_duration);
            }
        }
    }
}

// Add to your Database impl for tracking streaks
impl Database {
    pub fn calculate_current_streak(&self) -> Result<i64> {
        let mut stmt = self.conn.prepare(
            "SELECT date(substr(created_at, 1, 10)) as date_only
             FROM creative_prompts
             ORDER BY date_only DESC"
        )?;

        let dates: Vec<String> = stmt.query_map([], |row| {
            Ok(row.get::<_, String>(0)?)
        })?
        .collect::<Result<Vec<_>, _>>()?;

        if dates.is_empty() {
            return Ok(0);
        }

        let mut streak = 0i64;
        let mut current_date = chrono::Utc::now().date_naive();

        for date_str in dates {
            let entry_date = chrono::NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")?;

            if entry_date == current_date ||
               (streak == 0 && entry_date == current_date - chrono::Duration::days(1)) {
                streak += 1;
                current_date = entry_date - chrono::Duration::days(1);
            } else {
                break;
            }
        }

        Ok(streak)
    }

    pub fn update_metrics(&self) -> Result<()> {
        let total: i64 = self.conn.query_row(
            "SELECT COUNT(*) FROM creative_prompts",
            [],
            |row| row.get(0)
        )?;

        let streak = self.calculate_current_streak()?;

        if let Some(m) = metrics() {
            m.update_total_entries(total);
            m.update_streak(streak);
        }

        Ok(())
    }
}

// Update your Config struct to include Grafana settings
#[derive(Serialize, Deserialize, Default)]
pub struct MetricsConfig {
    // Add these to your existing Config struct
    grafana_push_url: Option<String>,
    grafana_user: Option<String>,
    grafana_token: Option<String>,
    metrics_enabled: Option<bool>,
}
