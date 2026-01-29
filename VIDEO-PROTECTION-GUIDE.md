# 🛡️ Video Piracy Protection Guide

This guide explains how to convert your regular videos into **Encrypted Streaming Videos (HLS)** that are difficult to steal.

## 1. Install FFmpeg
You need the "engine" to process videos.
*   **Easy Way (if you have Chocolatey)**: Open Terminal as Admin and run: `choco install ffmpeg`
*   **Manual Way**: Download from [ffmpeg.org](https://ffmpeg.org/download.html), extract, and add the `bin` folder to your System PATH.
*   **Verify**: Open a new terminal and type `ffmpeg -version`. You should see version info.

## 2. Encrypt Your Video
1.  Place your video (e.g., `lesson1.mp4`) in the root folder of this project.
2.  Open PowerShell in this folder.
3.  Run the protection script:
    ```powershell
    ./scripts/protect-video.ps1 -InputFile "lesson1.mp4"
    ```
4.  Wait for it to finish.
5.  It will create a new folder called **`encrypted_lesson1`**.

**Check the folder**, it should contain:
*   `index.m3u8` (The master playlist)
*   `stream.key` (The secret password file)
*   Lots of `.ts` files (The encrypted video chunks)

## 3. Upload to Hosting
1.  **DigitalOcean**: Use FileZilla (sftp to your droplet IP) and upload the folder to `/var/www/html/videos/` (or wherever your web server looks).
2.  **cPanel**: Go to File Manager -> `public_html` -> create a `videos` folder -> Upload the **entire folder**.

## 4. Embed in Tutor LMS (WordPress)
1.  **Install Player**: Go to WordPress Plugins -> Add New -> Install **"FV Player"** (Free) or **"Presto Player"**.
2.  **Get the Link**: Your link will look like:
    `https://your-domain.com/videos/encrypted_lesson1/index.m3u8`
    *(Note: You link to the .m3u8 file, not the .key or .ts files)*
3.  **Tutor LMS Lesson**:
    *   Edit a Topic/Lesson.
    *   Video Source: **Embedded** (or Shortcode).
    *   Paste the shortcode:
        ```
        [fvplayer src="https://your-domain.com/videos/encrypted_lesson1/index.m3u8"]
        ```
4.  **Save & Test**: Play the video. It should stream perfectly.

## 5. (Optional) Extra Security
To prevent people from downloading the key directly, you can configure your web server (Nginx/Apache) to only allow the key to be downloaded by your own website (Referrer Check).
*   **Apache (.htaccess inside the video folder)**:
    ```apache
    <Files "stream.key">
    Order Deny,Allow
    Deny from all
    Allow from your-domain.com
    </Files>
    ```
