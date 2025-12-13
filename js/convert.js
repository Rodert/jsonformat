// JSON转换工具脚本

// 工具函数：将字符串转换为驼峰命名
function toCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase())
              .replace(/^[a-z]/, (g) => g.toUpperCase());
}

// 工具函数：将字符串转换为帕斯卡命名（首字母大写）
function toPascalCase(str) {
    const camel = toCamelCase(str);
    return camel.charAt(0).toUpperCase() + camel.slice(1);
}

// 工具函数：将字符串转换为蛇形命名
function toSnakeCase(str) {
    return str.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
}

// 工具函数：获取Java类型
function getJavaType(value, isArray = false) {
    if (isArray) {
        if (value && value.length > 0) {
            return `List<${getJavaType(value[0])}>`;
        }
        return 'List<Object>';
    }
    
    if (value === null) return 'Object';
    if (typeof value === 'string') return 'String';
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'Integer' : 'Double';
    }
    if (typeof value === 'boolean') return 'Boolean';
    if (Array.isArray(value)) {
        if (value.length > 0) {
            return `List<${getJavaType(value[0])}>`;
        }
        return 'List<Object>';
    }
    if (typeof value === 'object') return 'Object';
    return 'Object';
}

// 工具函数：获取Golang类型
function getGolangType(value, isArray = false) {
    if (isArray) {
        if (value && value.length > 0) {
            return `[]${getGolangType(value[0])}`;
        }
        return '[]interface{}';
    }
    
    if (value === null) return 'interface{}';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'int' : 'float64';
    }
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
        if (value.length > 0) {
            return `[]${getGolangType(value[0])}`;
        }
        return '[]interface{}';
    }
    if (typeof value === 'object') return 'interface{}';
    return 'interface{}';
}

// 工具函数：获取C#类型
function getCSharpType(value, isArray = false) {
    if (isArray) {
        if (value && value.length > 0) {
            return `List<${getCSharpType(value[0])}>`;
        }
        return 'List<object>';
    }
    
    if (value === null) return 'object';
    if (typeof value === 'string') return 'string';
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'int' : 'double';
    }
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
        if (value.length > 0) {
            return `List<${getCSharpType(value[0])}>`;
        }
        return 'List<object>';
    }
    if (typeof value === 'object') return 'object';
    return 'object';
}

// 工具函数：获取Rust类型
function getRustType(value, isArray = false) {
    if (isArray) {
        if (value && value.length > 0) {
            return `Vec<${getRustType(value[0])}>`;
        }
        return 'Vec<serde_json::Value>';
    }
    
    if (value === null) return 'Option<serde_json::Value>';
    if (typeof value === 'string') return 'String';
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'i64' : 'f64';
    }
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) {
        if (value.length > 0) {
            return `Vec<${getRustType(value[0])}>`;
        }
        return 'Vec<serde_json::Value>';
    }
    if (typeof value === 'object') return 'serde_json::Value';
    return 'serde_json::Value';
}

// 解析JSON并生成类结构
function parseJsonToClasses(jsonObj, className = 'Root', generatedClasses = {}) {
    const fields = [];
    const nestedClasses = [];
    
    for (const [key, value] of Object.entries(jsonObj)) {
        const fieldName = toCamelCase(key);
        const originalKey = key;
        
        if (value === null) {
            fields.push({ name: fieldName, type: 'Object', originalKey, value: null });
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            // 嵌套对象
            const nestedClassName = toPascalCase(key);
            if (!generatedClasses[nestedClassName]) {
                generatedClasses[nestedClassName] = true;
                const nested = parseJsonToClasses(value, nestedClassName, generatedClasses);
                nestedClasses.push(...nested.classes);
                nestedClasses.push(nested);
            }
            fields.push({ name: fieldName, type: nestedClassName, originalKey, value, isObject: true });
        } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            // 对象数组
            const nestedClassName = toPascalCase(key.slice(0, -1)); // 去掉复数s
            if (!generatedClasses[nestedClassName]) {
                generatedClasses[nestedClassName] = true;
                const nested = parseJsonToClasses(value[0], nestedClassName, generatedClasses);
                nestedClasses.push(...nested.classes);
                nestedClasses.push(nested);
            }
            fields.push({ name: fieldName, type: nestedClassName, originalKey, value, isArray: true, isObjectArray: true });
        } else {
            fields.push({ name: fieldName, type: null, originalKey, value, isArray: Array.isArray(value) });
        }
    }
    
    return { className, fields, classes: nestedClasses };
}

