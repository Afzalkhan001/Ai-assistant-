"""
News integration using Google News India RSS (free)
Public context awareness for AERA
"""

import feedparser
from datetime import datetime

NEWS_RSS_URL = "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en"

def get_news_context():
    """
    Fetch top Indian news headlines via RSS
    No storage - temporary context only
    """
    try:
        feed = feedparser.parse(NEWS_RSS_URL)
        
        # Get top 3 headlines
        headlines = []
        for entry in feed.entries[:3]:
            headlines.append(entry.title)
        
        # Check for major keywords
        major_event = detect_major_event(headlines)
        
        return {
            'top_headlines': headlines,
            'major_event_detected': bool(major_event),
            'public_context': major_event if major_event else 'Normal day',
            'success': True
        }
    except Exception as e:
        print(f"News fetch failed: {e}")
        return {
            'top_headlines': [],
            'major_event_detected': False,
            'public_context': 'Normal day',
            'success': False
        }


def detect_major_event(headlines):
    """Detect major national events from news headlines"""
    keywords = [
        'cricket final',
        'india win',
        'india lose',
        'national holiday',
        'disaster',
        'election',
        'festival',
        'republic day',
        'independence day',
        'holi',
        'diwali',
        'eid'
    ]
    
    all_text = ' '.join(headlines).lower()
    
    for keyword in keywords:
        if keyword in all_text:
            return f"Major event: {keyword.title()}"
    
    return None


def get_news_summary_for_user():
    """Format news headlines for user request"""
    news = get_news_context()
    
    if not news['success'] or not news['top_headlines']:
        return "Couldn't fetch news right now. Try again in a moment."
    
    headlines_text = '\n'.join(f"- {h}" for h in news['top_headlines'])
    
    return f"Here's what's being reported in India today:\n\n{headlines_text}\n\nWant to focus on one?"
