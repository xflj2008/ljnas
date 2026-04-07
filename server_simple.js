/**
 * 舍得日报 - 简单版服务端
 * 照片用 base64 传输，纯 JSON
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { generateReport } = require('./server/docx_js');

const PORT = process.env.PORT || 3001;
const OUTPUT_DIR = '/tmp/sheda-reports';
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  // GET static files
  if (req.method === 'GET') {
    let url = req.url.split('?')[0];
    if (url === '/') url = '/index.html';
    if (url === '/favicon.ico') { res.writeHead(204); res.end(); return; }

    const filePath = path.join(__dirname, url);
    const ext = path.extname(filePath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found: ' + url);
    }
    return;
  }

  // POST /api/generate
  if (req.method === 'POST' && req.url === '/api/generate') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { date, weather, content, photos = [] } = JSON.parse(body);

        // 保存 base64 照片到临时文件
        const photoPaths = [];
        for (const photo of photos.slice(0, 2)) {
          const { data, name } = photo;
          const ext = name?.endsWith('.png') ? '.png' : '.jpg';
          const tmpPath = path.join('/tmp', `photo_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
          const buf = Buffer.from(data, 'base64');
          fs.writeFileSync(tmpPath, buf);
          photoPaths.push(tmpPath);
        }

        const dateStr = date || new Date().toISOString().slice(0, 10);
        const outPath = path.join(OUTPUT_DIR, `report_${dateStr.replace(/-/g,'')}.docx`);

        await generateReport({
          date: dateStr,
          weather: weather || '',
          content: content || {},
          photoPaths,
          outputPath: outPath,
        });

        const buf = fs.readFileSync(outPath);
        res.writeHead(200, {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="report_${dateStr}.docx"; filename*=UTF-8''${encodeURIComponent(`舍得日报_${dateStr}.docx`)}`,
          'Content-Length': buf.length,
        });
        res.end(buf);

        // 清理临时文件
        photoPaths.forEach(p => { try { fs.unlinkSync(p); } catch(e){} });
        setTimeout(() => { try { fs.unlinkSync(outPath); } catch(e){} }, 300000);

      } catch(e) {
        console.error('Generate error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`舍得日报服务已启动: http://0.0.0.0:${PORT}`);
});
