document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('word-count-input');
    const stats = document.getElementById('word-count-stats');
    const message = document.getElementById('word-count-message');
    let lastStatsText = '';

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function count() {
        const text = input.value;
        const noWhitespace = text.replace(/\s/g, '');
        const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
        const englishWords = (text.match(/[A-Za-z0-9]+(?:[-'][A-Za-z0-9]+)*/g) || []).length;
        const lines = text ? text.split(/\r?\n/).length : 0;
        const paragraphs = text.trim() ? text.trim().split(/\n\s*\n/).filter(Boolean).length : 0;
        const spaces = (text.match(/[ \t]/g) || []).length;
        const punctuation = (text.match(/[，。！？、；：“”‘’,.!?;:"'()[\]{}<>]/g) || []).length;
        const readingMinutes = Math.max(1, Math.ceil((chineseChars + englishWords) / 300));

        const rows = [
            ['字符数', text.length],
            ['不含空白', noWhitespace.length],
            ['中文字符', chineseChars],
            ['英文/数字词', englishWords],
            ['行数', lines],
            ['段落数', paragraphs],
            ['空格/制表符', spaces],
            ['标点符号', punctuation],
            ['预计阅读', `${readingMinutes} 分钟`]
        ];

        stats.innerHTML = rows.map(([label, value]) => {
            return `<div class="metric-card"><span>${label}</span><strong>${value}</strong></div>`;
        }).join('');
        lastStatsText = rows.map(([label, value]) => `${label}: ${value}`).join('\n');
        setMessage(text ? '统计已更新。' : '输入文本后自动统计。', text ? 'success' : '');
    }

    document.getElementById('sample-word-btn').addEventListener('click', () => {
        input.value = 'JavaPub 开发者在线工具箱\n\nJSON格式化、编码转换、文本处理、AI调试工具，打开即用，数据仅在浏览器本地处理。';
        count();
    });
    document.getElementById('clear-word-btn').addEventListener('click', () => {
        input.value = '';
        count();
    });
    document.getElementById('copy-word-stats-btn').addEventListener('click', () => {
        if (!lastStatsText) {
            setMessage('没有可复制的统计结果。', 'error');
            return;
        }
        navigator.clipboard.writeText(lastStatsText).then(() => setMessage('统计结果已复制。', 'success'));
    });
    input.addEventListener('input', count);
    count();
});
