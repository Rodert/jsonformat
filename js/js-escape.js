document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('js-escape-input');
    const output = document.getElementById('js-escape-output');
    const message = document.getElementById('js-escape-message');
    const quoteMode = document.getElementById('js-quote-mode');
    const useUnicode = document.getElementById('js-use-unicode');

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

    function unicodeEscape(char) {
        const point = char.codePointAt(0);
        if (point <= 0xffff) {
            return `\\u${point.toString(16).padStart(4, '0')}`;
        }
        const value = point - 0x10000;
        const high = 0xd800 + (value >> 10);
        const low = 0xdc00 + (value & 0x3ff);
        return `\\u${high.toString(16)}\\u${low.toString(16)}`;
    }

    function escapeJs() {
        const quote = quoteMode.value === 'single' ? "'" : '"';
        return Array.from(requireInput()).map((char) => {
            if (char === '\\') return '\\\\';
            if (char === '\n') return '\\n';
            if (char === '\r') return '\\r';
            if (char === '\t') return '\\t';
            if (char === '\b') return '\\b';
            if (char === '\f') return '\\f';
            if (char === '\v') return '\\v';
            if (char === quote) return `\\${quote}`;
            if (useUnicode.checked && char.codePointAt(0) > 0x7f) return unicodeEscape(char);
            return char;
        }).join('');
    }

    function unescapeJs() {
        return requireInput().replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g, (match, escape) => {
            if (escape === 'n') return '\n';
            if (escape === 'r') return '\r';
            if (escape === 't') return '\t';
            if (escape === 'b') return '\b';
            if (escape === 'f') return '\f';
            if (escape === 'v') return '\v';
            if (escape === '0') return '\0';
            if (escape === '\\') return '\\';
            if (escape === '"') return '"';
            if (escape === "'") return "'";
            if (escape.startsWith('x')) return String.fromCharCode(parseInt(escape.slice(1), 16));
            if (escape.startsWith('u{')) return String.fromCodePoint(parseInt(escape.slice(2, -1), 16));
            if (escape.startsWith('u')) return String.fromCharCode(parseInt(escape.slice(1), 16));
            return escape;
        });
    }

    function run(transform, success) {
        try {
            output.value = transform();
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('js-escape-btn').addEventListener('click', () => run(escapeJs, 'JavaScript 字符串转义完成。'));
    document.getElementById('js-unescape-btn').addEventListener('click', () => run(unescapeJs, 'JavaScript 字符串反转义完成。'));
    document.getElementById('js-escape-sample-btn').addEventListener('click', () => {
        input.value = 'JavaPub "Tools"\n中文';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('js-escape-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入内容。', '');
    });
    document.getElementById('js-escape-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('js-escape-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
