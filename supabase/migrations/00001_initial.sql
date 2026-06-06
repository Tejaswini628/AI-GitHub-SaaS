-- Create users table (synced with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT UNIQUE,
  github_id TEXT UNIQUE,
  github_username TEXT,
  avatar_url TEXT,
  access_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.repositories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  github_id BIGINT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT UNIQUE NOT NULL,
  owner TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  language TEXT,
  private BOOLEAN DEFAULT false,
  default_branch TEXT DEFAULT 'main',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  branch_name TEXT,
  commit_message TEXT,
  pr_url TEXT,
  pr_number INTEGER,
  result TEXT,
  files_changed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  repo_id UUID NOT NULL REFERENCES public.repositories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.commit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message TEXT NOT NULL,
  sha TEXT NOT NULL,
  url TEXT NOT NULL,
  files_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_repositories_user_id ON public.repositories(user_id);
CREATE INDEX IF NOT EXISTS idx_repositories_full_name ON public.repositories(full_name);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_repo_id ON public.tasks(repo_id);
CREATE INDEX IF NOT EXISTS idx_commit_logs_task_id ON public.commit_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_users_github_id ON public.users(github_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
    CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_repositories_updated_at') THEN
    CREATE TRIGGER update_repositories_updated_at BEFORE UPDATE ON public.repositories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tasks_updated_at') THEN
    CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only access their own data
CREATE POLICY "Users can manage own data" ON public.users
  FOR ALL USING (auth_id = auth.uid());

CREATE POLICY "Users can manage own repositories" ON public.repositories
  FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own tasks" ON public.tasks
  FOR ALL USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "Users can manage own commit_logs" ON public.commit_logs
  FOR ALL USING (task_id IN (
    SELECT t.id FROM public.tasks t
    JOIN public.users u ON u.id = t.user_id
    WHERE u.auth_id = auth.uid()
  ));

-- Auto-create user profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_id, name, email, avatar_url, access_token, github_id, github_username)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_user_meta_data->>'access_token', 'pending'),
    NEW.raw_user_meta_data->>'provider_id',
    NEW.raw_user_meta_data->>'user_name'
  );
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
