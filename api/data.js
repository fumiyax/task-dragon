import { neon } from '@neondatabase/serverless';
import { getTitle, getJobProgress } from './titles.js';

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
        const today = new Date().toISOString().split('T')[0];

        // 今日のタスクを取得
        const taskResult = await sql`
            SELECT morning, afternoon, night
            FROM tasks
            WHERE task_date = ${today}
        `;

        const todayTasks = taskResult[0] || {
            morning: false,
            afternoon: false,
            night: false
        };

        // キャラクター情報を取得
        const characterResult = await sql`
            SELECT level
            FROM current_character
            ORDER BY id DESC
            LIMIT 1
        `;

        const currentLevel = characterResult[0]?.level || 1;
        const titleInfo = getTitle(currentLevel);
        const jobProgress = getJobProgress(currentLevel);

        // 今日のスタンプ状況を取得
        const stampResult = await sql`
            SELECT id
            FROM stamps
            WHERE stamp_date = ${today}
        `;

        const hasStampToday = stampResult.length > 0;

        res.status(200).json({
            todayTasks,
            character: {
                level: currentLevel,
                title: titleInfo.title,
                job: titleInfo.job,
                icon: titleInfo.icon,
                jobLevel: titleInfo.jobLevel,
                jobProgress
            },
            hasStampToday
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', message: error.message });
    }
}
