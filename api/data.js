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
        // 今日のタスクを取得
        const today = new Date().toISOString().split('T')[0];
        const taskResult = await sql`
            SELECT morning, afternoon, night
            FROM tasks
            WHERE task_date = ${today}
        `;

        const todayTasks = taskResult.rows[0] || {
            morning: false,
            afternoon: false,
            night: false
        };

        // 卵の状態を取得
        const eggResult = await sql`
            SELECT start_date, check_count
            FROM current_egg
            ORDER BY id DESC
            LIMIT 1
        `;

        const currentEgg = eggResult.rows[0] || {
            start_date: today,
            check_count: 0
        };

        // ドラゴン一覧を取得
        const dragonsResult = await sql`
            SELECT icon, name, color, hatched_date
            FROM dragons
            ORDER BY hatched_date DESC
        `;

        res.status(200).json({
            todayTasks,
            currentEgg: {
                startDate: currentEgg.start_date,
                checkCount: currentEgg.check_count
            },
            dragons: dragonsResult.rows.map(d => ({
                icon: d.icon,
                name: d.name,
                color: d.color,
                hatchedDate: d.hatched_date
            }))
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', message: error.message });
    }
}
