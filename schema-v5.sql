-- バージョン5: 備考欄の追加

-- daily_tasks テーブルに備考欄を追加
ALTER TABLE daily_tasks
ADD COLUMN IF NOT EXISTS note TEXT;

-- 備考欄のデフォルト値は空文字列
UPDATE daily_tasks
SET note = ''
WHERE note IS NULL;
