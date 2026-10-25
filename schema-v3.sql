-- Level Up Quest Schema V3 - Task Management

-- 既存テーブルはそのまま維持

-- タスクマスターテーブル（新規）
CREATE TABLE IF NOT EXISTS task_master (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 日次タスクテーブル（新規）
CREATE TABLE IF NOT EXISTS daily_tasks (
    id SERIAL PRIMARY KEY,
    task_date DATE NOT NULL,
    task_master_id INTEGER NOT NULL REFERENCES task_master(id) ON DELETE CASCADE,
    is_planned BOOLEAN DEFAULT FALSE,
    timing TEXT, -- 'morning', 'afternoon', 'night', or NULL
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(task_date, task_master_id)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_task_master_sort ON task_master(sort_order);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_date ON daily_tasks(task_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_tasks_master ON daily_tasks(task_master_id);

-- 古いtasksテーブルは維持（後で移行するか判断）
