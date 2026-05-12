document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('status-search');
    const results = document.getElementById('status-results');
    const message = document.getElementById('status-message');

    const statuses = [
        [100, 'Continue', '继续', '客户端应继续请求。'],
        [101, 'Switching Protocols', '切换协议', '服务器同意切换协议。'],
        [200, 'OK', '成功', '请求成功。'],
        [201, 'Created', '已创建', '请求成功并创建了新资源。'],
        [202, 'Accepted', '已接受', '请求已接受但尚未处理完成。'],
        [204, 'No Content', '无内容', '请求成功但响应体为空。'],
        [301, 'Moved Permanently', '永久重定向', '资源已永久移动到新地址。'],
        [302, 'Found', '临时重定向', '资源临时移动到其他地址。'],
        [304, 'Not Modified', '未修改', '缓存资源仍然有效。'],
        [400, 'Bad Request', '错误请求', '请求语法或参数不正确。'],
        [401, 'Unauthorized', '未认证', '需要身份认证或 Token 无效。'],
        [403, 'Forbidden', '禁止访问', '服务器理解请求但拒绝执行。'],
        [404, 'Not Found', '未找到', '请求资源不存在。'],
        [405, 'Method Not Allowed', '方法不允许', '请求方法不被资源支持。'],
        [408, 'Request Timeout', '请求超时', '服务器等待请求超时。'],
        [409, 'Conflict', '冲突', '请求与当前资源状态冲突。'],
        [410, 'Gone', '已删除', '资源已永久删除。'],
        [413, 'Payload Too Large', '请求体过大', '请求体超过服务器限制。'],
        [415, 'Unsupported Media Type', '媒体类型不支持', 'Content-Type 不被支持。'],
        [422, 'Unprocessable Content', '语义错误', '请求格式正确但语义无法处理。'],
        [429, 'Too Many Requests', '请求过多', '触发限流或频率限制。'],
        [500, 'Internal Server Error', '服务器内部错误', '服务器处理请求时发生异常。'],
        [501, 'Not Implemented', '未实现', '服务器不支持该功能。'],
        [502, 'Bad Gateway', '网关错误', '上游服务返回无效响应。'],
        [503, 'Service Unavailable', '服务不可用', '服务暂时不可用或过载。'],
        [504, 'Gateway Timeout', '网关超时', '网关等待上游服务超时。']
    ];

    function statusClass(code) {
        return String(code).charAt(0);
    }

    function render() {
        const keyword = searchInput.value.trim().toLowerCase();
        const selectedClass = document.querySelector('input[name="status-class"]:checked').value;
        const filtered = statuses.filter(([code, phrase, zh, desc]) => {
            const classMatched = selectedClass === 'all' || statusClass(code) === selectedClass;
            const haystack = `${code} ${phrase} ${zh} ${desc}`.toLowerCase();
            return classMatched && (!keyword || haystack.includes(keyword));
        });

        results.innerHTML = filtered.map(([code, phrase, zh, desc]) => {
            return `<article class="status-card status-${statusClass(code)}xx"><strong>${code}</strong><h3>${phrase}</h3><span>${zh}</span><p>${desc}</p></article>`;
        }).join('');
        message.textContent = `找到 ${filtered.length} 个状态码。`;
    }

    searchInput.addEventListener('input', render);
    document.querySelectorAll('input[name="status-class"]').forEach(input => input.addEventListener('change', render));
    render();
});
