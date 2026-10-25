// タスク管理ページ

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

let tasks = [];

// タスク一覧を読み込み
async function loadTasks() {
    try {
        const response = await fetch(`${API_BASE}/api/tasks`);
        if (!response.ok) throw new Error('Failed to fetch tasks');

        const data = await response.json();
        tasks = data.tasks;
        displayTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
        document.getElementById('taskList').innerHTML =
            '<div class="error-message">タスクの読み込みに失敗しました</div>';
    }
}

// タスクを表示
function displayTasks() {
    const listEl = document.getElementById('taskList');

    if (!tasks || tasks.length === 0) {
        listEl.innerHTML = '<div class="empty-message">タスクがありません</div>';
        return;
    }

    // カテゴリごとにグループ化
    const categories = ['学校', 'ヤマハ', 'BUDDY', 'その他'];
    let html = '';

    categories.forEach(category => {
        const categoryTasks = tasks.filter(t => t.category === category);
        if (categoryTasks.length === 0) return;

        html += `<div class="category-group">
            <h3 class="category-title">${category}</h3>
            ${categoryTasks.map((task, index) => `
                <div class="manage-task-item" data-id="${task.id}">
                    <div class="task-order">${index + 1}</div>
                    <div class="task-name-display">${task.name}</div>
                    <div class="task-actions">
                        ${index > 0 ? `<button class="move-btn" onclick="moveTask(${task.id}, 'up')">↑</button>` : '<span class="move-btn-placeholder"></span>'}
                        ${index < categoryTasks.length - 1 ? `<button class="move-btn" onclick="moveTask(${task.id}, 'down')">↓</button>` : '<span class="move-btn-placeholder"></span>'}
                        <button class="edit-btn" onclick="editTask(${task.id})">編集</button>
                        <button class="delete-btn" onclick="deleteTask(${task.id})">削除</button>
                    </div>
                </div>
            `).join('')}
        </div>`;
    });

    listEl.innerHTML = html;
}

// タスクを追加
async function addTask() {
    const nameInput = document.getElementById('newTaskName');
    const categorySelect = document.getElementById('newTaskCategory');
    const name = nameInput.value.trim();
    const category = categorySelect.value;

    if (!name) {
        alert('タスク名を入力してください');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category })
        });

        if (!response.ok) throw new Error('Failed to add task');

        nameInput.value = '';
        await loadTasks();
    } catch (error) {
        console.error('Error adding task:', error);
        alert('タスクの追加に失敗しました');
    }
}

// タスクを編集
let editingTaskId = null;

async function editTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    editingTaskId = id;
    document.getElementById('editTaskName').value = task.name;
    document.getElementById('editTaskCategory').value = task.category;
    document.getElementById('editModal').style.display = 'flex';
}

async function saveEdit() {
    const name = document.getElementById('editTaskName').value.trim();
    const category = document.getElementById('editTaskCategory').value;

    if (!name) {
        alert('タスク名を入力してください');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/tasks?id=${editingTaskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, category })
        });

        if (!response.ok) throw new Error('Failed to update task');

        document.getElementById('editModal').style.display = 'none';
        editingTaskId = null;
        await loadTasks();
    } catch (error) {
        console.error('Error updating task:', error);
        alert('タスクの更新に失敗しました');
    }
}

function cancelEdit() {
    document.getElementById('editModal').style.display = 'none';
    editingTaskId = null;
}

// タスクを削除
async function deleteTask(id) {
    if (!confirm('このタスクを削除しますか？')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/api/tasks?id=${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Failed to delete task');

        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        alert('タスクの削除に失敗しました');
    }
}

// タスクを移動
async function moveTask(id, direction) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    // 同じカテゴリ内でのタスクのみ取得
    const categoryTasks = tasks.filter(t => t.category === task.category);
    const index = categoryTasks.findIndex(t => t.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= categoryTasks.length) return;

    // ソート順を入れ替え
    const task1 = categoryTasks[index];
    const task2 = categoryTasks[newIndex];

    try {
        await Promise.all([
            fetch(`${API_BASE}/api/tasks?id=${task1.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sort_order: task2.sort_order })
            }),
            fetch(`${API_BASE}/api/tasks?id=${task2.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sort_order: task1.sort_order })
            })
        ]);

        await loadTasks();
    } catch (error) {
        console.error('Error moving task:', error);
        alert('タスクの移動に失敗しました');
    }
}

// イベントリスナー
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();

    // 追加ボタン
    document.getElementById('addTaskBtn').addEventListener('click', addTask);

    // Enterキーで追加
    document.getElementById('newTaskName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // 編集モーダルのボタン
    document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
    document.getElementById('cancelEditBtn').addEventListener('click', cancelEdit);

    // モーダル外クリックで閉じる
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') {
            cancelEdit();
        }
    });
});
