# Deploying to GitHub Pages (mattkrueger.org)

This guide shows you how to deploy the Grateful Dead Tracker to your existing GitHub Pages site at mattkrueger.org.

## Prerequisites

- Git installed on your computer
- Access to your mattkrueger.org GitHub repository
- Node.js installed (to build the app)

## Option 1: Deploy as a Subfolder (Recommended)

This will make your app available at `https://mattkrueger.org/dead-tracker/`

### Step 1: Prepare the App

The app is already configured for this with `base: '/dead-tracker/'` in `vite.config.js`.

### Step 2: Add to Your Repository

1. Copy the entire `dead-tracker` folder into your `mattkrueger.org` repository:
```bash
# Navigate to your mattkrueger.org repo
cd /path/to/mattkrueger.org

# Copy the dead-tracker folder here
cp -r /path/to/dead-tracker .
```

2. Commit and push:
```bash
git add dead-tracker/
git commit -m "Add Grateful Dead show tracker"
git push origin main
```

### Step 3: Build and Deploy

Method A - Using GitHub Actions (Automatic):

1. Create `.github/workflows/deploy-dead-tracker.yml` in your repo:
```yaml
name: Deploy Dead Tracker

on:
  push:
    branches:
      - main
    paths:
      - 'dead-tracker/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install and Build
        run: |
          cd dead-tracker
          npm install
          npm run build
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dead-tracker/dist
          destination_dir: dead-tracker
```

2. Push this file and GitHub will automatically build and deploy

Method B - Manual Build:

```bash
cd dead-tracker
npm install
npm run build

# Copy the dist folder to your GitHub Pages branch
# (The exact commands depend on your repo setup)
```

### Step 4: Access Your App

Visit `https://mattkrueger.org/dead-tracker/`

## Option 2: Deploy as Main Site

This will make your app available at `https://mattkrueger.org/` (replaces your current homepage)

### Step 1: Update Configuration

1. Open `vite.config.js`
2. Change `base: '/dead-tracker/'` to `base: '/'`

### Step 2: Move Files to Root

```bash
# In your mattkrueger.org repo root
cp -r dead-tracker/src .
cp -r dead-tracker/public .
cp dead-tracker/index.html .
cp dead-tracker/package.json .
cp dead-tracker/vite.config.js .
cp dead-tracker/tailwind.config.js .
cp dead-tracker/postcss.config.js .
# etc.
```

### Step 3: Build and Deploy

```bash
npm install
npm run build
git add .
git commit -m "Deploy Grateful Dead tracker as main site"
git push origin main
```

## Option 3: Use Custom Subdomain

This will make your app available at `https://dead.mattkrueger.org/`

### Step 1: Update DNS

1. In your domain registrar (where you bought mattkrueger.org):
2. Add a CNAME record:
   - Subdomain: `dead`
   - Points to: `yourusername.github.io`

### Step 2: Update GitHub Settings

1. Create a new repository `dead-tracker` on GitHub
2. Push your code there
3. Go to Settings → Pages
4. Under "Custom domain", enter: `dead.mattkrueger.org`
5. Check "Enforce HTTPS"

### Step 3: Update vite.config.js

```javascript
export default defineConfig({
  plugins: [react()],
  base: '/', // Root of subdomain
})
```

### Step 4: Build and Deploy

```bash
npm run build
npm run deploy
```

## Troubleshooting

### Blank page after deployment
- Check that `base` in `vite.config.js` matches your URL structure
- Check browser console for 404 errors on assets

### CSS not loading
- Make sure you built the app before deploying
- Check that asset paths are correct

### Changes not showing up
- Clear browser cache
- Make sure you pushed to the correct branch
- Check GitHub Pages settings to verify the correct branch is being used

## Updating the App

Whenever you make changes:

```bash
cd dead-tracker
# Make your changes...
npm run build
git add .
git commit -m "Update tracker"
git push
```

If using GitHub Actions, the push will automatically trigger a rebuild and deploy.

## Current Limitations (Before Supabase)

- Using sample data (only 18 shows)
- Progress saved in browser only
- Won't sync across devices

Once you connect Supabase:
- All ~2,300 shows will appear
- Progress saves to cloud database
- Syncs across all devices
