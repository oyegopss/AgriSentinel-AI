# AgriSentinel AI – AI-Powered Crop Intelligence Platform

**AgriSentinel AI** is an AI-powered agriculture assistant that helps farmers **detect crop diseases**, **predict yield**, and **find the best mandi prices** using deep learning and government data APIs—all in the browser.

## Live Demo

**[https://agrisentinel-ai.vercel.app](https://agrisentinel-ai.vercel.app)**

---

## Overview

The platform combines:

- **AI crop disease detection** (CNN) for instant leaf diagnosis and treatment suggestions  
- **Yield prediction** based on crop, soil, weather, and farm area  
- **Smart mandi intelligence** using real-time Government of India [data.gov.in](https://data.gov.in) prices to recommend the best market  

Farmers can upload or scan leaf images, get disease and severity with explainable Grad-CAM heatmaps, see yield impact, and compare live mandi prices—all in one flow (including the **AI Farmer Advisor** unified decision system).

---

## Features

| Feature | Description |
|--------|-------------|
| **AI Crop Disease Detection** | MobileNetV2 CNN trained on PlantVillage; 38 disease classes; client-side TensorFlow.js inference |
| **Grad-CAM Explainable AI** | Heatmap overlay showing which leaf regions the model used for the prediction |
| **Real-time camera leaf scanning** | Capture leaf from device camera and run the same CNN + heatmap pipeline |
| **Crop Yield Prediction** | Input crop, soil, temperature, rainfall, farm area → predicted yield (tons/hectare) with factor breakdown |
| **Smart Mandi Price Intelligence** | Fetches live mandi prices from data.gov.in; best price recommendation and comparison table |
| **AI Farmer Advisor** | End-to-end flow: upload/scan leaf → disease → yield adjustment → mandi prices → AI recommendation |
| **Farmer recommendations** | Disease-specific treatment and market advice in the UI |

---

## AI Model Details

| Item | Detail |
|------|--------|
| **Dataset** | PlantVillage |
| **Images** | 54,306 |
| **Classes** | 38 (crop–disease combinations) |
| **Framework** | TensorFlow (training), TensorFlow.js (inference) |
| **Model** | MobileNetV2 CNN (transfer learning) |
| **Inference** | Client-side in the browser (no server GPU required) |

---

## Tech Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React, Next.js, Tailwind CSS, Framer Motion |
| **AI / ML** | TensorFlow.js (browser), TensorFlow + Keras (training) |
| **Dataset** | PlantVillage (38 classes, ~54k images) |
| **API** | [data.gov.in](https://data.gov.in) (Government of India mandi prices) |

---

## Installation

### Prerequisites

- **Node.js** 18+ and npm  
- (Optional) **Python 3.9+** and pip if you want to retrain the model or run dataset scripts  

### Run the app

```bash
git clone https://github.com/oyegopss/agrisentinel-ai.git
cd agrisentinel-ai

npm install
npm run dev
```

Then open:

**http://localhost:3000**

The app will load the pre-built TensorFlow.js model from `public/model/` (no training step required to run the demo).

### Optional: Mandi API (real prices)

For live mandi data, add a [data.gov.in API key](https://data.gov.in) and create:

```bash
# .env.local (do not commit)
NEXT_PUBLIC_DATA_GOV_API_KEY=your_api_key_here
```

If the key is missing, mandi pages will show a friendly error and the rest of the app (disease detection, yield prediction) still works.

### Optional: Retrain the disease model

```bash
# Python env and deps
python3 -m venv .venv-datasets
.venv-datasets/bin/pip install -r scripts/requirements-datasets.txt

# Train (downloads dataset if needed; can take 30–60+ min)
.venv-datasets/bin/python scripts/train_model.py

# Convert to TensorFlow.js for browser
.venv-datasets/bin/python scripts/convert_to_tfjs.py
```

Output goes to `public/model/` (model.json, shards, class_names.json).

---

## Project Structure

```
agrisentinel-ai/
├── app/                    # Next.js App Router pages
│   ├── page.tsx            # Home
│   ├── disease-detection/  # CNN + Grad-CAM + camera
│   ├── yield-prediction/
│   ├── mandi-intelligence/
│   ├── advisor/            # AI Farmer Advisor (full pipeline)
│   ├── voice-assistant/
│   └── layout.tsx
├── lib/                    # Shared utilities & API clients
│   ├── mandiApi.js         # data.gov.in mandi API
│   ├── advisorInference.ts  # Disease inference for Advisor
│   └── advisorYield.ts     # Yield logic for Advisor
├── public/
│   ├── model/              # TensorFlow.js model (tracked)
│   │   ├── model.json
│   │   ├── group1-shard*.bin
│   │   └── class_names.json
│   └── demo-leaves/        # Demo leaf images for quick test
├── scripts/                # Training & conversion
│   ├── train_model.py      # Train MobileNetV2 on PlantVillage
│   ├── convert_to_tfjs.py  # Keras → TensorFlow.js
│   ├── requirements-datasets.txt
│   └── run_full_pipeline.sh
├── datasets/               # Ignored; download via scripts
├── .venv-datasets/         # Ignored; Python venv for training
└── .gitignore
```

---

## Future Improvements

- Satellite-based crop monitoring  
- Pest detection (insects, larvae)  
- Weather forecasting integration  
- AI-driven irrigation recommendations  
- Multi-language support for farmers  

---

## License

See [LICENSE](LICENSE) in the repository (add a license file if needed).

---

**AgriSentinel AI** – AI Crop disease detection, Yield prediction, and Smart mandi intelligence in one platform.
