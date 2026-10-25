import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    // CORSヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const today = new Date().toISOString().split('T')[0];

    try {
        // GET: 今日のタスク状態を取得
        if (req.method === 'GET') {
            // 全タスクマスタを取得
            const allTasks = await sql`
                SELECT id, name, sort_order
                FROM task_master
                ORDER BY sort_order ASC, id ASC
            `;

            // 今日のタスク状態を取得
            const dailyTasks = await sql`
                SELECT task_master_id, is_planned, timing, is_completed
                FROM daily_tasks
                WHERE task_date = ${today}
            `;

            // マージ
            const tasksWithStatus = allTasks.map(task => {
                const daily = dailyTasks.find(d => d.task_master_id === task.id);
                return {
                    id: task.id,
                    name: task.name,
                    isPlanned: daily?.is_planned || false,
                    timing: daily?.timing || null,
                    isCompleted: daily?.is_completed || false
                };
            });

            return res.status(200).json({ tasks: tasksWithStatus });
        }

        // POST: タスク状態を更新
        if (req.method === 'POST') {
            const { taskId, isPlanned, timing, isCompleted } = req.body;

            if (!taskId) {
                return res.status(400).json({ error: 'Task ID is required' });
            }

            // UPSERT
            await sql`
                INSERT INTO daily_tasks (task_date, task_master_id, is_planned, timing, is_completed, updated_at)
                VALUES (${today}, ${taskId}, ${isPlanned || false}, ${timing}, ${isCompleted || false}, CURRENT_TIMESTAMP)
                ON CONFLICT (task_date, task_master_id)
                DO UPDATE SET
                    is_planned = ${isPlanned || false},
                    timing = ${timing},
                    is_completed = ${isCompleted || false},
                    updated_at = CURRENT_TIMESTAMP
            `;

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', message: error.message });
    }
}
