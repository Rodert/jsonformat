document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('ua-input');
    const result = document.getElementById('ua-result');
    const message = document.getElementById('ua-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function matchVersion(ua, pattern) {
        const match = ua.match(pattern);
        return match ? match[1] : '';
    }

    function detectBrowser(ua) {
        if (/Edg\/([\d.]+)/.test(ua)) return ['Microsoft Edge', matchVersion(ua, /Edg\/([\d.]+)/)];
        if (/OPR\/([\d.]+)/.test(ua)) return ['Opera', matchVersion(ua, /OPR\/([\d.]+)/)];
        if (/Chrome\/([\d.]+)/.test(ua) && !/Chromium/.test(ua)) return ['Chrome', matchVersion(ua, /Chrome\/([\d.]+)/)];
        if (/Firefox\/([\d.]+)/.test(ua)) return ['Firefox', matchVersion(ua, /Firefox\/([\d.]+)/)];
        if (/Version\/([\d.]+).*Safari/.test(ua)) return ['Safari', matchVersion(ua, /Version\/([\d.]+)/)];
        if (/MSIE ([\d.]+)/.test(ua)) return ['Internet Explorer', matchVersion(ua, /MSIE ([\d.]+)/)];
        if (/Trident.*rv:([\d.]+)/.test(ua)) return ['Internet Explorer', matchVersion(ua, /rv:([\d.]+)/)];
        return ['未知浏览器', '-'];
    }

    function detectOs(ua) {
        if (/Windows NT 10/.test(ua)) return 'Windows 10/11';
        if (/Windows NT 6\.3/.test(ua)) return 'Windows 8.1';
        if (/Windows NT 6\.1/.test(ua)) return 'Windows 7';
        if (/Android ([\d.]+)/.test(ua)) return `Android ${matchVersion(ua, /Android ([\d.]+)/)}`;
        if (/iPhone OS ([\d_]+)/.test(ua)) return `iOS ${matchVersion(ua, /iPhone OS ([\d_]+)/).replace(/_/g, '.')}`;
        if (/iPad.*OS ([\d_]+)/.test(ua)) return `iPadOS ${matchVersion(ua, /OS ([\d_]+)/).replace(/_/g, '.')}`;
        if (/Mac OS X ([\d_]+)/.test(ua)) return `macOS ${matchVersion(ua, /Mac OS X ([\d_]+)/).replace(/_/g, '.')}`;
        if (/Linux/.test(ua)) return 'Linux';
        return '未知系统';
    }

    function detectDevice(ua) {
        if (/bot|spider|crawler|slurp|bingpreview/i.test(ua)) return '机器人/爬虫';
        if (/iPad|Tablet|PlayBook|Silk/i.test(ua)) return '平板';
        if (/Mobile|iPhone|Android/i.test(ua)) return '手机';
        return '桌面设备';
    }

    function detectEngine(ua) {
        if (/AppleWebKit\/([\d.]+)/.test(ua)) return `WebKit/Blink ${matchVersion(ua, /AppleWebKit\/([\d.]+)/)}`;
        if (/Gecko\/([\d.]+)/.test(ua) && /Firefox/.test(ua)) return `Gecko ${matchVersion(ua, /Gecko\/([\d.]+)/)}`;
        if (/Trident\/([\d.]+)/.test(ua)) return `Trident ${matchVersion(ua, /Trident\/([\d.]+)/)}`;
        return '未知引擎';
    }

    function renderRows(rows) {
        result.innerHTML = rows.map(row => `<div class="result-row"><span>${row.label}</span><strong>${escapeHtml(row.value)}</strong></div>`).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function parse() {
        const ua = input.value.trim();
        if (!ua) {
            setMessage('请输入 User-Agent。', 'error');
            return;
        }
        const [browser, browserVersion] = detectBrowser(ua);
        renderRows([
            { label: '浏览器', value: browser },
            { label: '浏览器版本', value: browserVersion },
            { label: '操作系统', value: detectOs(ua) },
            { label: '设备类型', value: detectDevice(ua) },
            { label: '渲染引擎', value: detectEngine(ua) },
            { label: '是否移动端', value: /Mobile|iPhone|Android/i.test(ua) ? '是' : '否' },
            { label: '原始长度', value: `${ua.length} 字符` }
        ]);
        setMessage('User-Agent 解析完成。', 'success');
    }

    document.getElementById('parse-ua-btn').addEventListener('click', parse);
    document.getElementById('current-ua-btn').addEventListener('click', () => {
        input.value = navigator.userAgent;
        parse();
    });
    document.getElementById('sample-ua-btn').addEventListener('click', () => {
        input.value = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
        parse();
    });
    document.getElementById('clear-ua-btn').addEventListener('click', () => {
        input.value = '';
        result.innerHTML = '';
        setMessage('等待输入 User-Agent。', '');
    });
});
