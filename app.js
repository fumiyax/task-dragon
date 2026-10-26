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
        this.currentDate = this.getToday();
    }

    async loadData() {
        try {
            const [charResponse, tasksResponse] = await Promise.all([
                fetch(`${API_BASE}/api/data?date=${this.currentDate}`),
                fetch(`${API_BASE}/api/daily-tasks?date=${this.currentDate}`)
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

    changeDate(days) {
        const date = new Date(this.currentDate);
        date.setDate(date.getDate() + days);
        this.currentDate = date.toISOString().split('T')[0];
    }

    goToToday() {
        this.currentDate = this.getToday();
    }

    formatDateJapanese() {
        const date = new Date(this.currentDate);
        const today = this.getToday();
        const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
        return this.currentDate === today ? `${dateStr}（今日）` : dateStr;
    }

    async updateTask(taskId, updates) {
        try {
            const response = await fetch(`${API_BASE}/api/daily-tasks?date=${this.currentDate}`, {
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
            const response = await fetch(`${API_BASE}/api/stamp?date=${this.currentDate}`, {
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

    async unstamp() {
        try {
            const response = await fetch(`${API_BASE}/api/stamp?date=${this.currentDate}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Error unstamping:', error);
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
    document.getElementById('currentDate').textContent = manager.formatDateJapanese();

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
    await manager.updateTask(taskId, {
        isPlanned: task.isPlanned,
        timing: newTiming,
        isCompleted: task.isCompleted
    });
    displayTasks();
}

async function toggleComplete(taskId, isCompleted) {
    const task = manager.tasks.find(t => t.id === taskId);
    await manager.updateTask(taskId, {
        isPlanned: task.isPlanned,
        timing: task.timing,
        isCompleted
    });
    displayTasks();
}

function updateStampUI(hasStamp) {
    const stampArea = document.getElementById('stampArea');

    if (hasStamp) {
        stampArea.innerHTML = `
            <div class="stamped-display">
                <div class="stamped-icon">✅</div>
                <div>スタンプ承認済み</div>
            </div>
            <button class="stamp-button" id="unstampButton">
                ❌ 承認を解除
            </button>
        `;

        // 解除ボタンのイベントリスナーを追加
        const unstampButton = document.getElementById('unstampButton');
        if (unstampButton) {
            unstampButton.addEventListener('click', () => {
                document.getElementById('unstampPasswordModal').style.display = 'flex';
                document.getElementById('unstampPasswordInput').value = '';
                document.getElementById('unstampPasswordError').textContent = '';
                document.getElementById('unstampPasswordInput').focus();
            });
        }
    } else {
        // 元のボタンとメッセージ要素を復元
        stampArea.innerHTML = `
            <button class="stamp-button" id="stampButton">
                ✨ よくできました！ ✨
            </button>
            <p class="stamp-message" id="stampMessage"></p>
        `;

        // スタンプボタンのイベントリスナーを再設定
        const stampButton = document.getElementById('stampButton');
        if (stampButton) {
            stampButton.addEventListener('click', () => {
                document.getElementById('passwordModal').style.display = 'flex';
                document.getElementById('passwordInput').value = '';
                document.getElementById('passwordError').textContent = '';
                document.getElementById('passwordInput').focus();
            });
        }
    }
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', async () => {
    manager = new QuestManager();

    // 初期表示
    await updateUI();

    // スタンプボタン（初回のみ。以降はupdateStampUIで設定）
    const stampButton = document.getElementById('stampButton');
    if (stampButton) {
        stampButton.addEventListener('click', () => {
            // 合言葉モーダルを表示
            document.getElementById('passwordModal').style.display = 'flex';
            document.getElementById('passwordInput').value = '';
            document.getElementById('passwordError').textContent = '';
            document.getElementById('passwordInput').focus();
        });
    }

    // 合言葉確認ボタン
    const submitPasswordBtn = document.getElementById('submitPasswordBtn');
    if (submitPasswordBtn) {
        submitPasswordBtn.addEventListener('click', async () => {
            const password = document.getElementById('passwordInput').value;
            const errorEl = document.getElementById('passwordError');

            if (password === '238') {
                // 正しい合言葉
                document.getElementById('passwordModal').style.display = 'none';

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
            } else {
                // 間違った合言葉
                errorEl.textContent = '合言葉が違います';
                errorEl.className = 'stamp-message';
                document.getElementById('passwordInput').value = '';
                document.getElementById('passwordInput').focus();
            }
        });
    }

    // 合言葉キャンセルボタン
    const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
    if (cancelPasswordBtn) {
        cancelPasswordBtn.addEventListener('click', () => {
            document.getElementById('passwordModal').style.display = 'none';
        });
    }

    // モーダル外クリックで閉じる
    const passwordModal = document.getElementById('passwordModal');
    if (passwordModal) {
        passwordModal.addEventListener('click', (e) => {
            if (e.target.id === 'passwordModal') {
                passwordModal.style.display = 'none';
            }
        });
    }

    // Enterキーで確認
    const passwordInput = document.getElementById('passwordInput');
    if (passwordInput) {
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitPasswordBtn.click();
            }
        });
    }

    // 日付ナビゲーション
    const prevDayBtn = document.getElementById('prevDayBtn');
    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', async () => {
            manager.changeDate(-1);
            await updateUI();
        });
    }

    const nextDayBtn = document.getElementById('nextDayBtn');
    if (nextDayBtn) {
        nextDayBtn.addEventListener('click', async () => {
            manager.changeDate(1);
            await updateUI();
        });
    }

    const todayBtn = document.getElementById('todayBtn');
    if (todayBtn) {
        todayBtn.addEventListener('click', async () => {
            manager.goToToday();
            await updateUI();
        });
    }

    // スタンプ解除用の合言葉確認
    const submitUnstampPasswordBtn = document.getElementById('submitUnstampPasswordBtn');
    if (submitUnstampPasswordBtn) {
        submitUnstampPasswordBtn.addEventListener('click', async () => {
            const password = document.getElementById('unstampPasswordInput').value;
            const errorEl = document.getElementById('unstampPasswordError');

            if (password === '238') {
                document.getElementById('unstampPasswordModal').style.display = 'none';

                try {
                    await manager.unstamp();
                    await updateUI();

                    // 成功メッセージを表示
                    const messageEl = document.getElementById('stampMessage');
                    if (messageEl) {
                        messageEl.textContent = 'スタンプを解除しました';
                        messageEl.className = 'stamp-message success';
                        setTimeout(() => {
                            messageEl.textContent = '';
                        }, 2000);
                    }
                } catch (error) {
                    console.error('Unstamp error:', error);
                    alert(`スタンプの解除に失敗しました: ${error.message}`);
                }
            } else {
                errorEl.textContent = '合言葉が違います';
                errorEl.className = 'stamp-message';
                document.getElementById('unstampPasswordInput').value = '';
                document.getElementById('unstampPasswordInput').focus();
            }
        });
    }

    const cancelUnstampPasswordBtn = document.getElementById('cancelUnstampPasswordBtn');
    if (cancelUnstampPasswordBtn) {
        cancelUnstampPasswordBtn.addEventListener('click', () => {
            document.getElementById('unstampPasswordModal').style.display = 'none';
        });
    }

    const unstampPasswordModal = document.getElementById('unstampPasswordModal');
    if (unstampPasswordModal) {
        unstampPasswordModal.addEventListener('click', (e) => {
            if (e.target.id === 'unstampPasswordModal') {
                unstampPasswordModal.style.display = 'none';
            }
        });
    }

    const unstampPasswordInput = document.getElementById('unstampPasswordInput');
    if (unstampPasswordInput) {
        unstampPasswordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitUnstampPasswordBtn.click();
            }
        });
    }

    // 他の端末の変更を同期: タブがアクティブになった時にリロード
    document.addEventListener('visibilitychange', async () => {
        if (!document.hidden && manager) {
            await updateUI();
        }
    });

    // 定期的に同期（30秒ごと）
    setInterval(async () => {
        if (manager && !document.hidden) {
            await manager.loadData();
            displayTasks();
            updateStampUI(manager.data.hasStampToday);
        }
    }, 30000);
});
