document.addEventListener('DOMContentLoaded', function() {
    const queryInput = document.getElementById('error-query');
    const result = document.getElementById('error-result');
    const message = document.getElementById('error-message');
    const apiErrors = [
        ['400 / invalid_request', ['400', 'bad_request', 'invalid_request'], '请求体格式、字段名、参数类型或 JSON 结构不符合接口要求。', '先格式化请求 JSON，检查 model、messages/input、max_tokens 等字段。'],
        ['401 / authentication_error', ['401', 'unauthorized', 'authentication', 'invalid_api_key', 'api key'], 'API Key 缺失、无效、过期，或 Authorization 格式错误。', '确认使用 Bearer Token，检查 Key 所属平台、项目和环境变量。'],
        ['403 / permission_denied', ['403', 'forbidden', 'permission', 'billing', 'quota'], '账号、项目、模型或区域没有访问权限，也可能是账单状态异常。', '检查模型权限、组织/项目 ID、账户余额和供应商控制台配置。'],
        ['404 / model_not_found', ['404', 'not_found', 'model_not_found'], '模型名称错误、接口路径错误，或账号不可访问该模型。', '核对 endpoint、model 字符串和供应商文档中的模型列表。'],
        ['408 / request_timeout', ['408', 'timeout', 'request_timeout'], '请求处理时间过长，网络链路或上游服务超时。', '减小输入、降低输出 token 上限，并在客户端实现超时和重试策略。'],
        ['413 / context_length_exceeded', ['413', 'payload_too_large', 'context_length'], '输入内容、消息历史或文件体积超过模型上下文或网关限制。', '裁剪历史消息、压缩上下文、分块处理长文档，并降低 max tokens。'],
        ['422 / validation_error', ['422', 'unprocessable', 'validation'], '请求语法合法，但字段组合、枚举值或业务规则校验失败。', '根据返回的 param/message 定位字段，逐项确认参数取值范围。'],
        ['429 / rate_limit_exceeded', ['429', 'rate_limit', 'too_many_requests', 'rpm', 'tpm'], '触发请求数、token 数、并发数或账户配额限制。', '使用指数退避重试，降低并发，做队列削峰，必要时申请更高限额。'],
        ['500 / server_error', ['500', 'internal', 'server_error'], '供应商服务端内部异常。', '记录 request id，短暂重试；持续失败时查看供应商状态页或工单。'],
        ['502/503/504 / service_unavailable', ['502', '503', '504', 'bad_gateway', 'unavailable', 'overloaded'], '网关、上游服务、模型负载或网络链路异常。', '加入重试、熔断和备用模型策略，避免同步链路无限等待。']
    ];

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function render(items) {
        result.innerHTML = items.map(([title, , cause, action]) => {
            return `<div class="result-row"><span>${escapeHtml(title)}</span><strong>${escapeHtml(cause)} ${escapeHtml(action)}</strong></div>`;
        }).join('');
    }

    function search() {
        const query = queryInput.value.trim().toLowerCase();
        if (!query) {
            setMessage('请输入状态码或错误关键词。', 'error');
            return;
        }

        const matched = apiErrors.filter(([title, keys, cause, action]) => {
            return `${title} ${keys.join(' ')} ${cause} ${action}`.toLowerCase().includes(query);
        });
        render(matched);
        setMessage(matched.length ? `找到 ${matched.length} 条错误解释。` : '没有匹配结果，可尝试 401、429、context_length。', matched.length ? 'success' : 'error');
    }

    document.getElementById('error-search-btn').addEventListener('click', search);
    document.getElementById('error-list-btn').addEventListener('click', () => {
        render(apiErrors);
        setMessage(`已列出 ${apiErrors.length} 条常见 API 错误。`, 'success');
    });
});
