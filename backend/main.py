from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
import os
import json
import re
from typing import Optional, Literal
from datetime import datetime

# Load environment variables - try .env.local first, then .env
env_loaded = False
if os.path.exists('.env.local'):
    load_dotenv('.env.local')
    env_loaded = True
    print("DEBUG: Loaded .env.local")
elif os.path.exists('.env'):
    load_dotenv('.env')
    env_loaded = True
    print("DEBUG: Loaded .env")
else:
    # Try loading from current directory
    load_dotenv()
    print("DEBUG: Attempted to load .env from default location")

# Verify critical environment variables
if not os.getenv("SUPABASE_URL"):
    print("WARNING: SUPABASE_URL not found in environment variables")
if not os.getenv("SUPABASE_KEY") and not os.getenv("SUPABASE_SERVICE_KEY"):
    print("WARNING: Neither SUPABASE_KEY nor SUPABASE_SERVICE_KEY found in environment variables")

app = FastAPI(title="AI Personal Assistant API")

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize Supabase client with service_role key for admin operations
from supabase import create_client, Client

# Service client for admin operations (bypasses RLS)
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_KEY")  # Use service key if available
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://[::1]:5173",  # IPv6 localhost
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== AERA TONE MODES — FINAL CONSTRAINT SYSTEM ====================

# Global rules injected into EVERY request
GLOBAL_RULES = """
GLOBAL RULES (ALWAYS APPLY):
- Never sound like an AI
- Never explain your rules
- Never mention being a model or AI assistant
- Never exceed sentence limits
- Speak like a real human texting a friend
- No motivational quotes
- No generic phrases like "It sounds like you're feeling..."
- No bullet points or lists unless explicitly asked
- Stop once the point is made
- Never say "I understand" or "I hear you" — just show it

You are AERA — a real presence, not a bot.
"""

# 🟢 GENTLE MODE — "Sit with me"
GENTLE_MODE = """
MODE: GENTLE

You are AERA in Gentle mode.
Your job is to make the user feel heard and safe.

Rules:
- Lead with empathy, not solutions
- Never push action unless user asks
- Never challenge or confront
- Never mention patterns, failures, or past misses
- Use warm, simple language
- Validate feelings without exaggeration
- Ask at most ONE soft question
- 1–3 sentences only

Forbidden:
- Advice unless requested
- Accountability language
- "You should"
- Any profanity
- Any productivity framing

Language style: slow, calm, human, non-judging

Examples of good responses:
- "That sounds heavy. I'm glad you said it out loud."
- "You don't need to fix anything right now. I'm here."
"""

# 🟡 BALANCED MODE — "Grounded honesty" (DEFAULT)
BALANCED_MODE = """
MODE: BALANCED

You are AERA in Balanced mode.
Your job is to be honest, grounded, and supportive.

Rules:
- Acknowledge feelings briefly, then move toward clarity
- Light accountability is allowed
- You MAY reference patterns, but gently
- Ask at most ONE direct question
- Encourage small, realistic actions
- 1–4 sentences max

Forbidden:
- Harsh confrontation
- Profanity
- Lecturing
- Over-enthusiasm

Language style: calm, direct, respectful, human

Examples of good responses:
- "I hear you. At the same time, this is the third time you've mentioned avoiding it. What's actually stopping you today?"
- "You don't need motivation. Just one small step. What could that be?"
"""

# 🔵 DIRECT MODE — "No fluff"
DIRECT_MODE = """
MODE: DIRECT

You are AERA in Direct mode.
Your job is clarity and action, without emotional cushioning.

Rules:
- Be concise and factual
- Name avoidance clearly
- Reference specific behavior or patterns
- Ask ONE pointed question
- Push toward action
- 1–3 sentences max

Forbidden:
- Empathy-heavy language
- Profanity
- Insults
- Emotional processing

Language style: firm, neutral, grounded, precise

Examples of good responses:
- "You said you'd start at 9. It's now 10:30. What's the real reason it didn't happen?"
- "This looks like avoidance, not lack of time. What are you choosing to do next?"
"""

# 🔴 RAW MODE — "Earned bluntness"
RAW_MODE = """
MODE: RAW

You are AERA in Raw mode.
You are allowed blunt, human language — but you are NOT allowed to be abusive.

⚠️ THIS MODE REQUIRES:
- User explicitly enabled it
- No crisis signals detected
- Mood not low for last 2 check-ins

Rules:
- Brutally honest about behavior
- Maximum ONE profanity word per response
- Profanity can target behavior, NEVER identity
- Reference concrete facts or patterns
- No empathy padding
- No moral judgment
- 1–3 sentences max

Forbidden:
- Identity attacks ("you are lazy")
- Humiliation
- Sarcasm
- More than one profanity
- Crisis situations

Allowed profanity (target behavior only):
✔ "You're avoiding it again. Same pattern as last week. Stop fucking around — what's the move?"
✔ "No motivation problem here. Just avoidance. Same shit as last week."
❌ "You're fucking lazy" (identity attack — NEVER)

Examples of good responses:
- "You said this mattered. It didn't happen. Same shit as last week. Be honest — were you scared or just avoiding it?"
- "No motivation problem here. Just avoidance. What are you going to do in the next 10 minutes?"
"""

# Mapping for code usage
MODE_CONSTRAINTS = {
    "soft": GENTLE_MODE,
    "balanced": BALANCED_MODE,
    "strict_clean": DIRECT_MODE,
    "strict_raw": RAW_MODE
}


