document.addEventListener('DOMContentLoaded', function() {
    const search = document.getElementById('port-search');
    const output = document.getElementById('port-output');
    const message = document.getElementById('port-message');
    const rows = [
        [20, 'TCP', 'FTP Data', 'FTP 数据传输'],
        [21, 'TCP', 'FTP Control', 'FTP 控制连接'],
        [22, 'TCP', 'SSH/SFTP', '远程登录和安全文件传输'],
        [23, 'TCP', 'Telnet', '远程登录'],
        [25, 'TCP', 'SMTP', '邮件发送'],
        [53, 'TCP/UDP', 'DNS', '域名解析'],
        [67, 'UDP', 'DHCP Server', '动态地址分配服务端'],
        [68, 'UDP', 'DHCP Client', '动态地址分配客户端'],
        [80, 'TCP', 'HTTP', 'Web 明文访问'],
        [110, 'TCP', 'POP3', '邮件接收'],
        [123, 'UDP', 'NTP', '网络时间同步'],
        [143, 'TCP', 'IMAP', '邮件接收'],
        [161, 'UDP', 'SNMP', '网络设备管理'],
        [389, 'TCP/UDP', 'LDAP', '目录服务'],
        [443, 'TCP', 'HTTPS', 'Web 加密访问'],
        [445, 'TCP', 'SMB', 'Windows 文件共享'],
        [465, 'TCP', 'SMTPS', '加密 SMTP'],
        [587, 'TCP', 'SMTP Submission', '邮件提交'],
        [993, 'TCP', 'IMAPS', '加密 IMAP'],
        [995, 'TCP', 'POP3S', '加密 POP3'],
        [1433, 'TCP', 'SQL Server', 'Microsoft SQL Server'],
        [1521, 'TCP', 'Oracle', 'Oracle 数据库'],
        [2049, 'TCP/UDP', 'NFS', '网络文件系统'],
        [2181, 'TCP', 'ZooKeeper', '分布式协调服务'],
        [2375, 'TCP', 'Docker API', 'Docker 明文 API'],
        [2376, 'TCP', 'Docker API TLS', 'Docker TLS API'],
        [3306, 'TCP', 'MySQL/MariaDB', 'MySQL 数据库'],
        [3389, 'TCP/UDP', 'RDP', 'Windows 远程桌面'],
        [5432, 'TCP', 'PostgreSQL', 'PostgreSQL 数据库'],
        [5601, 'TCP', 'Kibana', 'Elastic 可视化'],
        [5672, 'TCP', 'RabbitMQ AMQP', 'RabbitMQ 消息队列'],
        [5900, 'TCP', 'VNC', '远程桌面'],
        [6379, 'TCP', 'Redis', 'Redis 缓存'],
        [8000, 'TCP', 'Dev HTTP', '常见开发服务端口'],
        [8080, 'TCP', 'HTTP Alternate', '常见 Web 开发/代理端口'],
        [8443, 'TCP', 'HTTPS Alternate', '常见 HTTPS 替代端口'],
        [9000, 'TCP', 'MinIO/Sonatype', '常见对象存储/服务端口'],
        [9092, 'TCP', 'Kafka', 'Kafka 消息队列'],
        [9200, 'TCP', 'Elasticsearch', 'Elasticsearch HTTP API'],
        [9300, 'TCP', 'Elasticsearch Transport', 'Elasticsearch 集群通信'],
        [9418, 'TCP', 'Git', 'Git 协议'],
        [11211, 'TCP/UDP', 'Memcached', 'Memcached 缓存'],
        [27017, 'TCP', 'MongoDB', 'MongoDB 数据库']
    ];

    function setMessage(text, type) {
        message.textContent = text;
        message.className = `json-message ${type || ''}`.trim();
    }

    function render() {
        const keyword = search.value.trim().toLowerCase();
        const matched = rows.filter((row) => !keyword || row.join(' ').toLowerCase().includes(keyword));
        output.value = matched.map(([port, proto, service, desc]) => `${String(port).padEnd(8)} ${proto.padEnd(8)} ${service.padEnd(24)} ${desc}`).join('\n');
        setMessage(`找到 ${matched.length} 条端口记录。`, matched.length ? 'success' : 'error');
    }

    search.addEventListener('input', render);
    document.getElementById('port-clear-btn').addEventListener('click', () => {
        search.value = '';
        render();
    });
    render();
});
