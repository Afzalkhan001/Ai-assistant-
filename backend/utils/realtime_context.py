"""
Real-time context generation for AERA v2
Provides time awareness, behavior signals, and environmental context
"""

from datetime import datetime
import pytz

def get_time_context(user_timezone='Asia/Kolkata'):
    """Generate time-based context signals"""
    try:
        now = datetime.now(pytz.timezone(user_timezone))
    except:
        now = datetime.now(pytz.timezone('Asia/Kolkata'))
    
    hour = now.hour
    day_name = now.strftime('%A')
    is_weekend = now.weekday() >= 5
    
    # Late-night vulnerability window (22:00-04:00)
    is_late_night = hour >= 22 or hour <= 4
    
    # Time of day categorization
    if 5 <= hour < 12:
        time_period = 'morning'
    elif 12 <= hour < 17:
        time_period = 'afternoon'
    elif 17 <= hour < 22:
        time_period = 'evening'
    else:
        time_period = 'late night'
    
    return {
        'timestamp': now.isoformat(),
        'hour': hour,
        'day': day_name,
        'is_weekend': is_weekend,
        'is_late_night': is_late_night,
        'time_period': time_period,
        'is_weekday': not is_weekend,
        'date': now.strftime('%Y-%m-%d'),
        'time_str': now.strftime('%H:%M')
    }


def build_realtime_context_block(user_id, user_timezone, behavior_signals, weather_ctx, news_ctx):
    """Build complete real-time context block for system prompt"""
    
    time_ctx = get_time_context(user_timezone)
    
    # Format behavioral signals
    signals = []
    if time_ctx['is_late_night']:
        signals.append("Late-night usage")
    if behavior_signals.get('task_skips_24h', 0) > 2:
        signals.append(f"{behavior_signals['task_skips_24h']} skipped tasks in last 24h")
    if behavior_signals.get('task_skips_72h', 0) > 4:
        signals.append(f"{behavior_signals['task_skips_72h']} task skips in last 3 days")
    if behavior_signals.get('rapid_opens_detected'):
        signals.append("Repeated opens without action")
    if behavior_signals.get('session_gap_hours', 0) < 1:
        signals.append("Frequent usage pattern")
    if behavior_signals.get('is_fresh_session'):
        signals.append("Fresh session (4+ hours since last use)")
    
    # Build context block
    context_block = f"""[REAL-TIME CONTEXT]
Date: {time_ctx['date']}
Local Time: {time_ctx['time_str']}
Day: {'Weekend' if time_ctx['is_weekend'] else 'Weekday'}
User State Signals:
{chr(10).join(f'- {s}' for s in signals) if signals else '- No significant signals'}
Environment:
- Weather: {weather_ctx.get('weather', 'Unknown')}
- Public context: {news_ctx.get('public_context', 'Normal day')}
"""
    
    return context_block, time_ctx
