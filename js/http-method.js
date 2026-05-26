document.addEventListener('DOMContentLoaded', function() {
    const search = document.getElementById('method-search');
    const output = document.getElementById('method-output');
    const message = document.getElementById('method-message');
    const rows = [
        ['GET', '安全、幂等', '通常无请求体', '读取资源、列表查询、详情查询'],
        ['HEAD', '安全、幂等', '无响应体', '只获取响应头、检查资源是否存在'],
        ['POST', '非安全、非幂等', '通常有请求体', '创建资源、提交表单、触发动作'],
        ['PUT', '非安全、幂等', '通常有请求体', '整体替换资源、按确定 URI 保存资源'],
        ['PATCH', '非安全、通常非幂等', '通常有请求体', '局部更新资源'],
        ['DELETE', '非安全、幂等', '通常无请求体', '删除指定资源'],
        ['OPTIONS', '安全、幂等', '通常无请求体', '查询服务能力、CORS 预检请求'],
        ['TRACE', '安全、幂等', '通常无请求体', '回显请求链路，生产环境通常禁用'],
        ['CONNECT', '非安全、非幂等', '特殊隧道请求', '代理建立 TCP 隧道，例如 HTTPS 代理']
    ];

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function render() {
        const keyword = search.value.trim().toLowerCase();
        const matched = rows.filter((row) => !keyword || row.join(' ').toLowerCase().includes(keyword));
        output.value = matched.map(([method, feature, body, usage]) => `${method}\n特性：${feature}\n请求体：${body}\n场景：${usage}`).join('\n\n');
        setMessage(`找到 ${matched.length} 个 HTTP 方法。`, matched.length ? 'success' : 'error');
    }

    search.addEventListener('input', render);
    document.getElementById('method-clear-btn').addEventListener('click', () => {
        search.value = '';
        render();
    });
    render();
});
