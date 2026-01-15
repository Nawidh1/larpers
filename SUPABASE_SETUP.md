# Supabase Setup Guide

This guide will help you connect your Agritech Dashboard to Supabase.

## Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Sign in or create an account
3. Create a new project (or select an existing one)
4. Wait for the project to finish setting up (this takes a few minutes)

5. Once your project is ready:
   - Go to **Settings** → **API**
   - You'll find two important values:
     - **Project URL** (looks like: `https://xxxxx.supabase.co`)
     - **anon public** key (a long string starting with `eyJ...`)

## Step 2: Create Environment Variables File

1. Create a file named `.env.local` in the root directory of your project
2. Add the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

3. Replace `your_project_url_here` with your actual Project URL
4. Replace `your_anon_key_here` with your actual anon public key

**Example:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Set Up Your Database

1. In your Supabase Dashboard, go to **SQL Editor**
2. Open the file `scripts/complete-setup.sql` from this project
3. Copy the entire contents
4. Paste it into the Supabase SQL Editor
5. Click **Run** to execute the script

This will create:
- All necessary database tables
- Row Level Security (RLS) policies
- Indexes for better performance

## Step 4: Restart Your Development Server

After creating the `.env.local` file:

1. Stop your current development server (Ctrl+C)
2. Start it again:
   ```bash
   npm run dev
   ```

## Step 5: Test the Connection

1. Open your browser and go to `http://localhost:3000`
2. You should be redirected to the login page
3. Try creating an account or signing in

## Troubleshooting

### The app is still in "demo mode"
- Make sure `.env.local` is in the root directory (same level as `package.json`)
- Check that the environment variable names are exactly:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Restart your development server after creating/modifying `.env.local`

### Database errors
- Make sure you ran the `complete-setup.sql` script in Supabase SQL Editor
- Check that all tables were created successfully in Supabase Dashboard → Table Editor

### Authentication not working
- Verify your Supabase project URL and anon key are correct
- Check the Supabase Dashboard → Authentication → Settings
- Make sure email authentication is enabled
- **IMPORTANT:** Set the Site URL and Redirect URLs in Supabase:
  1. Go to **Authentication** → **URL Configuration** in your Supabase Dashboard
  2. Set **Site URL** to: `http://localhost:3000` (for development) or your production URL
  3. Add to **Redirect URLs**:
     - `http://localhost:3000/auth/callback` (for development)
     - `https://yourdomain.com/auth/callback` (for production)
  4. Click **Save**
  
  This ensures that email confirmation links work correctly!

## Next Steps

After setup, you can:
- Create user accounts through the login page
- Add seed data (see `scripts/complete-setup.sql` Part 3)
- Customize your database schema if needed

## Need Help?

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
