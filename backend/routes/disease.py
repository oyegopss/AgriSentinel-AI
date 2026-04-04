from fastapi import APIRouter, File, UploadFile, HTTPException
from pydantic import BaseModel
import random

router = APIRouter(prefix="/disease", tags=["disease"])

class DiseaseResponse(BaseModel):
    is_leaf: bool
    disease: str
    confidence: float
    severity: str
    recommendation: str

@router.post("/detect", response_model=DiseaseResponse)
async def detect_disease(file: UploadFile = File(...)):
    """
    Simulated Disease Detection Endpoint.
    1. Checks if the image is a leaf (heuristic stub).
    2. Runs simulated classification if it is a leaf.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image.")

    # Read file content for processing placeholder
    contents = await file.read()
    file_size_kb = len(contents) / 1024

    # Simulated Leaf Classifier:
    # Let's pretend files under a certain size or generic condition fail the leaf test.
    # We will use a random chance to make it feel "real" or just assume it's a leaf for demo.
    # To ensure a good demo experience, we'll assume it IS a leaf.
    is_leaf = True

    if not is_leaf:
        return DiseaseResponse(
            is_leaf=False,
            disease="Unknown",
            confidence=0.0,
            severity="None",
            recommendation="Please upload a clear image of a crop leaf."
        )

    # Simulated Disease Classification:
    # Based on random selection to demonstrate the Unified Engine changing states.
    diseases = [
        {"name": "Healthy", "severity": "None", "rec": "Crop is healthy. Continue standard care.", "conf": random.uniform(0.90, 0.99)},
        {"name": "Early Blight", "severity": "Medium", "rec": "Apply copper-based fungicide. Reduce watering.", "conf": random.uniform(0.80, 0.95)},
        {"name": "Leaf Rust", "severity": "High", "rec": "CRITICAL: Isolate infected plants. Apply systemic fungicide immediately.", "conf": random.uniform(0.85, 0.98)},
        {"name": "Powdery Mildew", "severity": "Low", "rec": "Ensure proper spacing for airflow. Apply neem oil.", "conf": random.uniform(0.70, 0.88)}
    ]
    
    # Weighted choice: 40% healthy, 60% various diseases
    chosen = random.choices(
        diseases, 
        weights=[40, 20, 20, 20], 
        k=1
    )[0]

    return DiseaseResponse(
        is_leaf=True,
        disease=chosen["name"],
        confidence=chosen["conf"],
        severity=chosen["severity"],
        recommendation=chosen["rec"]
    )
