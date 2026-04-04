"""
Hackathon Demo (AgriSentinel AI)
- Purpose: Central API router that registers feature routes (risk, agent, profile, farm)
"""

from fastapi import APIRouter

from . import risk, agent, profile, farm, decisions, disease

# Central API router.
# New feature routers (e.g. disease, mandi, advisor) should be
# registered here to keep the application modular.

api_router = APIRouter()

# Risk prediction (weather + rule-based model)
api_router.include_router(risk.router)

# LLM-based AI farmer assistant
api_router.include_router(agent.router)

# Profile and farm (Firestore, single-user default)
api_router.include_router(profile.router)
api_router.include_router(farm.router)

# Disease detection
api_router.include_router(disease.router)

# Decision Engine
api_router.include_router(decisions.router)

# Example (future):
# from . import mandi
# api_router.include_router(mandi.router, prefix="/mandi", tags=["mandi"])
