document.addEventListener('DOMContentLoaded', function() {
    const cronInput = document.getElementById('cron-input');
    const parseBtn = document.getElementById('parse-cron-btn');
    const fieldsOutput = document.getElementById('cron-fields');
    const nextOutput = document.getElementById('cron-next');
    const message = document.getElementById('cron-message');

    const fieldDefs = [
        ['分钟', 0, 59],
        ['小时', 0, 23],
        ['日期', 1, 31],
        ['月份', 1, 12],
        ['星期', 0, 7]
    ];

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function parseField(expression, min, max, isWeekday) {
        const values = new Set();
        expression.split(',').forEach(part => {
            const [rangePart, stepPart] = part.split('/');
            const step = stepPart ? Number(stepPart) : 1;
            if (!Number.isInteger(step) || step <= 0) throw new Error(`步长无效：${part}`);

            let start;
            let end;
            if (rangePart === '*') {
                start = min;
                end = max;
            } else if (rangePart.includes('-')) {
                const [rawStart, rawEnd] = rangePart.split('-').map(Number);
                start = rawStart;
                end = rawEnd;
            } else {
                start = Number(rangePart);
                end = Number(rangePart);
            }

            if (!Number.isInteger(start) || !Number.isInteger(end) || start < min || end > max || start > end) {
                throw new Error(`字段范围无效：${part}`);
            }
            for (let value = start; value <= end; value += step) {
                values.add(isWeekday && value === 7 ? 0 : value);
            }
        });
        return [...values].sort((a, b) => a - b);
    }

    function parseCron() {
        const parts = cronInput.value.trim().split(/\s+/);
        if (parts.length !== 5) {
            throw new Error('请输入 5 段 Cron 表达式');
        }
        return parts.map((part, index) => parseField(part, fieldDefs[index][1], fieldDefs[index][2], index === 4));
    }

    function describeField(values, min, max) {
        if (values.length === max - min + 1 || (min === 0 && max === 7 && values.length === 7)) {
            return '每个有效值';
        }
        return values.join(', ');
    }

    function matches(date, parsed) {
        const minute = date.getMinutes();
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const weekday = date.getDay();
        return parsed[0].includes(minute)
            && parsed[1].includes(hour)
            && parsed[2].includes(day)
            && parsed[3].includes(month)
            && parsed[4].includes(weekday);
    }

    function nextRuns(parsed, count) {
        const runs = [];
        const cursor = new Date();
        cursor.setSeconds(0, 0);
        cursor.setMinutes(cursor.getMinutes() + 1);
        const maxChecks = 60 * 24 * 366 * 2;
        for (let checked = 0; checked < maxChecks && runs.length < count; checked++) {
            if (matches(cursor, parsed)) {
                runs.push(new Date(cursor));
            }
            cursor.setMinutes(cursor.getMinutes() + 1);
        }
        return runs;
    }

    function renderRows(container, rows) {
        container.innerHTML = rows.map(row => `<div class="result-row"><span>${row.label}</span><strong>${row.value}</strong></div>`).join('');
    }

    function run() {
        try {
            const parsed = parseCron();
            renderRows(fieldsOutput, parsed.map((values, index) => ({
                label: fieldDefs[index][0],
                value: describeField(values, fieldDefs[index][1], fieldDefs[index][2])
            })));
            const runs = nextRuns(parsed, 8);
            renderRows(nextOutput, runs.map((date, index) => ({
                label: `#${index + 1}`,
                value: date.toLocaleString('zh-CN', { hour12: false })
            })));
            setMessage(`解析成功，预览 ${runs.length} 次执行时间。`, 'success');
        } catch (error) {
            fieldsOutput.innerHTML = '';
            nextOutput.innerHTML = '';
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    parseBtn.addEventListener('click', run);
    cronInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') run();
    });
    document.querySelectorAll('[data-cron-sample]').forEach(button => {
        button.addEventListener('click', () => {
            cronInput.value = button.dataset.cronSample;
            run();
        });
    });
    run();
});