// ==================== Java转换 ====================
function convertToJava() {
    try {
        const jsonInput = document.getElementById('json-input').value.trim();
        if (!jsonInput) {
            showError('请输入JSON数据！');
            return;
        }
        
        const jsonObj = JSON.parse(jsonInput);
        const className = document.getElementById('class-name').value.trim() || 'Root';
        const packageName = document.getElementById('package-name').value.trim();
        
        const parsed = parseJsonToClasses(jsonObj, className, {});
        let result = '';
        
        if (packageName) {
            result += `package ${packageName};\n\n`;
        }
        
        result += `import java.util.List;\n\n`;
        result += generateJavaClass(parsed, parsed.classes, new Set());
        
        displayResult(result, 'java');
    } catch (error) {
        showError('JSON解析失败：' + error.message);
    }
}

function generateJavaClass(parsed, nestedClasses, generated = new Set()) {
    if (generated.has(parsed.className)) {
        return '';
    }
    generated.add(parsed.className);
    
    let code = `public class ${parsed.className} {\n\n`;
    
    // 生成字段
    for (const field of parsed.fields) {
        const javaType = getJavaType(field.value, field.isArray);
        const type = field.isObject ? field.type : (field.isObjectArray ? `List<${field.type}>` : javaType);
        const fieldName = toCamelCase(field.originalKey);
        code += `    private ${type} ${fieldName};\n`;
    }
    
    code += '\n';
    
    // 生成getter和setter
    for (const field of parsed.fields) {
        const javaType = getJavaType(field.value, field.isArray);
        const type = field.isObject ? field.type : (field.isObjectArray ? `List<${field.type}>` : javaType);
        const fieldName = toCamelCase(field.originalKey);
        const methodName = toPascalCase(field.originalKey);
        
        code += `    public ${type} get${methodName}() {\n`;
        code += `        return ${fieldName};\n`;
        code += `    }\n\n`;
        
        code += `    public void set${methodName}(${type} ${fieldName}) {\n`;
        code += `        this.${fieldName} = ${fieldName};\n`;
        code += `    }\n\n`;
    }
    
    code += '}\n';
    
    // 生成嵌套类
    for (const nested of nestedClasses) {
        if (nested && nested.className && nested.fields) {
            const nestedCode = generateJavaClass(nested, [], generated);
            if (nestedCode) {
                code += '\n' + nestedCode;
            }
        }
    }
    
    return code;
}

// ==================== Golang转换 ====================
function convertToGolang() {
    try {
        const jsonInput = document.getElementById('json-input').value.trim();
        if (!jsonInput) {
            showError('请输入JSON数据！');
            return;
        }
        
        const jsonObj = JSON.parse(jsonInput);
        const structName = document.getElementById('class-name').value.trim() || 'Root';
        
        const parsed = parseJsonToClasses(jsonObj, structName, {});
        let result = `package main\n\n`;
        result += `import "encoding/json"\n\n`;
        result += generateGolangStruct(parsed, parsed.classes, new Set());
        
        displayResult(result, 'go');
    } catch (error) {
        showError('JSON解析失败：' + error.message);
    }
}

