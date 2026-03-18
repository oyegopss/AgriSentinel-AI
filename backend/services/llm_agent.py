"""LLM-powered AI farmer assistant for AgriSentinel AI.

This module wraps an LLM (e.g. OpenAI) behind a small, stable
interface so the rest of the system is not tied to any single
provider. If no API key is configured, it falls back to a
rule-based mock that still returns structured advice.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any, Dict, Literal, Optional

import requests

UrgencyLevel = Literal["Low", "Medium", "High"]


@dataclass
class AdviceResult:
    advice: str
    urgency: UrgencyLevel
    recommended_action: str
    estimated_cost: str
    timeline: str

    def as_dict(self) -> Dict[str, Any]:
        return {
            "advice": self.advice,
            "urgency": self.urgency,
            "recommended_action": self.recommended_action,
            "estimated_cost": self.estimated_cost,
            "timeline": self.timeline,
        }


def _build_system_prompt() -> str:
    return (
        "You are AgriSentinel AI, a senior agricultural extension officer "
        "helping small and medium farmers in India. You know crop diseases, "
        "fungicides, cultural practices, mandi pricing and risk management. "
        "You must be practical, specific, and avoid vague motivational text. "
        "Assume limited budget and field conditions, and prefer low-cost, "
        "locally realistic recommendations. Output SHOULD be short but dense."
    )


def _build_user_prompt(
    user_query: str,
    disease_result: Optional[Dict[str, Any]] = None,
    risk_data: Optional[Dict[str, Any]] = None,
    yield_data: Optional[Dict[str, Any]] = None,
    profile: Optional[Dict[str, Any]] = None,
    farm: Optional[Dict[str, Any]] = None,
) -> str:
    lines = [
        "Farmer question:",
        user_query.strip(),
        "",
        "Structured context (JSON):",
    ]
    context: Dict[str, Any] = {}
    if disease_result:
        context["disease_result"] = disease_result
    if risk_data:
        context["risk_data"] = risk_data
    if yield_data:
        context["yield_data"] = yield_data
    if profile:
        context["farmer_profile"] = {
            "name": profile.get("name"),
            "location": profile.get("location"),
            "farm_area_acres": profile.get("farm_area_acres"),
            "crop_types": profile.get("crop_types"),
            "soil_type": profile.get("soil_type"),
        }
    if farm:
        context["farm"] = {
            "area_acres": farm.get("area_acres"),
            "has_polygon": bool(farm.get("polygon")),
        }
    if not context:
        context["note"] = "No model outputs were provided. Use only the question and general agronomy knowledge."

    lines.append(json.dumps(context, ensure_ascii=False, indent=2))
    lines.append(
        "\nYou MUST respond as STRICT JSON with EXACTLY these keys:\n"
        '{ "advice": string, "urgency": "Low"|"Medium"|"High", "recommended_action": string, "estimated_cost": string, "timeline": string }\n\n'
        "Guidelines:\n"
        "- Act as an Indian agricultural expert (practical, locally realistic inputs).\n"
        "- Provide: what to do, when to do it (timeline), and a cost estimate (scale by farm area if available).\n"
        "- If you suggest a spray, mention timing (morning/evening), re-entry interval, and basic safety.\n"
        "- Avoid generic motivation. Be specific and concise."
    )
    return "\n".join(lines)


def _parse_llm_json(text: str) -> AdviceResult:
    """Parse the LLM JSON output safely and normalise fields."""
    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Fallback: wrap raw text into advice
        return AdviceResult(
            advice=text.strip(),
            urgency="Medium",
            recommended_action="Review advice above and take steps as feasible in the next 3–5 days.",
            estimated_cost="₹0–₹2000 (approx.)",
            timeline="Next 3–5 days",
        )

    advice = str(data.get("advice") or "No advice provided.").strip()
    urgency_raw = str(data.get("urgency") or "Medium").strip().title()
    if urgency_raw not in {"Low", "Medium", "High"}:
        urgency_raw = "Medium"
    urgency: UrgencyLevel = urgency_raw  # type: ignore[assignment]

    recommended_action = str(
        data.get("recommended_action")
        or "Implement basic sanitation, monitoring and recommended sprays based on local guidance."
    ).strip()
    estimated_cost = str(data.get("estimated_cost") or "₹0–₹2000 (approx.)").strip()
    timeline = str(data.get("timeline") or "Next 3–5 days").strip()

    return AdviceResult(
        advice=advice,
        urgency=urgency,
        recommended_action=recommended_action,
        estimated_cost=estimated_cost,
        timeline=timeline,
    )


def _call_openai(prompt: str) -> Optional[AdviceResult]:
    """Call OpenAI (or compatible) chat completion API if configured.

    This uses the OpenAI-style HTTP interface so it can work with
    compatible providers as well. If no key or endpoint is set,
    returns ``None`` and the caller should use the mock instead.
    """
    api_key = os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")
    model = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

    if not api_key:
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    body = {
        "model": model,
        "response_format": {"type": "json_object"},
        "messages": [
            {"role": "system", "content": _build_system_prompt()},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_tokens": 450,
    }

    try:
        resp = requests.post(f"{base_url}/chat/completions", headers=headers, json=body, timeout=20)
    except requests.RequestException:
        return None

    if not resp.ok:
        return None

    data = resp.json()
    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        return None

    if not isinstance(content, str):
        return None

    return _parse_llm_json(content)


def _scale_cost_by_area(cost_per_acre: str, area_acres: Optional[float]) -> str:
    """If area_acres is set, append total estimate; otherwise return per-acre string."""
    if area_acres is None or area_acres <= 0:
        return cost_per_acre
    # Parse rough range from strings like "₹1500–₹3500 (fungicide + labour, per acre)"
    import re
    numbers = re.findall(r"₹?\s*([\d,]+)", cost_per_acre)
    if len(numbers) >= 2:
        try:
            lo = float(numbers[0].replace(",", ""))
            hi = float(numbers[1].replace(",", ""))
            total_lo = int(lo * area_acres)
            total_hi = int(hi * area_acres)
            return f"{cost_per_acre} Total for {area_acres:.1f} acres: approx. ₹{total_lo}–₹{total_hi}"
        except (ValueError, TypeError):
            pass
    return f"{cost_per_acre} (scale by {area_acres:.1f} acres for total budget)"


def _mock_advice(
    user_query: str,
    disease_result: Optional[Dict[str, Any]],
    risk_data: Optional[Dict[str, Any]],
    yield_data: Optional[Dict[str, Any]] = None,
    profile: Optional[Dict[str, Any]] = None,
    farm: Optional[Dict[str, Any]] = None,
) -> AdviceResult:
    """Deterministic, explainable fallback when no LLM is available."""
    disease_name = (disease_result or {}).get("disease") or (disease_result or {}).get("name")
    risk_level = (risk_data or {}).get("risk_level") or (risk_data or {}).get("risk") or "Medium"
    area_acres = (profile or {}).get("farm_area_acres") or (farm or {}).get("area_acres")

    base_advice_parts = []

    if disease_name:
        base_advice_parts.append(
            f"Current model suggests '{disease_name}' on the leaf. Focus first on removing heavily infected leaves and avoiding leaf wetness."
        )

    if risk_level == "High":
        urgency: UrgencyLevel = "High"
        base_advice_parts.append(
            "Weather conditions are favourable for fast disease spread (high risk). Sprays should be scheduled within 24–48 hours."
        )
        est_cost = "₹1500–₹3500 (fungicide + labour, per acre)"
    elif risk_level == "Low":
        urgency = "Low"
        base_advice_parts.append(
            "Weather-based risk is low. Prioritise monitoring and basic sanitation rather than aggressive spraying."
        )
        est_cost = "₹0–₹800 (monitoring, occasional spray)"
    else:
        urgency = "Medium"
        base_advice_parts.append(
            "Risk is moderate. Combine field scouting with one well-timed protective spray if symptoms increase."
        )
        est_cost = "₹800–₹2000 (targeted treatment)"

    est_cost = _scale_cost_by_area(est_cost, area_acres)

    base_advice_parts.append(
        "Use clean irrigation water, avoid overhead watering late in the day, and do not mix random pesticides without label guidance."
    )

    advice_text = " ".join(base_advice_parts)

    recommended_action = (
        "Inspect 10–20 plants across the field today, mark severely affected patches, "
        "remove and destroy rotten leaves, and plan a labelled fungicide spray if symptoms "
        "are spreading in the next 2–3 days."
    )

    return AdviceResult(
        advice=advice_text,
        urgency=urgency,
        recommended_action=recommended_action,
        estimated_cost=est_cost,
        timeline="Today: scouting + sanitation. Next 24–48h: spray if spread/risk is high. Recheck after 3–5 days.",
    )


def generate_advice(input_data: Dict[str, Any]) -> Dict[str, Any]:
    """Generate structured AI advice for a farmer.

    Args:
        input_data: dict with keys:
            - ``user_query`` (required): farmer's natural language question.
            - ``disease_result`` (optional): dict with model output from
              the disease detector.
            - ``risk_data`` (optional): dict from the risk prediction engine.
            - ``profile`` (optional): farmer profile (crop_types, soil, farm_area_acres, location).
            - ``farm`` (optional): farm doc (area_acres, polygon).

    Returns:
        JSON-serialisable dict::

            {
              "advice": "...",
              "urgency": "Low" | "Medium" | "High",
              "recommended_action": "...",
              "estimated_cost": "₹..."
            }
    """

    user_query = str(input_data.get("user_query") or "").strip()
    disease_result = input_data.get("disease_result") or None
    risk_data = input_data.get("risk_data") or None
    yield_data = input_data.get("yield_data") or None
    profile = input_data.get("profile") or None
    farm = input_data.get("farm") or None

    if not user_query:
        user_query = "Farmer asks for guidance on current crop condition and next 7-day plan."

    prompt = _build_user_prompt(user_query, disease_result, risk_data, yield_data=yield_data, profile=profile, farm=farm)

    # Try real LLM first; fall back to deterministic mock if anything fails
    result = _call_openai(prompt)
    if result is None:
        result = _mock_advice(user_query, disease_result, risk_data, yield_data=yield_data, profile=profile, farm=farm)

    return result.as_dict()


__all__ = ["generate_advice", "AdviceResult", "UrgencyLevel"]
