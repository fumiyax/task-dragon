// レベルアップクエスト - メインスクリプト

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

// データ管理
class QuestManager {
    constructor() {
        this.data = {
            character: { level: 1, title: '見習い剣士', job: '剣士', icon: '⚔️', jobLevel: 1, jobProgress: { current: 1, max: 100, percentage: 1 } },
            hasStampToday: false
        };
        this.tasks = [];
        this.today = this.getToday();
    }

    async loadData() {
        try {
            const [charResponse, tasksResponse] = await Promise.all([
                fetch(`${API_BASE}/api/data`),
                fetch(`${API_BASE}/api/daily-tasks`)
            ]);

            if (charResponse.ok) {
                const charData = await charResponse.json();
                this.data.character = charData.character;
                this.data.hasStampToday = charData.hasStampToday;
            }

            if (tasksResponse.ok) {
                const tasksData = await tasksResponse.json();
                this.tasks = tasksData.tasks;
            }

            return { ...this.data, tasks: this.tasks };
        } catch (error) {
            console.error('Error loading data:', error);
            return { ...this.data, tasks: this.tasks };
        }
    }

    getToday() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    async updateTask(taskId, updates) {
        try {
            const response = await fetch(`${API_BASE}/api/daily-tasks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId, ...updates })
            });

            if (!response.ok) throw new Error('Failed to update task');

            // ローカルデータを更新
            const task = this.tasks.find(t => t.id === taskId);
            if (task) {
                Object.assign(task, updates);
            }

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

    // タスク一覧を表示
    displayTasks();

    // スタンプ状態
    updateStampUI(manager.data.hasStampToday);
}

function displayTasks() {
    const listEl = document.getElementById('taskList');
    const summaryEl = document.getElementById('taskSummary');

    if (!manager.tasks || manager.tasks.length === 0) {
        listEl.innerHTML = '<div class="empty-message">タスクがありません<br><a href="manage.html">タスク管理</a>からタスクを追加してください</div>';
        summaryEl.textContent = '';
        return;
    }

    // カテゴリごとにグループ化
    const categories = ['学校', 'ヤマハ', 'BUDDY', 'その他'];
    let html = '';

    categories.forEach(category => {
        const categoryTasks = manager.tasks.filter(t => t.category === category);
        if (categoryTasks.length === 0) return;

        html += `<div class="category-section">
            <h3 class="category-header">${category}</h3>
            ${categoryTasks.map(task => `
        <div class="daily-task-item ${task.isPlanned ? 'planned' : ''} ${task.isCompleted ? 'completed' : ''}" data-id="${task.id}">
            <div class="task-plan-check">
                <input type="checkbox"
                       class="plan-checkbox"
                       ${task.isPlanned ? 'checked' : ''}
                       onchange="togglePlan(${task.id}, this.checked)">
            </div>
            <div class="task-name">${task.name}</div>
            <div class="task-timing">
                <button class="timing-btn ${task.timing === 'morning' ? 'active' : ''}"
                        onclick="setTiming(${task.id}, 'morning')"
                        ${!task.isPlanned ? 'disabled' : ''}>朝</button>
                <button class="timing-btn ${task.timing === 'afternoon' ? 'active' : ''}"
                        onclick="setTiming(${task.id}, 'afternoon')"
                        ${!task.isPlanned ? 'disabled' : ''}>昼</button>
                <button class="timing-btn ${task.timing === 'night' ? 'active' : ''}"
                        onclick="setTiming(${task.id}, 'night')"
                        ${!task.isPlanned ? 'disabled' : ''}>夜</button>
            </div>
            <div class="task-complete-check">
                <input type="checkbox"
                       class="complete-checkbox"
                       ${task.isCompleted ? 'checked' : ''}
                       onchange="toggleComplete(${task.id}, this.checked)"
                       ${!task.isPlanned ? 'disabled' : ''}>
                <span class="complete-label">完了</span>
            </div>
        </div>
    `).join('')}
        </div>`;
    });

    listEl.innerHTML = html;

    // サマリー表示
    const planned = manager.tasks.filter(t => t.isPlanned).length;
    const completed = manager.tasks.filter(t => t.isCompleted).length;
    summaryEl.innerHTML = `計画: ${planned} / 完了: ${completed}`;
}

async function togglePlan(taskId, isPlanned) {
    const task = manager.tasks.find(t => t.id === taskId);
    await manager.updateTask(taskId, {
        isPlanned,
        timing: isPlanned ? (task.timing || null) : null,
        isCompleted: isPlanned ? task.isCompleted : false
    });
    displayTasks();
}

async function setTiming(taskId, timing) {
    const task = manager.tasks.find(t => t.id === taskId);
    const newTiming = task.timing === timing ? null : timing;
    await manager.updateTask(taskId, { timing: newTiming });
    displayTasks();
}

async function toggleComplete(taskId, isCompleted) {
    await manager.updateTask(taskId, { isCompleted });
    displayTasks();
}

function updateStampUI(hasStamp) {
    const stampArea = document.getElementById('stampArea');
    const stampButton = document.getElementById('stampButton');
    const messageEl = document.getElementById('stampMessage');

    if (hasStamp) {
        stampArea.innerHTML = `
            <div class="stamped-display">
                <div class="stamped-icon">✅</div>
                <div>今日はもうスタンプを押しました！</div>
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
                    messageEl.textContent = '今日はもうスタンプを押しました';
                    messageEl.className = 'stamp-message already';
                } else {
                    messageEl.textContent = 'エラーが発生しました';
                    messageEl.className = 'stamp-message';
                }
                stampButton.disabled = false;
            }
        });
    }
});
