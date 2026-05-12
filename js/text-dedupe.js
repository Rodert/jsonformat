document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('dedupe-input');
    const output = document.getElementById('dedupe-output');
    const stats = document.getElementById('dedupe-stats');
    const message = document.getElementById('dedupe-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function option(id) {
        return document.getElementById(id).checked;
    }

    function renderStats(rows) {
        stats.innerHTML = rows.map(row => `<div class="result-row"><span>${row.label}</span><strong>${row.value}</strong></div>`).join('');
    }

    function dedupe() {
        if (!input.value) {
            setMessage('请输入要去重的文本。', 'error');
            return;
        }

        const rawLines = input.value.split(/\r?\n/);
        const seen = new Set();
        const result = [];
        let emptyCount = 0;
        let duplicateCount = 0;

        rawLines.forEach(line => {
            const normalizedLine = option('dedupe-trim') ? line.trim() : line;
            if (option('dedupe-remove-empty') && normalizedLine === '') {
                emptyCount++;
                return;
            }
            const key = option('dedupe-ignore-case') ? normalizedLine.toLowerCase() : normalizedLine;
            if (seen.has(key)) {
                duplicateCount++;
                return;
            }
            seen.add(key);
            result.push(normalizedLine);
        });

        if (option('dedupe-sort')) {
            result.sort((a, b) => a.localeCompare(b, 'zh-CN'));
        }

        output.value = result.join('\n');
        renderStats([
            { label: '原始行数', value: rawLines.length },
            { label: '保留行数', value: result.length },
            { label: '重复行数', value: duplicateCount },
            { label: '移除空行', value: emptyCount }
        ]);
        setMessage('文本去重完成。', 'success');
    }

    document.getElementById('dedupe-btn').addEventListener('click', dedupe);
    document.getElementById('sample-dedupe-btn').addEventListener('click', () => {
        input.value = 'JavaPub\njson\nJSON\nbase64\n\njson\nAI\nJavaPub\napi.chongplus.plus';
        dedupe();
    });
    document.getElementById('clear-dedupe-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        stats.innerHTML = '';
        setMessage('等待输入文本。', '');
    });
    document.getElementById('copy-dedupe-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的结果。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
});
