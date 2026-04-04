from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import random

router = APIRouter(prefix="/decisions", tags=["decisions"])

class DecisionRequest(BaseModel):
    crop_health: str
    disease_severity: str = "None"
    weather_condition: str
    humidity: float = 50.0
    mandi_prices: List[dict] # Expected keys: market, price, distance_km
    soil_moisture: Optional[float] = 45.0
    transport_rate_per_km: Optional[float] = 2.0  # e.g., ₹2 per km per quintal

class DecisionResponse(BaseModel):
    recommendation: str
    confidence: float
    alerts: List[str]
    profit_optimization: str

@router.post("/", response_model=DecisionResponse)
async def get_farming_decision(request: DecisionRequest):
    """
    Decision Engine: Integrates multiple data points to provide a final 
    actionable recommendation for the farmer.
    """
    alerts = []
    
    # 1. Health & Weather Integrated Risk Logic
    is_diseased = "healthy" not in request.crop_health.lower()
    is_raining = "rain" in request.weather_condition.lower()
    
    # Calculate Priority level
    priority = "Low"
    if is_diseased:
        if request.disease_severity.lower() == "high":
            priority = "Critical"
        elif request.disease_severity.lower() == "medium":
            priority = "High"
        else:
            priority = "Medium"
    
    if request.humidity > 80 and not is_diseased:
        alerts.append("Warning: High humidity. Fungal infection outbreak likely.")
        priority = "Medium" if priority == "Low" else priority

    if is_diseased:
        alerts.append(f"[{priority} Priority] Action Required: {request.crop_health} detected.")
    
    if is_raining and is_diseased:
        alerts.append("Warning: Rain detected. Fungal spread risk is extreme. Postpone chemical spray.")
        priority = "Critical"

    # 3. Mandi / Profit Logic with Transport Cost
    best_mandi = None
    max_profit = -999999
    
    for mandi in request.mandi_prices:
        price = mandi.get("price", 0)
        distance = mandi.get("distance_km", 0)
        cost = distance * request.transport_rate_per_km
        profit = price - cost
        if profit > max_profit:
            max_profit = profit
            best_mandi = mandi
            best_mandi["calculated_profit"] = profit
            best_mandi["transport_cost"] = cost

    profit_msg = "Market prices are stable."
    if best_mandi:
        profit_msg = f"Maximize Profit: Sell at {best_mandi['market']} (Estimated net price: ₹{best_mandi['calculated_profit']}/Q after ₹{best_mandi['transport_cost']} transport cost)."

    # 4. Final Recommendation
    if priority in ["Critical", "High"]:
        rec = f"Focus on crop recovery first. Treat the {request.crop_health} infection immediately. Delay harvesting."
    elif is_raining:
        rec = "Postpone harvesting or chemical application due to rain forecast. Ensure proper drainage in fields."
    else:
        rec = f"Optimal conditions for harvesting. {profit_msg}"

    return DecisionResponse(
        recommendation=rec,
        confidence=0.88 if is_diseased else 0.94,
        alerts=alerts,
        profit_optimization=profit_msg
    )
