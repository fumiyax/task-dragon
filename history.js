// スタンプ履歴ページ

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3000' : '';

async function loadHistory() {
    try {
        const response = await fetch(`${API_BASE}/api/history`);
        if (!response.ok) throw new Error('Failed to fetch history');

        const data = await response.json();
        displayHistory(data.stamps);
    } catch (error) {
        console.error('Error loading history:', error);
        document.getElementById('historyList').innerHTML =
            '<div class="error-message">データのよみこみにしっぱいしました</div>';
    }
}

function displayHistory(stamps) {
    const listEl = document.getElementById('historyList');

    if (!stamps || stamps.length === 0) {
        listEl.innerHTML = '<div class="empty-message">まだスタンプがありません</div>';
        return;
    }

    listEl.innerHTML = stamps.map(stamp => {
        const date = new Date(stamp.date);
        const dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;

        const levelChanged = stamp.titleBefore !== stamp.titleAfter;

        return `
            <div class="history-item ${levelChanged ? 'title-changed' : ''}">
                <div class="history-date">${dateStr}</div>
                <div class="history-level">
                    <span class="level-badge">LV ${stamp.levelBefore}</span>
                    <span class="arrow">→</span>
                    <span class="level-badge">LV ${stamp.levelAfter}</span>
                </div>
                <div class="history-title">
                    <span class="title">${stamp.titleBefore}</span>
                    ${levelChanged ? `
                        <span class="arrow">→</span>
                        <span class="title highlight">${stamp.titleAfter}</span>
                        <span class="celebration">🎉</span>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// ページ読み込み時に履歴を取得
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});
