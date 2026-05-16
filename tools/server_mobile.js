const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3399;
const DIR = __dirname;

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.png':  'image/png',
    '.jpg':  'image/jpeg',
    '.gif':  'image/gif',
    '.json': 'application/json',
};

const server = http.createServer((req, res) => {
    let filePath = path.join(DIR, req.url === '/' ? '/game_mobile.html' : req.url);
    const ext = path.extname(filePath);
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            // 返回文件列表
            if (req.url === '/') {
                fs.readdir(DIR, (e, files) => {
                    const list = files.filter(f => f.endsWith('.html'))
                        .map(f => `<li><a href="/${f}">${f}</a></li>`).join('');
                    res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
                    res.end(`<h2>游戏文件列表</h2><ul>${list}</ul>`);
                });
            } else {
                res.writeHead(404);
                res.end('Not found: ' + req.url);
            }
            return;
        }
        res.writeHead(200, {
            'Content-Type': mime[ext] || 'text/plain',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'no-cache',
        });
        res.end(data);
        console.log(`[${new Date().toLocaleTimeString()}] ${req.url}`);
    });
});

server.listen(PORT, '0.0.0.0', () => {
    const os = require('os');
    const nets = os.networkInterfaces();
    console.log('\n=============================');
    console.log('  游戏服务器已启动！');
    console.log('=============================');
    Object.values(nets).flat().filter(n => n.family === 'IPv4' && !n.internal).forEach(n => {
        console.log(`  手机访问: http://${n.address}:${PORT}/game_mobile.html`);
    });
    console.log('=============================\n');
});
