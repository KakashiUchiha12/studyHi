# 🌊 DigitalOcean Deployment Walkthrough

This guide is specific to the **StudyHi** application using **Docker**.

## Prerequisite: The "Droplet"
1.  **Log in** to DigitalOcean.
2.  **Create Droplet**:
    *   **Region**: Nearest to you.
    *   **OS**: Ubuntu 24.04 (LTS) x64.
    *   **Size**: Basic -> Regular -> $6/mo (1GB RAM) or $12/mo (2GB RAM).
    *   **Authentication**: Password (write it down!).
3.  **Launch**: Wait for the IP Address (e.g., `164.92.111.222`).

## Step 1: Connect to Server
Open your terminal (PowerShell or CMD) on your PC:
```powershell
ssh root@<YOUR_DROPLET_IP>
# Type "yes" if asked.
# Type your password (it won't show while typing).
```

## Step 2: Get the Code
Once inside the server (you'll see `root@ubuntu:~#`), run:
```bash
# Clone your repository
git clone https://github.com/KakashiUchiha12/studyHi.git

# Go into the folder
cd studyHi
```

## Step 3: Configure Environment
You need to set your passwords and secrets.
```bash
# Create .env file from example
cp env.example .env

# Edit it (Optional specific changes)
nano .env
# (Press Ctrl+X, then Y, then Enter to save if you changed anything)
```

## Step 4: The "Magic" Deployment (Manual Way)
We prepared a script to do the heavy lifting (Installs Docker, builds app, starts DB).
```bash
# Make script executable
chmod +x scripts/deploy-script.sh

# Run it
./scripts/deploy-script.sh
```

## Step 5: Continuous Deployment (Automatic Way) 🚀
We have set up **GitHub Actions** to auto-deploy whenever you push to `main`.

**Requirements:**
1.  Go to GitHub Repo -> Settings -> Secrets and variables -> Actions.
2.  Add `DROPLET_IP` (Your server IP).
3.  Add `DROPLET_PASSWORD` (Your server password).

**How it works:**
*   You edit code on your PC.
*   You push to GitHub (`git push`).
*   **GitHub automatically logs into your server and updates the site.**
*   You don't need to do anything!
