"""
Weather integration using Open-Meteo (free, no API key required)
"""

import requests

def get_weather_context(lat=28.6139, lon=77.2090):
    """
    Fetch current weather using Open-Meteo API (FREE)
    Default location: Delhi, India
    Returns weather condition for empathy calibration only
    """
    try:
        url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current_weather=true"
        response = requests.get(url, timeout=5)
        
        if response.ok:
            data = response.json()
            weather = data.get('current_weather', {})
            
            # Categorize weather for empathy calibration
            temp = weather.get('temperature', 25)
            
            if temp > 35:
                condition = 'Very hot'
            elif temp > 28:
                condition = 'Warm'
            elif temp < 15:
                condition = 'Cold'
            else:
                condition = 'Pleasant'
            
            # Check for rain (wind speed as proxy if no direct rain data)
            wind_speed = weather.get('windspeed', 0)
            if wind_speed > 20:
                condition += ', windy'
            
            return {
                'weather': condition,
                'temp_c': int(temp),
                'success': True
            }
    except Exception as e:
        print(f"Weather fetch failed: {e}")
        pass
    
    return {
        'weather': 'Unknown',
        'temp_c': None,
        'success': False
    }
