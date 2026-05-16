document.addEventListener('DOMContentLoaded', function() {
    const message = document.getElementById('ai-message');

    const priceModels = [
        { name: '自定义单价', input: 0, output: 0 },
        { name: 'OpenAI gpt-4.1-mini 示例', input: 0.4, output: 1.6 },
        { name: 'OpenAI gpt-4.1 示例', input: 2, output: 8 },
        { name: 'Claude Sonnet 4 示例', input: 3, output: 15 },
        { name: 'Claude Opus 4.1 示例', input: 15, output: 75 },
        { name: 'Claude 3.5 Haiku 示例', input: 0.8, output: 4 }
    ];

    const apiErrors = [
        {
            keys: ['400', 'bad_request', 'invalid_request', 'invalid_request_error'],
            title: '400 / invalid_request',
            cause: '请求体格式、字段名、参数类型或 JSON 结构不符合接口要求。',
            action: '先格式化请求 JSON，检查 model、messages/input、max_tokens 等字段是否匹配目标 API。'
        },
        {
            keys: ['401', 'unauthorized', 'authentication', 'invalid_api_key', 'api key'],
            title: '401 / authentication_error',
            cause: 'API Key 缺失、无效、过期，或请求头 Authorization 格式错误。',
            action: '确认使用 Bearer Token，检查 Key 所属平台、项目和环境变量是否正确。'
        },
        {
            keys: ['403', 'forbidden', 'permission', 'billing', 'quota'],
            title: '403 / permission_denied',
            cause: '账号、项目、模型或区域没有访问权限，也可能是账单状态异常。',
            action: '检查模型权限、组织/项目 ID、账户余额和供应商控制台的权限配置。'
        },
        {
            keys: ['404', 'not_found', 'model_not_found'],
            title: '404 / model_not_found',
            cause: '模型名称错误、接口路径错误，或当前账号不可访问该模型。',
            action: '核对 endpoint、model 字符串和供应商文档中的模型列表。'
        },
        {
            keys: ['408', 'timeout', 'request_timeout'],
            title: '408 / request_timeout',
            cause: '请求处理时间过长，网络链路或上游服务超时。',
            action: '减小输入、降低输出 token 上限，并在客户端实现超时和重试策略。'
        },
        {
            keys: ['413', 'payload_too_large', 'context_length', 'context_length_exceeded'],
            title: '413 / context_length_exceeded',
            cause: '输入内容、消息历史或文件体积超过模型上下文或网关限制。',
            action: '裁剪历史消息、压缩上下文、分块处理长文档，并降低 max tokens。'
        },
        {
            keys: ['422', 'unprocessable', 'validation'],
            title: '422 / validation_error',
            cause: '请求语法合法，但字段组合、枚举值或业务规则校验失败。',
            action: '根据返回的 param/message 定位字段，逐项确认参数取值范围。'
        },
        {
            keys: ['429', 'rate_limit', 'too_many_requests', 'rpm', 'tpm'],
            title: '429 / rate_limit_exceeded',
            cause: '触发请求数、token 数、并发数或账户配额限制。',
            action: '使用指数退避重试，降低并发，做队列削峰，必要时申请更高限额。'
        },
        {
            keys: ['500', 'internal', 'server_error'],
            title: '500 / server_error',
            cause: '供应商服务端内部异常。',
            action: '记录 request id，短暂重试；持续失败时查看供应商状态页或工单。'
        },
        {
            keys: ['502', '503', '504', 'bad_gateway', 'unavailable', 'overloaded'],
            title: '502/503/504 / service_unavailable',
            cause: '网关、上游服务、模型负载或网络链路异常。',
            action: '加入重试、熔断和备用模型策略，避免同步链路无限等待。'
        }
    ];

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function getValue(id) {
        const element = document.getElementById(id);
        return element ? element.value.trim() : '';
    }

    function setValue(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.value = value;
        }
    }

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function toNumber(id, fallback) {
        const value = Number(getValue(id));
        return Number.isFinite(value) ? value : fallback;
    }

    function formatJson(value) {
        return JSON.stringify(value, null, 2);
    }

    function copyText(targetId) {
        const target = document.getElementById(targetId);
        if (!target || !target.value) {
            setMessage('没有可复制的内容。', 'error');
            return;
        }

        const onSuccess = () => setMessage('内容已复制。', 'success');
        const onError = () => setMessage('复制失败，请手动选择内容复制。', 'error');

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(target.value).then(onSuccess).catch(onError);
            return;
        }

        target.select();
        try {
            document.execCommand('copy') ? onSuccess() : onError();
        } catch (error) {
            onError();
        }
    }

    function renderRows(containerId, rows) {
        const container = document.getElementById(containerId);
        container.innerHTML = rows.map(([label, value]) => {
            return `<div class="result-row"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
        }).join('');
    }

    function generatePrompt() {
        const role = getValue('prompt-role') || '专业助手';
        const task = getValue('prompt-task');
        const context = getValue('prompt-context');
        const output = getValue('prompt-output');

        if (!task) {
            setMessage('请先填写任务。', 'error');
            return;
        }

        const blocks = [
            `你是${role}。`,
            '',
            '## 任务',
            task,
            '',
            '## 上下文',
            context || '无额外上下文。',
            '',
            '## 输出要求',
            output || '输出清晰、结构化、可直接执行。'
        ];

        setValue('prompt-result', blocks.join('\n'));
        setMessage('Prompt 已生成。', 'success');
    }

    function fillPromptSample() {
        setValue('prompt-role', '资深 Java 后端工程师');
        setValue('prompt-task', '审查下面的接口设计，指出潜在问题，并给出可落地的改进方案。');
        setValue('prompt-context', '项目使用 Spring Boot，接口面向移动端，要求兼顾性能、可维护性和异常处理。');
        setValue('prompt-output', '用中文输出，按“问题 / 原因 / 建议”三列表格整理，最后给出优先级。');
        generatePrompt();
    }

    function clearPrompt() {
        ['prompt-role', 'prompt-task', 'prompt-context', 'prompt-output', 'prompt-result'].forEach(id => setValue(id, ''));
        setMessage('Prompt 表单已清空。');
    }

    function generateOpenAIResponses() {
        const system = getValue('openai-system');
        const user = getValue('openai-user');
        if (!user) {
            setMessage('请先填写 User 消息。', 'error');
            return;
        }

        const request = {
            model: getValue('openai-model'),
            input: [
                ...(system ? [{ role: 'system', content: system }] : []),
                { role: 'user', content: user }
            ],
            temperature: toNumber('openai-temperature', 0.2),
            max_output_tokens: toNumber('openai-max-output', 2048)
        };

        setValue('openai-result', formatJson(request));
        setMessage('OpenAI Responses API 请求体已生成。', 'success');
    }

    function generateOpenAIChat() {
        const system = getValue('openai-system');
        const user = getValue('openai-user');
        if (!user) {
            setMessage('请先填写 User 消息。', 'error');
            return;
        }

        const request = {
            model: getValue('openai-model'),
            messages: [
                ...(system ? [{ role: 'system', content: system }] : []),
                { role: 'user', content: user }
            ],
            temperature: toNumber('openai-temperature', 0.2),
            max_tokens: toNumber('openai-max-output', 2048)
        };

        setValue('openai-result', formatJson(request));
        setMessage('OpenAI Chat Completions 请求体已生成。', 'success');
    }

    function generateClaude() {
        const system = getValue('claude-system');
        const user = getValue('claude-user');
        if (!user) {
            setMessage('请先填写 User 消息。', 'error');
            return;
        }

        const request = {
            model: getValue('claude-model'),
            max_tokens: toNumber('claude-max-tokens', 2048),
            messages: [
                { role: 'user', content: user }
            ]
        };

        if (system) {
            request.system = system;
        }

        setValue('claude-result', formatJson(request));
        setMessage('Claude 请求体已生成。', 'success');
    }

    function estimateTokens() {
        const text = getValue('token-input');
        if (!text) {
            document.getElementById('token-stats').innerHTML = '';
            setMessage('请先输入需要估算的文本。', 'error');
            return;
        }

        const cjkCount = (text.match(/[\u3400-\u9fff\uf900-\ufaff]/g) || []).length;
        const asciiText = text.replace(/[\u3400-\u9fff\uf900-\ufaff]/g, '');
        const asciiCount = asciiText.replace(/\s/g, '').length;
        const whitespaceCount = (text.match(/\s/g) || []).length;
        const lineCount = text.split(/\r?\n/).length;
        const roughTokens = Math.max(1, Math.ceil(cjkCount * 1.1 + asciiCount / 4 + whitespaceCount / 8));
        const safeMaxOutput = Math.max(256, 128000 - roughTokens);

        renderRows('token-stats', [
            ['粗估 token', roughTokens.toLocaleString('zh-CN')],
            ['字符数', text.length.toLocaleString('zh-CN')],
            ['中文字符', cjkCount.toLocaleString('zh-CN')],
            ['非中文字符', asciiCount.toLocaleString('zh-CN')],
            ['行数', lineCount.toLocaleString('zh-CN')],
            ['128K 上下文剩余', safeMaxOutput.toLocaleString('zh-CN')]
        ]);
        setMessage('Token 已粗估。', 'success');
    }

    function clearTokens() {
        setValue('token-input', '');
        document.getElementById('token-stats').innerHTML = '';
        setMessage('Token 输入已清空。');
    }

    function renderErrors(items) {
        const container = document.getElementById('error-result');
        container.innerHTML = items.map(item => {
            return [
                '<div class="result-row">',
                `<span>${escapeHtml(item.title)}</span>`,
                `<strong>${escapeHtml(item.cause)} ${escapeHtml(item.action)}</strong>`,
                '</div>'
            ].join('');
        }).join('');
    }

    function searchError() {
        const query = getValue('error-query').toLowerCase();
        if (!query) {
            setMessage('请输入状态码或错误关键词。', 'error');
            return;
        }

        const matched = apiErrors.filter(item => {
            const haystack = `${item.keys.join(' ')} ${item.title} ${item.cause} ${item.action}`.toLowerCase();
            return haystack.includes(query);
        });

        renderErrors(matched);
        setMessage(matched.length ? `找到 ${matched.length} 条错误解释。` : '没有匹配结果，可尝试 401、429、context_length。', matched.length ? 'success' : 'error');
    }

    function renderCommonErrors() {
        renderErrors(apiErrors);
        setMessage(`已列出 ${apiErrors.length} 条常见 API 错误。`, 'success');
    }

    function initPriceModels() {
        const select = document.getElementById('price-model');
        select.innerHTML = priceModels.map((model, index) => {
            return `<option value="${index}">${escapeHtml(model.name)}</option>`;
        }).join('');
        select.addEventListener('change', function() {
            const model = priceModels[Number(select.value)] || priceModels[0];
            setValue('price-input-rate', model.input);
            setValue('price-output-rate', model.output);
            calculatePrice();
        });
        setValue('price-input-rate', priceModels[0].input);
        setValue('price-output-rate', priceModels[0].output);
    }

    function calculatePrice() {
        const inputRate = toNumber('price-input-rate', 0);
        const outputRate = toNumber('price-output-rate', 0);
        const inputTokens = toNumber('price-input-tokens', 0);
        const outputTokens = toNumber('price-output-tokens', 0);
        const exchangeRate = toNumber('price-exchange-rate', 7.2);
        const inputCost = inputTokens / 1000000 * inputRate;
        const outputCost = outputTokens / 1000000 * outputRate;
        const usdCost = inputCost + outputCost;
        const cnyCost = usdCost * exchangeRate;

        renderRows('price-result', [
            ['输入费用', `$${inputCost.toFixed(6)}`],
            ['输出费用', `$${outputCost.toFixed(6)}`],
            ['总费用 USD', `$${usdCost.toFixed(6)}`],
            ['约合 RMB', `¥${cnyCost.toFixed(4)}`],
            ['千次调用 RMB', `¥${(cnyCost * 1000).toFixed(2)}`]
        ]);
        setMessage('费用已计算。单价示例可能滞后，请以官方账单为准。', 'success');
    }

    document.getElementById('prompt-format-btn').addEventListener('click', generatePrompt);
    document.getElementById('prompt-sample-btn').addEventListener('click', fillPromptSample);
    document.getElementById('prompt-clear-btn').addEventListener('click', clearPrompt);
    document.getElementById('openai-responses-btn').addEventListener('click', generateOpenAIResponses);
    document.getElementById('openai-chat-btn').addEventListener('click', generateOpenAIChat);
    document.getElementById('claude-generate-btn').addEventListener('click', generateClaude);
    document.getElementById('token-estimate-btn').addEventListener('click', estimateTokens);
    document.getElementById('token-clear-btn').addEventListener('click', clearTokens);
    document.getElementById('error-search-btn').addEventListener('click', searchError);
    document.getElementById('error-list-btn').addEventListener('click', renderCommonErrors);
    document.getElementById('price-calc-btn').addEventListener('click', calculatePrice);
    document.querySelectorAll('[data-copy]').forEach(button => {
        button.addEventListener('click', () => copyText(button.dataset.copy));
    });

    initPriceModels();
    calculatePrice();
});
