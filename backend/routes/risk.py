from typing import Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field, validator

from services.weather import get_weather, WeatherServiceError
from services.risk_model import predict_risk
from services.firestore_db import get_firestore, get_profile


router = APIRouter(tags=["risk"])


class RiskRequest(BaseModel):
    crop_type: str = Field(..., description="Name of the crop, e.g. 'Wheat'")
    latitude: Optional[float] = Field(None, ge=-90, le=90, description="Latitude in decimal degrees")
    longitude: Optional[float] = Field(None, ge=-180, le=180, description="Longitude in decimal degrees")

    @validator("crop_type")
    def crop_not_empty(cls, v: str) -> str:  # type: ignore[override]
        v = v.strip()
        if not v:
            raise ValueError("crop_type must not be empty")
        return v


@router.post("/risk-predict")
def risk_predict(payload: RiskRequest):
    """Predict crop disease risk for a location.

    This endpoint fetches current weather (temperature, humidity, rainfall)
    using the OpenWeather-backed weather service and then feeds that data
    into the rule-based risk model. If lat/lon are omitted, uses stored
    profile location (farmers/default). Response includes location echo
    and optional profile crop context.
    """
    lat = payload.latitude
    lon = payload.longitude
    if lat is None or lon is None:
        profile = get_profile() if get_firestore() else None
        loc = (profile or {}).get("location") or {}
        lat = lat if lat is not None else loc.get("latitude")
        lon = lon if lon is not None else loc.get("longitude")
    if lat is None or lon is None:
        raise HTTPException(
            status_code=400,
            detail="latitude and longitude required, or set profile location",
        )

    try:
        weather = get_weather(lat=lat, lon=lon)
    except WeatherServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    risk = predict_risk(payload.crop_type, weather)

    out = {
        "location": {"latitude": lat, "longitude": lon},
        "weather": weather,
        "risk": risk,
    }
    profile = get_profile() if get_firestore() else None
    if profile and profile.get("crop_types"):
        out["profile_crop_context"] = {"crop_types": profile["crop_types"]}
    return out