function generateGolangStruct(parsed, nestedClasses, generated = new Set()) {
    if (generated.has(parsed.className)) {
        return '';
    }
    generated.add(parsed.className);
    
    let code = `type ${parsed.className} struct {\n`;
    
    for (const field of parsed.fields) {
        const golangType = getGolangType(field.value, field.isArray);
        const type = field.isObject ? field.type : (field.isObjectArray ? `[]${field.type}` : golangType);
        const fieldName = toPascalCase(field.originalKey);
        const jsonTag = field.originalKey;
        code += `    ${fieldName} ${type} \`json:"${jsonTag}"\`\n`;
    }
    
    code += '}\n';
    
    // 生成嵌套结构体
    for (const nested of nestedClasses) {
        if (nested && nested.className && nested.fields) {
            const nestedCode = generateGolangStruct(nested, [], generated);
            if (nestedCode) {
                code += '\n' + nestedCode;
            }
        }
    }
    
    return code;
}

// ==================== Ruby转换 ====================
function convertToRuby() {
    try {
        const jsonInput = document.getElementById('json-input').value.trim();
        if (!jsonInput) {
            showError('请输入JSON数据！');
            return;
        }
        
        const jsonObj = JSON.parse(jsonInput);
        const className = document.getElementById('class-name').value.trim() || 'Root';
        
        const parsed = parseJsonToClasses(jsonObj, className, {});
        let result = `require 'json'\n\n`;
        result += generateRubyClass(parsed, parsed.classes, new Set());
        
        displayResult(result, 'ruby');
    } catch (error) {
        showError('JSON解析失败：' + error.message);
    }
}

function generateRubyClass(parsed, nestedClasses, generated = new Set()) {
    if (generated.has(parsed.className)) {
        return '';
    }
    generated.add(parsed.className);
    
    let code = `class ${parsed.className}\n`;
    code += `    attr_accessor `;
    
    const attrNames = parsed.fields.map(f => `:${toSnakeCase(f.originalKey)}`).join(', ');
    code += attrNames + '\n\n';
    
    code += `    def initialize(data = {})\n`;
    for (const field of parsed.fields) {
        const fieldName = toSnakeCase(field.originalKey);
        code += `        @${fieldName} = data['${field.originalKey}'] || data[:${field.originalKey}]\n`;
    }
    code += `    end\n\n`;
    
    code += `    def to_json(*args)\n`;
    code += `        {\n`;
    for (const field of parsed.fields) {
        const fieldName = toSnakeCase(field.originalKey);
        code += `            '${field.originalKey}' => @${fieldName},\n`;
    }
    code += `        }.to_json(*args)\n`;
    code += `    end\n`;
    code += `end\n`;
    
    // 生成嵌套类
    for (const nested of nestedClasses) {
        if (nested && nested.className && nested.fields) {
            const nestedCode = generateRubyClass(nested, [], generated);
            if (nestedCode) {
                code += '\n' + nestedCode;
            }
        }
    }
    
    return code;
}

// ==================== C#转换 ====================
function convertToCSharp() {
    try {
        const jsonInput = document.getElementById('json-input').value.trim();
        if (!jsonInput) {
            showError('请输入JSON数据！');
            return;
        }
        
        const jsonObj = JSON.parse(jsonInput);
        const className = document.getElementById('class-name').value.trim() || 'Root';
        const namespace = document.getElementById('package-name').value.trim();
        
        const parsed = parseJsonToClasses(jsonObj, className, {});
        let result = '';
        
        if (namespace) {
            result += `namespace ${namespace}\n{\n`;
        }
        
        result += `    using System.Collections.Generic;\n`;
        result += `    using Newtonsoft.Json;\n\n`;
        result += generateCSharpClass(parsed, parsed.classes, namespace ? '    ' : '', new Set());
        
        if (namespace) {
            result += '}\n';
        }
        
        displayResult(result, 'csharp');
    } catch (error) {
        showError('JSON解析失败：' + error.message);
    }
}

