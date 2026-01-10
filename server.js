const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, req.url === '/' ? 'countdown.html' : req.url);
    
    try {
        const content = fs.readFileSync(filePath);
        const ext = path.extname(filePath);
        const contentType = ext === '.html' ? 'text/html' : 'text/plain';
        res.writeHead(200, {'Content-Type': contentType});
        res.end(content);
    } catch(e) {
        res.writeHead(404);
        res.end('File not found');
    }
});

server.listen(8000, () => {
    console.log('Server running at http://localhost:8000');
    console.log('Countdown: http://localhost:8000/countdown.html');
    console.log('Admin: http://localhost:8000/admin.html?key=admin2025');
});