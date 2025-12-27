"""
User behavior tracking for real-time context
Tracks session gaps, task skips, and behavioral patterns
"""

from datetime import datetime, timedelta

def get_user_behavior_signals(user_id, supabase):
    """
    Track user behavior patterns (temporary context only - not stored)
    Returns signals for real-time decision making
    """
    
    try:
        # Time since last session
        session_gap_hours = get_session_gap(user_id, supabase)
        
        # Task skips in last 24h/72h
        skips_24h = count_task_skips(user_id, hours=24, supabase=supabase)
        skips_72h = count_task_skips(user_id, hours=72, supabase=supabase)
        
        # Detect rapid opens (multiple messages in short time)
        rapid_opens = detect_rapid_opens(user_id, supabase)
        
        return {
            'session_gap_hours': session_gap_hours,
            'task_skips_24h': skips_24h,
            'task_skips_72h': skips_72h,
            'rapid_opens_detected': rapid_opens,
            'is_fresh_session': session_gap_hours > 4
        }
    except Exception as e:
        print(f"Behavior tracking error: {e}")
        return{
            'session_gap_hours': 0,
            'task_skips_24h': 0,
            'task_skips_72h': 0,
            'rapid_opens_detected': False,
            'is_fresh_session': False
        }


def get_session_gap(user_id, supabase):
    """Calculate hours since last message"""
    try:
        result = supabase.table("messages")\
            .select("created_at")\
            .eq("user_id", user_id)\
            .order("created_at", desc=True)\
            .limit(1)\
            .execute()
        
        if result.data:
            last_time = datetime.fromisoformat(result.data[0]['created_at'].replace('Z', '+00:00'))
            now = datetime.now(last_time.tzinfo)
            gap = (now - last_time).total_seconds() / 3600
            return gap
    except:
        pass
    
    return 24  # Default: assume fresh session


def count_task_skips(user_id, hours, supabase):
    """Count tasks marked as skipped in last N hours"""
    try:
        cutoff = datetime.now() - timedelta(hours=hours)
        
        result = supabase.table("tasks")\
            .select("id")\
            .eq("user_id", user_id)\
            .eq("status", "skipped")\
            .gte("updated_at", cutoff.isoformat())\
            .execute()
        
        return len(result.data) if result.data else 0
    except:
        return 0


def detect_rapid_opens(user_id, supabase):
    """Detect if user opened app multiple times in last hour without action"""
    try:
        one_hour_ago = datetime.now() - timedelta(hours=1)
        
        result = supabase.table("messages")\
            .select("id")\
            .eq("user_id", user_id)\
            .gte("created_at", one_hour_ago.isoformat())\
            .execute()
        
        # If more than 4 messages in last hour, consider it rapid usage
        return len(result.data) > 4 if result.data else False
    except:
        return False
