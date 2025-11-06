# Authentication Setup Guide

This guide will help you set up authentication and cloud sync for your Task Manager application.

## Overview

The application now uses Supabase for:
- User authentication (email/password)
- Cloud storage for task data
- Automatic sync across devices

## Prerequisites

- A Supabase account (free tier available)
- Node.js and npm installed

## Setup Steps

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Fill in the project details:
   - Project name: `taskmanager` (or your preferred name)
   - Database password: Choose a strong password
   - Region: Select the closest region to your users
5. Wait for the project to be provisioned (usually 1-2 minutes)

### 2. Get Your API Credentials

1. In your Supabase project dashboard, go to **Project Settings** (gear icon)
2. Click on **API** in the sidebar
3. You'll need two values:
   - **Project URL** (under "Config")
   - **anon/public key** (under "Project API keys")

### 3. Configure Environment Variables

1. Open the `.env.local` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Never commit your `.env.local` file to version control!

### 4. Set Up the Database

1. In your Supabase dashboard, go to the **SQL Editor**
2. Open the `supabase-schema.sql` file from your project
3. Copy the entire contents of the file
4. Paste it into the SQL Editor
5. Click **Run** to execute the SQL

This will create:
- A `user_data` table to store user tasks
- Row Level Security policies to protect user data
- Automatic triggers for updating timestamps

### 5. Enable Email Authentication

1. In your Supabase dashboard, go to **Authentication** > **Providers**
2. Make sure **Email** is enabled (it should be enabled by default)
3. Optional: Configure email templates under **Authentication** > **Email Templates**

### 6. Run Your Application

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## How It Works

### First Time Users

1. Users will see a login/signup form
2. New users can create an account with email and password
3. After signup, users will receive a confirmation email (in development, check the Supabase logs)
4. Once confirmed, users can log in

### Existing Users (Data Migration)

If you were using the app before authentication was added:

1. Your existing data is stored in browser localStorage
2. When you first log in, the app will **automatically migrate** your data to the cloud
3. After migration, your data will be synced across all your devices
4. Your localStorage data remains as a backup

### Data Sync

- All changes are automatically saved to Supabase (with a 500ms debounce)
- When you log in from a different device, you'll see all your tasks
- Data is protected by Row Level Security - users can only access their own data

## Troubleshooting

### "Missing Supabase environment variables" Error

- Make sure you've created the `.env.local` file
- Verify the variable names are exactly: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server after changing environment variables

### Can't Sign Up

- Check that Email provider is enabled in Supabase
- In development, check the Supabase dashboard for confirmation emails
- For production, configure email settings in Supabase

### Database Errors

- Make sure you've run the SQL schema from `supabase-schema.sql`
- Check the Supabase logs for detailed error messages
- Verify Row Level Security policies are set up correctly

### Data Not Syncing

- Check the browser console for errors
- Verify you're logged in (email should show in top-left)
- Check your internet connection
- Look at the Supabase logs for API errors

## Security Notes

- User passwords are hashed and secured by Supabase
- All data is protected by Row Level Security
- API keys are client-safe (the anon key is meant to be public)
- Never share your Supabase project password or service role key
- The anon key is rate-limited and has restricted permissions

## Production Deployment

When deploying to production (Vercel, Netlify, etc.):

1. Add the environment variables in your hosting platform's dashboard
2. Configure custom email templates in Supabase
3. Set up a custom domain for your app
4. Configure redirect URLs in Supabase: **Authentication** > **URL Configuration**
5. Consider upgrading your Supabase plan for higher limits

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- Check the browser console for error messages
- Review Supabase logs in the dashboard
