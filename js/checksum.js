document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('checksum-input');
    const mode = document.getElementById('checksum-mode');
    const outputCase = document.getElementById('checksum-case');
    const message = document.getElementById('checksum-message');
    const crc32Result = document.getElementById('crc32-result');
    const crc16CcittResult = document.getElementById('crc16-ccitt-result');
    const crc16ModbusResult = document.getElementById('crc16-modbus-result');
    const sizeResult = document.getElementById('checksum-size-result');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function formatHex(value, width) {
        const hex = value.toString(16).padStart(width, '0');
        return outputCase.value === 'lower' ? hex : hex.toUpperCase();
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

    function getBytes() {
        if (!input.value) {
            throw new Error('请输入要计算的内容');
        }
        return mode.value === 'hex'
            ? parseHexBytes(input.value)
            : new TextEncoder().encode(input.value);
    }

    function crc32(bytes) {
        let crc = 0xffffffff;
        for (const byte of bytes) {
            crc ^= byte;
            for (let i = 0; i < 8; i += 1) {
                crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
            }
        }
        return (crc ^ 0xffffffff) >>> 0;
    }

    function crc16CcittFalse(bytes) {
        let crc = 0xffff;
        for (const byte of bytes) {
            crc ^= byte << 8;
            for (let i = 0; i < 8; i += 1) {
                crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) : (crc << 1);
                crc &= 0xffff;
            }
        }
        return crc;
    }

    function crc16Modbus(bytes) {
        let crc = 0xffff;
        for (const byte of bytes) {
            crc ^= byte;
            for (let i = 0; i < 8; i += 1) {
                crc = (crc >>> 1) ^ (crc & 1 ? 0xa001 : 0);
            }
        }
        return crc & 0xffff;
    }

    function calculate() {
        try {
            const bytes = getBytes();
            crc32Result.textContent = formatHex(crc32(bytes), 8);
            crc16CcittResult.textContent = formatHex(crc16CcittFalse(bytes), 4);
            crc16ModbusResult.textContent = formatHex(crc16Modbus(bytes), 4);
            sizeResult.textContent = String(bytes.length);
            setMessage('CRC 校验计算完成。', 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    function clearResults() {
        crc32Result.textContent = '-';
        crc16CcittResult.textContent = '-';
        crc16ModbusResult.textContent = '-';
        sizeResult.textContent = '0';
    }

    document.getElementById('checksum-run-btn').addEventListener('click', calculate);
    document.getElementById('checksum-sample-btn').addEventListener('click', () => {
        input.value = '123456789';
        mode.value = 'text';
        clearResults();
        setMessage('已载入 CRC 标准测试示例。', 'success');
    });
    document.getElementById('checksum-clear-btn').addEventListener('click', () => {
        input.value = '';
        clearResults();
        setMessage('等待输入内容。', '');
    });
    document.getElementById('checksum-copy-btn').addEventListener('click', () => {
        if (crc32Result.textContent === '-') {
            setMessage('没有可复制的结果。', 'error');
            return;
        }
        const text = [
            `CRC-32: ${crc32Result.textContent}`,
            `CRC-16/CCITT-FALSE: ${crc16CcittResult.textContent}`,
            `CRC-16/MODBUS: ${crc16ModbusResult.textContent}`,
            `Bytes: ${sizeResult.textContent}`
        ].join('\n');
        navigator.clipboard.writeText(text).then(() => setMessage('结果已复制。', 'success'));
    });
});
