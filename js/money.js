// 人民币大写数字映射
const chineseNumbers = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const chineseUnits = ['', '拾', '佰', '仟'];
const chineseBigUnits = ['', '万', '亿'];

/**
 * 将数字转换为人民币大写
 * @param {number|string} amount - 金额
 * @returns {string} 人民币大写字符串
 */
function convertToChineseMoney(amount) {
    const normalizedAmount = String(amount).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(normalizedAmount)) {
        throw new Error('请输入有效金额，最多保留两位小数');
    }

    // 将输入转换为数字
    const num = Number(normalizedAmount);
    
    // 验证输入
    if (isNaN(num)) {
        throw new Error('请输入有效的数字');
    }
    
    if (num < 0) {
        throw new Error('金额不能为负数');
    }
    
    if (num > 999999999999.99) {
        throw new Error('金额过大，最大支持999999999999.99');
    }
    
    // 处理零的情况
    if (num === 0) {
        return '零元整';
    }
    
    // 分离整数部分和小数部分
    const parts = num.toFixed(2).split('.');
    const integerPart = parts[0];
    const decimalPart = parts[1];
    
    // 转换整数部分
    let result = '';
    
    if (integerPart !== '0') {
        // 将整数部分转换为字符串并反转，便于处理
        const integerStr = integerPart;
        
        // 处理整数部分，按万、亿分组
        const groups = [];
        for (let i = integerStr.length; i > 0; i -= 4) {
            const start = Math.max(0, i - 4);
            groups.unshift(integerStr.slice(start, i));
        }
        
        // 转换每一组
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            const groupResult = convertGroup(group);
            
            if (groupResult) {
                result += groupResult;
                // 添加大单位（万、亿）
                const bigUnitIndex = groups.length - 1 - i;
                if (bigUnitIndex > 0 && bigUnitIndex < chineseBigUnits.length) {
                    result += chineseBigUnits[bigUnitIndex];
                }
            } else if (i > 0 && i < groups.length - 1) {
                // 如果中间组为空，需要添加零
                result += '零';
            }
        }
        
        result += '元';
    }
    
    // 处理小数部分（角、分）
    if (decimalPart === '00') {
        result = result ? result + '整' : '零元整';
    } else {
        const jiao = parseInt(decimalPart[0]);
        const fen = parseInt(decimalPart[1]);
        
        if (jiao !== 0) {
            result += chineseNumbers[jiao] + '角';
        }
        
        if (fen !== 0) {
            if (jiao === 0 && result.endsWith('元')) {
                result += '零';
            }
            result += chineseNumbers[fen] + '分';
        } else if (jiao !== 0) {
            result += '整';
        }
    }
    
    // 清理多余的零：将连续的零合并为一个，但保留必要的零
    result = result.replace(/零+/g, '零');
    // 处理特殊情况：零元、零万、零亿等
    result = result.replace(/零元/g, '元');
    result = result.replace(/零([万亿])/g, '$1');
    // 处理元前面有零的情况
    result = result.replace(/零+元/g, '元');
    
    return result;
}

/**
 * 转换一组最多4位数字（个、十、百、千）
 * @param {string} group - 数字字符串（最多4位）
 * @returns {string} 转换后的字符串
 */
function convertGroup(group) {
    if (!group || group === '0' || group === '0000') {
        return '';
    }
    
    let result = '';
    let needZero = false;
    
    // 补齐到4位
    const paddedGroup = group.padStart(4, '0');
    
    for (let i = 0; i < 4; i++) {
        const digit = parseInt(paddedGroup[i]);
        const unitIndex = 3 - i;
        
        if (digit !== 0) {
            // 如果需要补零
            if (needZero && result && !result.endsWith('零')) {
                result += '零';
            }
            needZero = false;
            
            // 添加数字和单位
            result += chineseNumbers[digit] + chineseUnits[unitIndex];
        } else {
            // 如果后面还有非零数字，标记需要补零
            if (i < 3) {
                const hasNonZeroAfter = paddedGroup.slice(i + 1).split('').some(d => d !== '0');
                if (hasNonZeroAfter && result) {
                    needZero = true;
                }
            }
        }
    }
    
    return result;
}

/**
 * 转换并显示结果
 */
function convertMoney() {
    const input = document.getElementById('money-input');
    const output = document.getElementById('money-output');
    const message = document.getElementById('money-message');
    const amount = input.value.trim();
    
    if (!amount) {
        output.className = 'money-result error';
        output.textContent = '请输入金额';
        if (message) {
            message.textContent = '请输入金额。';
            message.className = 'json-message error';
        }
        return;
    }
    
    try {
        const result = convertToChineseMoney(amount);
        output.className = 'money-result success';
        output.textContent = result;
        if (message) {
            message.textContent = '金额转换完成。';
            message.className = 'json-message success';
        }
    } catch (error) {
        output.className = 'money-result error';
        output.textContent = '错误：' + error.message;
        if (message) {
            message.textContent = '错误：' + error.message;
            message.className = 'json-message error';
        }
    }
}

/**
 * 清空输入和输出
 */
function clearMoney() {
    document.getElementById('money-input').value = '';
    const output = document.getElementById('money-output');
    const message = document.getElementById('money-message');
    output.className = 'money-result';
    output.textContent = '请输入金额后点击转换';
    if (message) {
        message.textContent = '等待输入金额。';
        message.className = 'json-message';
    }
}

/**
 * 复制结果到剪贴板
 */
function copyResult() {
    const output = document.getElementById('money-output');
    const text = output.textContent;
    
    if (text === '请输入金额后点击转换' || text.startsWith('错误：')) {
        return;
    }
    
    // 使用现代 Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = output.textContent;
            const message = document.getElementById('money-message');
            output.textContent = '已复制到剪贴板！';
            if (message) {
                message.textContent = '结果已复制到剪贴板。';
                message.className = 'json-message success';
            }
            setTimeout(() => {
                output.textContent = originalText;
            }, 1500);
        }).catch(err => {
            alert('复制失败，请手动选择文本复制');
        });
    } else {
        // 降级方案：使用传统方法
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            const originalText = output.textContent;
            output.textContent = '已复制到剪贴板！';
            setTimeout(() => {
                output.textContent = originalText;
            }, 1500);
        } catch (err) {
            alert('复制失败，请手动选择文本复制');
        }
        document.body.removeChild(textarea);
    }
}

// 监听回车键
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('money-input');
    if (input) {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                convertMoney();
            }
        });
        
        // 限制输入只能为数字和小数点
        input.addEventListener('input', function(e) {
            let value = e.target.value;
            // 移除非数字和小数点的字符
            value = value.replace(/[^\d.]/g, '');
            // 确保只有一个小数点
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            // 限制小数点后最多2位
            if (parts.length === 2 && parts[1].length > 2) {
                value = parts[0] + '.' + parts[1].slice(0, 2);
            }
            e.target.value = value;
        });
    }
});
