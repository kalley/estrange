# estrange CLI

Terminal-based daily creative disruption for developers, writers, and command-line enthusiasts.

## Installation

### From Source
```bash
git clone https://github.com/kalley/estrange.git
cd estrange
cargo build --release
cp target/release/estrange /usr/local/bin/  # or wherever you keep binaries
```

### Binary Releases
Check the [releases page](https://github.com/kalley/estrange/releases) for pre-built binaries.

### API Key Setup (Optional)
For automatic prompt generation, set your Gemini API key:
```bash
export GEMINI_API_KEY="your-key-here"
```

## Usage

### The Daily Ritual
Simply run:
```bash
estrange
```

This will:
1. 🌀 Receive today's creative disruption (auto-generated)
2. ✨ Present you with an unexpected prompt
3. 📝 Open your editor to process the strangeness
4. 💾 Store your creative response

### Manual Mode
Want to bring your own prompt?
```bash
estrange --manual
```

### Commands

```bash
# The core ritual - receive disruption and respond
estrange

# Enter your own prompt instead of receiving one
estrange --manual

# Browse your creative journey
estrange retrace           # (alias: list)
estrange retrace --limit 5

# Search through your responses for patterns
estrange excavate "doorknob"    # (alias: search)
estrange excavate "gravity"

# Reflect on your creative patterns and growth
estrange witness           # (alias: stats)

# Preserve your creative journey
estrange archive           # (alias: export)
```

## Prompt Generators

`estrange` uses this default generator:
```
Generate one unexpected creative stimulus - it could be anything: an object, a situation, a constraint, a weird fact, a made-up rule, or anything else that could spark ideas. Just give me the one thing, no explanation.
```

### Alternative Generators (for manual mode)

**Assumption Breakers:**
```
Give me a "what if" scenario that challenges a common assumption about how the world works. Just the scenario, no elaboration.
```

**Abstract Provocations:**
```
Generate one abstract creative prompt that could be interpreted in multiple ways - it might be poetic, philosophical, or just wonderfully weird.
```

**Constraint Catalysts:**
```
Give me one creative constraint or limitation that could spark interesting ideas. It could be a rule, a restriction, or an unusual requirement.
```

## Data Storage

Your creative journey is stored locally in SQLite:

**Database Location:**
- Linux: `~/.local/share/estrange/estrange.db`
- Mac: `~/Library/Application Support/estrange/estrange.db`
- Windows: `%LOCALAPPDATA%/estrange/estrange.db`

**Export Your Journey:**
```bash
estrange archive > my-creative-journey.json
```

## Integration & Automation

The CLI tool is perfect for:
- **Daily cron jobs:** `0 9 * * * /usr/local/bin/estrange`
- **Git hooks:** Add creative breaks to your development workflow
- **Scripting:** Integrate with other creative tools
- **Tmux/Screen sessions:** Background creative disruption

## Editor Integration

`estrange` respects your `$EDITOR` environment variable. Works great with:
- vim/neovim
- emacs
- VSCode (`code --wait`)
- Any terminal-based editor

## Future CLI Features

Ideas brewing:
- Custom prompt template system
- Pattern visualization in terminal
- Multi-modal responses (audio, sketches)
- Plugin system for custom generators

## Troubleshooting

**Editor not opening?**
```bash
export EDITOR="your-preferred-editor"
```

**Permission issues?**
```bash
chmod +x /usr/local/bin/estrange
```

**API key not working?**
```bash
echo $GEMINI_API_KEY  # Should show your key
```

## Back to Main Documentation
See the [main README](../../README.md) for philosophy, examples, and general information about estrange.
