# Database Migration Guide

## Problem
Old messages are not loading because the required database tables may not exist in Supabase.

## Solution
Apply the comprehensive schema migration that creates all required tables with proper RLS policies.

## Steps to Fix

### Step 1: Apply the Migration to Supabase

You have two options:

#### Option A: Using Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/003_comprehensive_schema_fix.sql`
5. Paste into the SQL editor
6. Click **Run** to execute the migration
7. Verify tables were created in the **Table Editor**

#### Option B: Using Supabase CLI
```bash
# Make sure you're in the project root
cd "c:\Users\DELL\OneDrive\Desktop\ai personal app"

# Login to Supabase (if not already)
npx supabase login

# Link your project (get project ref from dashboard URL)
npx supabase link --project-ref YOUR_PROJECT_REF

# Push the migration
npx supabase db push
```

### Step 2: Verify the Migration

Test the backend health check:
```bash
# Start the backend if not running
cd backend
python main.py

# In another terminal, test the health endpoint
curl http://localhost:8000/health
```

You should see output like:
```json
{
  "status": "ok",
  "all_tables_ready": true,
  "database": {
    "connected": true,
    "tables": {
      "users": { "exists": true, "accessible": true },
      "messages": { "exists": true, "accessible": true },
      ...
    }
  }
}
```

### Step 3: Test Message Loading

1. Start the frontend:
```bash
cd frontend
npm run dev
```

2. Open http://localhost:5173 in your browser
3. Login or signup with test account
4. Send a test message
5. Refresh the page - messages should load!

### Step 4: Check Browser Console

Open browser DevTools (F12) and check the Console tab for:
- ✅ `Loading messages for user <id> (attempt 1/4)`
- ✅ `Loaded X messages`
- ❌ Any error messages

## What Was Fixed

### Database Schema
- ✅ Created `messages` table for chat history
- ✅ Created `users` table for user profiles
- ✅ Created supporting tables (contexts, patterns, events, checkins, tasks)
- ✅ Added proper RLS policies for service role access
- ✅ Added indexes for performance

### Backend Improvements
- ✅ Better error handling in `/messages` endpoint
- ✅ Enhanced `/health` endpoint to check database status
- ✅ Detailed logging for debugging
- ✅ Helpful error messages

### Frontend Improvements
- ✅ Retry logic with exponential backoff (3 retries)
- ✅ Better error messages for users
- ✅ Graceful handling of offline backend
- ✅ Detailed console logging

## Troubleshooting

### "Table does not exist" error
- **Cause**: Migration not applied
- **Fix**: Follow Step 1 above to apply the migration

### "Permission denied" or RLS policy errors
- **Cause**: Backend not using service role key
- **Fix**: Ensure `backend/.env.local` has `SUPABASE_SERVICE_KEY` set (not just `SUPABASE_KEY`)

### Messages still not loading
- **Cause**: Multiple possible issues
- **Fix**: 
  1. Check backend logs for specific error
  2. Test `/health` endpoint to see which tables are missing
  3. Verify user is logged in (check localStorage in DevTools)
  4. Check Network tab in DevTools for failed requests

### Backend not connecting to Supabase
- **Cause**: Missing or incorrect environment variables
- **Fix**: Verify `backend/.env.local` has:
  ```
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_KEY=eyJhbG...  (service_role key, not anon key!)
  OPENAI_API_KEY=sk-...
  ```

## Testing Checklist

- [ ] Migration applied successfully
- [ ] `/health` endpoint shows all tables ready
- [ ] Backend starts without errors
- [ ] Frontend connects to backend
- [ ] Can send new messages
- [ ] Messages persist after page refresh
- [ ] No errors in browser console
- [ ] No errors in backend logs

## Need Help?

If you're still having issues:
1. Share the output of `curl http://localhost:8000/health`
2. Share browser console errors
3. Share backend logs from the terminal

The detailed error messages will help pinpoint the exact issue.
