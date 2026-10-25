import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    // CORSヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // スタンプ履歴を取得（最新30件）
        const stamps = await sql`
            SELECT stamp_date, level_before, level_after, title_before, title_after, created_at
            FROM stamps
            ORDER BY stamp_date DESC
            LIMIT 30
        `;

        res.status(200).json({
            stamps: stamps.map(s => ({
                date: s.stamp_date,
                levelBefore: s.level_before,
                levelAfter: s.level_after,
                titleBefore: s.title_before,
                titleAfter: s.title_after
            }))
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', message: error.message });
    }
}
