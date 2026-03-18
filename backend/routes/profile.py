from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from services.firestore_db import get_firestore, get_profile, set_profile


router = APIRouter(prefix="/profile", tags=["profile"])


class LocationModel(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    label: Optional[str] = None


class ProfileBody(BaseModel):
    name: str = Field(..., min_length=1)
    location: Optional[LocationModel] = None
    farm_area_acres: float = Field(..., ge=0)
    crop_types: list[str] = Field(default_factory=list)
    soil_type: Optional[str] = None


@router.get("")
def get_profile_endpoint():
    """Return the single-user profile (farmers/default)."""
    if get_firestore() is None:
        raise HTTPException(status_code=503, detail="Firestore not configured")
    try:
        data = get_profile()
    except Exception as exc:
        msg = str(exc)
        if "firestore.googleapis.com" in msg or "Cloud Firestore API" in msg:
            raise HTTPException(
                status_code=503,
                detail="Cloud Firestore API is disabled for this project. Enable Firestore in Google Cloud/Firebase console and retry.",
            ) from exc
        raise HTTPException(status_code=500, detail="Failed to read profile from Firestore") from exc
    if data is None:
        return {}
    return data


@router.post("")
def post_profile_endpoint(body: ProfileBody):
    """Validate and upsert profile at farmers/default."""
    if get_firestore() is None:
        raise HTTPException(status_code=503, detail="Firestore not configured")
    payload = body.model_dump(exclude_none=True)
    if body.location is not None:
        payload["location"] = body.location.model_dump(exclude_none=True)
    try:
        set_profile(payload)
    except Exception as exc:
        msg = str(exc)
        if "firestore.googleapis.com" in msg or "Cloud Firestore API" in msg:
            raise HTTPException(
                status_code=503,
                detail="Cloud Firestore API is disabled for this project. Enable Firestore in Google Cloud/Firebase console and retry.",
            ) from exc
        raise HTTPException(status_code=500, detail="Failed to save profile to Firestore") from exc
    return payload
