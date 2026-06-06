@echo off
echo Setting up AI GitHub Developer SaaS...
echo.

if not exist .env (
  echo Creating .env file from .env.example...
  copy .env.example .env
  echo IMPORTANT: Edit .env with your Supabase credentials and OpenAI API key
  echo.
)

echo Installing dependencies...
call npm install

echo.
echo ============================================================
echo IMPORTANT - Manual Steps Required:
echo ============================================================
echo 1. Create a Supabase project at https://supabase.com
echo 2. Go to SQL Editor and run the migration from:
echo    supabase\migrations\00001_initial.sql
echo 3. Enable GitHub Auth in Supabase Auth settings:
echo    - Go to Authentication -^> Providers
echo    - Enable GitHub and add your Client ID and Secret
echo    - Add callback URL: http://localhost:3000/api/auth/callback
echo 4. Copy your Supabase URL and anon key to .env
echo 5. Run 'npm run dev' to start the development server
echo ============================================================
echo.
