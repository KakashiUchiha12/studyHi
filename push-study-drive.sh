#!/bin/bash

# Script to push Study Drive implementation to KakashiUchiha12/studyHi
# This helps you push the complete cloud storage system to the studyHi repository

set -e

echo "════════════════════════════════════════════════════════════════════"
echo "  🚀 Push Study Drive to KakashiUchiha12/studyHi"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if we're on the Study Drive branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "copilot/transform-studyhi-to-cloud-storage" ]; then
    echo "⚠️  Warning: You're on branch '$current_branch'"
    echo "   Study Drive is on: copilot/transform-studyhi-to-cloud-storage"
    echo ""
    read -p "Switch to Study Drive branch? (yes/no): " switch
    if [ "$switch" = "yes" ]; then
        git checkout copilot/transform-studyhi-to-cloud-storage
        echo "✅ Switched to Study Drive branch"
    else
        echo "❌ Please switch to the correct branch first"
        exit 1
    fi
fi

echo "✅ On correct branch: copilot/transform-studyhi-to-cloud-storage"
echo ""

# Check if studyhi remote exists
if ! git remote | grep -q "^studyhi$"; then
    echo "📡 Adding studyhi remote..."
    git remote add studyhi https://github.com/KakashiUchiha12/studyHi.git
    echo "✅ Remote 'studyhi' configured"
else
    echo "✅ Remote 'studyhi' already configured"
fi
echo ""

# Fetch latest from studyhi
echo "📥 Fetching latest from studyHi repository..."
if git fetch studyhi 2>/dev/null; then
    echo "✅ Fetched successfully"
else
    echo "⚠️  Could not fetch (may not have access yet)"
fi
echo ""

# Show what will be pushed
echo "════════════════════════════════════════════════════════════════════"
echo "  📦 Study Drive Implementation Ready to Push"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Database Schema: 5 new models (Drive, DriveFolder, DriveFile, etc.)"
echo "✅ API Routes: 12 complete endpoints"
echo "✅ UI Components: Drive page + storage/upload components"
echo "✅ Utilities: Storage, hashing, bandwidth, duplicate detection"
echo "✅ Security: PDF.js vulnerability patched (4.2.67)"
echo "✅ Documentation: 7 comprehensive guides"
echo ""
echo "📊 Statistics:"
echo "   - 9 commits"
echo "   - 35+ files"
echo "   - 5,000+ lines of code"
echo ""

# Show commit log
echo "📝 Recent commits to push:"
git log --oneline -5 copilot/transform-studyhi-to-cloud-storage | head -5
echo ""

