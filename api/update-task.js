import { neon } from '@neondatabase/serverless';

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
        const { taskType, checked } = req.body;
        const today = new Date().toISOString().split('T')[0];

        if (!['morning', 'afternoon', 'night'].includes(taskType)) {
            return res.status(400).json({ error: 'Invalid task type' });
        }

        // タスクを更新（なければ挿入）
        if (taskType === 'morning') {
            await sql`
                INSERT INTO tasks (task_date, morning, updated_at)
                VALUES (${today}, ${checked}, CURRENT_TIMESTAMP)
                ON CONFLICT (task_date)
                DO UPDATE SET
                    morning = ${checked},
                    updated_at = CURRENT_TIMESTAMP
            `;
        } else if (taskType === 'afternoon') {
            await sql`
                INSERT INTO tasks (task_date, afternoon, updated_at)
                VALUES (${today}, ${checked}, CURRENT_TIMESTAMP)
                ON CONFLICT (task_date)
                DO UPDATE SET
                    afternoon = ${checked},
                    updated_at = CURRENT_TIMESTAMP
            `;
        } else if (taskType === 'night') {
            await sql`
                INSERT INTO tasks (task_date, night, updated_at)
                VALUES (${today}, ${checked}, CURRENT_TIMESTAMP)
                ON CONFLICT (task_date)
                DO UPDATE SET
                    night = ${checked},
                    updated_at = CURRENT_TIMESTAMP
            `;
        }

        res.status(200).json({
            success: true
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', message: error.message });
    }
}