function generateCSharpClass(parsed, nestedClasses, indent = '', generated = new Set()) {
    if (generated.has(parsed.className)) {
        return '';
    }
    generated.add(parsed.className);
    
    let code = `${indent}public class ${parsed.className}\n${indent}{\n`;
    
    // 生成属性
    for (const field of parsed.fields) {
        const csharpType = getCSharpType(field.value, field.isArray);
        const type = field.isObject ? field.type : (field.isObjectArray ? `List<${field.type}>` : csharpType);
        const propertyName = toPascalCase(field.originalKey);
        const jsonProperty = field.originalKey;
        code += `${indent}    [JsonProperty("${jsonProperty}")]\n`;
        code += `${indent}    public ${type} ${propertyName} { get; set; }\n\n`;
    }
    
    code += `${indent}}\n`;
    
    // 生成嵌套类
    for (const nested of nestedClasses) {
        if (nested && nested.className && nested.fields) {
            const nestedCode = generateCSharpClass(nested, [], indent, generated);
            if (nestedCode) {
                code += '\n' + nestedCode;
            }
        }
    }
    
    return code;
}

// ==================== Rust转换 ====================
function convertToRust() {
    try {
        const jsonInput = document.getElementById('json-input').value.trim();
        if (!jsonInput) {
            showError('请输入JSON数据！');
            return;
        }
        
        const jsonObj = JSON.parse(jsonInput);
        const structName = document.getElementById('class-name').value.trim() || 'Root';
        
        const parsed = parseJsonToClasses(jsonObj, structName, {});
        let result = `use serde::{Deserialize, Serialize};\nuse serde_json;\n\n`;
        result += generateRustStruct(parsed, parsed.classes, new Set());
        
        displayResult(result, 'rust');
    } catch (error) {
        showError('JSON解析失败：' + error.message);
    }
}

function generateRustStruct(parsed, nestedClasses, generated = new Set()) {
    if (generated.has(parsed.className)) {
        return '';
    }
    generated.add(parsed.className);
    
    let code = `#[derive(Debug, Serialize, Deserialize)]\n`;
    code += `pub struct ${parsed.className} {\n`;
    
    for (const field of parsed.fields) {
        const rustType = getRustType(field.value, field.isArray);
        const type = field.isObject ? field.type : (field.isObjectArray ? `Vec<${field.type}>` : rustType);
        const fieldName = toSnakeCase(field.originalKey);
        const serdeName = field.originalKey;
        code += `    #[serde(rename = "${serdeName}")]\n`;
        code += `    pub ${fieldName}: ${type},\n`;
    }
    
    code += '}\n';
    
    // 生成嵌套结构体
    for (const nested of nestedClasses) {
        if (nested && nested.className && nested.fields) {
            const nestedCode = generateRustStruct(nested, [], generated);
            if (nestedCode) {
                code += '\n' + nestedCode;
            }
        }
    }
    
    return code;
}

// ==================== XML转换 ====================
function convertToXML() {
    try {
        const jsonInput = document.getElementById('json-input').value.trim();
        if (!jsonInput) {
            showError('请输入JSON数据！');
            return;
        }
        
        const jsonObj = JSON.parse(jsonInput);
        const rootName = document.getElementById('class-name').value.trim() || 'root';
        
        const xml = jsonToXml(jsonObj, rootName);
        displayResult('<?xml version="1.0" encoding="UTF-8"?>\n' + xml, 'xml');
    } catch (error) {
        showError('JSON解析失败：' + error.message);
    }
}

function jsonToXml(obj, rootName = 'root', indent = '') {
    let xml = `${indent}<${rootName}>\n`;
    
    for (const [key, value] of Object.entries(obj)) {
        if (value === null) {
            xml += `${indent}    <${key}></${key}>\n`;
        } else if (typeof value === 'object' && !Array.isArray(value)) {
            xml += jsonToXml(value, key, indent + '    ');
        } else if (Array.isArray(value)) {
            for (const item of value) {
                if (typeof item === 'object') {
                    xml += jsonToXml(item, key, indent + '    ');
                } else {
                    xml += `${indent}    <${key}>${escapeXml(String(item))}</${key}>\n`;
                }
            }
        } else {
            xml += `${indent}    <${key}>${escapeXml(String(value))}</${key}>\n`;
        }
    }
    
    xml += `${indent}</${rootName}>\n`;
    return xml;
}

