document.addEventListener('DOMContentLoaded', function() {
    const message = document.getElementById('price-message');
    const result = document.getElementById('price-result');
    const priceModels = [
        { name: '自定义单价', input: 0, output: 0 },
        { name: 'OpenAI gpt-4.1-mini 示例', input: 0.4, output: 1.6 },
        { name: 'OpenAI gpt-4.1 示例', input: 2, output: 8 },
        { name: 'Claude Sonnet 4 示例', input: 3, output: 15 },
        { name: 'Claude Opus 4.1 示例', input: 15, output: 75 },
        { name: 'Claude 3.5 Haiku 示例', input: 0.8, output: 4 }
    ];

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function getNumber(id, fallback) {
        const value = Number(document.getElementById(id).value);
        return Number.isFinite(value) ? value : fallback;
    }

    function setValue(id, value) {
        document.getElementById(id).value = value;
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderRows(rows) {
        result.innerHTML = rows.map(([label, value]) => {
            return `<div class="result-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
        }).join('');
    }

    function calculate() {
        const inputRate = getNumber('price-input-rate', 0);
        const outputRate = getNumber('price-output-rate', 0);
        const inputTokens = getNumber('price-input-tokens', 0);
        const outputTokens = getNumber('price-output-tokens', 0);
        const exchangeRate = getNumber('price-exchange-rate', 7.2);
        const inputCost = inputTokens / 1000000 * inputRate;
        const outputCost = outputTokens / 1000000 * outputRate;
        const usdCost = inputCost + outputCost;
        const cnyCost = usdCost * exchangeRate;

        renderRows([
            ['输入费用', `$${inputCost.toFixed(6)}`],
            ['输出费用', `$${outputCost.toFixed(6)}`],
            ['总费用 USD', `$${usdCost.toFixed(6)}`],
            ['约合 RMB', `¥${cnyCost.toFixed(4)}`],
            ['千次调用 RMB', `¥${(cnyCost * 1000).toFixed(2)}`]
        ]);
        setMessage('费用已计算。单价示例可能滞后，请以官方账单为准。', 'success');
    }

    function initModels() {
        const select = document.getElementById('price-model');
        select.innerHTML = priceModels.map((model, index) => `<option value="${index}">${escapeHtml(model.name)}</option>`).join('');
        select.addEventListener('change', () => {
            const model = priceModels[Number(select.value)] || priceModels[0];
            setValue('price-input-rate', model.input);
            setValue('price-output-rate', model.output);
            calculate();
        });
        setValue('price-input-rate', priceModels[0].input);
        setValue('price-output-rate', priceModels[0].output);
    }

    document.getElementById('price-calc-btn').addEventListener('click', calculate);
    initModels();
    calculate();
});
