"""
Response validation for AERA v2
Ensures responses meet human-like quality standards
"""

import re

def validate_response(response_text):
    """
    Validate response meets AERA v2 standards
    Returns: (is_valid, error_message)
    """
    
    if not response_text or len(response_text.strip()) == 0:
        return False, "Empty response"
    
    # Check sentence count (max 3-4 sentences)
    sentences = [s.strip() for s in response_text.split('.') if s.strip()]
    if len(sentences) > 4:
        return False, f"Too many sentences ({len(sentences)}, max 4)"
    
    # Check for banned AI phrases
    banned_phrases = [
        "i understand",
        "i'm here to help",
        "let me know",
        "feel free to",
        "would you like me to",
        "i can help you",
        "how can i assist",
        "is there anything",
        "happy to help",
        "i'd be happy",
        "please don't hesitate"
    ]
    
    lower_response = response_text.lower()
    for phrase in banned_phrases:
        if phrase in lower_response:
            return False, f"Contains banned AI phrase: '{phrase}'"
    
    # Check for list formatting
    if '\n-' in response_text or '\n*' in response_text or '\n•' in response_text:
        return False, "Contains list formatting"
    
    # Check for numbered lists
    if re.search(r'\n\d+\.', response_text):
        return False, "Contains numbered list"
    
    # Check for emojis (common ones)
    emoji_pattern = re.compile("["
        u"\U0001F600-\U0001F64F"  # emoticons
        u"\U0001F300-\U0001F5FF"  # symbols & pictographs
        u"\U0001F680-\U0001F6FF"  # transport & map
        u"\U0001F1E0-\U0001F1FF"  # flags
        u"\U00002702-\U000027B0"
        u"\U000024C2-\U0001F251"
        "]+", flags=re.UNICODE)
    
    if emoji_pattern.search(response_text):
        return False, "Contains emojis"
    
    # Check for excessive hedging
    hedging_words = ['maybe', 'perhaps', 'possibly', 'might', 'could be']
    hedge_count = sum(1 for word in hedging_words if word in lower_response)
    if hedge_count > 2:
        return False, "Excessive hedging (too many maybe/perhaps/possibly)"
    
    # Check response length (should be concise)
    word_count = len(response_text.split())
    if word_count > 100:
        return False, f"Response too long ({word_count} words, max ~100)"
    
    return True, "Valid"


def log_validation_failure(response_text, error):
    """Log validation failures for monitoring"""
    print(f"[VALIDATION FAILED] {error}")
    print(f"Response: {response_text[:100]}...")
