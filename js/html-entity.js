document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('html-entity-input');
    const output = document.getElementById('html-entity-output');
    const message = document.getElementById('html-entity-message');
    const encodeQuotes = document.getElementById('encode-quotes');
    const encodeLinebreaks = document.getElementById('encode-linebreaks');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function requireInput() {
        if (!input.value) {
            throw new Error('请输入要处理的内容');
        }
        return input.value;
    }

    function escapeHtml(text) {
        let result = text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        if (encodeQuotes.checked) {
            result = result.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }
        if (encodeLinebreaks.checked) {
            result = result.replace(/\r?\n/g, '<br>');
        }
        return result;
    }

    function unescapeHtml(text) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = text.replace(/<br\s*\/?>/gi, '\n');
        return textarea.value;
    }

    function toNumericEntities(text) {
        return Array.from(text).map(char => `&#${char.codePointAt(0)};`).join('');
    }

    function run(transform, success) {
        try {
            output.value = transform(requireInput());
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('html-escape-btn').addEventListener('click', () => run(escapeHtml, 'HTML 转义完成。'));
    document.getElementById('html-unescape-btn').addEventListener('click', () => run(unescapeHtml, 'HTML 反转义完成。'));
    document.getElementById('html-numeric-btn').addEventListener('click', () => run(toNumericEntities, '数字实体转换完成。'));
    document.getElementById('sample-html-btn').addEventListener('click', () => {
        input.value = '<div class="card">JavaPub & Tools</div>\n<script>alert("demo")</script>';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('clear-html-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入内容。', '');
    });
    document.getElementById('copy-html-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('swap-html-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
