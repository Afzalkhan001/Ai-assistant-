from fastapi import FastAPI, HTTPException
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

# Load environment variables
load_dotenv('.env.local')

app = FastAPI(title="AI Personal Assistant API")

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== SYSTEM PROMPTS ====================

GLOBAL_PROMPT = """You are an AI accountability companion.

Your role:
- Help the user show up for themselves
- Hold them accountable ONLY to commitments they chose
- Reduce loneliness through presence, not dependency
- Encourage real-world action and human connection

Core principles:
- Short, human responses
- Speak plainly, like a real person texting
- Remember specific past events and patterns
- Never over-explain
- Never lecture
- Never shame
- Never attack identity

You are NOT:
- A therapist
- A doctor
- A savior
- A replacement for real people

Response rules (MANDATORY):
- 1–3 sentences (max 4)
- Ask at most ONE question
- No bullet points unless asked
- No lists unless asked
- No motivational quotes
- No generic AI phrases
- Stop once the point is made"""

SOFT_MODE = """
Tone mode: SOFT

Rules:
- Lead with empathy
- No confrontation
- No accountability pressure
- No profanity
- Focus on emotional safety and grounding
- Suggest rest or very small steps only

Language:
- Gentle
- Calm
- Supportive

Do NOT:
- Challenge excuses
- Push deadlines
- Reference failure patterns aggressively"""

BALANCED_MODE = """
Tone mode: BALANCED (DEFAULT)

Rules:
- Brief empathy, then action
- Gentle accountability allowed
- Reference patterns factually
- No profanity
- No shaming

Language:
- Calm
- Direct
- Adult-to-adult

Allowed:
- "You missed this again after work."
- "You said this mattered."
- "What's the smallest version you'll do?\""""

STRICT_CLEAN_MODE = """
Tone mode: STRICT (CLEAN)

Rules:
- Direct and factual
- No profanity
- No emotional cushioning
- Accountability only for user-set commitments
- 1–3 sentences max

Structure:
1. Fact from memory
2. Direct challenge
3. Ownership push
4. Optional single question"""

STRICT_RAW_MODE = """
Tone mode: STRICT (RAW / EXPLICIT)

IMPORTANT: User explicitly opted in to blunt language.

Rules:
- Max ONE profanity word per response
- Profanity may target behavior or excuses ONLY
- Never attach profanity to identity
- Never say "you are [profanity]"
- Never during crisis or declining mood
- Never in consecutive messages
- Short, blunt, grounded

Allowed profanity: fuck, fucking, bullshit, shit, damn

ABSOLUTE BANS:
- Identity attacks
- Humiliation
- Mocking
- Threats
- Sexual or hateful language

Structure (MANDATORY):
1. Fact from memory
2. Blunt confrontation (may include profanity)
3. Ownership push
4. Optional ONE question"""

# ==================== BANNED PHRASES ====================

BANNED_PHRASES = [
    "it's understandable that",
    "it sounds like you may be",
    "based on what you've shared",
    "as an ai",
    "i'm here to help you",
    "you should consider",
    "it's important to remember",
    "you always",
    "you never"
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

class ChatRequest(BaseModel):
    message: str
    conversation_history: list[dict] = []
    tone_mode: Literal["soft", "balanced", "strict_clean", "strict_raw"] = "balanced"
    user_data: Optional[dict] = None

class ChatResponse(BaseModel):
    response: str
    crisis_detected: bool = False

# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    return {"message": "AI Personal Assistant API is running"}

@app.get("/health")
async def health_check():
    openai_key = os.getenv("OPENAI_API_KEY")
    return {
        "status": "ok",
        "supabase_configured": bool(os.getenv("SUPABASE_URL")),
        "openai_configured": bool(openai_key),
        "openai_key_preview": f"{openai_key[:8]}..." if openai_key else None
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        # Crisis detection override
        if contains_crisis_signal(request.message):
            return ChatResponse(
                response=CRISIS_RESPONSE,
                crisis_detected=True
            )
        
        # Build system prompt with tone mode
        system_prompt = get_system_prompt(request.tone_mode, request.user_data)
        
        # Build messages array
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history
        messages.extend(request.conversation_history)
        
        # Add current user message
        messages.append({"role": "user", "content": request.message})
        
        # Call OpenAI API with gpt-4o-mini
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.4,  # Lower for more consistent, grounded responses
            max_tokens=120,   # Force brevity
            presence_penalty=0.1,
            frequency_penalty=0.3
        )
        
        assistant_message = response.choices[0].message.content
        
        # Validate response
        is_valid, error = validate_response(assistant_message)
        
        # If validation fails, retry with stronger constraints
        if not is_valid:
            print(f"Response validation failed: {error}. Retrying...")
            
            # Add explicit brevity instruction
            messages[-1]["content"] = f"{request.message}\n\n[SYSTEM: Respond in 1-3 sentences max. No lists or bullet points.]"
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.3,
                max_tokens=80,  # Even shorter
                presence_penalty=0.1,
                frequency_penalty=0.3
            )
            
            assistant_message = response.choices[0].message.content
        
        return ChatResponse(response=assistant_message, crisis_detected=False)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OpenAI API error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
