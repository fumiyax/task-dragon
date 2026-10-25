-- Level Up Quest Schema for Neon DB (Version 2)

-- タスクテーブル（変更なし）
CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    task_date DATE NOT NULL UNIQUE,
    morning BOOLEAN DEFAULT FALSE,
    afternoon BOOLEAN DEFAULT FALSE,
    night BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- キャラクターテーブル（current_eggから変更）
DROP TABLE IF EXISTS current_egg;
CREATE TABLE IF NOT EXISTS current_character (
    id SERIAL PRIMARY KEY,
    level INTEGER DEFAULT 1,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 初期レコード挿入
INSERT INTO current_character (level)
VALUES (1)
ON CONFLICT DO NOTHING;

-- スタンプテーブル（新規）
CREATE TABLE IF NOT EXISTS stamps (
    id SERIAL PRIMARY KEY,
    stamp_date DATE NOT NULL UNIQUE,
    level_before INTEGER NOT NULL,
    level_after INTEGER NOT NULL,
    title_before TEXT NOT NULL,
    title_after TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 古いdragonsテーブルを削除
DROP TABLE IF EXISTS dragons;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_tasks_date ON tasks(task_date DESC);
CREATE INDEX IF NOT EXISTS idx_stamps_date ON stamps(stamp_date DESC);
