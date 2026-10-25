import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
    // CORSヘッダー
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // GET: タスクマスタ一覧取得
        if (req.method === 'GET') {
            const tasks = await sql`
                SELECT id, name, category, sort_order
                FROM task_master
                ORDER BY
                    CASE category
                        WHEN '学校' THEN 1
                        WHEN 'ヤマハ' THEN 2
                        WHEN 'BUDDY' THEN 3
                        ELSE 4
                    END,
                    sort_order ASC,
                    id ASC
            `;

            return res.status(200).json({ tasks });
        }

        // POST: タスク追加
        if (req.method === 'POST') {
            const { name, category } = req.body;

            if (!name || name.trim() === '') {
                return res.status(400).json({ error: 'Task name is required' });
            }

            const validCategory = category || '学校';

            // カテゴリ内での最大のsort_orderを取得
            const maxOrder = await sql`
                SELECT COALESCE(MAX(sort_order), -1) as max_order
                FROM task_master
                WHERE category = ${validCategory}
            `;

            const newOrder = maxOrder[0].max_order + 1;

            const result = await sql`
                INSERT INTO task_master (name, category, sort_order)
                VALUES (${name.trim()}, ${validCategory}, ${newOrder})
                RETURNING id, name, category, sort_order
            `;

            return res.status(201).json({ task: result[0] });
        }

        // DELETE: タスク削除
        if (req.method === 'DELETE') {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ error: 'Task ID is required' });
            }

            await sql`
                DELETE FROM task_master
                WHERE id = ${id}
            `;

            return res.status(200).json({ success: true });
        }

        // PUT: タスク更新（並び替え）
        if (req.method === 'PUT') {
            const { id } = req.query;
            const { name, category, sort_order } = req.body;

            if (!id) {
                return res.status(400).json({ error: 'Task ID is required' });
            }

            if (name !== undefined) {
                await sql`
                    UPDATE task_master
                    SET name = ${name.trim()}
                    WHERE id = ${id}
                `;
            }

            if (category !== undefined) {
                await sql`
                    UPDATE task_master
                    SET category = ${category}
                    WHERE id = ${id}
                `;
            }

            if (sort_order !== undefined) {
                await sql`
                    UPDATE task_master
                    SET sort_order = ${sort_order}
                    WHERE id = ${id}
                `;
            }

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', message: error.message });
    }
}
