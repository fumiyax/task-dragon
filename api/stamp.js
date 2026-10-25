import { neon } from '@neondatabase/serverless';
import { getTitle } from './titles.js';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    // CORSヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const today = new Date().toISOString().split('T')[0];

        // 今日既にスタンプがあるかチェック
        const existingStamp = await sql`
            SELECT id FROM stamps WHERE stamp_date = ${today}
        `;

        if (existingStamp.length > 0) {
            return res.status(400).json({ error: 'Already stamped today' });
        }

        // 現在のレベルを取得
        const characterResult = await sql`
            SELECT level FROM current_character ORDER BY id DESC LIMIT 1
        `;

        const currentLevel = characterResult[0]?.level || 1;
        const newLevel = currentLevel + 1;

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
            VALUES (${today}, ${currentLevel}, ${newLevel}, ${titleBefore.title}, ${titleAfter.title})
        `;

        res.status(200).json({
            success: true,
            levelBefore: currentLevel,
            levelAfter: newLevel,
            titleBefore: titleBefore.title,
            titleAfter: titleAfter.title,
            leveledUp: true
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', message: error.message });
    }
}