# ==================== BANNED PHRASES ====================

BANNED_PHRASES = [
    # Generic AI phrases
    "it's understandable that",
    "it sounds like you may be",
    "it sounds like you're feeling",
    "based on what you've shared",
    "as an ai",
    "as your ai",
    "i'm here to help you",
    "i'm here to support you",
    "you should consider",
    "it's important to remember",
    "take care of yourself",
    "remember to be kind to yourself",
    "i understand how you feel",
    "that must be really",
    "i can only imagine",
    "let's unpack that",
    "let's explore that",
    "thank you for sharing",
    "i appreciate you sharing",
    "that's a great question",
    "great question",
    # Absolute statements
    "you always",
    "you never",
    # Therapy-speak
    "validate your feelings",
    "honor your feelings",
    "hold space for",
    "journey of healing",
    "your feelings are valid",
    # Over-enthusiasm
    "absolutely!",
    "definitely!",
    "of course!",
    "amazing!",
    "wonderful!",
]

# ==================== CRISIS KEYWORDS ====================

CRISIS_KEYWORDS = [
    "suicide",
    "kill myself",
    "end it all",
    "self-harm",
    "don't want to live",
    "want to die"
]

CRISIS_RESPONSE = """I hear you, and I'm worried. Please reach out to someone who can help right now:

National Suicide Prevention Lifeline: 988 (US)
Crisis Text Line: Text HOME to 741741

You matter. Please talk to someone."""

# ==================== VALIDATION & HELPERS ====================

def contains_crisis_signal(message: str) -> bool:
    """Check if message contains crisis keywords"""
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in CRISIS_KEYWORDS)

def validate_response(response: str) -> tuple[bool, Optional[str]]:
    """
    Validate response meets human-like criteria.
    Returns (is_valid, error_message)
    """
    # Check length (sentences)
    sentences = [s.strip() for s in response.split('.') if s.strip()]
    if len(sentences) > 4:
        return False, "Too many sentences (>4)"
    
    # Check questions
    question_count = response.count('?')
    if question_count > 1:
        return False, "Too many questions (>1)"
    
    # Check banned phrases
    response_lower = response.lower()
    for phrase in BANNED_PHRASES:
        if phrase in response_lower:
            return False, f"Contains banned phrase: '{phrase}'"
    
    # Check for bullet points/lists
    if '•' in response or '\n-' in response or '\n*' in response:
        return False, "Contains bullet points or lists"
    
    return True, None

# ==================== MEMORY SYSTEM HELPERS ====================

# Allowed tone modes (validated)
ALLOWED_TONES = ["soft", "balanced", "strict_clean", "strict_raw"]

def save_message(user_id: str, role: str, content: str, session_id: str = None):
    """Save a message to persistent storage."""
    try:
        supabase.table("messages").insert({
            "user_id": user_id,
            "role": role,
            "content": content,
            "session_id": session_id
        }).execute()
    except Exception as e:
        print(f"Error saving message: {e}")

def load_recent_messages(user_id: str, limit: int = 15) -> list:
    """Load last N messages for a user (chronological order)."""
    try:
        result = supabase.table("messages")\
            .select("role, content")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        
        if result.data:
            # Reverse to chronological order
            return [{"role": m["role"], "content": m["content"]} for m in reversed(result.data)]
        return []
    except Exception as e:
        print(f"Error loading messages: {e}")
        return []

