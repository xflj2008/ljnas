const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = 3001;
const UPLOAD_DIR = '/tmp/sheda-uploads';
const OUTPUT_DIR = '/tmp/sheda-reports';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const filePath = path.join(__dirname, '..', 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  if (req.url === '/manifest.json') {
    const filePath = path.join(__dirname, '..', 'manifest.json');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  if (req.method === 'POST' && req.url === '/api/sheda-report') {
    const boundary = req.headers['content-type']?.split('boundary=')[1];
    if (!boundary) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'No boundary' }));
      return;
    }

    try {
      const { fields, files } = await parseMultipart(req, boundary, UPLOAD_DIR);

      const date = fields.date || new Date().toISOString().slice(0, 10);
      const weather = fields.weather || '';
      const content = JSON.parse(fields.content || '{}');
      const photos = files.photos || [];

      const dateStr = date.replace(/-/g, '');
      const outputPath = path.join(OUTPUT_DIR, `report_${dateStr}_${Date.now()}.docx`);

      // 调用Python生成docx
      const args = [
        path.join(__dirname, 'docx_gen.py'),
        '--date', date,
        '--weather', weather,
        '--content', JSON.stringify(content),
        '--output', outputPath,
        ...(photos.length ? ['--photos', ...photos] : [])
      ];

      await new Promise((resolve, reject) => {
        const py = spawn('python3', args);
        let err = '';
        py.stderr.on('data', d => err += d.toString());
        py.on('close', code => code === 0 ? resolve() : reject(new Error(err || 'Python error')));
      });

      res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="report_${dateStr}.docx"`
      });
      fs.createReadStream(outputPath).pipe(res);

      // 清理上传文件
      photos.forEach(f => { try { fs.unlinkSync(f); } catch(e){} });
      setTimeout(() => { try { fs.unlinkSync(outputPath); } catch(e){} }, 60000);

    } catch(e) {
      console.error('Error:', e.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e.message }));
    }
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

function parseMultipart(req, boundary, uploadDir) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const data = Buffer.concat(chunks);
      const parts = data.toString('binary').split(`--${boundary}`);

      const fields = {};
      const files = {};

      for (const part of parts) {
        if (!part || !part.includes('\r\n\r\n')) continue;

        const [header, ...bodyParts] = part.split('\r\n\r\n');
        const body = bodyParts.join('\r\n\r\n');

        const nameMatch = header.match(/name="([^"]+)"/);
        const filenameMatch = header.match(/filename="([^"]+)"/);
        if (!nameMatch) continue;

        const fieldName = nameMatch[1];

        if (filenameMatch) {
          const filename = filenameMatch[1];
          if (!filename) continue;
          const ext = path.extname(filename);
          const tmpPath = path.join(uploadDir, `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
          fs.writeFileSync(tmpPath, body.slice(0, -2)); // 去掉末尾\r\n
          if (!files[fieldName]) files[fieldName] = [];
          files[fieldName].push(tmpPath);
        } else {
          fields[fieldName] = body.trim();
        }
      }

      resolve({ fields, files });
    });
    req.on('error', reject);
  });
}

server.listen(PORT, () => {
  console.log(`舍得日报PWA服务已启动: http://localhost:${PORT}`);
  console.log(`访问地址: http://YOUR_IP:${PORT}`);
});
