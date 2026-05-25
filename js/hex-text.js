document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('hex-input');
    const output = document.getElementById('hex-output');
    const message = document.getElementById('hex-message');
    const separator = document.getElementById('hex-separator');
    const uppercase = document.getElementById('hex-uppercase');

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

    function textToHex() {
        const bytes = new TextEncoder().encode(requireInput());
        let parts = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'));
        if (uppercase.checked) {
            parts = parts.map((part) => part.toUpperCase());
        }
        return parts.join(separator.value);
    }

    function parseHexBytes(text) {
        const clean = text
            .replace(/0x/gi, '')
            .replace(/[\s,;:_-]+/g, '');

        if (!clean) {
            throw new Error('请输入十六进制内容');
        }
        if (!/^[0-9a-fA-F]+$/.test(clean)) {
            throw new Error('十六进制输入只能包含 0-9 和 A-F');
        }
        if (clean.length % 2 !== 0) {
            throw new Error('十六进制字节长度必须是偶数');
        }

        const bytes = [];
        for (let i = 0; i < clean.length; i += 2) {
            bytes.push(parseInt(clean.slice(i, i + 2), 16));
        }
        return new Uint8Array(bytes);
    }

    function hexToText() {
        return new TextDecoder('utf-8', { fatal: true }).decode(parseHexBytes(requireInput()));
    }

    function run(transform, success) {
        try {
            output.value = transform();
            setMessage(success, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('text-to-hex-btn').addEventListener('click', () => run(textToHex, '文本转 Hex 完成。'));
    document.getElementById('hex-to-text-btn').addEventListener('click', () => run(hexToText, 'Hex 转文本完成。'));
    document.getElementById('hex-sample-btn').addEventListener('click', () => {
        input.value = 'JavaPub Tools';
        output.value = '';
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('hex-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        setMessage('等待输入内容。', '');
    });
    document.getElementById('hex-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
    document.getElementById('hex-swap-btn').addEventListener('click', () => {
        if (output.value) {
            input.value = output.value;
            output.value = '';
            setMessage('结果已放回输入框。', 'success');
        }
    });
});
