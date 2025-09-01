# estrange 🌀

A CLI tool for daily creative disruption. Receive unexpected prompts, surrender to strangeness, witness your creative patterns emerge over time.

## Why?

Routine thinking creates invisible walls. `estrange` disrupts these patterns through daily creative disruption - one unexpected prompt at a time. It's not about producing brilliant ideas (though you might). It's about keeping your mind flexible and surprising.

## Installation

### From Source
```bash
git clone https://github.com/yourusername/estrange.git
cd estrange
cargo build --release
cp target/release/estrange /usr/local/bin/  # or wherever you keep binaries
```

### Binary Releases
Check the [releases page](https://github.com/yourusername/estrange/releases) for pre-built binaries.

### API Key Setup (Optional)
For automatic prompt generation, set your Gemini API key:
```bash
export GEMINI_API_KEY="your-key-here"
```

## Usage

# Note: estrange embraces the rhythm of once daily
# Multiple calls return the same prompt until tomorrow

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

## Example Disruptions

Here are some prompts `estrange` might serve you:

**"A doorknob that remembers every hand that's touched it"**
*What stories would it tell? How would this change architecture? Privacy? Security?*

**"Gravity works sideways on Tuesdays"**
*How would cities adapt? What would Tuesday fashion look like? Emergency protocols?*

**"The sound purple makes when it's thinking"**
*What does color consciousness feel like? How would you compose this? Paint it? Live it?*

**"Libraries where books read themselves to you, but only whisper the boring parts"**
*What gets whispered? What stays silent? How do you find the exciting parts?*

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

## Data Autonomy

Your creative journey belongs to you:

- **Local storage:** SQLite database, no cloud dependencies
- **Portable:** Copy your database file to move between machines
- **Private:** Nothing leaves your device unless you choose to export
- **Location:**
  - Linux: `~/.local/share/estrange/estrange.db`
  - Mac: `~/Library/Application Support/estrange/estrange.db`
  - Windows: `%LOCALAPPDATA%/estrange/estrange.db`

## Creative Pattern Analysis

After weeks or months of disruptions, analyze your creative DNA:

```bash
estrange archive > my-creative-journey.json
```

Feed this to your favorite LLM and ask:
- "What creative territories do I gravitate toward?"
- "Which prompts sparked my most expansive thinking?"
- "How has my creative process evolved?"
- "What patterns am I stuck in? How can I break them?"
- "What types of strangeness do I resist? Why might that be?"

## Philosophy

`estrange` embraces:
- **Surrender over control:** Let strangeness work through you
- **Process over product:** The thinking matters more than the output
- **Consistency over intensity:** Small daily disruptions compound
- **Privacy over sharing:** Your creative space, your rules
- **Questions over answers:** Good prompts generate more questions
- **Estrangement over familiarity:** Break patterns, see with fresh eyes
- **Autonomy over convenience:** You own your creative journey completely

*"The real voyage of discovery consists not in seeking new landscapes, but in having new eyes." - Marcel Proust*

## Future Disruptions

Ideas brewing for future versions:
- Custom prompt template system (bring your own creative philosophy)
- Pattern visualization (see your creative DNA graphically)
- Multi-modal responses (sketching, voice notes, mixed media)
- Temporal analysis (how does creativity change with seasons, moods, events?)

## Contributing

Found a bug? Have an idea for creative enhancement? Pull requests welcome.

This tool believes in doing one thing well: **daily creative disruption**. Feature requests should align with this core mission.

## License

MIT License - disrupt freely, share widely.

---

*"I can't understand why people are frightened of new ideas. I'm frightened of the old ones." - John Cage*
