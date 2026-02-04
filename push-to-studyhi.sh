#!/bin/bash

# Script to push authentication fixes to KakashiUchiha12/studyHi
# This script helps you push the fixes from this repository to studyHi

set -e

echo "════════════════════════════════════════════════════════════"
echo "  Push Authentication Fixes to KakashiUchiha12/studyHi"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check if studyhi remote exists
if ! git remote | grep -q "^studyhi$"; then
    echo "Adding studyhi remote..."
    git remote add studyhi https://github.com/KakashiUchiha12/studyHi.git
fi

echo "✅ Remote 'studyhi' configured"
echo ""

# Fetch latest from studyhi
echo "Fetching latest from studyHi repository..."
git fetch studyhi
echo ""

# Show what will be pushed
echo "════════════════════════════════════════════════════════════"
echo "  Key Changes to be Pushed:"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1. lib/auth.ts"
echo "   - Google OAuth made conditional (prevents crashes)"
echo "   - NEXTAUTH_SECRET fallback added"
echo ""
echo "2. env.production.template"
echo "   - Template for environment configuration"
echo ""
echo "3. .gitignore"
echo "   - Protects .env.production from being committed"
echo ""
echo "4. Documentation (optional)"
echo "   - ENV-CONFIG-GUIDE.md"
echo "   - PRODUCTION-DEPLOYMENT.md"
echo ""

# Ask user which method they want
echo "════════════════════════════════════════════════════════════"
echo "  Choose Push Method:"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "1) Push to main branch (direct, requires write access)"
echo "2) Push to a feature branch (safer, can review first)"
echo "3) Show diff only (don't push anything)"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "⚠️  WARNING: This will push directly to main branch!"
        read -p "Are you sure? (yes/no): " confirm
        if [ "$confirm" = "yes" ]; then
            echo ""
            echo "Pushing to studyhi main branch..."
            git push studyhi HEAD:main
            echo ""
            echo "✅ Successfully pushed to KakashiUchiha12/studyHi main branch!"
            echo ""
            echo "View changes at: https://github.com/KakashiUchiha12/studyHi"
        else
            echo "Push cancelled."
        fi
        ;;
    2)
        echo ""
        read -p "Enter branch name (e.g., auth-fixes): " branch_name
        if [ -z "$branch_name" ]; then
            branch_name="auth-improvements"
        fi
        echo ""
        echo "Pushing to studyhi branch: $branch_name"
        git push studyhi HEAD:$branch_name
        echo ""
        echo "✅ Successfully pushed to branch: $branch_name"
        echo ""
        echo "Create a Pull Request at:"
        echo "https://github.com/KakashiUchiha12/studyHi/compare/$branch_name"
        ;;
    3)
        echo ""
        echo "Showing differences between current state and studyhi/main:"
        echo ""
        git diff studyhi/main HEAD -- lib/auth.ts env.production.template .gitignore
        ;;
    4)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice. Exiting..."
        exit 1
        ;;
esac

echo ""
echo "════════════════════════════════════════════════════════════"
echo "  Done!"
echo "════════════════════════════════════════════════════════════"
