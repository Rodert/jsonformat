document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('line-tools-input');
    const output = document.getElementById('line-tools-output');
    const message = document.getElementById('line-tools-message');
    const prefix = document.getElementById('line-prefix');
    const suffix = document.getElementById('line-suffix');
    const joiner = document.getElementById('line-joiner');
    const customJoiner = document.getElementById('line-custom-joiner');
    const trimLines = document.getElementById('line-trim');
    const removeEmpty = document.getElementById('line-remove-empty');
    const wrapQuotes = document.getElementById('line-wrap-quotes');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function readLines() {
        if (!input.value) {
            throw new Error('请输入要处理的文本');
        }
        let lines = input.value.replace(/\r/g, '').split('\n');
        if (trimLines.checked) {
            lines = lines.map((line) => line.trim());
        }
        if (removeEmpty.checked) {
            lines = lines.filter((line) => line !== '');
        }
        return lines;
    }

    function getJoiner() {
        if (joiner.value === 'custom') {
            return customJoiner.value;
        }
        if (joiner.value === '\\n') {
            return '\n';
        }
        return joiner.value;
    }

    function process() {
        try {
            const lines = readLines().map((line) => {
                const value = wrapQuotes.checked ? `'${line.replace(/'/g, "\\'")}'` : line;
                return `${prefix.value}${value}${suffix.value}`;
            });
            output.value = lines.join(getJoiner());
            setMessage(`处理完成，共 ${lines.length} 行。`, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('line-tools-run-btn').addEventListener('click', process);
    document.getElementById('line-tools-sample-btn').addEventListener('click', () => {
        input.value = '1001\n1002\n1003';
        prefix.value = '';
        suffix.value = '';
        joiner.value = ', ';
        wrapQuotes.checked = true;
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('line-tools-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入文本。', '');
    });
    document.getElementById('line-tools-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('line-tools-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
