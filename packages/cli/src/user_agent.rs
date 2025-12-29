use std::env;

pub fn build_user_agent(client_type: &str, version: &str) -> String {
    let os = env::consts::OS;         // e.g., "macos", "linux", "windows"
    let arch = env::consts::ARCH;     // e.g., "x86_64", "aarch64"
    let runtime = "Rust";              // hardcoded for now, can be dynamic if needed

    format!("estrange-{}-{}/{} ({}; {}; {})",
        client_type.to_lowercase(),
        version,
        runtime,
        os,
        arch,
        client_type
    )
}
