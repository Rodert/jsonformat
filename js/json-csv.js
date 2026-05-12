document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('json-csv-input');
    const output = document.getElementById('json-csv-output');
    const message = document.getElementById('json-csv-message');
    const stats = document.getElementById('json-csv-stats');
    const flattenInput = document.getElementById('csv-flatten');
    const bomInput = document.getElementById('csv-bom');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function flattenObject(obj, prefix = '', result = {}) {
        Object.entries(obj || {}).forEach(([key, value]) => {
            const path = prefix ? `${prefix}.${key}` : key;
            if (flattenInput.checked && value && typeof value === 'object' && !Array.isArray(value)) {
                flattenObject(value, path, result);
            } else {
                result[path] = Array.isArray(value) || (value && typeof value === 'object') ? JSON.stringify(value) : value;
            }
        });
        return result;
    }

    function escapeCsv(value) {
        const text = value === null || value === undefined ? '' : String(value);
        if (/[",\n\r]/.test(text)) {
            return `"${text.replace(/"/g, '""')}"`;
        }
        return text;
    }

    function renderStats(rows) {
        stats.innerHTML = rows.map(row => `<div class="result-row"><span>${row.label}</span><strong>${row.value}</strong></div>`).join('');
    }

    function convert() {
        try {
            const raw = input.value.trim();
            if (!raw) throw new Error('请输入 JSON 数据');
            const parsed = JSON.parse(raw);
            const rows = Array.isArray(parsed) ? parsed : [parsed];
            if (rows.length === 0) throw new Error('JSON 数组不能为空');
            if (!rows.every(row => row && typeof row === 'object' && !Array.isArray(row))) {
                throw new Error('JSON 顶层应为对象或对象数组');
            }

            const flatRows = rows.map(row => flattenObject(row));
            const headers = [...new Set(flatRows.flatMap(row => Object.keys(row)))];
            const csv = [
                headers.map(escapeCsv).join(','),
                ...flatRows.map(row => headers.map(header => escapeCsv(row[header])).join(','))
            ].join('\n');

            output.value = csv;
            renderStats([
                { label: '行数', value: flatRows.length },
                { label: '列数', value: headers.length },
                { label: '大小', value: `${new Blob([csv]).size} B` }
            ]);
            setMessage('JSON 已转换为 CSV。', 'success');
        } catch (error) {
            output.value = '';
            stats.innerHTML = '';
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    function download() {
        if (!output.value) {
            setMessage('没有可下载的 CSV。', 'error');
            return;
        }
        const content = bomInput.checked ? `\uFEFF${output.value}` : output.value;
        const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setMessage('CSV 文件已生成下载。', 'success');
    }

    document.getElementById('json-csv-convert-btn').addEventListener('click', convert);
    document.getElementById('json-csv-sample-btn').addEventListener('click', () => {
        input.value = JSON.stringify([
            { id: 1, name: 'JavaPub', profile: { city: '北京', role: 'developer' }, tags: ['json', 'csv'] },
            { id: 2, name: 'Tools', profile: { city: '上海', role: 'toolbox' }, tags: ['offline'] }
        ], null, 2);
        convert();
    });
    document.getElementById('json-csv-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        stats.innerHTML = '';
        setMessage('等待输入 JSON。', '');
    });
    document.getElementById('json-csv-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的 CSV。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('CSV 已复制。', 'success'));
    });
    document.getElementById('json-csv-download-btn').addEventListener('click', download);
});
