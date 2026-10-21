// ドラゴンの種類
const DRAGON_TYPES = [
    { icon: '🔥', name: 'ファイアドラゴン', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { icon: '💧', name: 'ウォータードラゴン', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { icon: '🌿', name: 'フォレストドラゴン', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
    { icon: '⚡', name: 'サンダードラゴン', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
    { icon: '🌟', name: 'スタードラゴン', color: 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)' },
    { icon: '🌈', name: 'レインボードラゴン', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)' },
    { icon: '❄️', name: 'アイスドラゴン', color: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)' },
    { icon: '🌙', name: 'ムーンドラゴン', color: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' }
];

// データ管理
class TaskManager {
    constructor() {
        this.data = this.loadData();
        this.today = this.getToday();
        this.initEggIfNeeded();
    }

    loadData() {
        const saved = localStorage.getItem('dragonTaskData');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            tasks: {},
            currentEgg: null,
            dragons: []
        };
    }

    saveData() {
        localStorage.setItem('dragonTaskData', JSON.stringify(this.data));
    }

    getToday() {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    }

    initEggIfNeeded() {
        if (!this.data.currentEgg) {
            this.data.currentEgg = {
                startDate: this.today,
                checkCount: 0
            };
            this.saveData();
        }
    }

    getTodayTasks() {
        if (!this.data.tasks[this.today]) {
            this.data.tasks[this.today] = {
                morning: false,
                afternoon: false,
                night: false
            };
        }
        return this.data.tasks[this.today];
    }

    setTask(taskType, checked) {
        this.data.tasks[this.today][taskType] = checked;
        this.updateEggProgress();
        this.saveData();
    }

    updateEggProgress() {
        // 7日間のチェック数を計算
        const startDate = new Date(this.data.currentEgg.startDate);
        const today = new Date(this.today);
        const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));

        let totalChecks = 0;
        for (let i = 0; i <= daysDiff && i < 7; i++) {
            const date = new Date(startDate);
            date.setDate(date.getDate() + i);
            const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            if (this.data.tasks[dateStr]) {
                const tasks = this.data.tasks[dateStr];
                if (tasks.morning) totalChecks++;
                if (tasks.afternoon) totalChecks++;
                if (tasks.night) totalChecks++;
            }
        }

        this.data.currentEgg.checkCount = totalChecks;

        // 孵化判定（7日間で18回以上チェック、または7日経過）
        if (daysDiff >= 6 && totalChecks >= 18) {
            this.hatchEgg();
        } else if (daysDiff >= 6) {
            // 7日経過したが条件未達成の場合、卵をリセット
            this.resetEgg();
        }
    }

    hatchEgg() {
        // ランダムにドラゴンを選択
        const randomDragon = DRAGON_TYPES[Math.floor(Math.random() * DRAGON_TYPES.length)];

        this.data.dragons.push({
            ...randomDragon,
            hatchedDate: this.today
        });

        // 卵をリセット
        this.resetEgg();

        // 孵化アニメーション
        this.showHatchAnimation(randomDragon);
    }

    resetEgg() {
        this.data.currentEgg = {
            startDate: this.today,
            checkCount: 0
        };
        this.saveData();
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

            setTimeout(() => {
                // 元に戻す
                egg.textContent = '🥚';
                eggMessage.textContent = 'あたらしいたまごをそだてよう！';
                this.saveData();
                updateUI();
            }, 3000);
        }, 1500);
    }

    getProgress() {
        const startDate = new Date(this.data.currentEgg.startDate);
        const today = new Date(this.today);
        const daysDiff = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
        const days = Math.min(daysDiff + 1, 7);
        const checkCount = this.data.currentEgg.checkCount;

        return { days, checkCount, percentage: (checkCount / 21) * 100 };
    }

    reset() {
        if (confirm('すべてのデータをリセットしますか？')) {
            localStorage.removeItem('dragonTaskData');
            location.reload();
        }
    }
}

// UIの更新
function updateUI() {
    const manager = new TaskManager();

    // 日付表示
    const date = new Date();
    const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
    document.getElementById('currentDate').textContent = dateStr;

    // タスクの状態を復元
    const todayTasks = manager.getTodayTasks();
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

    if (dragons.length === 0) {
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
    }).reverse().join('');
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', () => {
    const manager = new TaskManager();

    // 初期表示
    updateUI();

    // タスクチェックボックス
    ['morning', 'afternoon', 'night'].forEach(taskId => {
        const checkbox = document.getElementById(taskId);
        checkbox.addEventListener('change', (e) => {
            manager.setTask(taskId, e.target.checked);
            updateTaskStyle(taskId, e.target.checked);
            updateUI();
        });
    });

    // リセットボタン
    document.getElementById('resetBtn').addEventListener('click', () => {
        manager.reset();
    });
});