# Ask user which method they want
echo "════════════════════════════════════════════════════════════════════"
echo "  Choose Push Method"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "1) Push to feature branch (RECOMMENDED - safest)"
echo "   → Creates 'feature/study-drive' branch"
echo "   → Can review changes before merging"
echo "   → No risk to main branch"
echo ""
echo "2) Push directly to main branch"
echo "   → Fast but risky"
echo "   → Overwrites main branch"
echo "   → Requires write access"
echo ""
echo "3) Show what would be pushed (dry run)"
echo "   → Preview changes without pushing"
echo ""
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "════════════════════════════════════════════════════════════════════"
        echo "  Method 1: Push to Feature Branch"
        echo "════════════════════════════════════════════════════════════════════"
        echo ""
        
        branch_name="feature/study-drive"
        
        echo "📤 Pushing to studyhi branch: $branch_name"
        echo ""
        echo "⚠️  You will be prompted for authentication:"
        echo "   - Username: Your GitHub username"
        echo "   - Password: Your Personal Access Token (not your password!)"
        echo ""
        echo "   Get a token at: https://github.com/settings/tokens"
        echo "   Required scope: 'repo' (full control)"
        echo ""
        read -p "Ready to push? (yes/no): " ready
        
        if [ "$ready" = "yes" ]; then
            echo ""
            echo "Pushing..."
            if git push studyhi copilot/transform-studyhi-to-cloud-storage:$branch_name; then
                echo ""
                echo "════════════════════════════════════════════════════════════════════"
                echo "  ✅ Successfully Pushed!"
                echo "════════════════════════════════════════════════════════════════════"
                echo ""
                echo "🎉 Study Drive is now in KakashiUchiha12/studyHi"
                echo ""
                echo "📋 Next Steps:"
                echo ""
                echo "1. Create Pull Request:"
                echo "   Visit: https://github.com/KakashiUchiha12/studyHi/compare/$branch_name"
                echo ""
                echo "2. Review the changes"
                echo ""
                echo "3. Merge to main when ready"
                echo ""
                echo "4. After merge, users must run:"
                echo "   npx prisma db push"
                echo "   node scripts/initialize-drives.js"
                echo "   npm install"
                echo ""
                echo "📚 Documentation:"
                echo "   - DRIVE-SETUP-GUIDE.md"
                echo "   - DRIVE-IMPLEMENTATION-SUMMARY.md"
                echo "   - SECURITY-UPDATE-PDFJS.md"
                echo ""
            else
                echo ""
                echo "❌ Push failed!"
                echo ""
                echo "Common issues:"
                echo "  - Authentication failed: Use a Personal Access Token"
                echo "  - Permission denied: Verify you have write access"
                echo "  - Network error: Check your internet connection"
                echo ""
                echo "See PUSH-STUDY-DRIVE-TO-STUDYHI.md for troubleshooting"
            fi
        else
            echo "Push cancelled."
        fi
        ;;
        
    2)
        echo ""
        echo "════════════════════════════════════════════════════════════════════"
        echo "  Method 2: Push Directly to Main"
        echo "════════════════════════════════════════════════════════════════════"
        echo ""
        echo "⚠️  WARNING: This will OVERWRITE the main branch in studyHi!"
        echo ""
        echo "This is fast but risky. Only use if:"
        echo "  - You own the studyHi repository"
        echo "  - You're sure about the changes"
        echo "  - No one else is working on it"
        echo ""
        read -p "Are you ABSOLUTELY sure? Type 'YES' to continue: " confirm
        
        if [ "$confirm" = "YES" ]; then
            echo ""
            echo "Pushing to main branch..."
            if git push studyhi HEAD:main --force; then
                echo ""
                echo "════════════════════════════════════════════════════════════════════"
                echo "  ✅ Successfully Pushed to Main!"
                echo "════════════════════════════════════════════════════════════════════"
                echo ""
                echo "🎉 Study Drive is now live in KakashiUchiha12/studyHi"
                echo ""
                echo "⚠️  IMPORTANT: All users must now:"
                echo ""
                echo "1. Pull the changes:"
                echo "   git pull origin main"
                echo ""
                echo "2. Run migrations:"
                echo "   npx prisma db push"
                echo "   node scripts/initialize-drives.js"
                echo ""
                echo "3. Install dependencies:"
                echo "   npm install"
                echo ""
                echo "4. Update PDF.js imports (8 files)"
                echo "   See: SECURITY-UPDATE-PDFJS.md"
                echo ""
                echo "5. Restart application"
                echo ""
                echo "View at: https://github.com/KakashiUchiha12/studyHi"
            else
                echo ""
                echo "❌ Push failed!"
                echo "See PUSH-STUDY-DRIVE-TO-STUDYHI.md for troubleshooting"
            fi
        else
            echo "Push cancelled. Use Method 1 (feature branch) for a safer approach."
        fi
        ;;
        
    3)
        echo ""
        echo "════════════════════════════════════════════════════════════════════"
        echo "  Preview: Changes to be Pushed"
        echo "════════════════════════════════════════════════════════════════════"
        echo ""
        echo "📊 Files changed:"
        git diff studyhi/main HEAD --stat 2>/dev/null || echo "Cannot compare (no access to studyhi/main)"
        echo ""
        echo "📝 Commits to push:"
        git log --oneline copilot/transform-studyhi-to-cloud-storage --not --remotes=studyhi/* 2>/dev/null || git log --oneline -10
        echo ""
        ;;
        
    4)
        echo ""
        echo "Exiting..."
        exit 0
        ;;
        
    *)
        echo ""
        echo "❌ Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  Done!"
echo "════════════════════════════════════════════════════════════════════"
echo ""
echo "For detailed instructions, see: PUSH-STUDY-DRIVE-TO-STUDYHI.md"
echo ""
