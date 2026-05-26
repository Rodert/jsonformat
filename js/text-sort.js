document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('text-sort-input');
    const output = document.getElementById('text-sort-output');
    const message = document.getElementById('text-sort-message');
    const trimLines = document.getElementById('text-sort-trim');
    const removeEmpty = document.getElementById('text-sort-remove-empty');

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

    function shuffle(lines) {
        const result = [...lines];
        for (let i = result.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function processLines(mode) {
        const lines = readLines();
        if (mode === 'asc') {
            return [...lines].sort((a, b) => a.localeCompare(b, 'zh-Hans-CN', { numeric: true }));
        }
        if (mode === 'desc') {
            return [...lines].sort((a, b) => b.localeCompare(a, 'zh-Hans-CN', { numeric: true }));
        }
        if (mode === 'numeric') {
            return [...lines].sort((a, b) => Number(a) - Number(b));
        }
        if (mode === 'shuffle') {
            return shuffle(lines);
        }
        if (mode === 'reverse') {
            return [...lines].reverse();
        }
        if (mode === 'number') {
            const width = String(lines.length).length;
            return lines.map((line, index) => `${String(index + 1).padStart(width, '0')}. ${line}`);
        }
        return lines;
    }

    function run(mode) {
        try {
            const lines = processLines(mode);
            output.value = lines.join('\n');
            setMessage(`处理完成，共 ${lines.length} 行。`, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.querySelectorAll('[data-sort-mode]').forEach((button) => {
        button.addEventListener('click', () => run(button.dataset.sortMode));
    });
    document.getElementById('text-sort-sample-btn').addEventListener('click', () => {
        input.value = 'banana\napple\n10\n2\nJavaPub\n工具箱';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('text-sort-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入文本。', '');
    });
    document.getElementById('text-sort-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('text-sort-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
