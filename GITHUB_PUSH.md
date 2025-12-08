# Push to GitHub - Quick Guide

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click "New repository"
3. Name it (e.g., `academia-san-martin`)
4. Keep it **Private** (recommended)
5. **DO NOT** initialize with README
6. Click "Create repository"

## Step 2: Push Code

Open terminal in project root and run:

```bash
cd c:\xampp\htdocs\CAPSTONE-main\CAPSTONE-main

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Production ready system"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Verify

1. Refresh your GitHub repository page
2. You should see all files uploaded
3. Check that `.env` files are NOT uploaded (they're in .gitignore)

## Important Notes

✅ **What WILL be uploaded:**
- All source code
- Documentation
- Configuration templates (.env.example)
- Build scripts

❌ **What will NOT be uploaded:**
- node_modules/
- .next/
- build/
- .env files (secrets)
- Database files

## Next Steps

After pushing to GitHub:
1. Open **VERCEL_DEPLOYMENT.md**
2. Follow the Vercel deployment steps
3. Deploy your application

## Troubleshooting

### "Git not found"
Install Git: https://git-scm.com/download/win

### "Permission denied"
Use HTTPS URL or set up SSH keys

### "Large files"
Already handled - build folders are in .gitignore

### "Failed to push"
```bash
# If repository already has content
git pull origin main --allow-unrelated-histories
git push origin main
```

## Quick Commands Reference

```bash
# Check status
git status

# Add specific files
git add filename.txt

# Commit changes
git commit -m "Your message"

# Push changes
git push

# Pull latest changes
git pull
```

## Ready to Deploy?

Once pushed to GitHub:
→ Open **VERCEL_DEPLOYMENT.md** for next steps
