# 🚀 Supabase Integration Setup for Canvas

## ✅ Your Supabase Project Ready!

I can see you have a Supabase project ready at:
**URL**: `https://sdfgzlgjrqkoixaqpehp.supabase.co`

Now let's get Canvas fully connected with live authentication!

## 📋 Quick Setup Steps

### 1. Get Your API Keys

Go to your Supabase Dashboard:
1. Visit: https://supabase.com/dashboard/project/sdfgzlgjrqkoixaqpehp/settings/api
2. Copy the **anon public** key
3. Copy the **service_role secret** key

### 2. Update Your .env File

Replace these values in your `.env` file:

```bash
# Replace 'your-supabase-anon-key-here' with your actual anon public key
NUXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-anon-key...

# Replace 'your-service-role-key-here' with your actual service role key  
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-service-key...
```

### 3. Set Up Authentication

In your Supabase Dashboard, go to Authentication settings:

1. **Site URL**: `http://localhost:3003`
2. **Redirect URLs**: Add these URLs:
   ```
   http://localhost:3003/auth/callback
   http://localhost:3003/auth/reset-password
   ```

### 4. Enable Authentication Providers (Optional)

You can enable social login providers:
- **Google OAuth**: For Google sign-in
- **GitHub OAuth**: For GitHub sign-in
- **Discord OAuth**: For Discord sign-in

### 5. Database Setup

Canvas will automatically create the necessary tables. You can also run these SQL commands in your Supabase SQL editor:

```sql
-- Enable RLS (Row Level Security)
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table for additional user data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);
```

### 6. Test Authentication

Once configured:
1. Restart your Canvas development server
2. Go to http://localhost:3003/auth/login
3. Try creating an account
4. Test the login flow

## 🎉 What You'll Get

With Supabase connected, Canvas will have:

✅ **Full User Registration** - Email/password signup  
✅ **Secure Login** - JWT-based authentication  
✅ **Password Reset** - Email-based password recovery  
✅ **Social Login** - Google/GitHub/Discord (if enabled)  
✅ **User Profiles** - Avatar and profile management  
✅ **Protected Routes** - Secure workspace access  
✅ **Session Management** - Automatic login persistence  

## 🔧 Current Canvas Features Ready

With authentication working, you'll have access to:

- **🏢 Workspace Management** - Create and manage workspaces
- **📄 Document System** - Create and edit documents
- **🤖 ATHENA AI Assistant** - 3D AI companion
- **⚡ ProCommandCenter** - AI-powered commands
- **🔀 Real-time Collaboration** - Multi-user editing
- **📊 Performance Monitoring** - Analytics dashboard
- **🛡️ Enterprise Security** - Full protection suite

## 📞 Need Help?

If you encounter any issues:

1. **Check the browser console** for any error messages
2. **Verify your API keys** are correctly copied
3. **Ensure redirect URLs** are properly configured
4. **Check Supabase logs** in your dashboard

Canvas is production-ready and waiting for your Supabase keys to come alive! 🚀

---

*Generated with [Claude Code](https://claude.ai/code)*