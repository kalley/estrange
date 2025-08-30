# riff 🎵

A simple CLI tool for daily creative exercises. Get a random prompt, riff on it, track your creative growth over time.

## Why?

Creative thinking is like a muscle - it gets stronger with regular exercise. But work creativity often comes with constraints and expectations. `riff` gives you a space for unconstrained creative exploration, one prompt at a time.

## Installation

### From Source
```bash
git clone https://github.com/yourusername/riff.git
cd riff
cargo build --release
cp target/release/riff /usr/local/bin/  # or wherever you keep binaries
```

### Binary Releases
Check the [releases page](https://github.com/yourusername/riff/releases) for pre-built binaries.

## Usage

### Daily Workflow
1. Get a random creative prompt from your favorite LLM (see examples below)
2. Run `riff add` and enter the prompt
3. Your editor opens with a template - brain dump whatever comes to mind
4. Save and quit - your creative riff is stored

### Commands

```bash
# Add a new creative riff
riff add

# List recent entries (default: 10)
riff list
riff list --limit 5

# Search your riffs
riff search "doorknob"
riff search "gravity"

# See your creative statistics
riff stats

# Export all data as JSON (great for analysis)
riff export
```

## Getting Creative Prompts

The magic happens when you feed these prompt generators to an LLM:

### Basic Prompt Generator
```
Generate one unexpected creative stimulus - it could be anything: an object, a situation, a constraint, a weird fact, a made-up rule, or anything else that could spark ideas. Just give me the one thing, no explanation.
```

### Alternative Prompt Styles

**For object-based thinking:**
```
Give me one random object, concept, or phenomenon with an unusual twist or property. No explanation, just the thing.
```

**For constraint-based creativity:**
```
Give me one creative constraint or limitation that could spark interesting ideas. It could be a rule, a restriction, or an unusual requirement.
```

**For "what if" scenarios:**
```
Give me a "what if" scenario that challenges a common assumption about how the world works. Just the scenario, no elaboration.
```

**For abstract prompts:**
```
Generate one abstract creative prompt that could be interpreted in multiple ways - it might be poetic, philosophical, or just wonderfully weird.
```

## Example Prompts and Responses

Here are some example prompts and the kinds of thinking they might spark:

**Prompt:** "A doorknob that remembers every hand that's touched it"
**Possible riffs:** Security implications, emotional imprints, stories it could tell, therapeutic applications, privacy concerns, historical documentation...

**Prompt:** "Gravity works sideways on Tuesdays"
**Possible riffs:** Urban planning adaptations, Tuesday fashion, emergency protocols, sports rule changes, architectural solutions...

**Prompt:** "The sound purple makes when it's thinking"
**Possible riffs:** Synesthesia exploration, color psychology, abstract music composition, meditation techniques, AI consciousness metaphors...

## Data Storage

Your riffs live in a local SQLite database:
- **Linux/Mac:** `~/.local/share/riff/riff.db`
- **Windows:** `%LOCALAPPDATA%/riff/riff.db`

The database is portable - just copy it to move your creative history between machines.

## Analysis and Insights

After collecting riffs for a while, try exporting your data and asking an LLM to analyze patterns:

```bash
riff export > my-creative-journey.json
```

Then ask questions like:
- "What themes do I gravitate toward in my creative thinking?"
- "How has my creative process evolved over time?"
- "What types of prompts spark the most expansive thinking for me?"
- "Are there creative territories I haven't explored yet?"

## Philosophy

`riff` is built on the idea that creativity thrives with:
- **Low friction:** One command, open editor, done
- **No judgment:** Your riffs are private by default
- **Ownership:** Your data, your tool, your creative journey
- **Consistency:** Small daily practice over sporadic bursts

The goal isn't to produce brilliant ideas every day (though you might!). It's to keep your creative thinking flexible and surprising.

## Contributing

This is a simple tool that does one thing well. That said, if you have ideas for improvements, issues, or want to add features, pull requests are welcome.

Some ideas for future enhancements:
- Built-in LLM integration for automatic prompt generation
- Configurable prompt templates
- Basic analytics/visualization
- Export formats for different analysis tools

## License

MIT License - use it, modify it, share it.

---

*"The best way to have a good idea is to have a lot of ideas." - Linus Pauling*
