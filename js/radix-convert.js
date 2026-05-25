document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('radix-input');
    const fromInput = document.getElementById('radix-from');
    const targetInput = document.getElementById('radix-target');
    const message = document.getElementById('radix-message');
    const fields = {
        bin: document.getElementById('radix-bin-result'),
        oct: document.getElementById('radix-oct-result'),
        dec: document.getElementById('radix-dec-result'),
        hex: document.getElementById('radix-hex-result'),
        custom: document.getElementById('radix-custom-result')
    };
    const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function readRadix(element, name) {
        const value = Number(element.value);
        if (!Number.isInteger(value) || value < 2 || value > 36) {
            throw new Error(`${name}必须是 2-36 之间的整数`);
        }
        return value;
    }

    function normalizeInput(value, radix) {
        let text = value.trim().replace(/_/g, '').toUpperCase();
        if (!text) {
            throw new Error('请输入要转换的数字');
        }
        const negative = text.startsWith('-');
        if (negative) {
            text = text.slice(1);
        }
        if (radix === 2 && text.startsWith('0B')) text = text.slice(2);
        if (radix === 8 && text.startsWith('0O')) text = text.slice(2);
        if (radix === 16 && text.startsWith('0X')) text = text.slice(2);
        return { text, negative };
    }

    function parseBigInt(value, radix) {
        const { text, negative } = normalizeInput(value, radix);
        let result = 0n;
        const bigRadix = BigInt(radix);

        for (const char of text) {
            const digit = digits.indexOf(char);
            if (digit < 0 || digit >= radix) {
                throw new Error(`字符 "${char}" 不属于 ${radix} 进制`);
            }
            result = result * bigRadix + BigInt(digit);
        }

        return negative ? -result : result;
    }

    function formatBigInt(value, radix) {
        if (value === 0n) {
            return '0';
        }
        const negative = value < 0n;
        let current = negative ? -value : value;
        const bigRadix = BigInt(radix);
        let result = '';

        while (current > 0n) {
            result = digits[Number(current % bigRadix)] + result;
            current /= bigRadix;
        }

        return negative ? `-${result}` : result;
    }

    function resetResults() {
        Object.values(fields).forEach((field) => {
            field.textContent = '-';
        });
    }

    function convert() {
        try {
            const from = readRadix(fromInput, '输入进制');
            const target = readRadix(targetInput, '目标进制');
            const value = parseBigInt(input.value, from);
            fields.bin.textContent = formatBigInt(value, 2);
            fields.oct.textContent = formatBigInt(value, 8);
            fields.dec.textContent = formatBigInt(value, 10);
            fields.hex.textContent = formatBigInt(value, 16);
            fields.custom.textContent = `${formatBigInt(value, target)} (${target}进制)`;
            setMessage('进制转换完成。', 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('radix-convert-btn').addEventListener('click', convert);
    document.getElementById('radix-sample-btn').addEventListener('click', () => {
        input.value = 'FF';
        fromInput.value = '16';
        targetInput.value = '36';
        resetResults();
        setMessage('已载入示例。', 'success');
    });
    document.getElementById('radix-clear-btn').addEventListener('click', () => {
        input.value = '';
        resetResults();
        setMessage('等待输入数字。', '');
    });
    document.getElementById('radix-copy-btn').addEventListener('click', () => {
        if (fields.dec.textContent === '-') {
            setMessage('没有可复制的结果。', 'error');
            return;
        }
        const text = [
            `BIN: ${fields.bin.textContent}`,
            `OCT: ${fields.oct.textContent}`,
            `DEC: ${fields.dec.textContent}`,
            `HEX: ${fields.hex.textContent}`,
            `TARGET: ${fields.custom.textContent}`
        ].join('\n');
        navigator.clipboard.writeText(text).then(() => setMessage('结果已复制。', 'success'));
    });
});
