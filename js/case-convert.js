document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('case-input');
    const output = document.getElementById('case-output');
    const message = document.getElementById('case-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function words(text) {
        return text
            .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
            .replace(/[^A-Za-z0-9\u4e00-\u9fa5]+/g, ' ')
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(word => word.toLowerCase());
    }

    function cap(word) {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    function convert(mode) {
        const text = input.value;
        if (!text) {
            setMessage('请输入要转换的文本。', 'error');
            return;
        }

        const parts = words(text);
        const resultMap = {
            upper: () => text.toUpperCase(),
            lower: () => text.toLowerCase(),
            title: () => parts.map(cap).join(' '),
            camel: () => parts.map((word, index) => index === 0 ? word : cap(word)).join(''),
            pascal: () => parts.map(cap).join(''),
            snake: () => parts.join('_'),
            kebab: () => parts.join('-'),
            constant: () => parts.join('_').toUpperCase()
        };

        output.value = resultMap[mode]();
        setMessage('转换完成。', 'success');
    }

    document.querySelectorAll('[data-case-mode]').forEach(button => {
        button.addEventListener('click', () => convert(button.dataset.caseMode));
    });
    document.getElementById('sample-case-btn').addEventListener('click', () => {
        input.value = 'user profile URL value';
        convert('camel');
    });
    document.getElementById('clear-case-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入文本。', '');
    });
    document.getElementById('copy-case-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的结果。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('swap-case-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
