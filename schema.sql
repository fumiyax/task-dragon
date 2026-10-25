-- Dragon Task App Schema for Neon DB

-- タスクテーブル
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    task_date DATE NOT NULL UNIQUE,
    morning BOOLEAN DEFAULT FALSE,
    afternoon BOOLEAN DEFAULT FALSE,
    night BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 卵テーブル（1レコードのみ）
CREATE TABLE IF NOT EXISTS current_egg (
    id SERIAL PRIMARY KEY,
    start_date DATE NOT NULL,
    check_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初期レコード挿入
INSERT INTO current_egg (start_date, check_count)
VALUES (CURRENT_DATE, 0)
ON CONFLICT DO NOTHING;

-- ドラゴンテーブル
CREATE TABLE IF NOT EXISTS dragons (
    id SERIAL PRIMARY KEY,
    icon TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT NOT NULL,
    hatched_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(task_date DESC);
CREATE INDEX IF NOT EXISTS idx_dragons_date ON dragons(hatched_date DESC);
