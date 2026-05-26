document.addEventListener('DOMContentLoaded', function() {
    const search = document.getElementById('header-search');
    const output = document.getElementById('header-output');
    const message = document.getElementById('header-message');
    const rows = [
        ['Accept', '请求', '客户端可接受的响应媒体类型', 'Accept: application/json'],
        ['Accept-Encoding', '请求', '客户端支持的压缩算法', 'Accept-Encoding: gzip, br'],
        ['Authorization', '请求', '身份认证凭证', 'Authorization: Bearer <token>'],
        ['Content-Type', '通用', '请求或响应体的媒体类型', 'Content-Type: application/json'],
        ['Content-Length', '通用', '请求或响应体字节长度', 'Content-Length: 348'],
        ['User-Agent', '请求', '客户端应用、系统或浏览器标识', 'User-Agent: Mozilla/5.0'],
        ['Referer', '请求', '当前请求来源页面', 'Referer: https://example.com/'],
        ['Origin', '请求/CORS', '跨域请求来源', 'Origin: https://example.com'],
        ['Cookie', '请求', '随请求发送的 Cookie', 'Cookie: sid=abc'],
        ['Set-Cookie', '响应', '服务端设置 Cookie', 'Set-Cookie: sid=abc; HttpOnly; Secure'],
        ['Cache-Control', '缓存', '缓存策略', 'Cache-Control: no-cache'],
        ['ETag', '缓存', '资源版本标识', 'ETag: "abc123"'],
        ['If-None-Match', '缓存', '协商缓存 ETag 条件', 'If-None-Match: "abc123"'],
        ['Last-Modified', '缓存', '资源最后修改时间', 'Last-Modified: Tue, 26 May 2026 10:00:00 GMT'],
        ['Location', '响应', '重定向目标地址', 'Location: /login'],
        ['Access-Control-Allow-Origin', 'CORS', '允许跨域访问的来源', 'Access-Control-Allow-Origin: https://example.com'],
        ['Access-Control-Allow-Methods', 'CORS', '允许跨域请求方法', 'Access-Control-Allow-Methods: GET,POST'],
        ['Access-Control-Allow-Headers', 'CORS', '允许跨域请求头', 'Access-Control-Allow-Headers: Content-Type, Authorization'],
        ['Access-Control-Allow-Credentials', 'CORS', '是否允许携带凭证', 'Access-Control-Allow-Credentials: true'],
        ['Content-Disposition', '响应', '控制浏览器展示或下载文件', 'Content-Disposition: attachment; filename="demo.csv"'],
        ['X-Content-Type-Options', '安全', '禁止 MIME 嗅探', 'X-Content-Type-Options: nosniff'],
        ['X-Frame-Options', '安全', '控制页面是否允许被 iframe 嵌入', 'X-Frame-Options: DENY'],
        ['Content-Security-Policy', '安全', '内容安全策略', "Content-Security-Policy: default-src 'self'"],
        ['Strict-Transport-Security', '安全', '强制 HTTPS 访问策略', 'Strict-Transport-Security: max-age=31536000'],
        ['Referrer-Policy', '安全', '控制 Referer 信息发送策略', 'Referrer-Policy: strict-origin-when-cross-origin']
    ];

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function render() {
        const keyword = search.value.trim().toLowerCase();
        const matched = rows.filter((row) => !keyword || row.join(' ').toLowerCase().includes(keyword));
        output.value = matched.map(([name, category, desc, example]) => `${name}\n分类：${category}\n说明：${desc}\n示例：${example}`).join('\n\n');
        setMessage(`找到 ${matched.length} 条 Header。`, matched.length ? 'success' : 'error');
    }

    search.addEventListener('input', render);
    document.getElementById('header-clear-btn').addEventListener('click', () => {
        search.value = '';
        render();
    });
    render();
});