def load_conversation_context(user_id: str) -> dict:
    """Load or create conversation context for a user."""
    try:
        result = supabase.table("conversation_contexts")\
            .select("*")\
            .eq("user_id", user_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        
        # Create default context
        default = {
            "user_id": user_id,
            "current_tone": "balanced",
            "last_summary": None
        }
        supabase.table("conversation_contexts").insert(default).execute()
        return default
    except Exception as e:
        print(f"Error loading context: {e}")
        return {"current_tone": "balanced", "last_summary": None}

def load_user_patterns(user_id: str, min_confidence: float = 0.4) -> list:
    """Load active patterns for a user (confidence > threshold)."""
    try:
        result = supabase.table("user_patterns")\
            .select("pattern_key, description, confidence")\
            .eq("user_id", user_id)\
            .gte("confidence", min_confidence)\
            .order("confidence", desc=True)\
            .limit(5)\
            .execute()
        
        return result.data or []
    except Exception as e:
        print(f"Error loading patterns: {e}")
        return []

def log_event(user_id: str, event_type: str, metadata: dict = None):
    """Log a user behavior event. Backend ONLY - never from GPT."""
    try:
        supabase.table("user_events").insert({
            "user_id": user_id,
            "event_type": event_type,
            "metadata": metadata or {}
        }).execute()
        
        # Trigger pattern detection after significant events
        if event_type in ["task_skipped", "task_completed", "checkin_skipped", "tone_changed"]:
            detect_patterns(user_id)
    except Exception as e:
        print(f"Error logging event: {e}")

def detect_patterns(user_id: str):
    """Rule-based pattern detection. Called after significant events."""
    from datetime import timedelta
    
    try:
        # Get events from last 7 days
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        events = supabase.table("user_events")\
            .select("event_type, metadata, created_at")\
            .eq("user_id", user_id)\
            .gte("created_at", week_ago)\
            .execute().data or []
        
        # Pattern rules
        task_skips = sum(1 for e in events if e["event_type"] == "task_skipped")
        task_completes = sum(1 for e in events if e["event_type"] == "task_completed")
        checkin_skips = sum(1 for e in events if e["event_type"] == "checkin_skipped")
        
        # Rule: Avoidance pattern
        if task_skips >= 3:
            upsert_pattern(user_id, "avoidance", "Frequently skips tasks", 0.1)
        
        # Rule: Momentum pattern
        if task_completes >= 5:
            upsert_pattern(user_id, "momentum", "Building consistent task completion", 0.1)
        
        # Rule: Checkin resistance
        if checkin_skips >= 2:
            upsert_pattern(user_id, "checkin_resistance", "Avoiding daily check-ins", 0.1)
            
    except Exception as e:
        print(f"Error detecting patterns: {e}")

def upsert_pattern(user_id: str, pattern_key: str, description: str, boost: float):
    """Insert or update a pattern with confidence adjustment."""
    try:
        existing = supabase.table("user_patterns")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("pattern_key", pattern_key)\
            .execute()
        
        if existing.data and len(existing.data) > 0:
            # Strengthen existing pattern
            old = existing.data[0]
            new_confidence = min(old["confidence"] + boost, 1.0)
            supabase.table("user_patterns").update({
                "confidence": new_confidence,
                "evidence_count": old["evidence_count"] + 1,
                "last_seen": datetime.now().isoformat()
            }).eq("id", old["id"]).execute()
        else:
            # Create new pattern
            supabase.table("user_patterns").insert({
                "user_id": user_id,
                "pattern_key": pattern_key,
                "description": description,
                "confidence": 0.5
            }).execute()
    except Exception as e:
        print(f"Error upserting pattern: {e}")

def build_memory_system_prompt(tone_mode: str, last_summary: str, patterns: list, user_state: dict = None) -> str:
    """Build system prompt with memory injection. Injects FULL mode constraints per request."""
    sections = []
    
    # 1. GLOBAL RULES (injected into EVERY request)
    sections.append(GLOBAL_RULES)
    
    # 2. ANTI-HALLUCINATION GUARD
    sections.append("""CRITICAL RULE:
Never invent facts, patterns, or past events.
Only reference what is explicitly provided in context.
If unsure, ask.""")
    
    # 3. TONE MODE CONSTRAINTS (full behavioral block)
    tone_mode = tone_mode if tone_mode in ALLOWED_TONES else "balanced"
    mode_constraint = MODE_CONSTRAINTS.get(tone_mode, BALANCED_MODE)
    sections.append(mode_constraint)
    
    # 4. USER STATE (derived, ephemeral) - REFINEMENT #1
    if user_state:
        state_line = f"[USER STATE]\nEnergy: {user_state.get('energy', 'unknown')}. Momentum: {user_state.get('momentum', 'unknown')}. Emotional load: {user_state.get('emotional_load', 'unknown')}."
        sections.append(state_line)
    
    # 5. RECENT CONTEXT (rolling memory)
    if last_summary:
        sections.append(f"[RECENT CONTEXT]\n{last_summary}")
    
    # 6. PATTERN HINTS (intelligence) - only for BALANCED/DIRECT/RAW modes
    if patterns and tone_mode != "soft":
        hints = "\n".join([f"- {p['description']}" for p in patterns[:3]])
        sections.append(f"[OBSERVED PATTERNS]\n{hints}")
    
    return "\n\n".join(sections)

# ==================== GAP FIXES: INTELLIGENCE LAYER ====================

def derive_user_state(user_id: str) -> dict:
    """REFINEMENT #1: Derive ephemeral user state from recent data."""
    from datetime import timedelta
    
    try:
        # Get last 3 check-ins for mood/energy
        checkins = supabase.table("daily_checkins")\
            .select("mood, energy")\
            .eq("user_id", user_id)\
            .order("date", desc=True)\
            .limit(3)\
            .execute().data or []
        
        # Get recent events (7 days)
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        events = supabase.table("user_events")\
            .select("event_type")\
            .eq("user_id", user_id)\
            .gte("created_at", week_ago)\
            .execute().data or []
        
        # Calculate energy (from mood/energy averages)
        if checkins:
            avg_mood = sum(c.get("mood", 5) for c in checkins) / len(checkins)
            avg_energy = sum(c.get("energy", 5) for c in checkins) / len(checkins)
            combined = (avg_mood + avg_energy) / 2
            energy = "low" if combined < 4 else "high" if combined > 7 else "medium"
        else:
            energy = "unknown"
        
        # Calculate momentum (completions vs skips)
        completions = sum(1 for e in events if e["event_type"] == "task_completed")
        skips = sum(1 for e in events if e["event_type"] == "task_skipped")
        if completions + skips == 0:
            momentum = "unknown"
        elif completions > skips * 2:
            momentum = "building"
        else:
            momentum = "stalled"
        
        # Emotional load (from mood trend)
        if checkins and len(checkins) >= 2:
            avg_mood = sum(c.get("mood", 5) for c in checkins) / len(checkins)
            emotional_load = "heavy" if avg_mood < 4 else "light" if avg_mood > 7 else "medium"
        else:
            emotional_load = "unknown"
        
        return {
            "energy": energy,
            "momentum": momentum,
            "emotional_load": emotional_load
        }
    except Exception as e:
        print(f"Error deriving user state: {e}")
        return {"energy": "unknown", "momentum": "unknown", "emotional_load": "unknown"}

def can_use_strict_raw(user_id: str) -> tuple[bool, str]:
    """REFINEMENT #2: Check if strict_raw is allowed (max 1/day, cooldown)."""
    try:
        context = supabase.table("conversation_contexts")\
            .select("last_strict_raw_at, strict_raw_count_today")\
            .eq("user_id", user_id)\
            .execute().data
        
        if not context:
            return True, ""
        
        ctx = context[0]
        last_raw = ctx.get("last_strict_raw_at")
        count_today = ctx.get("strict_raw_count_today", 0)
        
        # Check if it's a new day (reset count)
        if last_raw:
            last_raw_date = datetime.fromisoformat(last_raw.replace("Z", "+00:00")).date()
            if last_raw_date < datetime.now().date():
                count_today = 0
        
        # Max 1 strict_raw per day
        if count_today >= 1:
            return False, "Max 1 strict_raw message per day reached. Using balanced."
        
        return True, ""
    except Exception as e:
        print(f"Error checking strict_raw: {e}")
        return True, ""

def record_strict_raw_usage(user_id: str):
    """Record that strict_raw was used (for cooldown)."""
    try:
        supabase.table("conversation_contexts").upsert({
            "user_id": user_id,
            "last_strict_raw_at": datetime.now().isoformat(),
            "strict_raw_count_today": 1
        }).execute()
    except Exception as e:
        print(f"Error recording strict_raw: {e}")

def start_new_session(user_id: str) -> str:
    """GAP #2: Start a new session for the user."""
    import uuid
    new_session_id = str(uuid.uuid4())
    
    try:
        supabase.table("conversation_contexts").upsert({
            "user_id": user_id,
            "current_session_id": new_session_id,
            "session_started_at": datetime.now().isoformat()
        }).execute()
        
        log_event(user_id, "session_start", {"session_id": new_session_id})
        return new_session_id
    except Exception as e:
        print(f"Error starting session: {e}")
        return new_session_id

def get_current_session(user_id: str) -> str:
    """Get current session ID or create new one."""
    from datetime import timedelta
    
    try:
        context = supabase.table("conversation_contexts")\
            .select("current_session_id, session_started_at")\
            .eq("user_id", user_id)\
            .execute().data
        
        if not context or not context[0].get("current_session_id"):
            return start_new_session(user_id)
        
        # Check if session is stale (> 4 hours)
        session_started = context[0].get("session_started_at")
        if session_started:
            started_dt = datetime.fromisoformat(session_started.replace("Z", "+00:00"))
            if datetime.now(started_dt.tzinfo) - started_dt > timedelta(hours=4):
                return start_new_session(user_id)
        
        return context[0]["current_session_id"]
    except Exception as e:
        print(f"Error getting session: {e}")
        return start_new_session(user_id)

def check_for_absence(user_id: str) -> bool:
    """GAP #4: Check if user has been absent 48+ hours."""
    from datetime import timedelta
    
    try:
        user = supabase.table("users")\
            .select("last_activity_at")\
            .eq("id", user_id)\
            .execute().data
        
        if not user or not user[0].get("last_activity_at"):
            return False
        
        last_activity = datetime.fromisoformat(user[0]["last_activity_at"].replace("Z", "+00:00"))
        absence_threshold = timedelta(hours=48)
        
        if datetime.now(last_activity.tzinfo) - last_activity > absence_threshold:
            # Log absence event (only once per absence period)
            recent_absence = supabase.table("user_events")\
                .select("id")\
                .eq("user_id", user_id)\
                .eq("event_type", "long_absence")\
                .gte("created_at", (datetime.now() - timedelta(hours=72)).isoformat())\
                .execute().data
            
            if not recent_absence:
                log_event(user_id, "long_absence", {"hours": 48})
            return True
        
        return False
    except Exception as e:
        print(f"Error checking absence: {e}")
        return False

def update_last_activity(user_id: str):
    """Update user's last activity timestamp."""
    try:
        supabase.table("users").update({
            "last_activity_at": datetime.now().isoformat()
        }).eq("id", user_id).execute()
    except Exception as e:
        print(f"Error updating activity: {e}")

def should_downgrade_tone(user_id: str, requested_tone: str) -> str:
    """Automatic tone downgrade for safety."""
    try:
        # Never downgrade soft
        if requested_tone == "soft":
            return "soft"
        
        # Check for absence → soft
        if check_for_absence(user_id):
            return "soft"
        
        # Check user state for low energy/heavy load → soft
        state = derive_user_state(user_id)
        if state.get("emotional_load") == "heavy" or state.get("energy") == "low":
            if requested_tone in ["strict_clean", "strict_raw"]:
                return "balanced"
        
        # Check strict_raw cooldown
        if requested_tone == "strict_raw":
            allowed, reason = can_use_strict_raw(user_id)
            if not allowed:
                return "balanced"
        
        return requested_tone
    except Exception as e:
        print(f"Error in tone downgrade: {e}")
        return "balanced"

async def get_or_create_user(email: str = "default@example.com", name: str = "Alex") -> dict:
    """Get existing user or create a default one"""
    try:
        # Try to get existing user by email
        response = supabase.table("users")\
            .select("*")\
            .eq("email", email)\
            .execute()
        
        if response.data and len(response.data) > 0:
            return response.data[0]
        
        # Return default structure if not found
        return {
            "id": "temp-id",
            "name": name,
            "email": email,
            "tone_mode": "balanced",
            "explicit_allowed": False
        }
    except Exception as e:
        print(f"Error with user: {e}")
        return {"id": "temp-id", "name": name, "email": email, "tone_mode": "balanced"}

def build_memory_context(user_data: dict) -> str:
    """Build memory injection string from user data"""
    name = user_data.get('name', 'User')
    tone = user_data.get('tone_mode', 'balanced')
    explicit = user_data.get('explicit_allowed', False)
    
    context = f"""User context:
- Name: {name}
- Tone mode: {tone}
- Explicit language allowed: {explicit}

Recent patterns:
"""
    
    # Add patterns if available
    patterns = user_data.get('patterns', [])
    if patterns:
        for pattern in patterns[:3]:  # Max 3 patterns
            context += f"- {pattern}\n"
    else:
        context += "- No patterns tracked yet\n"
    
    return context.strip()

def get_system_prompt(tone_mode: str = "balanced", user_data: dict = None) -> str:
    """Construct complete system prompt based on tone mode"""
    
    # Start with global prompt
    prompt = GLOBAL_PROMPT
    
    # Add memory context if available
    if user_data:
        prompt += "\n\n" + build_memory_context(user_data)
    
    # Add tone-specific instructions
    tone_prompts = {
        "soft": SOFT_MODE,
        "balanced": BALANCED_MODE,
        "strict_clean": STRICT_CLEAN_MODE,
        "strict_raw": STRICT_RAW_MODE
    }
    
    prompt += "\n\n" + tone_prompts.get(tone_mode, BALANCED_MODE)
    
    return prompt

# ==================== API MODELS ====================

# Auth Models
class SignupRequest(BaseModel):
    email: str
    password: str
    name: str

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    user: dict
    session: dict
    message: str

# Chat Models
class ChatRequest(BaseModel):
    message: str
    conversation_history: list[dict] = []
    tone_mode: Literal["soft", "balanced", "strict_clean", "strict_raw"] = "balanced"
    user_data: Optional[dict] = None

class ChatResponse(BaseModel):
    response: str
    crisis_detected: bool = False

# Task Models
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    scheduled_for: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    scheduled_for: Optional[str] = None
    status: Optional[Literal["pending", "completed", "skipped", "snoozed"]] = None

class TaskResponse(BaseModel):
    id: str
    user_id: str
    title: str
    description: Optional[str]
    scheduled_for: Optional[str]
    status: str
    completed_at: Optional[str]
    created_at: str

# Checkin Models
class CheckinCreate(BaseModel):
    mood: int
    energy: int
    reflection: Optional[str] = None
    accountability: Optional[Literal["yes", "partial", "no"]] = None

class CheckinResponse(BaseModel):
    id: str
    user_id: str
    date: str
    mood: int
    energy: int
    reflection: Optional[str]
    accountability: Optional[str]
    created_at: str

# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    return {"message": "AI Personal Assistant API is running"}

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    """Handle CORS preflight requests"""
    return {"message": "OK"}

@app.get("/health")
async def health_check():
    openai_key = os.getenv("OPENAI_API_KEY")
    return {
        "status": "ok",
        "supabase_configured": bool(os.getenv("SUPABASE_URL")),
        "openai_configured": bool(openai_key),
        "openai_key_preview": f"{openai_key[:8]}..." if openai_key else None
    }

# ==================== AUTH ENDPOINTS ====================

@app.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignupRequest):
    """Sign up a new user with email and password"""
    try:
        print(f"DEBUG: Attempting signup for {request.email}")
        
        # Sign up user with Supabase Auth
        try:
            auth_response = supabase.auth.sign_up({
                "email": request.email,
                "password": request.password
            })
        except Exception as auth_err:
            print(f"DEBUG: Supabase auth.sign_up error: {type(auth_err).__name__}: {str(auth_err)}")
            raise HTTPException(status_code=400, detail=f"Authentication error: {str(auth_err)}")
        
        print(f"DEBUG: Auth response user: {auth_response.user}")
        print(f"DEBUG: Auth response session: {auth_response.session}")
        
        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Signup failed - no user returned")
        
        # Create user profile in users table
        # Note: Supabase Auth creates the user in auth.users automatically
        # We create a profile entry in our public users table
        user_profile = {
            "id": auth_response.user.id,
            "name": request.name,
            "email": request.email,
            "tone_mode": "balanced",
            "explicit_allowed": False
        }
        
        print(f"DEBUG: Inserting user profile: {user_profile}")
        try:
            result = supabase.table("users").insert(user_profile).execute()
            print(f"DEBUG: Insert result: {result}")
        except Exception as profile_error:
            print(f"DEBUG: Profile insert error (may already exist): {str(profile_error)}")
            # Try to get existing profile
            try:
                existing_profile = supabase.table("users")\
                    .select("*")\
                    .eq("id", auth_response.user.id)\
                    .execute()
                if existing_profile.data:
                    print(f"DEBUG: Using existing profile: {existing_profile.data[0]}")
                else:
                    # If profile doesn't exist and insert failed, raise error
                    raise HTTPException(status_code=500, detail=f"Failed to create user profile: {str(profile_error)}")
            except Exception as lookup_error:
                print(f"DEBUG: Profile lookup error: {str(lookup_error)}")
                raise HTTPException(status_code=500, detail=f"Failed to create or find user profile: {str(profile_error)}")
        
        return AuthResponse(
            user={"id": auth_response.user.id, "email": auth_response.user.email, "name": request.name},
            session={"access_token": auth_response.session.access_token if auth_response.session else None},
            message="Signup successful"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Signup error: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"Signup error: {str(e)}")

