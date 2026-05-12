document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('csv-json-input');
    const output = document.getElementById('csv-json-output');
    const message = document.getElementById('csv-json-message');
    const stats = document.getElementById('csv-json-stats');
    const delimiterInput = document.getElementById('csv-json-delimiter');
    const headerInput = document.getElementById('csv-json-header');
    const trimInput = document.getElementById('csv-json-trim');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function getDelimiter() {
        return delimiterInput.value === 'tab' ? '\t' : delimiterInput.value;
    }

    function normalizeCell(value) {
        return trimInput.checked ? value.trim() : value;
    }

    function parseCsv(text, delimiter) {
        const rows = [];
        let row = [];
        let field = '';
        let inQuotes = false;

        for (let i = 0; i < text.length; i += 1) {
            const char = text[i];

            if (inQuotes) {
                if (char === '"') {
                    if (text[i + 1] === '"') {
                        field += '"';
                        i += 1;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    field += char;
                }
                continue;
            }

            if (char === '"') {
                if (field.trim() === '') {
                    field = '';
                    inQuotes = true;
                } else {
                    field += char;
                }
            } else if (char === delimiter) {
                row.push(normalizeCell(field));
                field = '';
            } else if (char === '\n' || char === '\r') {
                row.push(normalizeCell(field));
                rows.push(row);
                row = [];
                field = '';

                if (char === '\r' && text[i + 1] === '\n') {
                    i += 1;
                }
            } else {
                field += char;
            }
        }

        if (inQuotes) {
            throw new Error('CSV 引号未闭合');
        }

        if (field !== '' || row.length > 0 || text.endsWith(delimiter)) {
            row.push(normalizeCell(field));
            rows.push(row);
        }

        return rows.filter((currentRow) => currentRow.some((cell) => cell !== ''));
    }

    function makeHeaders(rawHeaders) {
        const seen = new Map();
        return rawHeaders.map((header, index) => {
            const fallback = `column_${index + 1}`;
            const base = header || fallback;
            const count = seen.get(base) || 0;
            seen.set(base, count + 1);
            return count === 0 ? base : `${base}_${count + 1}`;
        });
    }

    function rowsToObjects(rows) {
        const headers = makeHeaders(rows[0] || []);
        return rows.slice(1).map((row) => {
            return headers.reduce((result, header, index) => {
                result[header] = row[index] === undefined ? '' : row[index];
                return result;
            }, {});
        });
    }

    function renderStats(rows, columns, bytes) {
        stats.innerHTML = [
            { label: '行数', value: rows },
            { label: '列数', value: columns },
            { label: '大小', value: `${bytes} B` }
        ].map((row) => `<div class="result-row"><span>${row.label}</span><strong>${row.value}</strong></div>`).join('');
    }

    function convert() {
        try {
            const raw = input.value.trim();
            if (!raw) throw new Error('请输入 CSV 数据');

            const rows = parseCsv(raw, getDelimiter());
            if (rows.length === 0) throw new Error('CSV 内容为空');

            const columnCount = Math.max(...rows.map((row) => row.length));
            const result = headerInput.checked ? rowsToObjects(rows) : rows;

            if (headerInput.checked && rows.length < 2) {
                throw new Error('使用表头模式时至少需要一行表头和一行数据');
            }

            const json = JSON.stringify(result, null, 2);
            output.value = json;
            renderStats(headerInput.checked ? result.length : rows.length, columnCount, new Blob([json]).size);
            setMessage('CSV 已转换为 JSON。', 'success');
        } catch (error) {
            output.value = '';
            stats.innerHTML = '';
            setMessage(`错误：${error.message}`, 'error');
        }
    }

    function download() {
        if (!output.value) {
            setMessage('没有可下载的 JSON。', 'error');
            return;
        }

        const url = URL.createObjectURL(new Blob([output.value], { type: 'application/json;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setMessage('JSON 文件已生成下载。', 'success');
    }

    document.getElementById('csv-json-convert-btn').addEventListener('click', convert);
    document.getElementById('csv-json-sample-btn').addEventListener('click', () => {
        delimiterInput.value = ',';
        headerInput.checked = true;
        trimInput.checked = true;
        input.value = 'id,name,city,tags,remark\n1,JavaPub,北京,"json,csv","支持中文和逗号"\n2,Tools,上海,offline,"字段可用双引号包裹"';
        convert();
    });
    document.getElementById('csv-json-clear-btn').addEventListener('click', () => {
        input.value = '';
        output.value = '';
        stats.innerHTML = '';
        setMessage('等待输入 CSV。', '');
    });
    document.getElementById('csv-json-copy-btn').addEventListener('click', () => {
        if (!output.value) {
            setMessage('没有可复制的 JSON。', 'error');
            return;
        }
        navigator.clipboard.writeText(output.value).then(() => setMessage('JSON 已复制。', 'success'));
    });
    document.getElementById('csv-json-download-btn').addEventListener('click', download);
});
