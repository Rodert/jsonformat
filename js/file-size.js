document.addEventListener('DOMContentLoaded', function() {
    const valueInput = document.getElementById('file-size-value');
    const unitInput = document.getElementById('file-size-unit');
    const decimalsInput = document.getElementById('file-size-decimals');
    const message = document.getElementById('file-size-message');
    const fields = {
        bytes: document.getElementById('size-b-result'),
        decimal: document.getElementById('size-decimal-result'),
        binary: document.getElementById('size-binary-result'),
        bits: document.getElementById('size-bit-result')
    };
    const multipliers = {
        B: 1,
        KB: 1000,
        MB: 1000 ** 2,
        GB: 1000 ** 3,
        TB: 1000 ** 4,
        KiB: 1024,
        MiB: 1024 ** 2,
        GiB: 1024 ** 3,
        TiB: 1024 ** 4
    };

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function readOptions() {
        const value = Number(valueInput.value);
        const decimals = Number(decimalsInput.value);
        if (!Number.isFinite(value) || value < 0) {
            throw new Error('文件大小必须是大于等于 0 的数字');
        }
        if (!Number.isInteger(decimals) || decimals < 0 || decimals > 12) {
            throw new Error('小数位必须是 0-12 之间的整数');
        }
        return { value, decimals };
    }

    function format(value, decimals) {
        return Number(value.toFixed(decimals)).toLocaleString('en-US');
    }

    function reset() {
        Object.values(fields).forEach((field) => {
            field.textContent = '-';
        });
    }

    function convert() {
        try {
            const { value, decimals } = readOptions();
            const bytes = value * multipliers[unitInput.value];
            fields.bytes.textContent = `${format(bytes, decimals)} B`;
            fields.decimal.textContent = [
                `${format(bytes / 1000, decimals)} KB`,
                `${format(bytes / (1000 ** 2), decimals)} MB`,
                `${format(bytes / (1000 ** 3), decimals)} GB`
            ].join(' / ');
            fields.binary.textContent = [
                `${format(bytes / 1024, decimals)} KiB`,
                `${format(bytes / (1024 ** 2), decimals)} MiB`,
                `${format(bytes / (1024 ** 3), decimals)} GiB`
            ].join(' / ');
            fields.bits.textContent = `${format(bytes * 8, decimals)} bit`;
            setMessage('文件大小换算完成。', 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    document.getElementById('file-size-convert-btn').addEventListener('click', convert);
    document.getElementById('file-size-clear-btn').addEventListener('click', () => {
        valueInput.value = '';
        reset();
        setMessage('等待输入文件大小。', '');
    });
    document.getElementById('file-size-copy-btn').addEventListener('click', () => {
        if (fields.bytes.textContent === '-') {
            setMessage('没有可复制的结果。', 'error');
            return;
        }
        const text = [
            `Bytes: ${fields.bytes.textContent}`,
            `Decimal: ${fields.decimal.textContent}`,
            `Binary: ${fields.binary.textContent}`,
            `Bits: ${fields.bits.textContent}`
        ].join('\n');
        navigator.clipboard.writeText(text).then(() => setMessage('结果已复制。', 'success'));
    });
});
