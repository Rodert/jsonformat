document.addEventListener('DOMContentLoaded', function() {
    const currentSeconds = document.getElementById('current-seconds');
    const currentMillis = document.getElementById('current-millis');
    const pauseClockBtn = document.getElementById('pause-clock-btn');
    const copyCurrentBtn = document.getElementById('copy-current-btn');
    const timestampInput = document.getElementById('timestamp-input');
    const convertTimestampBtn = document.getElementById('convert-timestamp-btn');
    const useNowBtn = document.getElementById('use-now-btn');
    const clearTimestampBtn = document.getElementById('clear-timestamp-btn');
    const timestampResult = document.getElementById('timestamp-result');
    const datetimeInput = document.getElementById('datetime-input');
    const convertDateBtn = document.getElementById('convert-date-btn');
    const dateNowBtn = document.getElementById('date-now-btn');
    const dateResult = document.getElementById('date-result');
    const message = document.getElementById('timestamp-message');

    let clockRunning = true;
    let timer = null;

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function pad(value) {
        return String(value).padStart(2, '0');
    }

    function toLocalInputValue(date) {
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    }

    function formatLocal(date) {
        return date.toLocaleString('zh-CN', { hour12: false });
    }

    function renderResult(container, rows) {
        container.innerHTML = rows.map(row => {
            return `<div class="result-row"><span>${row.label}</span><strong>${escapeHtml(row.value)}</strong></div>`;
        }).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function tick() {
        const now = Date.now();
        currentSeconds.textContent = Math.floor(now / 1000);
        currentMillis.textContent = now;
    }

    function startClock() {
        tick();
        timer = window.setInterval(tick, 1000);
    }

    function normalizeTimestamp(raw) {
        const text = raw.trim();
        if (!/^-?\d+(\.\d+)?$/.test(text)) {
            throw new Error('请输入有效的数字时间戳');
        }

        const numeric = Number(text);
        if (!Number.isFinite(numeric)) {
            throw new Error('时间戳超出有效范围');
        }

        const absLength = text.replace(/^-/, '').split('.')[0].length;
        return absLength <= 10 ? numeric * 1000 : numeric;
    }

    function convertTimestamp() {
        try {
            const millis = normalizeTimestamp(timestampInput.value);
            const date = new Date(millis);
            if (Number.isNaN(date.getTime())) {
                throw new Error('无法解析该时间戳');
            }

            renderResult(timestampResult, [
                { label: '本地时间', value: formatLocal(date) },
                { label: 'UTC 时间', value: date.toUTCString() },
                { label: 'ISO 时间', value: date.toISOString() },
                { label: '秒级时间戳', value: Math.floor(date.getTime() / 1000) },
                { label: '毫秒时间戳', value: date.getTime() }
            ]);
            setMessage('时间戳转换成功。', 'success');
        } catch (error) {
            timestampResult.innerHTML = '';
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    function convertDate() {
        try {
            if (!datetimeInput.value) {
                throw new Error('请选择日期时间');
            }
            const date = new Date(datetimeInput.value);
            if (Number.isNaN(date.getTime())) {
                throw new Error('无法解析该日期时间');
            }

            renderResult(dateResult, [
                { label: '秒级时间戳', value: Math.floor(date.getTime() / 1000) },
                { label: '毫秒时间戳', value: date.getTime() },
                { label: '本地时间', value: formatLocal(date) },
                { label: 'ISO 时间', value: date.toISOString() }
            ]);
            setMessage('日期转换成功。', 'success');
        } catch (error) {
            dateResult.innerHTML = '';
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    function copyText(text) {
        navigator.clipboard.writeText(text).then(() => {
            setMessage('已复制到剪贴板。', 'success');
        }).catch(error => {
            setMessage(`复制失败：${error.message}`, 'error');
        });
    }

    pauseClockBtn.addEventListener('click', function() {
        clockRunning = !clockRunning;
        if (clockRunning) {
            startClock();
            pauseClockBtn.textContent = '暂停';
        } else {
            window.clearInterval(timer);
            pauseClockBtn.textContent = '继续';
        }
    });

    copyCurrentBtn.addEventListener('click', () => copyText(currentSeconds.textContent));
    convertTimestampBtn.addEventListener('click', convertTimestamp);
    timestampInput.addEventListener('keydown', event => {
        if (event.key === 'Enter') {
            convertTimestamp();
        }
    });
    useNowBtn.addEventListener('click', function() {
        timestampInput.value = Date.now();
        convertTimestamp();
    });
    clearTimestampBtn.addEventListener('click', function() {
        timestampInput.value = '';
        timestampResult.innerHTML = '';
        setMessage('等待输入时间戳或日期。', '');
    });
    convertDateBtn.addEventListener('click', convertDate);
    dateNowBtn.addEventListener('click', function() {
        datetimeInput.value = toLocalInputValue(new Date());
        convertDate();
    });

    datetimeInput.value = toLocalInputValue(new Date());
    startClock();
});
