# Deployment Guide - Vercel

This guide will help you deploy your Task Manager application to Vercel.

## Prerequisites

Before deploying, ensure you have:
- ✅ A GitHub account with this repository pushed
- ✅ A Supabase project set up ([See SETUP_AUTH.md](./SETUP_AUTH.md))
- ✅ Your Supabase credentials ready:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Deploy to Vercel

### Step 1: Sign Up / Log In to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "Sign Up" or "Log In"
3. Choose "Continue with GitHub" for easiest integration

### Step 2: Import Your Repository

1. Once logged in, click "Add New..." → "Project"
2. You'll see a list of your GitHub repositories
3. Find **taskmanager** and click "Import"

### Step 3: Configure Your Project

Vercel will auto-detect that this is a Next.js project. You'll see:

- **Framework Preset**: Next.js (auto-detected) ✓
- **Root Directory**: `./` (default) ✓
- **Build Command**: `npm run build` (auto-detected) ✓
- **Output Directory**: `.next` (auto-detected) ✓

### Step 4: Add Environment Variables

**IMPORTANT**: Before deploying, you must add your Supabase credentials.

1. Expand the "Environment Variables" section
2. Add the following variables:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key |

3. Make sure to set them for all environments (Production, Preview, Development)

**Where to find these values:**
- Log into [Supabase Dashboard](https://app.supabase.com)
- Select your project
- Go to Settings → API
- Copy the URL and anon key

### Step 5: Deploy

1. Click "Deploy"
2. Vercel will:
   - Clone your repository
   - Install dependencies
   - Build your application
   - Deploy to a global CDN

This typically takes 1-3 minutes.

### Step 6: Access Your App

Once deployed, you'll see:
- ✅ **Production URL**: `https://your-app-name.vercel.app`
- Your app is now live and accessible worldwide!

## Post-Deployment

### Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain (e.g., `taskmanager.yourdomain.com`)
4. Follow Vercel's instructions to update your DNS settings

### Automatic Deployments

Every time you push to your main branch:
- Vercel automatically builds and deploys the new version
- Preview deployments are created for pull requests

### Update Supabase Redirect URLs

After deployment, update your Supabase authentication settings:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Navigate to Authentication → URL Configuration
3. Add your Vercel domain to:
   - **Site URL**: `https://your-app-name.vercel.app`
   - **Redirect URLs**:
     - `https://your-app-name.vercel.app/**`
     - `http://localhost:3000/**` (for local development)

## Troubleshooting

### Build Fails

**Problem**: Build fails with "Missing environment variables"
**Solution**: Double-check that you added both Supabase environment variables in Vercel settings

**Problem**: Font loading errors
**Solution**: This is normal during local builds with network restrictions. Vercel's build environment handles this correctly.

### Runtime Errors

**Problem**: "Failed to fetch" or Supabase connection errors
**Solution**:
1. Verify environment variables are set correctly in Vercel
2. Check that your Supabase project is active
3. Ensure redirect URLs are configured in Supabase

### Authentication Issues

**Problem**: Login redirects fail
**Solution**: Add your Vercel URL to Supabase redirect URLs (see "Update Supabase Redirect URLs" above)

## Monitoring

Vercel provides built-in monitoring:
- **Analytics**: View page views, unique visitors
- **Logs**: Check function logs and errors
- **Speed Insights**: Monitor performance

Access these from your Vercel project dashboard.

## Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**Your app is now live! Share your URL and start using your task manager from anywhere in the world!**
