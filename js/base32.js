document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('base32-input');
    const output = document.getElementById('base32-output');
    const message = document.getElementById('base32-message');
    const keepPadding = document.getElementById('base32-padding');
    const useLowercase = document.getElementById('base32-lowercase');
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

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

    function encodeBase32(text) {
        const bytes = new TextEncoder().encode(text);
        let bits = 0;
        let value = 0;
        let result = '';

        for (const byte of bytes) {
            value = (value << 8) | byte;
            bits += 8;
            while (bits >= 5) {
                result += alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }

        if (bits > 0) {
            result += alphabet[(value << (5 - bits)) & 31];
        }

        if (keepPadding.checked) {
            while (result.length % 8 !== 0) {
                result += '=';
            }
        }

        return useLowercase.checked ? result.toLowerCase() : result;
    }

    function decodeBase32(base32) {
        const clean = base32.replace(/\s+/g, '').replace(/=+$/g, '').toUpperCase();
        let bits = 0;
        let value = 0;
        const bytes = [];

        for (const char of clean) {
            const index = alphabet.indexOf(char);
            if (index === -1) {
                throw new Error(`包含无效 Base32 字符 "${char}"`);
            }
            value = (value << 5) | index;
            bits += 5;
            if (bits >= 8) {
                bytes.push((value >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }

        return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
    }

    function run(transform, success) {
        try {
            output.value = transform(requireInput());
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('base32-encode-btn').addEventListener('click', () => run(encodeBase32, 'Base32 编码完成。'));
    document.getElementById('base32-decode-btn').addEventListener('click', () => run(decodeBase32, 'Base32 解码完成。'));
    document.getElementById('base32-sample-btn').addEventListener('click', () => {
        input.value = 'JavaPub Tools';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('base32-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入内容。', '');
    });
    document.getElementById('base32-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('base32-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
