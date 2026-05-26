document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('regex-escape-input');
    const output = document.getElementById('regex-escape-output');
    const message = document.getElementById('regex-escape-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function requireInput() {
        if (!input.value) {
            throw new Error('请输入要转换的内容');
        }
        return input.value;
    }

    function escapeRegex() {
        return requireInput().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function unescapeRegex() {
        return requireInput().replace(/\\([.*+?^${}()|[\]\\])/g, '$1');
    }

    function run(transform, success) {
        try {
            output.value = transform();
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('regex-escape-btn').addEventListener('click', () => run(escapeRegex, '正则转义完成。'));
    document.getElementById('regex-unescape-btn').addEventListener('click', () => run(unescapeRegex, '基础反转义完成。'));
    document.getElementById('regex-escape-sample-btn').addEventListener('click', () => {
        input.value = 'https://example.com?a=1+b&tag=(json)';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('regex-escape-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入内容。', '');
    });
    document.getElementById('regex-escape-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('regex-escape-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
