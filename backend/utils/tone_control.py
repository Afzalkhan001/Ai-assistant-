"""
Server-side tone enforcement for AERA v2
Overrides user tone selection based on safety signals
"""

def enforce_tone_downgrade(requested_tone, behavior_signals, recent_mood, time_ctx):
    """
    Server-side tone enforcement - overrides user choice if needed
    
    Returns: (enforced_tone, reason)
    """
    
    # RULE 1: Crisis signals → force GENTLE
    # (Crisis detection happens earlier in main.py)
    
    # RULE 2: Mood < 4 → force GENTLE
    if recent_mood is not None and recent_mood < 4:
        if requested_tone in ['strict_raw', 'strict_clean', 'balanced']:
            return 'soft', 'Low mood state (mood < 4)'
    
    # RULE 3: 5+ skips in 3 days → downgrade RAW/DIRECT → BALANCED
    if behavior_signals.get('task_skips_72h', 0) >= 5:
        if requested_tone in ['strict_raw', 'strict_clean']:
            return 'balanced', f"High avoidance pattern ({behavior_signals['task_skips_72h']} skips in 3 days)"
    
    # RULE 4: Late night + low energy → downgrade to BALANCED
    if time_ctx.get('is_late_night'):
        # Check if energy is low (from recent check-in)
        if recent_mood is not None and recent_mood < 5:
            if requested_tone in ['strict_raw', 'strict_clean']:
                return 'balanced', 'Late-night vulnerability window + low energy'
    
    # RULE 5: RAW only allowed if mood >= 4 and no crisis
    if requested_tone == 'strict_raw':
        if recent_mood is not None and recent_mood < 4:
            return 'balanced', 'Mood too low for Raw mode (< 4)'
    
    # No downgrade needed
    return requested_tone, None


def get_last_checkin_mood(user_id, supabase):
    """Get most recent check-in mood value"""
    try:
        # Query checkins table for latest mood
        result = supabase.table("checkins")\
            .select("mood")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0].get('mood')
    except Exception as e:
        print(f"Error fetching mood: {e}")
    
    return None


def get_last_checkin_energy(user_id, supabase):
    """Get most recent check-in energy value"""
    try:
        result = supabase.table("checkins")\
            .select("energy")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0].get('energy')
    except Exception as e:
        print(f"Error fetching energy: {e}")
    
    return None
