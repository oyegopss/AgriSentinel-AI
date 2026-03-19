#!/usr/bin/env bash
# Hackathon Demo: end-to-end pipeline runner (train → convert → start dev).
# Full pipeline: install deps → train → convert → dev server
# Run from project root: ./scripts/run_full_pipeline.sh

set -e
cd "$(dirname "$0")/.."
ROOT="$PWD"
VENV="$ROOT/.venv-datasets"

echo "=== 1. Install Python deps ==="
"$VENV/bin/pip" install -r scripts/requirements-datasets.txt

echo ""
echo "=== 2. Train model (downloads dataset from HF if local is empty) ==="
"$VENV/bin/python" scripts/train_model.py

echo ""
echo "=== 3. Convert to TensorFlow.js ==="
"$VENV/bin/python" scripts/convert_to_tfjs.py

echo ""
echo "=== 4. Start dev server ==="
npm run dev
