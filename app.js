// レベルアップクエスト - メインスクリプト

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

// データ管理
class QuestManager {
    constructor() {
        this.data = {
            todayTasks: { morning: false, afternoon: false, night: false },
            character: { level: 1, title: '見習い剣士', job: '剣士', icon: '⚔️', jobLevel: 1, jobProgress: { current: 1, max: 100, percentage: 1 } },
            hasStampToday: false
        };
        this.today = this.getToday();
    }

    async loadData() {
        try {
            const response = await fetch(`${API_BASE}/api/data`);
            if (!response.ok) throw new Error('Failed to fetch data');
            this.data = await response.json();
            return this.data;
        } catch (error) {
            console.error('Error loading data:', error);
            return this.data;
        }
    }

    getToday() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    async setTask(taskType, checked) {
        try {
            const response = await fetch(`${API_BASE}/api/update-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskType, checked })
            });

            if (!response.ok) throw new Error('Failed to update task');

            // ローカルデータを更新
            this.data.todayTasks[taskType] = checked;

            return await response.json();
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }

    async stamp() {
        try {
            const response = await fetch(`${API_BASE}/api/stamp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            const result = await response.json();
            this.showLevelUpAnimation(result);
            return result;
        } catch (error) {
            console.error('Error stamping:', error);
            throw error;
        }
    }

    showLevelUpAnimation(result) {
        const stampArea = document.getElementById('stampArea');
        const messageEl = document.getElementById('stampMessage');

        messageEl.textContent = `${result.titleBefore} → ${result.titleAfter} レベルアップ！🎉`;
        messageEl.className = 'stamp-message success';

        setTimeout(async () => {
            await this.loadData();
            updateUI();
        }, 2000);
    }
}

// グローバルマネージャーインスタンス
let manager;

// UIの更新
async function updateUI() {
    if (!manager) {
        manager = new QuestManager();
    }

    // 常に最新データを取得
    await manager.loadData();

    // 日付表示
    const date = new Date();
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    document.getElementById('currentDate').textContent = dateStr;

    // キャラクター情報
    const char = manager.data.character;
    document.getElementById('levelValue').textContent = char.level;
    document.getElementById('titleIcon').textContent = char.icon;
    document.getElementById('titleText').textContent = char.title;
    document.getElementById('jobName').textContent = char.job;
    document.getElementById('jobLevel').textContent = char.jobLevel;
    document.getElementById('jobProgressFill').style.width = `${char.jobProgress.percentage}%`;

    // タスクの状態を復元
    const todayTasks = manager.data.todayTasks;
    document.getElementById('morning').checked = todayTasks.morning;
    document.getElementById('afternoon').checked = todayTasks.afternoon;
    document.getElementById('night').checked = todayTasks.night;

    // チェック状態に応じてスタイルを更新
    updateTaskStyle('morning', todayTasks.morning);
    updateTaskStyle('afternoon', todayTasks.afternoon);
    updateTaskStyle('night', todayTasks.night);

    // 今日のカウント
    const todayCount = [todayTasks.morning, todayTasks.afternoon, todayTasks.night].filter(Boolean).length;
    document.getElementById('todayCount').textContent = todayCount;

    // スタンプ状態
    updateStampUI(manager.data.hasStampToday);
}

function updateTaskStyle(taskId, checked) {
    const checkbox = document.getElementById(taskId);
    const taskItem = checkbox.closest('.task-item');
    if (checked) {
        taskItem.classList.add('checked');
    } else {
        taskItem.classList.remove('checked');
    }
}

function updateStampUI(hasStamp) {
    const stampArea = document.getElementById('stampArea');
    const stampButton = document.getElementById('stampButton');
    const messageEl = document.getElementById('stampMessage');

    if (hasStamp) {
        stampArea.innerHTML = `
            <div class="stamped-display">
                <div class="stamped-icon">✅</div>
                <div>きょうはもうスタンプをおしました！</div>
            </div>
        `;
    } else {
        stampButton.disabled = false;
        messageEl.textContent = '';
        messageEl.className = 'stamp-message';
    }
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', async () => {
    manager = new QuestManager();

    // 初期表示
    await updateUI();

    // タスクチェックボックス
    ['morning', 'afternoon', 'night'].forEach(taskId => {
        const checkbox = document.getElementById(taskId);
        checkbox.addEventListener('change', async (e) => {
            const checked = e.target.checked;
            updateTaskStyle(taskId, checked);

            // APIにタスクを送信
            await manager.setTask(taskId, checked);
            await updateUI();
        });
    });

    // スタンプボタン
    const stampButton = document.getElementById('stampButton');
    if (stampButton) {
        stampButton.addEventListener('click', async () => {
            try {
                stampButton.disabled = true;
                await manager.stamp();
                await updateUI();
            } catch (error) {
                const messageEl = document.getElementById('stampMessage');
                if (error.message === 'Already stamped today') {
                    messageEl.textContent = 'きょうはもうスタンプをおしました';
                    messageEl.className = 'stamp-message already';
                } else {
                    messageEl.textContent = 'エラーがはっせいしました';
                    messageEl.className = 'stamp-message';
                }
                stampButton.disabled = false;
            }
        });
    }

    // リセットボタン
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (confirm('すべてのデータをリセットしますか？')) {
                // TODO: Add reset API endpoint if needed
                alert('リセット機能は管理者に連絡してください');
            }
        });
    }
});
