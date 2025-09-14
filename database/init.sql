-- ChemQuest Alchemist Academy Database Schema
-- Initial database setup for PostgreSQL

-- Create database (run this separately as superuser)
-- CREATE DATABASE chemquest_db;
-- CREATE USER chemquest_user WITH ENCRYPTED PASSWORD 'your_secure_password';
-- GRANT ALL PRIVILEGES ON DATABASE chemquest_db TO chemquest_user;

-- Connect to chemquest_db and run the following:

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    date_of_birth DATE,
    education_level VARCHAR(20) CHECK (education_level IN ('O-Level', 'A-Level', 'Other')),
    school VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Characters table (gamification profile)
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    character_name VARCHAR(100) NOT NULL,
    level INTEGER DEFAULT 1,
    experience_points INTEGER DEFAULT 0,
    total_gold INTEGER DEFAULT 0,
    current_realm VARCHAR(50),
    avatar_url VARCHAR(500),
    title VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Realms table
CREATE TABLE realms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    difficulty_level INTEGER DEFAULT 1,
    unlock_requirements JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Challenges table
CREATE TABLE challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    realm_id UUID REFERENCES realms(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(50) NOT NULL,
    difficulty_level INTEGER DEFAULT 1,
    content JSONB NOT NULL,
    solution JSONB NOT NULL,
    points_reward INTEGER DEFAULT 10,
    gold_reward INTEGER DEFAULT 5,
    time_limit INTEGER, -- in seconds
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User challenge attempts
CREATE TABLE challenge_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    user_answer JSONB,
    is_correct BOOLEAN,
    points_earned INTEGER DEFAULT 0,
    gold_earned INTEGER DEFAULT 0,
    time_taken INTEGER, -- in seconds
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, challenge_id, attempt_number)
);

-- Badges and achievements
CREATE TABLE badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon_url VARCHAR(500),
    unlock_criteria JSONB,
    rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User badges (inventory)
CREATE TABLE user_badges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, badge_id)
);

-- Daily quests
CREATE TABLE daily_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    quest_type VARCHAR(50) NOT NULL,
    requirements JSONB NOT NULL,
    rewards JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User daily quest progress
CREATE TABLE user_daily_quests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quest_id UUID REFERENCES daily_quests(id) ON DELETE CASCADE,
    progress JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    quest_date DATE DEFAULT CURRENT_DATE,
    
    UNIQUE(user_id, quest_id, quest_date)
);

-- User sessions for tracking streaks and activity
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    session_end TIMESTAMP WITH TIME ZONE,
    activities JSONB DEFAULT '[]',
    total_points_earned INTEGER DEFAULT 0,
    total_gold_earned INTEGER DEFAULT 0
);

-- Leaderboards
CREATE TABLE leaderboards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL, -- 'overall', 'weekly', 'realm_specific', etc.
    score INTEGER NOT NULL,
    rank INTEGER,
    period_start DATE,
    period_end DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, category, period_start, period_end)
);

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_challenge_attempts_user_id ON challenge_attempts(user_id);
CREATE INDEX idx_challenge_attempts_challenge_id ON challenge_attempts(challenge_id);
CREATE INDEX idx_challenge_attempts_completed_at ON challenge_attempts(completed_at);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);
CREATE INDEX idx_user_daily_quests_user_id ON user_daily_quests(user_id);
CREATE INDEX idx_user_daily_quests_date ON user_daily_quests(quest_date);
CREATE INDEX idx_leaderboards_category ON leaderboards(category);
CREATE INDEX idx_leaderboards_rank ON leaderboards(rank);

-- Insert initial realms
INSERT INTO realms (name, description, difficulty_level) VALUES
('Mathmage Trials', 'Master the art of equation balancing and stoichiometry', 1),
('Memory Labyrinth', 'Test your knowledge of chemical properties and reactions', 2),
('Virtual Apprentice', 'Learn laboratory techniques and procedures', 3),
('Seer''s Challenge', 'Develop observation skills and predict reaction outcomes', 4),
('Cartographer''s Gauntlet', 'Analyze data and interpret chemical graphs', 5),
('Forest of Isomers', 'Navigate the complex world of organic chemistry', 6);

-- Insert sample badges
INSERT INTO badges (name, description, icon_url, unlock_criteria, rarity) VALUES
('First Steps', 'Complete your first challenge', '/badges/first-steps.png', '{"challenges_completed": 1}', 'common'),
('Equation Master', 'Balance 50 chemical equations correctly', '/badges/equation-master.png', '{"equation_challenges_completed": 50}', 'rare'),
('Memory Champion', 'Complete all Memory Labyrinth challenges', '/badges/memory-champion.png', '{"realm_completed": "Memory Labyrinth"}', 'epic'),
('Lab Safety Expert', 'Complete all Virtual Apprentice challenges without errors', '/badges/lab-safety.png', '{"perfect_lab_completion": true}', 'epic'),
('Alchemist Supreme', 'Reach maximum level in all realms', '/badges/alchemist-supreme.png', '{"max_level_all_realms": true}', 'legendary');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Game Engine specific tables

-- User unlocked realms
CREATE TABLE user_unlocked_realms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    realm_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 0,
    
    UNIQUE(user_id, realm_id)
);

-- User inventory (items, badges, collectibles)
CREATE TABLE user_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id VARCHAR(100) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    acquired_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, item_id)
);

-- User achievements
CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(100) NOT NULL,
    achievement_name VARCHAR(200) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, achievement_id)
);

-- Challenge attempts for game engine
CREATE TABLE game_challenge_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_id VARCHAR(100) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE,
    answer JSONB,
    is_correct BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    hints_used INTEGER DEFAULT 0,
    time_elapsed INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Indexes for game engine tables
CREATE INDEX idx_user_unlocked_realms_user_id ON user_unlocked_realms(user_id);
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_game_challenge_attempts_user_id ON game_challenge_attempts(user_id);
CREATE INDEX idx_game_challenge_attempts_challenge_id ON game_challenge_attempts(challenge_id);

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_challenges_updated_at BEFORE UPDATE ON challenges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();