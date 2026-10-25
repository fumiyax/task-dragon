// API Base URL
const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

// データ管理
class TaskManager {
    constructor() {
        this.data = {
            todayTasks: { morning: false, afternoon: false, night: false },
            currentEgg: { startDate: '', checkCount: 0 },
            dragons: []
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
            // フォールバック：localStorageから読み込み
            return this.loadFromLocalStorage();
        }
    }

    loadFromLocalStorage() {
        const saved = localStorage.getItem('dragonTaskData');
        if (saved) {
            const parsed = JSON.parse(saved);
            this.data = {
                todayTasks: parsed.tasks?.[this.today] || { morning: false, afternoon: false, night: false },
                currentEgg: parsed.currentEgg || { startDate: this.today, checkCount: 0 },
                dragons: parsed.dragons || []
            };
        }
        return this.data;
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

            const result = await response.json();

            // ローカルデータを更新
            this.data.todayTasks[taskType] = checked;
            this.data.currentEgg.checkCount = result.totalChecks;

            // 孵化した場合
            if (result.hatched) {
                this.showHatchAnimation(result.hatched);
            }

            return result;
        } catch (error) {
            console.error('Error updating task:', error);
            // フォールバック：localStorageに保存
            this.saveToLocalStorage(taskType, checked);
        }
    }

    saveToLocalStorage(taskType, checked) {
        const saved = localStorage.getItem('dragonTaskData') || '{"tasks":{},"currentEgg":null,"dragons":[]}';
        const data = JSON.parse(saved);

        if (!data.tasks[this.today]) {
            data.tasks[this.today] = { morning: false, afternoon: false, night: false };
        }
        data.tasks[this.today][taskType] = checked;

        localStorage.setItem('dragonTaskData', JSON.stringify(data));
        this.data.todayTasks = data.tasks[this.today];
    }

    showHatchAnimation(dragon) {
        const egg = document.getElementById('egg');
        const eggMessage = document.getElementById('eggMessage');

        // 卵を揺らす
        egg.classList.add('hatching');
        eggMessage.textContent = 'たまごがわれる！';

        setTimeout(() => {
            // ドラゴンに変化
            egg.textContent = dragon.icon;
            egg.classList.remove('hatching');
            eggMessage.textContent = `${dragon.name}がうまれた！🎉`;

            setTimeout(async () => {
                // 元に戻す
                egg.textContent = '🥚';
                eggMessage.textContent = 'あたらしいたまごをそだてよう！';
                // データを再読み込み
                await this.loadData();
                updateUI();
            }, 3000);
        }, 1500);
    }

    getProgress() {
        const startDate = new Date(this.data.currentEgg.startDate);
        const today = new Date(this.today);
        const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        const days = Math.min(daysDiff + 1, 7);
        const checkCount = this.data.currentEgg.checkCount || 0;

        return { days, checkCount, percentage: (checkCount / 21) * 100 };
    }

    async reset() {
        if (confirm('すべてのデータをリセットしますか？')) {
            // TODO: Add reset API endpoint if needed
            localStorage.removeItem('dragonTaskData');
            location.reload();
        }
    }
}

// グローバルマネージャーインスタンス
let manager;

// UIの更新
async function updateUI() {
    if (!manager) {
        manager = new TaskManager();
        await manager.loadData();
    }

    // 日付表示
    const date = new Date();
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    document.getElementById('currentDate').textContent = dateStr;

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

    // 進捗表示
    const progress = manager.getProgress();
    document.getElementById('progressFill').style.width = `${progress.percentage}%`;
    document.getElementById('progressDays').textContent = progress.days;

    // 励ましメッセージ
    updateEncourageMessage(progress.checkCount, progress.days);

    // ドラゴンコレクション
    displayDragons(manager.data.dragons);
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

function updateEncourageMessage(checkCount, days) {
    const messageEl = document.getElementById('encourageMessage');
    const needed = 18;
    const remaining = needed - checkCount;

    if (checkCount >= needed) {
        messageEl.textContent = 'もうすぐうまれるよ！🎉';
        messageEl.style.color = '#28a745';
    } else if (remaining <= 3) {
        messageEl.textContent = `あと${remaining}かいでうまれるよ！がんばれ！💪`;
        messageEl.style.color = '#ffc107';
    } else if (days >= 4) {
        messageEl.textContent = `あと${remaining}かい！もうすこし！✨`;
        messageEl.style.color = '#17a2b8';
    } else if (checkCount > 0) {
        messageEl.textContent = 'いいちょうし！つづけよう！😊';
        messageEl.style.color = '#28a745';
    } else {
        messageEl.textContent = '';
    }
}

function displayDragons(dragons) {
    const grid = document.getElementById('dragonGrid');

    if (!dragons || dragons.length === 0) {
        grid.innerHTML = '<div class="empty-message">まだドラゴンがいません</div>';
        return;
    }

    grid.innerHTML = dragons.map(dragon => {
        const date = new Date(dragon.hatchedDate);
        const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

        return `
            <div class="dragon-card" style="background: ${dragon.color}">
                <div class="dragon-icon">${dragon.icon}</div>
                <div class="dragon-name">${dragon.name}</div>
                <div class="dragon-date">${dateStr}</div>
            </div>
        `;
    }).join('');
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', async () => {
    manager = new TaskManager();

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

    // リセットボタン
    document.getElementById('resetBtn').addEventListener('click', () => {
        manager.reset();
    });
});
