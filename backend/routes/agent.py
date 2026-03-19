"""
Hackathon Demo (AgriSentinel AI)
- Purpose: FastAPI route for the AI advisor endpoint (`POST /api/ai-agent`)
- Inputs: query + optional disease/risk/yield context
- Output: structured advice JSON from `services.llm_agent`
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

from services.llm_agent import generate_advice
from services.firestore_db import get_firestore, get_profile, get_farm


router = APIRouter(tags=["ai-agent"])


class AgentRequest(BaseModel):
    query: str = Field(..., description="Farmer's question or instruction")
    disease: Optional[str] = Field(
        None,
        description="Optional disease name or detection result to provide extra context.",
    )
    risk: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional risk prediction payload (e.g. from /risk-predict).",
    )
    yield_data: Optional[Dict[str, Any]] = Field(
        None,
        description="Optional yield payload (e.g. from yield predictor / advisor).",
    )


@router.post("/ai-agent")
def ai_agent_endpoint(payload: AgentRequest) -> Dict[str, Any]:
    """LLM-backed AI farmer assistant.

    Combines the farmer's query with optional disease and risk
    information, then calls the LLM agent service to generate
    structured advice. Optionally pulls profile and farm from
    Firestore to personalize and scale cost by farm area.
    """
    disease_result: Optional[Dict[str, Any]] = None
    if payload.disease:
        disease_result = {"disease": payload.disease}

    profile = None
    farm = None
    if get_firestore():
        profile = get_profile()
        farm = get_farm()

    input_data: Dict[str, Any] = {
        "user_query": payload.query,
        "disease_result": disease_result,
        "risk_data": payload.risk,
        "yield_data": payload.yield_data,
        "profile": profile,
        "farm": farm,
    }

    return generate_advice(input_data)
