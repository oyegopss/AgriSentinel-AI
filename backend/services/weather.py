import os
from typing import Any, Dict, Optional

import requests


class WeatherServiceError(RuntimeError):
    """Raised when the weather provider is unavailable."""


def get_weather(lat: float, lon: float) -> Dict[str, Optional[float]]:
    """Fetch current weather from OpenWeather and return key fields.

    - Uses OPENWEATHER_API_KEY from environment.
    - Returns temperature (°C), humidity (%), rainfall (mm in last 1h).
    - On any failure, logs the error and returns safe default values.
    """

    api_key = os.getenv("OPENWEATHER_API_KEY")
    default = {"temperature": None, "humidity": None, "rainfall": 0.0}

    if not api_key:
        print("[weather] OPENWEATHER_API_KEY not set; returning defaults")
        return default

    try:
        resp = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={
                "lat": lat,
                "lon": lon,
                "appid": api_key,
                "units": "metric",
            },
            timeout=10,
        )
    except requests.RequestException as exc:
        print(f"[weather] Request error: {exc}")
        return default

    if not resp.ok:
        print(f"[weather] OpenWeather error {resp.status_code}: {resp.text[:200]}")
        return default

    try:
        data: Dict[str, Any] = resp.json()
    except ValueError as exc:
        print(f"[weather] Failed to parse JSON: {exc}")
        return default

    main = data.get("main") or {}
    if not isinstance(main, dict):
        print("[weather] Missing 'main' block in response")
        return default

    temp = main.get("temp")
    humidity = main.get("humidity")

    rain_block = data.get("rain") or {}
    rainfall = 0.0
    if isinstance(rain_block, dict):
        one_h = rain_block.get("1h")
        if isinstance(one_h, (int, float)):
            rainfall = float(one_h)

    result: Dict[str, Optional[float]] = {
        "temperature": float(temp) if isinstance(temp, (int, float)) else None,
        "humidity": float(humidity) if isinstance(humidity, (int, float)) else None,
        "rainfall": rainfall,
    }

    return result


__all__ = ["get_weather", "WeatherServiceError"]
