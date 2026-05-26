document.addEventListener('DOMContentLoaded', function() {
    const startColor = document.getElementById('gradient-start-color');
    const endColor = document.getElementById('gradient-end-color');
    const angleInput = document.getElementById('gradient-angle');
    const startPos = document.getElementById('gradient-start-pos');
    const endPos = document.getElementById('gradient-end-pos');
    const preview = document.getElementById('gradient-preview');
    const output = document.getElementById('gradient-output');
    const message = document.getElementById('gradient-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function readPercent(element, name) {
        const value = Number(element.value);
        if (!Number.isFinite(value) || value < 0 || value > 100) {
            throw new Error(`${name}必须是 0-100 之间的数字`);
        }
        return value;
    }

    function generate() {
        try {
            const angle = Number(angleInput.value);
            if (!Number.isFinite(angle)) {
                throw new Error('角度必须是有效数字');
            }
            const from = readPercent(startPos, '起始位置');
            const to = readPercent(endPos, '结束位置');
            const gradient = `linear-gradient(${angle}deg, ${startColor.value} ${from}%, ${endColor.value} ${to}%)`;
            preview.style.background = gradient;
            output.value = `background: ${gradient};`;
            setMessage('CSS 渐变已生成。', 'success');
        } catch (error) {
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    [startColor, endColor, angleInput, startPos, endPos].forEach((element) => {
        element.addEventListener('input', generate);
    });
    document.getElementById('gradient-generate-btn').addEventListener('click', generate);
    document.getElementById('gradient-sample-btn').addEventListener('click', () => {
        startColor.value = '#1677ff';
        endColor.value = '#12b76a';
        angleInput.value = '135';
        startPos.value = '0';
        endPos.value = '100';
        generate();
    });
    document.getElementById('gradient-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的 CSS。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('CSS 已复制。', 'success'));
    });
    generate();
});
