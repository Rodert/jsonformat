document.addEventListener('DOMContentLoaded', () => {
    // 获取DOM元素
    const jsonInput = document.getElementById('json-input');
    const jsonOutput = document.getElementById('json-output');
    const formatBtn = document.getElementById('format-btn');
    const clearBtn = document.getElementById('clear-btn');
    const copyBtn = document.getElementById('copy-btn');
    const sampleBtn = document.getElementById('sample-btn');

    // 示例JSON数据
    const sampleJson = {
        "name": "JSON格式化工具",
        "version": "1.0.0",
        "description": "一个简单的JSON格式化工具",
        "features": [
            "格式化JSON",
            "高亮显示",
            "简洁大方的界面"
        ],
        "author": {
            "name": "开发者",
            "website": "https://github.com/yourusername"
        },
        "isOpenSource": true,
        "stars": 42
    };

    // 格式化JSON函数
    function formatJSON() {
        try {
            // 获取输入的JSON字符串
            const inputValue = jsonInput.value.trim();
            
            // 如果输入为空，清空输出
            if (!inputValue) {
                jsonOutput.textContent = '';
                return;
            }
            
            // 解析JSON字符串为JavaScript对象
            const parsedJson = JSON.parse(inputValue);
            
            // 将对象转换为格式化的JSON字符串
            const formattedJson = JSON.stringify(parsedJson, null, 4);
            
            // 显示格式化后的JSON
            jsonOutput.textContent = formattedJson;
            
            // 应用语法高亮
            hljs.highlightElement(jsonOutput);
            
        } catch (error) {
            // 显示错误信息
            jsonOutput.textContent = `错误: ${error.message}`;
            jsonOutput.classList.add('error');
        }
    }

    // 自动格式化（当输入改变时）
    jsonInput.addEventListener('input', () => {
        // 移除错误类
        jsonOutput.classList.remove('error');
        
        // 如果启用了自动格式化，则格式化JSON
        // 这里可以添加一个延迟，避免频繁格式化
        clearTimeout(jsonInput.timer);
        jsonInput.timer = setTimeout(formatJSON, 300);
    });

    // 格式化按钮点击事件
    formatBtn.addEventListener('click', formatJSON);

    // 清空按钮点击事件
    clearBtn.addEventListener('click', () => {
        jsonInput.value = '';
        jsonOutput.textContent = '';
        jsonOutput.classList.remove('error');
    });

    // 复制按钮点击事件
    copyBtn.addEventListener('click', () => {
        if (!jsonOutput.textContent) return;
        
        // 创建一个临时textarea元素
        const textarea = document.createElement('textarea');
        textarea.value = jsonOutput.textContent;
        document.body.appendChild(textarea);
        
        // 选择并复制文本
        textarea.select();
        document.execCommand('copy');
        
        // 移除临时元素
        document.body.removeChild(textarea);
        
        // 显示复制成功提示
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '已复制!';
        
        // 2秒后恢复按钮文本
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    });

    // 示例按钮点击事件
    sampleBtn.addEventListener('click', () => {
        jsonInput.value = JSON.stringify(sampleJson);
        formatJSON();
    });

    // 添加键盘快捷键
    document.addEventListener('keydown', (e) => {
        // Ctrl+Enter 或 Cmd+Enter 格式化
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            formatJSON();
        }
    });
});