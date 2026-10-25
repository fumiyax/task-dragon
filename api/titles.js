// 称号計算ロジック

export function getTitle(level) {
    // 職業リスト（100レベルごと）
    const jobs = [
        { name: '剣士', final: '剣聖', icon: '⚔️' },
        { name: '武闘家', final: '拳聖', icon: '🥋' },
        { name: '魔法使い', final: '大魔導師', icon: '🪄' },
        { name: '僧侶', final: '大司教', icon: '⛪' },
        { name: '忍者', final: '忍', icon: '🥷' },
        { name: '騎士', final: '聖騎士', icon: '🛡️' },
        { name: '盗賊', final: '怪盗', icon: '🎭' },
        { name: '竜騎士', final: '竜王', icon: '🐉' },
        { name: '賢者', final: '大賢者', icon: '📜' },
        { name: '勇者', final: '英雄', icon: '👑' }
    ];

    // 職業を決定（100レベルごと、ループ）
    const jobIndex = Math.floor((level - 1) / 100) % jobs.length;
    const job = jobs[jobIndex];

    // 職業内でのレベル（1-100）
    const jobLevel = ((level - 1) % 100) + 1;

    // 称号を決定（10レベルごと）
    const titleIndex = Math.floor((jobLevel - 1) / 10);
    const titlePrefixes = [
        (name) => `見習い${name}`,      // LV1-10
        (name) => name,                  // LV11-20
        (name) => `熟練${name}`,        // LV21-30
        (name) => `上級${name}`,        // LV31-40
        (name) => `達人${name}`,        // LV41-50
        (name) => `名人${name}`,        // LV51-60
        (name) => `伝説の${name}`,      // LV61-70
        (name) => `究極の${name}`,      // LV71-80
        (name) => `神級${name}`,        // LV81-90
        () => job.final                  // LV91-100
    ];

    const title = titlePrefixes[titleIndex](job.name);

    return {
        title,
        job: job.name,
        icon: job.icon,
        jobLevel,
        jobIndex: jobIndex + 1
    };
}

export function getJobProgress(level) {
    const jobLevel = ((level - 1) % 100) + 1;
    return {
        current: jobLevel,
        max: 100,
        percentage: jobLevel
    };
}
