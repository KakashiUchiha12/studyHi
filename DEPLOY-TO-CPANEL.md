# 🚀 Step-by-Step cPanel Deployment Guide

This guide will walk you through deploying your StudyHi application to a shared cPanel hosting environment.

## 📋 Prerequisites
- Access to your cPanel dashboard.
- A domain or subdomain connected to your hosting (e.g., `app.yourdomain.com`).
- The **"Setup Node.js App"** feature enabled in your cPanel.

---

## Phase 1: Local Preparation (On Your Machine)

1.  **Stop the Development Server**:
    Press `Ctrl + C` in your terminal to stop the running server.

2.  **Compile the Custom Server**:
    We need to turn your `server.ts` into a file that cPanel can run (`dist/server.js`).
    ```powershell
    npm run build:server
    ```

3.  **Build the Next.js Application**:
    This optimizes your app for production.
    ```powershell
    npm run build
    ```

4.  **Prepare Files for Upload**:
    Create a ZIP file containing ONLY the following files and folders. **Do NOT zip `node_modules`.**
    *   `.next` (folder)
    *   `public` (folder)
    *   `dist` (folder) - *This contains your compiled server*
    *   `prisma` (folder)
    *   `package.json`
    *   `next.config.mjs`
    *   `database/schema.sql` - *For setting up the database*

    > **Tip**: Select these items in File Explorer, right-click, and choose "Compress to ZIP file". Name it `studyhi-deploy.zip`.

---

## Phase 2: cPanel Database Setup

1.  **Create Database**:
    *   Log in to cPanel.
    *   Go to **"MySQL® Database Wizard"**.
    *   Step 1: Create a database (e.g., `youruser_studyhi`).
    *   Step 2: Create a user (e.g., `youruser_admin`).
    *   Step 3: **IMPORTANT**: Save the **password** you generate!
    *   Step 4: Assign user to database and check **"ALL PRIVILEGES"**.

2.  **Import Tables**:
    *   Go back to cPanel home.
    *   Open **"phpMyAdmin"**.
    *   Select your new database (`youruser_studyhi`) from the left sidebar.
    *   Click the **"Import"** tab at the top.
    *   Click "Choose File" and select the `database/schema.sql` file from your local project.
    *   Click **"Go"** at the bottom.
    *   *Result: You should see all your tables (User, Task, etc.) appear in the left sidebar.*

---

## Phase 3: File Upload

1.  **File Manager**:
    *   Go to **"File Manager"** in cPanel.
    *   Navigate to your domain's root folder (usually `public_html` or a subdomain folder like `views/app`).
    *   **Delete** any default files (like `cgi-bin` or `index.php`) if this folder is dedicated to your app.

2.  **Upload & Extract**:
    *   Click **"Upload"** and upload your `studyhi-deploy.zip`.
    *   Right-click the uploaded zip and select **"Extract"**.
    *   *Result: You should see `.next`, `dist`, `package.json`, etc., in your folder.*

3.  **Create Production Environment Configuration**:
    *   In File Manager, create a new file named `.env`.
    *   Edit it and paste your environment variables. **Update the database connection string!**

    ```env
    NODE_ENV=production
    NEXTAUTH_URL=https://studyhi.freemdcat.com
    NEXTAUTH_SECRET=super_long_secret_string_for_nextauth_development_env_32_chars

    # Database: mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME
    DATABASE_URL="mysql://youruser_admin:YourSecurePassword@localhost:3306/youruser_studyhi"

    # Services
    PUSHER_APP_ID="2107345"
    PUSHER_KEY="03c8b458570215655ea3"
    PUSHER_SECRET="447b4e7fb1e016284ebf"
    PUSHER_CLUSTER="ap2"

    UPLOADTHING_SECRET="sk_live_e395636b11cb29ce54fec27ff66ffe09dbfc668414281ea70a438492ba4f8e11"
    UPLOADTHING_APP_ID="uxcuh400vg"
    UPLOADTHING_TOKEN="eyJhcGlLZXkiOiJza19saXZlX2UzOTU2MzZiMTFjYjI5Y2U1NGZlYzI3ZmY2NmZmZTA5ZGJmYzY2ODQxNDI4MWVhNzBhNDM4NDkyYmE0ZjhlMTEiLCJhcHBJZCI6InV4Y3VoNDAwdmciLCJyZWdpb25zIjpbInNlYTEiXX0="

    # Google Auth
    GOOGLE_CLIENT_ID="379796803716-0sjlagpgvuul9nbgmq0tes8lv836u4el.apps.googleusercontent.com"
    GOOGLE_CLIENT_SECRET="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"
    ```

---

## Phase 4: Node.js App Setup

1.  **Create Application**:
    *   Go to cPanel home and find **"Setup Node.js App"**.
    *   Click **"Create Application"**.
    *   **Node.js Version**: Select **18.x** or **20.x** (whichever matches your local dev).
    *   **Application Mode**: `Production`.
    *   **Application Root**: The path to your files (e.g., `public_html` or `subdomain_folder`).
    *   **Application URL**: Your domain.
    *   **Application Startup File**: `dist/server.js` (Type this manually!).
    *   Click **"Create"**.

2.  **Install Dependencies**:
    *   Once created, scroll down to steps.
    *   Click the **"Run NPM Install"** button.
    *   *Wait for it to finish. This installs all packages listed in package.json.*

3.  **Start the App**:
    *   Click **"Restart"** (or "Start").
    *   Wait a moment, then click **"Open"** to visit your site.

---

## 🚨 Troubleshooting

*   **"503 Service Unavailable"**:
    *   Check the "stderr.log" in your File Manager (inside the app folder).
    *   It often means a missing environment variable or database connection error.
*   **"Internal Server Error"**:
    *   Ensure your `DATABASE_URL` is correct.
    *   Ensure you imported the `schema.sql`.
*   **Styles/Images missing**:
    *   Next.js sometimes needs a custom server.js to serve static files correctly in subfolders. Verify `dist/server.js` is set as the startup file.
