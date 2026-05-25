document.addEventListener('DOMContentLoaded', function() {
    const minInput = document.getElementById('random-min');
    const maxInput = document.getElementById('random-max');
    const countInput = document.getElementById('random-count');
    const decimalsInput = document.getElementById('random-decimals');
    const formatInput = document.getElementById('random-format');
    const sortInput = document.getElementById('random-sort');
    const uniqueInput = document.getElementById('random-unique');
    const output = document.getElementById('random-output');
    const message = document.getElementById('random-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function secureRandomInt(max) {
        const limit = Math.floor(0x100000000 / max) * max;
        const buffer = new Uint32Array(1);
        let value;
        do {
            crypto.getRandomValues(buffer);
            value = buffer[0];
        } while (value >= limit);
        return value % max;
    }

    function secureRandom() {
        return secureRandomInt(0x1000000) / 0x1000000;
    }

    function readOptions() {
        const min = Number(minInput.value);
        const max = Number(maxInput.value);
        const count = Number(countInput.value);
        const decimals = Number(decimalsInput.value);

        if (!Number.isFinite(min) || !Number.isFinite(max)) {
            throw new Error('最小值和最大值必须是有效数字');
        }
        if (min > max) {
            throw new Error('最小值不能大于最大值');
        }
        if (!Number.isInteger(count) || count < 1 || count > 10000) {
            throw new Error('数量必须是 1-10000 之间的整数');
        }
        if (!Number.isInteger(decimals) || decimals < 0 || decimals > 12) {
            throw new Error('小数位必须是 0-12 之间的整数');
        }

        return { min, max, count, decimals };
    }

    function generateInteger(min, max) {
        const range = max - min + 1;
        if (!Number.isSafeInteger(range) || range <= 0 || range > 0xffffffff) {
            throw new Error('整数范围过大，请缩小范围或使用小数模式');
        }
        return min + secureRandomInt(range);
    }

    function generateValues(options) {
        const { min, max, count, decimals } = options;
        const values = [];

        if (uniqueInput.checked && decimals === 0) {
            const integerMin = Math.ceil(min);
            const integerMax = Math.floor(max);
            const range = integerMax - integerMin + 1;
            if (range < count) {
                throw new Error('当前整数范围不足以生成指定数量的不重复随机数');
            }
            const picked = new Set();
            while (values.length < count) {
                const value = generateInteger(integerMin, integerMax);
                if (!picked.has(value)) {
                    picked.add(value);
                    values.push(value);
                }
            }
        } else {
            for (let i = 0; i < count; i += 1) {
                const raw = decimals === 0
                    ? generateInteger(Math.ceil(min), Math.floor(max))
                    : min + secureRandom() * (max - min);
                values.push(decimals === 0 ? raw : Number(raw.toFixed(decimals)));
            }
        }

        if (sortInput.value === 'asc') {
            values.sort((a, b) => a - b);
        } else if (sortInput.value === 'desc') {
            values.sort((a, b) => b - a);
        }

        return values;
    }

    function formatValues(values) {
        if (formatInput.value === 'json') {
            return JSON.stringify(values, null, 2);
        }
        if (formatInput.value === 'csv') {
            return values.join(', ');
        }
        return values.join('\n');
    }

    function generate() {
        try {
            if (!globalThis.crypto || !globalThis.crypto.getRandomValues) {
                throw new Error('当前环境不支持 Crypto API');
            }
            const values = generateValues(readOptions());
            output.value = formatValues(values);
            setMessage(`已生成 ${values.length} 个随机数。`, 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('random-generate-btn').addEventListener('click', generate);
    document.getElementById('random-clear-btn').addEventListener('click', () => {
        output.value = '';
        setMessage('等待生成随机数。', '');
    });
    document.getElementById('random-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('结果已复制。', 'success'));
    });
});
