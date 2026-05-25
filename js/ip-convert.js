document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('ip-convert-input');
    const message = document.getElementById('ip-convert-message');
    const fields = {
        ip: document.getElementById('ip-result'),
        uint: document.getElementById('ip-uint-result'),
        hex: document.getElementById('ip-hex-result'),
        binary: document.getElementById('ip-binary-result')
    };

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function resetResults() {
        Object.values(fields).forEach((field) => {
            field.textContent = '-';
        });
    }

    function parseIpv4(value) {
        const parts = value.trim().split('.');
        if (parts.length !== 4) {
            throw new Error('请输入有效的 IPv4 地址');
        }

        return parts.map((part) => {
            if (!/^(0|[1-9]\d{0,2})$/.test(part)) {
                throw new Error('IPv4 每段必须是 0-255 的整数');
            }
            const number = Number(part);
            if (number > 255) {
                throw new Error('IPv4 每段必须是 0-255 的整数');
            }
            return number;
        });
    }

    function ipToUint(parts) {
        return (((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3]) >>> 0;
    }

    function uintToIp(value) {
        return [
            (value >>> 24) & 255,
            (value >>> 16) & 255,
            (value >>> 8) & 255,
            value & 255
        ].join('.');
    }

    function parseUint(value) {
        const trimmed = value.trim();
        const number = /^0x[0-9a-f]+$/i.test(trimmed)
            ? Number.parseInt(trimmed, 16)
            : Number(trimmed);

        if (!Number.isInteger(number) || number < 0 || number > 0xffffffff) {
            throw new Error('整数必须在 0 到 4294967295 之间');
        }
        return number >>> 0;
    }

    function render(ip, uint) {
        fields.ip.textContent = ip;
        fields.uint.textContent = String(uint);
        fields.hex.textContent = `0x${uint.toString(16).padStart(8, '0').toUpperCase()}`;
        fields.binary.textContent = uint.toString(2).padStart(32, '0');
    }

    function convertIpToInt() {
        try {
            if (!input.value.trim()) {
                throw new Error('请输入 IPv4 地址');
            }
            const parts = parseIpv4(input.value);
            const uint = ipToUint(parts);
            render(parts.join('.'), uint);
            setMessage('IPv4 转整数完成。', 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    function convertIntToIp() {
        try {
            if (!input.value.trim()) {
                throw new Error('请输入整数');
            }
            const uint = parseUint(input.value);
            render(uintToIp(uint), uint);
            setMessage('整数转 IPv4 完成。', 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('ip-to-int-btn').addEventListener('click', convertIpToInt);
    document.getElementById('int-to-ip-btn').addEventListener('click', convertIntToIp);
    document.getElementById('ip-sample-btn').addEventListener('click', () => {
        input.value = '192.168.1.1';
        resetResults();
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('ip-clear-btn').addEventListener('click', () => {
        input.value = '';
        resetResults();
        setMessage('等待输入内容。', '');
    });
    document.getElementById('ip-copy-btn').addEventListener('click', () => {
        if (fields.ip.textContent === '-') {
            setMessage('没有可复制的结果。', 'error');
            return;
        }
        const text = [
            `IPv4: ${fields.ip.textContent}`,
            `Unsigned Int: ${fields.uint.textContent}`,
            `Hex: ${fields.hex.textContent}`,
            `Binary: ${fields.binary.textContent}`
        ].join('\n');
        navigator.clipboard.writeText(text).then(() => setMessage('结果已复制。', 'success'));
    });
});
