document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('unicode-input');
    const output = document.getElementById('unicode-output');
    const message = document.getElementById('unicode-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function requireInput() {
        if (!input.value) {
            throw new Error('请输入要转换的文本');
        }
        return input.value;
    }

    function toUnicodeEscape(text) {
        return Array.from(text).map(char => {
            const code = char.codePointAt(0);
            if (code <= 0xffff) {
                return `\\u${code.toString(16).padStart(4, '0')}`;
            }
            const high = Math.floor((code - 0x10000) / 0x400) + 0xd800;
            const low = ((code - 0x10000) % 0x400) + 0xdc00;
            return `\\u${high.toString(16)}\\u${low.toString(16)}`;
        }).join('');
    }

    function fromUnicodeEscape(text) {
        return text
            .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
            .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
            .replace(/U\+([0-9a-fA-F]{1,6})/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
            .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
            .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number(num)));
    }

    function run(transform, success) {
        try {
            output.value = transform(requireInput());
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('unicode-escape-btn').addEventListener('click', () => {
        run(toUnicodeEscape, '已转换为 Unicode 转义。');
    });
    document.getElementById('unicode-unescape-btn').addEventListener('click', () => {
        run(fromUnicodeEscape, '已转换为普通文本。');
    });
    document.getElementById('codepoint-btn').addEventListener('click', () => {
        run(text => Array.from(text).map(char => `U+${char.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`).join(' '), '已转换为 Unicode 码点。');
    });
    document.getElementById('html-number-btn').addEventListener('click', () => {
        run(text => Array.from(text).map(char => `&#${char.codePointAt(0)};`).join(''), '已转换为 HTML 数字实体。');
    });
    document.getElementById('sample-unicode-btn').addEventListener('click', () => {
        input.value = 'JavaPub 开发者工具箱 🚀';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('clear-unicode-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入文本。', '');
    });
    document.getElementById('copy-unicode-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('swap-unicode-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
