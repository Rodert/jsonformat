document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('morse-input');
    const output = document.getElementById('morse-output');
    const message = document.getElementById('morse-message');
    const separator = document.getElementById('morse-letter-separator');
    const keepUnknown = document.getElementById('morse-keep-unknown');

    const morseMap = {
        A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
        I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
        Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
        Y: '-.--', Z: '--..',
        0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....',
        6: '-....', 7: '--...', 8: '---..', 9: '----.',
        '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
        '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
        ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
        '"': '.-..-.', '$': '...-..-', '@': '.--.-.'
    };
    const textMap = Object.fromEntries(Object.entries(morseMap).map(([char, code]) => [code, char]));

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

    function encodeLine(line) {
        const letterSeparator = separator.value;
        const words = line.trim().split(/\s+/).filter(Boolean);

        return words.map((word) => {
            return Array.from(word).map((char) => {
                const code = morseMap[char.toUpperCase()];
                if (code) {
                    return code;
                }
                return keepUnknown.checked ? `[${char}]` : '';
            }).filter(Boolean).join(letterSeparator);
        }).filter(Boolean).join(' / ');
    }

    function encodeMorse(text) {
        return text.split(/\r?\n/).map(encodeLine).join('\n');
    }

    function decodeMorse(text) {
        return text.split(/\r?\n/).map((line) => {
            const normalized = line
                .replace(/[｜|]/g, ' ')
                .replace(/\s*\/\s*/g, ' / ')
                .replace(/\s+/g, ' ')
                .trim();

            if (!normalized) {
                return '';
            }

            return normalized.split(' ').map((token) => {
                if (token === '/') {
                    return ' ';
                }
                if (/^\[.+\]$/.test(token)) {
                    return token.slice(1, -1);
                }
                return textMap[token] || '?';
            }).join('').replace(/\s+/g, ' ').trim();
        }).join('\n');
    }

    function run(transform, success) {
        try {
            output.value = transform(requireInput());
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('morse-encode-btn').addEventListener('click', () => run(encodeMorse, '摩斯密码编码完成。'));
    document.getElementById('morse-decode-btn').addEventListener('click', () => run(decodeMorse, '摩斯密码解码完成。'));
    document.getElementById('morse-sample-btn').addEventListener('click', () => {
        input.value = 'JavaPub Tools 2026';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('morse-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入内容。', '');
    });
    document.getElementById('morse-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('morse-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
