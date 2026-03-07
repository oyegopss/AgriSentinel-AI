# AgriSentinel AI – Smart Farming Intelligence Platform

**AgriSentinel AI** is an AI-powered platform designed to help farmers make data-driven decisions. The system includes crop disease detection using computer vision, yield prediction using machine learning, and smart mandi recommendations using market price data.

---

## Features

- **Crop Disease Detection** – Upload leaf images for instant AI diagnosis and treatment suggestions
- **Yield Prediction** – ML-based harvest forecasts using crop, soil, weather, and farm size
- **Smart Mandi Price Intelligence** – Compare mandi prices and find the best market for your crop
- **Voice Assistant** – Ask questions by voice or text (disease, mandi, yield) in a conversational interface
- **Modern Web Dashboard** – Dark futuristic UI with glassmorphism, animations, and responsive design

---

## Tech Stack

| Layer      | Technologies                          |
| ---------- | ------------------------------------- |
| **Frontend** | Next.js, Tailwind CSS, Framer Motion   |
| **Backend**  | Flask / Node API                      |
| **AI / ML**  | TensorFlow, OpenCV                    |
| **APIs**     | Weather API, Mandi Price Data         |

---

## Team – TriNexus

| Role            | Name              |
| --------------- | ----------------- |
| AI & Backend    | Gopal Ji Dwivedi  |
| Frontend        | Jhanvi Chaudhary  |
| Data & Research | Harsh Yadav       |

---

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Install and run

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm start
```

### Project routes

| Route                 | Description                    |
| --------------------- | ------------------------------ |
| `/`                   | Landing page                   |
| `/disease-detection`  | Crop disease detection (upload) |
| `/yield-prediction`   | Yield prediction form & dashboard |
| `/mandi-intelligence` | Mandi price comparison table  |
| `/voice-assistant`    | Voice/text AI assistant        |

---

## Development & Git (Hackathon)

### Initial setup (one-time)

Run these commands from the **project root** (e.g. `agrisentinel-ai/`):

```bash
# 1. Initialize Git
git init

# 2. Stage all files
git add .

# 3. First commit
git commit -m "Initial commit - AgriSentinel AI hackathon project"

# 4. Use main as default branch
git branch -M main

# 5. Add your GitHub repo as remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/agrisentinel-ai.git

# 6. Push to GitHub
git push -u origin main
```

### Daily hackathon workflow

- **Commit often** with clear messages:

```bash
git add .
git commit -m "feat: add disease detection result card"
git push
```

- **Good commit message examples:**
  - `feat: add voice assistant page with speech-to-text`
  - `fix: mandi table filter for crop and location`
  - `ui: glassmorphism and neon borders on yield dashboard`
  - `docs: update README with team and tech stack`

- **Sync before starting work:**

```bash
git pull origin main
```

- **Create a feature branch (optional):**

```bash
git checkout -b feature/your-feature-name
# ... make changes ...
git add .
git commit -m "feat: your feature description"
git push -u origin main
```

---

## Connect to a new GitHub repository

1. Create a **new repository** on GitHub (e.g. `agrisentinel-ai`). Do **not** initialize with README if you already have one locally.

2. Run in your project folder:

```bash
git init
git add .
git commit -m "Initial commit - AgriSentinel AI hackathon project"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agrisentinel-ai.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username (or org name) and `agrisentinel-ai` with your repo name if different.

3. If the repo was created with a README and you get push conflicts:

```bash
git pull origin main --allow-unrelated-histories
# Resolve any conflicts, then:
git add .
git commit -m "Merge remote README with local project"
git push -u origin main
```

---

## License

This project is submitted for hackathon purposes. All rights reserved by **Team TriNexus**.
