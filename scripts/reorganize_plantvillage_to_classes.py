#!/usr/bin/env python3
"""
Hackathon Demo: Reorganize PlantVillage dataset into class folder structure.

Reorganize PlantVillage color/ into 38 class folders.
Handles: (1) files directly in color/ with name raw_*_CLASSNAME_<uuid>___*.jpg
         (2) subdirs named raw_*_CLASSNAME_* containing *.jpg
Extracts CLASSNAME (e.g. Apple___Apple_scab) for color_by_class/CLASSNAME/.
"""

import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
COLOR_DIR = PROJECT_ROOT / "datasets" / "plantvillage" / "color"
OUT_DIR = PROJECT_ROOT / "datasets" / "plantvillage" / "color_by_class"

# From name "raw_*_CLASSNAME_<uuid>___...". Class is everything between raw_*_ and _uuid___ (greedy).
CLASS_PATTERN = re.compile(r"^raw_(?:color|grayscale|segmented)_(.+)_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}___", re.I)


def extract_class(name: str):
    m = CLASS_PATTERN.match(name)
    return m.group(1).strip() if m else None


def main():
    if not COLOR_DIR.exists():
        print(f"Not found: {COLOR_DIR}. Run download_plantvillage.py first.")
        return
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    count = 0
    for jpg in COLOR_DIR.rglob("*.jpg"):
        if not jpg.exists() or jpg.is_dir():
            continue
        class_name = extract_class(jpg.stem) or extract_class(jpg.parent.name)
        if not class_name:
            continue
        class_dir = OUT_DIR / class_name.replace("/", "_")
        class_dir.mkdir(parents=True, exist_ok=True)
        dest = class_dir / jpg.name
        if not dest.exists() or dest.stat().st_size != jpg.stat().st_size:
            dest.write_bytes(jpg.read_bytes())
        count += 1
    n_classes = len(list(OUT_DIR.iterdir()))
    print(f"Reorganized {count} images into {n_classes} classes under {OUT_DIR}")


if __name__ == "__main__":
    main()
