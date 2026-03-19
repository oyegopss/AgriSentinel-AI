"""
Hackathon Demo (AgriSentinel AI)
- Purpose: Rule-based + heuristic risk model (weather-based) for disease probability
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, Literal, Optional, TypedDict


RiskLevel = Literal["Low", "Medium", "High"]


class WeatherPayload(TypedDict, total=False):
    temperature: Optional[float]
    humidity: Optional[float]
    rainfall: Optional[float]


@dataclass
class RiskPrediction:
    risk_level: RiskLevel
    probability: float  # 0–1
    reason: str

    def as_dict(self) -> Dict[str, object]:  # JSON‑friendly
        return {
            "risk_level": self.risk_level,
            "probability": self.probability,
            "reason": self.reason,
        }


def _clamp_prob(p: float) -> float:
    return max(0.0, min(1.0, round(p, 3)))


def predict_risk(crop_type: str, weather_data: WeatherPayload) -> Dict[str, object]:
    """Rule-based crop disease risk model.

    This engine is intentionally simple and explainable. It uses
    humidity, temperature, and rainfall to derive a qualitative
    risk level and a probability score in the range [0, 1].

    Args:
        crop_type: Name of the crop (e.g. "Wheat", "Rice"). Used only
            for explanation text for now, but can drive crop-specific
            rules later.
        weather_data: Dict containing `temperature` (°C), `humidity` (%),
            and optional `rainfall` (mm).
    """

    temp = weather_data.get("temperature")
    humidity = weather_data.get("humidity")
    rainfall = weather_data.get("rainfall")

    reasons: list[str] = []
    score: float = 0.0

    # Base rule: missing data → conservative, but low confidence
    if humidity is None or temp is None:
        reasons.append(
            "Weather data incomplete; assuming low to medium risk based on partial information."
        )
        return RiskPrediction(
            risk_level="Medium",
            probability=_clamp_prob(0.4),
            reason=" ".join(reasons),
        ).as_dict()

    # Normalize inputs
    h = float(humidity)
    t = float(temp)
    r = float(rainfall) if rainfall is not None else 0.0

    # Humidity-driven fungal risk
    if h > 85:
        score += 0.4
        reasons.append("Humidity is very high (> 85%), which strongly favours fungal diseases.")
    elif h > 70:
        score += 0.25
        reasons.append("Humidity is high (> 70%), which increases fungal and leaf-spot risk.")
    elif h < 40:
        score += 0.05
        reasons.append("Humidity is low (< 40%), which suppresses most leaf fungal pathogens.")
    else:
        score += 0.15
        reasons.append("Humidity is moderate, allowing some disease development but not extreme.")

    # Temperature band – typical fungal optimum 20–30°C
    if 20 <= t <= 30:
        score += 0.25
        reasons.append("Temperature is in the 20–30°C band where many crop fungi are most active.")
    elif 15 <= t < 20 or 30 < t <= 34:
        score += 0.15
        reasons.append("Temperature is close to the ideal range for disease development.")
    else:
        score += 0.05
        reasons.append("Temperature is outside the main risk band, limiting rapid disease spread.")

    # Rainfall / leaf wetness
    if r >= 10:
        score += 0.2
        reasons.append("Recent rainfall (≥ 10 mm) increases leaf wetness and spore germination.")
    elif r >= 2:
        score += 0.1
        reasons.append("Some recent rainfall provides moisture for infection but is not extreme.")
    else:
        score += 0.02
        reasons.append("Little to no recent rainfall, so leaf surfaces stay relatively dry.")

    # Crop-type adjustments (simple but explicit)
    crop = crop_type.strip().lower()
    if crop in {"wheat", "barley", "oats"}:
        score += 0.05
        reasons.append("Cereal crops like wheat are highly responsive to humid, mild conditions (rusts, blights).")
    elif crop in {"rice"}:
        score += 0.07
        reasons.append("Rice is often grown in standing water, so fungal and bacterial leaf diseases are common.")
    elif crop in {"tomato", "potato", "chilli", "pepper"}:
        score += 0.06
        reasons.append("Solanaceous crops are prone to late blight and leaf spots under cool, wet conditions.")

    # Map score → risk level & probability
    # Score is roughly in [0, 1]; clamp and interpret.
    prob = _clamp_prob(score)

    if prob >= 0.7:
        level: RiskLevel = "High"
        reasons.insert(0, "Overall disease risk is HIGH based on current weather.")
    elif prob >= 0.4:
        level = "Medium"
        reasons.insert(0, "Overall disease risk is MEDIUM – conditions are partially favourable.")
    else:
        level = "Low"
        reasons.insert(0, "Overall disease risk is LOW – current conditions are mostly unfavourable.")

    explanation = " " .join(reasons)

    return RiskPrediction(
        risk_level=level,
        probability=prob,
        reason=explanation,
    ).as_dict()


__all__ = ["predict_risk", "RiskPrediction", "RiskLevel"]
