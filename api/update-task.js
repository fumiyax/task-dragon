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

        // タスクを更新（なければ挿入）- 動的カラム名のためif文で分岐
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

        // 7日間のチェック数を計算
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

        const countResult = await sql`
            SELECT
                COALESCE(SUM(CASE WHEN morning THEN 1 ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN afternoon THEN 1 ELSE 0 END), 0) +
                COALESCE(SUM(CASE WHEN night THEN 1 ELSE 0 END), 0) as total_checks
            FROM tasks
            WHERE task_date >= ${sevenDaysAgoStr} AND task_date <= ${today}
        `;

        const totalChecks = parseInt(countResult[0]?.total_checks || 0);

        // 卵の状態を更新
        await sql`
            UPDATE current_egg
            SET check_count = ${totalChecks},
                updated_at = CURRENT_TIMESTAMP
        `;

        // 卵の開始日を取得
        const eggResult = await sql`
            SELECT start_date FROM current_egg ORDER BY id DESC LIMIT 1
        `;
        const startDate = new Date(eggResult[0]?.start_date || today);
        const daysDiff = Math.floor((new Date(today) - startDate) / (1000 * 60 * 60 * 24));

        // 孵化判定
        let hatched = null;
        if (daysDiff >= 6 && totalChecks >= 18) {
            hatched = await hatchDragon(today);
        } else if (daysDiff >= 6) {
            // 条件未達成でリセット
            await resetEgg(today);
        }

        res.status(200).json({
            success: true,
            totalChecks,
            daysDiff,
            hatched
        });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ error: 'Database error', message: error.message });
    }
}

async function hatchDragon(today) {
    const dragonTypes = [
        { icon: '🔥', name: 'ファイアドラゴン', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
        { icon: '💧', name: 'ウォータードラゴン', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
        { icon: '🌿', name: 'フォレストドラゴン', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
        { icon: '⚡', name: 'サンダードラゴン', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
        { icon: '🌟', name: 'スタードラゴン', color: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' },
        { icon: '🌈', name: 'レインボードラゴン', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
        { icon: '❄️', name: 'アイスドラゴン', color: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)' },
        { icon: '🌙', name: 'ムーンドラゴン', color: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' }
    ];

    const randomDragon = dragonTypes[Math.floor(Math.random() * dragonTypes.length)];

    await sql`
        INSERT INTO dragons (icon, name, color, hatched_date)
        VALUES (${randomDragon.icon}, ${randomDragon.name}, ${randomDragon.color}, ${today})
    `;

    await resetEgg(today);

    return randomDragon;
}

async function resetEgg(today) {
    await sql`
        UPDATE current_egg
        SET start_date = ${today},
            check_count = 0,
            updated_at = CURRENT_TIMESTAMP
    `;
}
