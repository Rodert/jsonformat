document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('ip-input');
    const result = document.getElementById('ip-result');
    const message = document.getElementById('ip-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function parseIpv4(ip) {
        const parts = ip.split('.');
        if (parts.length !== 4) return null;
        const nums = parts.map(part => {
            if (!/^\d+$/.test(part)) return NaN;
            return Number(part);
        });
        if (nums.some(num => !Number.isInteger(num) || num < 0 || num > 255)) return null;
        return nums;
    }

    function isIpv6(ip) {
        if (!ip.includes(':')) return false;
        if (!/^[0-9a-fA-F:.]+$/.test(ip)) return false;
        try {
            const parts = ip.split('::');
            if (parts.length > 2) return false;
            const left = parts[0] ? parts[0].split(':') : [];
            const right = parts[1] ? parts[1].split(':') : [];
            const groups = [...left, ...right].filter(Boolean);
            return groups.length <= 8 && groups.every(group => /^[0-9a-fA-F]{1,4}$/.test(group));
        } catch (error) {
            return false;
        }
    }

    function ipv4Type(nums) {
        const [a, b] = nums;
        if (a === 10) return '私有地址 10.0.0.0/8';
        if (a === 172 && b >= 16 && b <= 31) return '私有地址 172.16.0.0/12';
        if (a === 192 && b === 168) return '私有地址 192.168.0.0/16';
        if (a === 127) return '回环地址 127.0.0.0/8';
        if (a === 169 && b === 254) return '链路本地地址 169.254.0.0/16';
        if (a >= 224 && a <= 239) return '多播地址 224.0.0.0/4';
        if (a === 0) return '本网络地址 0.0.0.0/8';
        if (a >= 240) return '保留地址 240.0.0.0/4';
        return '公网地址或可路由地址';
    }

    function ipv6Type(ip) {
        const lower = ip.toLowerCase();
        if (lower === '::1') return '回环地址 ::1';
        if (lower === '::') return '未指定地址 ::';
        if (lower.startsWith('fe80:')) return '链路本地地址 fe80::/10';
        if (/^f[cd][0-9a-f]{2}:/i.test(lower)) return '唯一本地地址 fc00::/7';
        if (lower.startsWith('ff')) return '多播地址 ff00::/8';
        if (lower.startsWith('2001:db8:') || lower === '2001:db8::1') return '文档示例地址 2001:db8::/32';
        return '公网地址或可路由地址';
    }

    function renderRows(rows) {
        result.innerHTML = rows.map(row => `<div class="result-row"><span>${row.label}</span><strong>${row.value}</strong></div>`).join('');
    }

    function lookup() {
        const ip = input.value.trim();
        if (!ip) {
            setMessage('请输入 IP 地址。', 'error');
            return;
        }

        const ipv4 = parseIpv4(ip);
        if (ipv4) {
            const numeric = ipv4.reduce((sum, part) => (sum << 8) + part, 0) >>> 0;
            renderRows([
                { label: '版本', value: 'IPv4' },
                { label: '标准格式', value: ipv4.join('.') },
                { label: '地址类型', value: ipv4Type(ipv4) },
                { label: '十进制', value: numeric },
                { label: '十六进制', value: `0x${numeric.toString(16).toUpperCase().padStart(8, '0')}` },
                { label: '二进制', value: ipv4.map(part => part.toString(2).padStart(8, '0')).join('.') }
            ]);
            setMessage('IPv4 地址解析完成。', 'success');
            return;
        }

        if (isIpv6(ip)) {
            renderRows([
                { label: '版本', value: 'IPv6' },
                { label: '输入地址', value: ip },
                { label: '地址类型', value: ipv6Type(ip) },
                { label: '包含压缩', value: ip.includes('::') ? '是' : '否' }
            ]);
            setMessage('IPv6 地址解析完成。', 'success');
            return;
        }

        result.innerHTML = '';
        setMessage('错误：不是有效的 IPv4 或 IPv6 地址。', 'error');
    }

    document.getElementById('ip-lookup-btn').addEventListener('click', lookup);
    document.getElementById('ip-clear-btn').addEventListener('click', () => {
        input.value = '';
        result.innerHTML = '';
        setMessage('等待输入 IP 地址。', '');
    });
    input.addEventListener('keydown', event => {
        if (event.key === 'Enter') lookup();
    });
    document.querySelectorAll('[data-ip-sample]').forEach(button => {
        button.addEventListener('click', () => {
            input.value = button.dataset.ipSample;
            lookup();
        });
    });
});