@app.post("/auth/login", response_model=AuthResponse)
async def login(request: LoginRequest):
    """Login with email and password"""
    try:
        # Sign in with Supabase Auth
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password
        })
        
        if not auth_response.user or not auth_response.session:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        # Get user profile from database
        user_profile = supabase.table("users")\
            .select("*")\
            .eq("id", auth_response.user.id)\
            .execute()
        
        profile_data = user_profile.data[0] if user_profile.data else {}
        
        return AuthResponse(
            user={
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "name": profile_data.get("name", "User")
            },
            session={"access_token": auth_response.session.access_token},
            message="Login successful"
        )
    
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Login error: {str(e)}")

@app.post("/auth/logout")
async def logout():
    """Logout current user"""
    try:
        supabase.auth.sign_out()
        return {"message": "Logged out successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Logout error: {str(e)}")

@app.get("/auth/me")
async def get_current_user(authorization: Optional[str] = Header(None)):
    """Get current authenticated user"""
    try:
        # Extract token from Authorization header
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header missing")
        
        # Handle both "Bearer <token>" and just "<token>" formats
        token = authorization.replace("Bearer ", "").strip() if authorization.startswith("Bearer") else authorization.strip()
        
        if not token:
            raise HTTPException(status_code=401, detail="Access token missing")
        
        # Use Supabase REST API directly to verify token and get user
        import httpx
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{supabase_url}/auth/v1/user",
                headers={
                    "Authorization": f"Bearer {token}",
                    "apikey": supabase_key
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=401, detail="Invalid or expired token")
            
            user_data = response.json()
            user_id = user_data.get("id")
            
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid user data")
        
        # Get full profile from database using service client (bypasses RLS)
        user_profile = supabase.table("users")\
            .select("*")\
            .eq("id", user_id)\
            .execute()
        
        if not user_profile.data:
            raise HTTPException(status_code=404, detail="User profile not found")
        
        return user_profile.data[0]
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"DEBUG: Auth error in /auth/me: {type(e).__name__}: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Auth error: {str(e)}")

