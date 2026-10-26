import { neon } from '@neondatabase/serverless';
import { getTitle } from './titles.js';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    // CORSヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const targetDate = req.query.date || new Date().toISOString().split('T')[0];

        // GET: 指定日のスタンプ状態を取得
        if (req.method === 'GET') {
            const stamp = await sql`
                SELECT * FROM stamps WHERE stamp_date = ${targetDate}
            `;
            return res.status(200).json({
                hasStamp: stamp.length > 0,
                stamp: stamp[0] || null
            });
        }

        // POST: スタンプを押す
        if (req.method === 'POST') {
            const { levelIncrease } = req.body || {};
            return await handleStampPost(targetDate, res, levelIncrease || 1);
        }

        // DELETE: スタンプを解除
        if (req.method === 'DELETE') {
            return await handleStampDelete(targetDate, res);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', message: error.message });
    }
}

async function handleStampPost(targetDate, res, levelIncrease = 1) {
    try {

        // 既にスタンプがあるかチェック
        const existingStamp = await sql`
            SELECT id FROM stamps WHERE stamp_date = ${targetDate}
        `;

        if (existingStamp.length > 0) {
            return res.status(400).json({ error: 'Already stamped today' });
        }

        // 現在のレベルを取得
        const characterResult = await sql`
            SELECT level FROM current_character ORDER BY id DESC LIMIT 1
        `;

        const currentLevel = characterResult[0]?.level || 1;
        const newLevel = currentLevel + levelIncrease;

        const titleBefore = getTitle(currentLevel);
        const titleAfter = getTitle(newLevel);

        // レベルアップ
        await sql`
            UPDATE current_character
            SET level = ${newLevel},
                updated_at = CURRENT_TIMESTAMP
        `;

        // スタンプ記録を追加
        await sql`
            INSERT INTO stamps (stamp_date, level_before, level_after, title_before, title_after)
            VALUES (${targetDate}, ${currentLevel}, ${newLevel}, ${titleBefore.title}, ${titleAfter.title})
        `;

        return res.status(200).json({
            success: true,
            levelBefore: currentLevel,
            levelAfter: newLevel,
            titleBefore: titleBefore.title,
            titleAfter: titleAfter.title,
            leveledUp: true
        });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error', message: error.message });
    }
}

async function handleStampDelete(targetDate, res) {
    try {
        // スタンプがあるかチェック
        const existingStamp = await sql`
            SELECT * FROM stamps WHERE stamp_date = ${targetDate}
        `;

        if (existingStamp.length === 0) {
            return res.status(400).json({ error: 'No stamp to delete' });
        }

        const stamp = existingStamp[0];

        // 現在のレベルを取得
        const characterResult = await sql`
            SELECT level FROM current_character ORDER BY id DESC LIMIT 1
        `;

        const currentLevel = characterResult[0]?.level || 1;
        const newLevel = Math.max(1, currentLevel - 1);

        const title = getTitle(newLevel);

        // レベルを下げる
        await sql`
            UPDATE current_character
            SET level = ${newLevel},
                updated_at = CURRENT_TIMESTAMP
        `;

        // スタンプ記録を削除
        await sql`
            DELETE FROM stamps WHERE stamp_date = ${targetDate}
        `;

        return res.status(200).json({
            success: true,
            level: newLevel,
            title: title.title
        });
    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: 'Database error', message: error.message });
    }
}
