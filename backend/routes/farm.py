from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from services.firestore_db import get_firestore, get_farm, set_farm


router = APIRouter(prefix="/farm", tags=["farm"])

# 1 acre ≈ 4046.86 m²
M2_PER_ACRE = 4046.86


class PointModel(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lon: float = Field(..., ge=-180, le=180)


class FarmBody(BaseModel):
    polygon: list[PointModel] = Field(..., min_length=3)
    area_acres: Optional[float] = None


def _area_m2(lats: list[float], lons: list[float]) -> float:
    """Approximate polygon area in m² using lat/lon and meter scaling at centroid."""
    import math
    n = len(lats)
    if n != len(lons) or n < 3:
        return 0.0
    if lats[0] != lats[-1] or lons[0] != lons[-1]:
        lats = list(lats) + [lats[0]]
        lons = list(lons) + [lons[0]]
        n = len(lats)
    cy = sum(lats) / n
    cx = sum(lons) / n
    m_per_deg_lat = 111320.0
    m_per_deg_lon = 111320.0 * math.cos(math.radians(cy))
    xs = [lon * m_per_deg_lon for lon in lons]
    ys = [lat * m_per_deg_lat for lat in lats]
    area = 0.0
    for i in range(n - 1):
        area += xs[i] * ys[i + 1] - xs[i + 1] * ys[i]
    return abs(area) / 2.0


def _polygon_area_acres(points: list[dict]) -> float:
    """Compute area in acres from list of {lat, lon} (server as source of truth)."""
    lats = [p["lat"] for p in points]
    lons = [p["lon"] for p in points]
    m2 = _area_m2(lats, lons)
    return m2 / M2_PER_ACRE


@router.get("")
def get_farm_endpoint():
    """Return the single-user farm polygon (farms/default)."""
    if get_firestore() is None:
        raise HTTPException(status_code=503, detail="Firestore not configured")
    try:
        data = get_farm()
    except Exception as exc:
        msg = str(exc)
        if "firestore.googleapis.com" in msg or "Cloud Firestore API" in msg:
            raise HTTPException(
                status_code=503,
                detail="Cloud Firestore API is disabled for this project. Enable Firestore in Google Cloud/Firebase console and retry.",
            ) from exc
        raise HTTPException(status_code=500, detail="Failed to read farm from Firestore") from exc
    if data is None:
        return {}
    return data


@router.post("")
def post_farm_endpoint(body: FarmBody):
    """Store polygon; compute area server-side as source of truth."""
    if get_firestore() is None:
        raise HTTPException(status_code=503, detail="Firestore not configured")
    points = [p.model_dump() for p in body.polygon]
    area_acres = _polygon_area_acres(points)
    payload = {"polygon": points, "area_acres": area_acres}
    try:
        set_farm(payload)
    except Exception as exc:
        msg = str(exc)
        if "firestore.googleapis.com" in msg or "Cloud Firestore API" in msg:
            raise HTTPException(
                status_code=503,
                detail="Cloud Firestore API is disabled for this project. Enable Firestore in Google Cloud/Firebase console and retry.",
            ) from exc
        raise HTTPException(status_code=500, detail="Failed to save farm to Firestore") from exc
    return payload