function escapeXml(str) {
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;')
              .replace(/'/g, '&apos;');
}

// ==================== YAML转换 ====================
function convertToYAML() {
    try {
        const jsonInput = document.getElementById('json-input').value.trim();
        if (!jsonInput) {
            showError('请输入JSON数据！');
            return;
        }
        
        const jsonObj = JSON.parse(jsonInput);
        const yaml = jsonToYaml(jsonObj, 0);
        displayResult(yaml, 'yaml');
    } catch (error) {
        showError('JSON解析失败：' + error.message);
    }
}

function jsonToYaml(obj, indent = 0) {
    const indentStr = '  '.repeat(indent);
    let yaml = '';
    
    if (Array.isArray(obj)) {
        for (const item of obj) {
            if (typeof item === 'object' && !Array.isArray(item)) {
                yaml += `${indentStr}- `;
                const itemYaml = jsonToYaml(item, indent + 1);
                const lines = itemYaml.split('\n');
                yaml += lines[0] + '\n';
                for (let i = 1; i < lines.length; i++) {
                    if (lines[i].trim()) {
                        yaml += '  ' + lines[i] + '\n';
                    }
                }
            } else {
                yaml += `${indentStr}- ${formatYamlValue(item)}\n`;
            }
        }
    } else {
        for (const [key, value] of Object.entries(obj)) {
            if (value === null) {
                yaml += `${indentStr}${key}: null\n`;
            } else if (typeof value === 'object' && !Array.isArray(value)) {
                yaml += `${indentStr}${key}:\n`;
                yaml += jsonToYaml(value, indent + 1);
            } else if (Array.isArray(value)) {
                yaml += `${indentStr}${key}:\n`;
                yaml += jsonToYaml(value, indent + 1);
            } else {
                yaml += `${indentStr}${key}: ${formatYamlValue(value)}\n`;
            }
        }
    }
    
    return yaml;
}

function formatYamlValue(value) {
    if (typeof value === 'string') {
        if (value.includes(':') || value.includes('\n') || value.includes('"') || value.includes("'")) {
            return `"${value.replace(/"/g, '\\"')}"`;
        }
        return value;
    }
    return String(value);
}

// ==================== 工具函数 ====================
function displayResult(code, language) {
    const output = document.getElementById('output-result');
    output.textContent = code;
    output.className = `language-${language}`;
    
    if (typeof hljs !== 'undefined') {
        hljs.highlightElement(output);
    }
}

function showError(message) {
    const output = document.getElementById('output-result');
    output.textContent = '错误：' + message;
    output.className = 'language-text';
}

function clearAll() {
    document.getElementById('json-input').value = '';
    document.getElementById('class-name').value = '';
    document.getElementById('package-name').value = '';
    document.getElementById('output-result').textContent = '';
}

function loadSample() {
    const sample = {
        "id": 1,
        "name": "张三",
        "age": 28,
        "email": "zhangsan@example.com",
        "isActive": true,
        "salary": 15000.50,
        "address": {
            "city": "北京",
            "district": "朝阳区",
            "street": "建国路88号"
        },
        "hobbies": ["阅读", "旅游", "摄影"],
        "tags": ["程序员", "Java开发者"],
        "metadata": {
            "createdAt": "2023-01-01",
            "updatedAt": "2023-12-01"
        }
    };
    
    document.getElementById('json-input').value = JSON.stringify(sample, null, 2);
    document.getElementById('class-name').value = 'User';
    document.getElementById('package-name').value = 'com.example.model';
}

function copyResult() {
    const output = document.getElementById('output-result');
    const text = output.textContent;
    
    if (!text || text.startsWith('错误：')) {
        return;
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
            const originalText = output.textContent;
            output.textContent = '已复制到剪贴板！';
            setTimeout(() => {
                output.textContent = originalText;
                if (typeof hljs !== 'undefined') {
                    hljs.highlightElement(output);
                }
            }, 1500);
        }).catch(err => {
            alert('复制失败：' + err);
        });
    } else {
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
                if (typeof hljs !== 'undefined') {
                    hljs.highlightElement(output);
                }
            }, 1500);
        } catch (err) {
            alert('复制失败，请手动选择文本复制');
        }
        document.body.removeChild(textarea);
    }
}
