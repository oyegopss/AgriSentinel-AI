#!/usr/bin/env python3
"""
Convert trained Keras H5 model to TensorFlow.js format for browser inference.

Input:  model/plant_disease_model.h5
Output: public/model/model.json + shard .bin files

Usage (from project root):
    .venv-datasets/bin/pip install tensorflowjs
    .venv-datasets/bin/python scripts/convert_to_tfjs.py
"""

import os
import sys
import json
import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
H5_PATH = PROJECT_ROOT / "model" / "plant_disease_model.h5"
CLASS_NAMES_PATH = PROJECT_ROOT / "model" / "class_names.json"
OUTPUT_DIR = PROJECT_ROOT / "public" / "model"


def main():
    if not H5_PATH.exists():
        print(f"Model not found at {H5_PATH}")
        print("Run train_model.py first.")
        sys.exit(1)

    try:
        import tensorflowjs as tfjs
    except ImportError:
        print("tensorflowjs not installed. Install it:")
        print("  .venv-datasets/bin/pip install tensorflowjs")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Remove old model files (keep README if present)
    for f in OUTPUT_DIR.iterdir():
        if f.name in ("README.md",):
            continue
        if f.is_file():
            f.unlink()

    print(f"Converting {H5_PATH} → {OUTPUT_DIR}")

    import tensorflow as tf
    model = tf.keras.models.load_model(str(H5_PATH))
    tfjs.converters.save_keras_model(model, str(OUTPUT_DIR))

    # Copy class_names.json to public/model/ for optional frontend use
    if CLASS_NAMES_PATH.exists():
        shutil.copy2(CLASS_NAMES_PATH, OUTPUT_DIR / "class_names.json")
        print(f"Copied class_names.json → {OUTPUT_DIR / 'class_names.json'}")

    output_files = list(OUTPUT_DIR.iterdir())
    print(f"\nConversion complete. Files in {OUTPUT_DIR}:")
    for f in sorted(output_files):
        size = f.stat().st_size
        print(f"  {f.name} ({size:,} bytes)")

    print("\nThe model is ready for browser inference.")
    print("Frontend loads it with: tf.loadLayersModel('/model/model.json')")


if __name__ == "__main__":
    main()
