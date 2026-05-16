document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('token-input');
    const stats = document.getElementById('token-stats');
    const message = document.getElementById('token-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderRows(rows) {
        stats.innerHTML = rows.map(([label, value]) => {
            return `<div class="result-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
        }).join('');
    }

    function estimate() {
        const text = input.value.trim();
        if (!text) {
            stats.innerHTML = '';
            setMessage('请先输入需要估算的文本。', 'error');
            return;
        }

        const cjkCount = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
        const asciiText = text.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, '');
        const asciiCount = asciiText.replace(/\s/g, '').length;
        const whitespaceCount = (text.match(/\s/g) || []).length;
        const lineCount = text.split(/\r?\n/).length;
        const roughTokens = Math.max(1, Math.ceil(cjkCount * 1.1 + asciiCount / 4 + whitespaceCount / 8));
        const safeMaxOutput = Math.max(256, 128000 - roughTokens);

        renderRows([
            ['粗估 token', roughTokens.toLocaleString('zh-CN')],
            ['字符数', text.length.toLocaleString('zh-CN')],
            ['中文字符', cjkCount.toLocaleString('zh-CN')],
            ['非中文字符', asciiCount.toLocaleString('zh-CN')],
            ['行数', lineCount.toLocaleString('zh-CN')],
            ['128K 上下文剩余', safeMaxOutput.toLocaleString('zh-CN')]
        ]);
        setMessage('Token 已粗估。', 'success');
    }

    function clearAll() {
        input.value = '';
        stats.innerHTML = '';
        setMessage('输入已清空。');
    }

    function fillSample() {
        input.value = '你是资深 Java 后端工程师。\n\n请审查接口设计，指出潜在问题，并给出可落地的改进方案。';
        estimate();
    }

    document.getElementById('token-estimate-btn').addEventListener('click', estimate);
    document.getElementById('token-clear-btn').addEventListener('click', clearAll);
    document.getElementById('token-sample-btn').addEventListener('click', fillSample);
});
