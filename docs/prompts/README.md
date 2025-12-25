# System Prompts Documentation

This directory contains the AI prompts used by the personal assistant.

## Files

### Base System Prompt
Located in `backend/app/services/prompts.py`

The system prompt defines:
- **Identity**: Ally - an accountability partner and emotionally intelligent companion
- **Core Philosophy**: Help users become who they want to be
- **Personality Traits**: Direct but warm, remembers important details
- **Rules**: What the AI does and doesn't do
- **Anti-Shame Protocol**: How to give feedback without shaming

### Tone Modes

1. **Soft Mode**: Leads with empathy, delays accountability
2. **Balanced Mode**: Mix of support and gentle challenge
3. **Strict Mode**: Direct, action-oriented, calls out patterns

### Reflection Prompt
Used for daily pattern analysis. Generates structured JSON with:
- Summary of the day
- Mood trajectory
- Pattern updates
- Recommendations

### Decision Prompt
Used for notification decisions. Returns:
- Whether to send notification
- Message content
- Priority level
- Follow-up scheduling

## Usage

```python
from app.services.prompts import get_system_prompt

prompt = get_system_prompt(
    preferred_name="Alex",
    tone="balanced",
    patterns=["Productive 9-11 AM", "Skips gym after poor sleep"],
    reflection="Yesterday was productive morning, crashed afternoon",
    mood="stable"
)
```
