# Publishing AgriSentinel AI to GitHub

## Repository description (short)

Use this as the **GitHub repo description** (Settings → General → Description):

```
AI-powered crop disease detection, yield prediction, and mandi price intelligence platform using TensorFlow.js and government data APIs.
```

---

## Commands to connect and push

Replace `<github-repo-url>` with your actual repo URL (e.g. `https://github.com/username/agrisentinel-ai.git`).

```bash
# If starting fresh (no git yet)
git init
git add .
git commit -m "AgriSentinel AI – Final version with CNN disease detection, yield prediction, Grad-CAM visualization, and smart mandi intelligence"
git branch -M main
git remote add origin <github-repo-url>
git push -u origin main
```

If the repo already has a remote:

```bash
git add .
git status   # verify .gitignore excludes node_modules, datasets, .venv-datasets, .cache, .env.local
git commit -m "AgriSentinel AI – Final version with CNN disease detection, yield prediction, Grad-CAM visualization, and smart mandi intelligence"
git push -u origin main
```

---

## Commit message (full)

```
AgriSentinel AI – Final version with CNN disease detection, yield prediction, Grad-CAM visualization, and smart mandi intelligence
```
