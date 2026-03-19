#!/usr/bin/env python3
"""
Hackathon Demo: Download the PlantVillage dataset used for model training.

Download the PlantVillage dataset and save it under datasets/plantvillage/.

Dataset: ~54,306 images, 38 classes, 14 crops, RGB (healthy + diseased leaves).
Uses Hugging Face 'datasets' (no Kaggle API required).

Usage (from project root):
    pip install -r scripts/requirements-datasets.txt
    python scripts/download_plantvillage.py
"""

import os
import sys
from pathlib import Path

# Project root: script lives in scripts/, dataset goes in datasets/plantvillage/
PROJECT_ROOT = Path(__file__).resolve().parent.parent
OUTPUT_DIR = PROJECT_ROOT / "datasets" / "plantvillage"
COLOR_DIR = OUTPUT_DIR / "color"

# Keep Hugging Face cache inside project so no write to ~/.cache
os.environ["HF_HOME"] = str(PROJECT_ROOT / ".cache" / "huggingface")
os.environ["HF_DATASETS_CACHE"] = str(PROJECT_ROOT / ".cache" / "huggingface" / "datasets")


def main():
    try:
        from datasets import load_dataset
    except ImportError:
        print("Please install dependencies first:")
        print("  pip install -r scripts/requirements-datasets.txt")
        sys.exit(1)

    print("Loading PlantVillage dataset (color, RGB)...")
    print("This may take a while on first run (downloads ~hundreds of MB).")
    try:
        # Config may be "default" (mohanty) or "color" (thrillchad)
        dataset = load_dataset("mohanty/PlantVillage", "default")
    except ValueError as e:
        if "not found" in str(e):
            dataset = load_dataset("thrillchad/PlantVillage", "color")
        else:
            raise e

    COLOR_DIR.mkdir(parents=True, exist_ok=True)

    # Column names: mohanty/PlantVillage may use "disease" (str) or "label" (int); image key "image"
    feats = dataset["train"].features
    first = dataset["train"][0]
    keys = list(first.keys())
    label_key = None
    for k in ("label", "disease", "disease_name", "class_name"):
        if k in keys:
            label_key = k
            break
    if label_key is None:
        # Use first column that is not image
        image_key = "image" if "image" in keys else "img"
        label_key = next((k for k in keys if k != image_key), keys[0])
    image_key = "image" if "image" in keys else "img"
    # If label is int, get class names from features
    id2label = None
    if label_key in feats and hasattr(feats[label_key], "names") and feats[label_key].names:
        id2label = feats[label_key].names

    def save_split(split_name: str, ds):
        n = len(ds)
        for i, row in enumerate(ds):
            raw = row.get(label_key, "unknown")
            label = id2label[int(raw)] if id2label is not None and isinstance(raw, (int, float)) else str(raw)
            class_dir = COLOR_DIR / label.replace("/", "_").replace(" ", "_")
            class_dir.mkdir(parents=True, exist_ok=True)
            img = row.get(image_key)
            if img is None:
                continue
            path = class_dir / f"{split_name}_{i:06d}.jpg"
            img.save(path)
            if (i + 1) % 5000 == 0 or i == 0:
                print(f"  {split_name}: {i + 1}/{n}")

    print("Saving train split...")
    save_split("train", dataset["train"])
    print("Saving test split...")
    save_split("test", dataset["test"])

    n_classes = len(list(COLOR_DIR.iterdir()))
    n_images = sum(1 for _ in COLOR_DIR.rglob("*.jpg"))
    print(f"Done. Saved to {COLOR_DIR}")
    print(f"  Classes: {n_classes}, Images: {n_images}")


if __name__ == "__main__":
    main()
