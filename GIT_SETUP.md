# Git setup – AgriSentinel AI (Hackathon)

> Hackathon Submission Note: Keep these steps handy for local demo + GitHub publishing.

Quick copy-paste commands to initialize Git and connect to GitHub.

---

## Step 1: Initialize and first commit

Run from project root (`agrisentinel-ai/`):

```bash
git init
git add .
git commit -m "Initial commit - AgriSentinel AI hackathon project"
```

---

## Step 2: Connect to GitHub and push

1. Create a new repository on GitHub named `agrisentinel-ai` (or your choice).  
2. Do **not** add a README, .gitignore, or license if you already have them locally.

Then run (replace `YOUR_USERNAME` with your GitHub username):

```bash
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agrisentinel-ai.git
git push -u origin main
```

**Using SSH instead of HTTPS:**

```bash
git remote add origin git@github.com:YOUR_USERNAME/agrisentinel-ai.git
git push -u origin main
```

---

## Step 3: Later commits (during hackathon)

```bash
git add .
git commit -m "feat: brief description of your change"
git push
```

Example messages:  
`feat: add voice assistant`, `fix: mandi filter`, `ui: update landing hero`
