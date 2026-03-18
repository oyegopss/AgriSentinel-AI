"""
Firestore client for AgriSentinel AI (single-user v1).
Uses GOOGLE_APPLICATION_CREDENTIALS (path to JSON) or FIREBASE_* env vars.
"""
import os
from typing import Any, Optional

_firestore_client: Any = None


def get_firestore():
    """Return Firestore client; initializes once from env."""
    global _firestore_client
    if _firestore_client is not None:
        return _firestore_client

    creds_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if creds_path and os.path.isfile(creds_path):
        import firebase_admin
        from firebase_admin import credentials, firestore
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(credentials.Certificate(creds_path))
        _firestore_client = firestore.client()
        return _firestore_client

    project_id = os.getenv("FIREBASE_PROJECT_ID")
    client_email = os.getenv("FIREBASE_CLIENT_EMAIL")
    private_key = os.getenv("FIREBASE_PRIVATE_KEY")
    if project_id and client_email and private_key:
        import firebase_admin
        from firebase_admin import credentials, firestore
        # Private key may be stored with literal \n
        if "\\n" in private_key:
            private_key = private_key.replace("\\n", "\n")
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(
                credentials.Certificate({
                    "type": "service_account",
                    "project_id": project_id,
                    "client_email": client_email,
                    "private_key": private_key,
                    "token_uri": "https://oauth2.googleapis.com/token",
                })
            )
        _firestore_client = firestore.client()
        return _firestore_client

    return None


def get_profile() -> Optional[dict]:
    """Return farmer profile for single-user doc farmers/default."""
    db = get_firestore()
    if not db:
        return None
    doc = db.collection("farmers").document("default").get()
    if doc.exists:
        return doc.to_dict()
    return None


def set_profile(data: dict) -> dict:
    """Upsert profile at farmers/default."""
    db = get_firestore()
    if not db:
        raise RuntimeError("Firestore not configured")
    db.collection("farmers").document("default").set(data)
    return data


def get_farm() -> Optional[dict]:
    """Return farm polygon for single-user doc farms/default."""
    db = get_firestore()
    if not db:
        return None
    doc = db.collection("farms").document("default").get()
    if doc.exists:
        return doc.to_dict()
    return None


def set_farm(data: dict) -> dict:
    """Upsert farm at farms/default."""
    db = get_firestore()
    if not db:
        raise RuntimeError("Firestore not configured")
    db.collection("farms").document("default").set(data)
    return data