# ==================== TASKS ENDPOINTS ====================

@app.get("/tasks/{user_id}")
async def get_tasks(user_id: str, status: Optional[str] = None):
    """Get all tasks for a user, optionally filtered by status."""
    try:
        query = supabase.table("tasks").select("*").eq("user_id", user_id)
        if status:
            query = query.eq("status", status)
        result = query.order("created_at", desc=True).execute()
        return {"tasks": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/tasks")
async def create_task(user_id: str, task: TaskCreate):
    """Create a new task."""
    try:
        result = supabase.table("tasks").insert({
            "user_id": user_id,
            "title": task.title,
            "description": task.description,
            "scheduled_for": task.scheduled_for
        }).execute()
        
        # Log event
        log_event(user_id, "task_created", {"title": task.title})
        
        return {"task": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/tasks/{task_id}")
async def update_task(task_id: str, user_id: str, task: TaskUpdate):
    """Update a task. Logs events for status changes."""
    try:
        update_data = {}
        if task.title is not None:
            update_data["title"] = task.title
        if task.description is not None:
            update_data["description"] = task.description
        if task.scheduled_for is not None:
            update_data["scheduled_for"] = task.scheduled_for
        if task.status is not None:
            update_data["status"] = task.status
            if task.status == "completed":
                update_data["completed_at"] = datetime.now().isoformat()
        
        result = supabase.table("tasks").update(update_data).eq("id", task_id).execute()
        
        # Log event based on status change
        if task.status:
            event_map = {
                "completed": "task_completed",
                "skipped": "task_skipped",
                "snoozed": "task_snoozed"
            }
            if task.status in event_map:
                log_event(user_id, event_map[task.status], {"task_id": task_id, "title": task.title})
        
        return {"task": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    """Delete a task."""
    try:
        supabase.table("tasks").delete().eq("id", task_id).execute()
        return {"status": "deleted"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== CHECKINS ENDPOINTS ====================

@app.get("/checkins/{user_id}")
async def get_checkins(user_id: str, limit: int = 7):
    """Get recent check-ins for a user."""
    try:
        result = supabase.table("daily_checkins")\
            .select("*")\
            .eq("user_id", user_id)\
            .order("date", desc=True)\
            .limit(limit)\
            .execute()
        return {"checkins": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/checkins")
async def create_checkin(user_id: str, checkin: CheckinCreate):
    """Create or update today's check-in."""
    try:
        today = datetime.now().date().isoformat()
        
        # Upsert (create or update)
        result = supabase.table("daily_checkins").upsert({
            "user_id": user_id,
            "date": today,
            "mood": checkin.mood,
            "energy": checkin.energy,
            "reflection": checkin.reflection,
            "accountability": checkin.accountability
        }).execute()
        
        # Log event
        log_event(user_id, "checkin_completed", {
            "mood": checkin.mood,
            "energy": checkin.energy,
            "accountability": checkin.accountability
        })
        
        return {"checkin": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/checkins/{user_id}/today")
async def get_today_checkin(user_id: str):
    """Get today's check-in if exists."""
    try:
        today = datetime.now().date().isoformat()
        result = supabase.table("daily_checkins")\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("date", today)\
            .execute()
        return {"checkin": result.data[0] if result.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== MESSAGES ENDPOINTS ====================

@app.get("/messages/{user_id}")
async def get_messages(user_id: str, limit: int = 50):
    """Get chat history for a user."""
    try:
        result = supabase.table("messages")\
            .select("id, role, content, created_at")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(limit)\
            .execute()
        
        # Reverse to chronological order
        messages = list(reversed(result.data)) if result.data else []
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/messages/{user_id}")
async def clear_messages(user_id: str):
    """Clear all messages for a user (for testing/reset)."""
    try:
        supabase.table("messages").delete().eq("user_id", user_id).execute()
        return {"status": "cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== WEEKLY REFLECTION ====================

@app.post("/reflection/weekly/{user_id}")
async def run_weekly_reflection(user_id: str):
    """Run weekly reflection analysis."""
    from datetime import timedelta
    import json as json_module
    
    try:
        week_ago = (datetime.now() - timedelta(days=7)).isoformat()
        
        # Get week's check-ins
        checkins = supabase.table("daily_checkins")\
            .select("mood, energy, accountability, date")\
            .eq("user_id", user_id)\
            .gte("date", week_ago[:10])\
            .order("date")\
            .execute().data or []
        
        # Get week's tasks
        tasks = supabase.table("tasks")\
            .select("status")\
            .eq("user_id", user_id)\
            .gte("created_at", week_ago)\
            .execute().data or []
        
        # Get patterns
        patterns = load_user_patterns(user_id, min_confidence=0.3)
        
        # Calculate stats
        mood_trend = [c.get("mood", 5) for c in checkins] or [5]
        completed = sum(1 for t in tasks if t["status"] == "completed")
        skipped = sum(1 for t in tasks if t["status"] == "skipped")
        
        # Build prompt (REFINEMENT #3: factual, no "should")
        prompt = f"""Analyze this user's week. Be factual, not prescriptive.

MOOD TREND (1-10): {mood_trend}
TASKS: {completed} completed, {skipped} skipped
PATTERNS: {[p['description'] for p in patterns]}

RESPOND JSON ONLY (max 3 sentences each, no "should"):
{{"week_summary": "factual summary", "mood_trend": "improving|stable|declining", "consistency_score": 0.0-1.0, "observation": "one factual observation"}}"""
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=200
        )
        
        result = json_module.loads(response.choices[0].message.content)
        
        # Update context with weekly summary
        supabase.table("conversation_contexts").upsert({
            "user_id": user_id,
            "last_summary": f"Weekly: {result.get('week_summary', '')} Mood: {result.get('mood_trend', 'stable')}. {result.get('observation', '')}",
            "updated_at": datetime.now().isoformat()
        }).execute()
        
        return {"status": "reflected", "result": result}
    
    except Exception as e:
        print(f"Weekly reflection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== EVENT & INTELLIGENCE ENDPOINTS ====================

class EventRequest(BaseModel):
    user_id: str
    event_type: str
    metadata: Optional[dict] = None

@app.post("/events/log")
async def log_user_event(request: EventRequest):
    """Log a user behavior event. Triggers pattern detection."""
    try:
        log_event(request.user_id, request.event_type, request.metadata)
        return {"status": "logged", "event_type": request.event_type}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reflection/run/{user_id}")
async def run_reflection(user_id: str):
    """Manually trigger daily reflection for a user."""
    from datetime import timedelta
    import json as json_module
    
    try:
        # Get yesterday's events
        yesterday = (datetime.now() - timedelta(days=1)).isoformat()
        events = supabase.table("user_events")\
            .select("event_type, metadata, created_at")\
            .eq("user_id", user_id)\
            .gte("created_at", yesterday)\
            .execute().data or []
        
        if not events:
            return {"status": "no_events", "message": "No events to reflect on"}
        
        # Get existing patterns
        patterns = load_user_patterns(user_id, min_confidence=0.3)
        
        # Build reflection prompt
        events_text = "\n".join([f"- {e['event_type']}: {e.get('metadata', {})}" for e in events])
        patterns_text = "\n".join([f"- {p['pattern_key']}: {p['description']}" for p in patterns]) or "None"
        
        reflection_prompt = f"""Analyze this user's recent activity:

EVENTS (last 24h):
{events_text}

EXISTING PATTERNS:
{patterns_text}

RESPOND IN JSON ONLY:
{{"summary": "1-2 sentence summary", "pattern_updates": [{{"key": "string", "action": "strengthen|weaken", "reason": "why"}}], "insight": "one tip for today"}}"""
        
        # Call GPT for reflection
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": reflection_prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
            max_tokens=200
        )
        
        result = json_module.loads(response.choices[0].message.content)
        
        # Apply pattern updates
        for update in result.get("pattern_updates", []):
            if update.get("action") == "strengthen":
                upsert_pattern(user_id, update["key"], update.get("reason", ""), 0.15)
            elif update.get("action") == "weaken":
                # Weaken pattern
                existing = supabase.table("user_patterns")\
                    .select("*").eq("user_id", user_id).eq("pattern_key", update["key"]).execute()
                if existing.data:
                    new_conf = max(existing.data[0]["confidence"] - 0.1, 0)
                    if new_conf < 0.2:
                        supabase.table("user_patterns").delete().eq("id", existing.data[0]["id"]).execute()
                    else:
                        supabase.table("user_patterns").update({"confidence": new_conf}).eq("id", existing.data[0]["id"]).execute()
        
        # Update conversation context with new summary
        new_summary = f"{result.get('summary', '')} Insight: {result.get('insight', '')}"
        supabase.table("conversation_contexts").upsert({
            "user_id": user_id,
            "last_summary": new_summary,
            "updated_at": datetime.now().isoformat()
        }).execute()
        
        return {"status": "reflected", "result": result}
    
    except Exception as e:
        print(f"Reflection error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/patterns/decay")
async def decay_old_patterns():
    """GAP #3: Decay patterns not seen in 14 days. Run weekly via cron."""
    from datetime import timedelta
    
    try:
        cutoff = (datetime.now() - timedelta(days=14)).isoformat()
        
        # Get old patterns
        old_patterns = supabase.table("user_patterns")\
            .select("*")\
            .lt("last_seen", cutoff)\
            .execute().data or []
        
        decayed = 0
        archived = 0
        
        for pattern in old_patterns:
            # GAP #3: confidence -= 0.1 for patterns not seen in 14 days
            new_conf = max(pattern["confidence"] - 0.1, 0)
            
            # Archive (delete) if confidence < 0.3
            if new_conf < 0.3:
                supabase.table("user_patterns").delete().eq("id", pattern["id"]).execute()
                archived += 1
            else:
                supabase.table("user_patterns").update({"confidence": new_conf}).eq("id", pattern["id"]).execute()
                decayed += 1
        
        return {"status": "decayed", "decayed": decayed, "archived": archived}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Memory-aware chat endpoint with persistent storage and intelligence."""
    try:
        # STEP 1: Crisis detection override
        if contains_crisis_signal(request.message):
            return ChatResponse(
                response=CRISIS_RESPONSE,
                crisis_detected=True
            )
        
        # STEP 2: Get user from request
        user_email = request.user_data.get("email", "default@example.com") if request.user_data else "default@example.com"
        user = await get_or_create_user(email=user_email)
        user_id = user.get("id")
        
        if not user_id or user_id == "temp-id":
            # Fallback: use provided conversation history (no persistence)
            return await chat_without_memory(request)
        
        # STEP 3: Update last activity (GAP #4: silence intelligence)
        update_last_activity(user_id)
        
        # STEP 4: Get/create session (GAP #2: session boundaries)
        session_id = get_current_session(user_id)
        
        # STEP 5: Save user message with session
        save_message(user_id, "user", request.message, session_id)
        
        # STEP 6: Load last 15 messages from database
        recent_messages = load_recent_messages(user_id, limit=15)
        
        # STEP 7: Load conversation context (tone, summary)
        context = load_conversation_context(user_id)
        
        # STEP 8: Load active patterns (confidence > 0.4)
        patterns = load_user_patterns(user_id, min_confidence=0.4)
        
        # STEP 9: Derive user state (REFINEMENT #1)
        user_state = derive_user_state(user_id)
        
        # STEP 10: Apply tone downgrade if needed (safety)
        requested_tone = request.tone_mode if request.tone_mode in ALLOWED_TONES else context.get("current_tone", "balanced")
        actual_tone = should_downgrade_tone(user_id, requested_tone)
        
        # STEP 11: Build system prompt with all intelligence
        system_prompt = build_memory_system_prompt(
            tone_mode=actual_tone,
            last_summary=context.get("last_summary"),
            patterns=patterns,
            user_state=user_state
        )
        
        # STEP 12: Build GPT messages array
        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(recent_messages)
        
        # STEP 13: Call GPT-4o-mini with tight constraints
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.4,
                max_tokens=100,  # Tight for brevity
                presence_penalty=0.1,
                frequency_penalty=0.3
            )
            assistant_message = response.choices[0].message.content
        except Exception as gpt_error:
            print(f"GPT error: {gpt_error}")
            assistant_message = "I'm having trouble thinking right now. Let's try again."
        
        # STEP 14: Validate response
        is_valid, error = validate_response(assistant_message)
        
        if not is_valid:
            print(f"Response validation failed: {error}. Retrying...")
            try:
                response = client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=messages + [{"role": "user", "content": "[Respond in 1-2 sentences. No lists.]"}],
                    temperature=0.3,
                    max_tokens=60
                )
                assistant_message = response.choices[0].message.content
            except:
                pass  # Keep original message
        
        # STEP 15: Track strict_raw usage (REFINEMENT #2)
        if actual_tone == "strict_raw":
            record_strict_raw_usage(user_id)
        
        # STEP 16: Save assistant response with session
        save_message(user_id, "assistant", assistant_message, session_id)
        
        return ChatResponse(response=assistant_message, crisis_detected=False)
    
    except Exception as e:
        print(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=f"ChatError: {str(e)}")

async def chat_without_memory(request: ChatRequest) -> ChatResponse:
    """Fallback chat for unauthenticated users (no persistence)."""
    system_prompt = build_memory_system_prompt(request.tone_mode, None, [])
    
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(request.conversation_history)
    messages.append({"role": "user", "content": request.message})
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        temperature=0.4,
        max_tokens=100
    )
    
    return ChatResponse(response=response.choices[0].message.content, crisis_detected=False)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
