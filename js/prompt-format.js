document.addEventListener('DOMContentLoaded', function() {
    const message = document.getElementById('prompt-message');

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function getValue(id) {
        return document.getElementById(id).value.trim();
    }

    function setValue(id, value) {
        document.getElementById(id).value = value;
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

        setValue('prompt-result', [
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
        ].join('\n'));
        setMessage('Prompt 已生成。', 'success');
    }

    function fillSample() {
        setValue('prompt-role', '资深 Java 后端工程师');
        setValue('prompt-task', '审查下面的接口设计，指出潜在问题，并给出可落地的改进方案。');
        setValue('prompt-context', '项目使用 Spring Boot，接口面向移动端，要求兼顾性能、可维护性和异常处理。');
        setValue('prompt-output', '用中文输出，按“问题 / 原因 / 建议”三列表格整理，最后给出优先级。');
        generatePrompt();
    }

    function clearAll() {
        ['prompt-role', 'prompt-task', 'prompt-context', 'prompt-output', 'prompt-result'].forEach(id => setValue(id, ''));
        setMessage('内容已清空。');
    }

    function copyResult() {
        const result = document.getElementById('prompt-result');
        if (!result.value) {
            setMessage('没有可复制的 Prompt。', 'error');
            return;
        }
        navigator.clipboard.writeText(result.value).then(() => setMessage('Prompt 已复制。', 'success'));
    }

    document.getElementById('prompt-format-btn').addEventListener('click', generatePrompt);
    document.getElementById('prompt-sample-btn').addEventListener('click', fillSample);
    document.getElementById('prompt-clear-btn').addEventListener('click', clearAll);
    document.getElementById('prompt-copy-btn').addEventListener('click', copyResult);
});
