-- Comprehensive Schema Fix Migration
-- Ensures all tables required by backend exist with proper RLS policies
-- Safe to run multiple times (uses IF NOT EXISTS)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------------------
-- FIX 1: Ensure users table exists (profile data, not auth)
-------------------------------------------

-- Drop old users table if it conflicts with auth
DO $$ 
BEGIN
    -- Check if users table exists without FK to auth.users
    IF EXISTS (
        SELECT FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_id_fkey'
    ) THEN
        DROP TABLE users CASCADE;
    END IF;
END $$;

-- Create users table (references auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    tone_mode VARCHAR(50) DEFAULT 'balanced',
    explicit_allowed BOOLEAN DEFAULT FALSE,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_id ON users(id);

-------------------------------------------
-- FIX 2: Messages table (chat history)
-------------------------------------------

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    session_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);

-------------------------------------------
-- FIX 3: Conversation contexts (session data)
-------------------------------------------

CREATE TABLE IF NOT EXISTS conversation_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    current_tone VARCHAR(50) DEFAULT 'balanced',
    last_summary TEXT,
    current_session_id UUID,
    session_started_at TIMESTAMPTZ,
    last_strict_raw_at TIMESTAMPTZ,
    strict_raw_count_today INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_contexts_user_id ON conversation_contexts(user_id);

-------------------------------------------
-- FIX 4: User patterns (behavioral intelligence)
-------------------------------------------

CREATE TABLE IF NOT EXISTS user_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_key VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    evidence_count INT DEFAULT 1,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, pattern_key)
);

CREATE INDEX IF NOT EXISTS idx_user_patterns_user_id ON user_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patterns_confidence ON user_patterns(user_id, confidence DESC);

-------------------------------------------
-- FIX 5: User events (behavior tracking)
-------------------------------------------

CREATE TABLE IF NOT EXISTS user_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_events_user_id ON user_events(user_id);
CREATE INDEX IF NOT EXISTS idx_user_events_type ON user_events(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_user_events_created_at ON user_events(created_at DESC);

-------------------------------------------
-- FIX 6: Daily check-ins (mood/energy tracking)
-------------------------------------------

CREATE TABLE IF NOT EXISTS daily_checkins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood INT CHECK (mood >= 1 AND mood <= 10),
    energy INT CHECK (energy >= 1 AND energy <= 10),
    reflection TEXT,
    accountability VARCHAR(20) CHECK (accountability IN ('yes', 'partial', 'no')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_id ON daily_checkins(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_date ON daily_checkins(user_id, date DESC);

-------------------------------------------
-- FIX 7: Tasks (task management)
-------------------------------------------

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_for TIMESTAMPTZ,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'snoozed')),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON tasks(user_id, scheduled_for);

-------------------------------------------
-- FIX 8: Row Level Security (RLS) Policies
-------------------------------------------

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Service role full access on users" ON users;
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Service role full access on messages" ON messages;
DROP POLICY IF EXISTS "Users can view own contexts" ON conversation_contexts;
DROP POLICY IF EXISTS "Service role full access on contexts" ON conversation_contexts;
DROP POLICY IF EXISTS "Users can view own patterns" ON user_patterns;
DROP POLICY IF EXISTS "Service role full access on patterns" ON user_patterns;
DROP POLICY IF EXISTS "Users can view own events" ON user_events;
DROP POLICY IF EXISTS "Service role full access on events" ON user_events;
DROP POLICY IF EXISTS "Users can view own checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Service role full access on checkins" ON daily_checkins;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Service role full access on tasks" ON tasks;

-- Create policies for users table
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Service role full access on users" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for messages table
CREATE POLICY "Users can view own messages" ON messages
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on messages" ON messages
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for conversation_contexts table
CREATE POLICY "Users can view own contexts" ON conversation_contexts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on contexts" ON conversation_contexts
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for user_patterns table
CREATE POLICY "Users can view own patterns" ON user_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on patterns" ON user_patterns
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for user_events table
CREATE POLICY "Users can view own events" ON user_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on events" ON user_events
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for daily_checkins table
CREATE POLICY "Users can view own checkins" ON daily_checkins
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on checkins" ON daily_checkins
    FOR ALL USING (auth.role() = 'service_role');

-- Create policies for tasks table
CREATE POLICY "Users can view own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on tasks" ON tasks
    FOR ALL USING (auth.role() = 'service_role');

-------------------------------------------
-- FIX 9: Helper function to update updated_at timestamp
-------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conversation_contexts_updated_at ON conversation_contexts;
CREATE TRIGGER update_conversation_contexts_updated_at BEFORE UPDATE ON conversation_contexts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_patterns_updated_at ON user_patterns;
CREATE TRIGGER update_user_patterns_updated_at BEFORE UPDATE ON user_patterns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_checkins_updated_at ON daily_checkins;
CREATE TRIGGER update_daily_checkins_updated_at BEFORE UPDATE ON daily_checkins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
