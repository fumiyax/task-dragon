-- Add category column to task_master

ALTER TABLE task_master
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '学校';

-- 既存のタスクにデフォルトカテゴリを設定
UPDATE task_master
SET category = '学校'
WHERE category IS NULL;
