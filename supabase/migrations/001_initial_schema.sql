-- AI Personal Assistant - Initial Database Schema
-- Supabase/PostgreSQL Migration

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-------------------------------------------
-- USERS
-------------------------------------------

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

-------------------------------------------
-- USER PROFILES
-------------------------------------------

CREATE TYPE tone_preference AS ENUM ('soft', 'balanced', 'strict');

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    preferred_name VARCHAR(50) NOT NULL,
    preferred_tone tone_preference DEFAULT 'balanced',
    timezone VARCHAR(50) DEFAULT 'UTC',
    dnd_enabled BOOLEAN DEFAULT FALSE,
    dnd_start TIME,
    dnd_end TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-------------------------------------------
-- TASKS
-------------------------------------------

CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'completed', 'skipped', 'failed');
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date DATE,
    due_time TIME,
    priority task_priority DEFAULT 'medium',
    status task_status DEFAULT 'pending',
    reminder_minutes_before INT DEFAULT 15,
    is_recurring BOOLEAN DEFAULT FALSE,
    recurrence_days INT[],
    streak_count INT DEFAULT 0,
    completion_note TEXT,
    skip_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(user_id, due_date);

-------------------------------------------
-- MESSAGES (Chat History)
-------------------------------------------

CREATE TYPE message_role AS ENUM ('user', 'assistant');

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(user_id, created_at DESC);

-------------------------------------------
-- CONVERSATION CONTEXTS (Short-term Memory)
-------------------------------------------

CREATE TYPE emotional_tone AS ENUM ('calm', 'stressed', 'motivated', 'deflated', 'anxious');

CREATE TABLE conversation_contexts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    messages JSONB DEFAULT '[]'::jsonb,
    current_emotional_tone emotional_tone,
    current_focus_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    session_started_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversation_contexts_user_id ON conversation_contexts(user_id);

-------------------------------------------
-- USER PATTERNS (Long-term Memory)
-------------------------------------------

CREATE TYPE pattern_type AS ENUM (
    'productivity_window', 
    'avoidance_trigger', 
    'failure_pattern', 
    'success_pattern'
);

CREATE TABLE user_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pattern_type pattern_type NOT NULL,
    description TEXT NOT NULL,
    confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    evidence_count INT DEFAULT 1,
    first_observed DATE NOT NULL,
    last_observed DATE NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_patterns_user_id ON user_patterns(user_id);
CREATE INDEX idx_user_patterns_confidence ON user_patterns(user_id, confidence DESC);

-------------------------------------------
-- DAILY REFLECTIONS (Pattern Summaries)
-------------------------------------------

CREATE TYPE mood_trajectory AS ENUM ('improving', 'stable', 'declining');

CREATE TABLE daily_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reflection_date DATE NOT NULL,
    summary TEXT NOT NULL,
    mood_trajectory mood_trajectory DEFAULT 'stable',
    tasks_completed INT DEFAULT 0,
    tasks_failed INT DEFAULT 0,
    key_insight TEXT,
    patterns_identified JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, reflection_date)
);

CREATE INDEX idx_daily_reflections_user_id ON daily_reflections(user_id);
CREATE INDEX idx_daily_reflections_date ON daily_reflections(user_id, reflection_date DESC);

-------------------------------------------
-- USER ROUTINES
-------------------------------------------

CREATE TABLE user_routines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    routine_name VARCHAR(100) NOT NULL,
    scheduled_time TIME NOT NULL,
    days_of_week INT[] NOT NULL,
    steps JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_routines_user_id ON user_routines(user_id);

-------------------------------------------
-- PUSH TOKENS
-------------------------------------------

CREATE TABLE push_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);

-------------------------------------------
-- NOTIFICATION LOGS
-------------------------------------------

CREATE TABLE notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    decision_type VARCHAR(50),
    title VARCHAR(100),
    body TEXT,
    status VARCHAR(20) NOT NULL, -- 'sent', 'blocked', 'failed'
    block_reasons TEXT[],
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_logs_user_id ON notification_logs(user_id);
CREATE INDEX idx_notification_logs_sent_at ON notification_logs(user_id, sent_at DESC);
CREATE INDEX idx_notification_logs_task_id ON notification_logs(task_id);

-------------------------------------------
-- NOTIFICATION PREFERENCES
-------------------------------------------

CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT TRUE,
    morning_checkin BOOLEAN DEFAULT TRUE,
    evening_checkin BOOLEAN DEFAULT TRUE,
    task_reminders BOOLEAN DEFAULT TRUE,
    celebration_notifications BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_preferences_user_id ON notification_preferences(user_id);

-------------------------------------------
-- SCHEDULED REMINDERS
-------------------------------------------

CREATE TABLE scheduled_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    remind_at TIMESTAMPTZ NOT NULL,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_reminders_remind_at ON scheduled_reminders(remind_at) WHERE NOT sent;

-------------------------------------------
-- SCHEDULED CHECKS (Follow-ups)
-------------------------------------------

CREATE TABLE scheduled_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    check_type VARCHAR(50) NOT NULL,
    condition VARCHAR(50),
    scheduled_for TIMESTAMPTZ NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scheduled_checks_scheduled_for ON scheduled_checks(scheduled_for) WHERE NOT processed;

-------------------------------------------
-- PENDING RECOMMENDATIONS
-------------------------------------------

CREATE TABLE pending_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    reasoning TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'dismissed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pending_recommendations_user_id ON pending_recommendations(user_id);

-------------------------------------------
-- CRISIS LOGS (Anonymized for safety review)
-------------------------------------------

CREATE TABLE crisis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    detected_at TIMESTAMPTZ NOT NULL,
    handled BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_crisis_logs_detected_at ON crisis_logs(detected_at DESC);

-------------------------------------------
-- ROW LEVEL SECURITY (Optional but recommended)
-------------------------------------------

-- Enable RLS on all user-data tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_recommendations ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies should be created based on your auth setup
-- Example policy (uncomment and modify as needed):
-- CREATE POLICY "Users can view own data" ON tasks
--     FOR ALL USING (user_id = auth.uid());
