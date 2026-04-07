/**
 * 舍得日报 - 服务端（支持邮件发送）
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const { generateReport } = require('./server/docx_js');

const PORT = process.env.PORT || 3001;

// QQ邮箱SMTP配置
const SMTP_CONFIG = {
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  auth: {
    user: '860635641@qq.com',
    pass: 'dyynqfvgpiggbfgc'  // QQ邮箱授权码
  }
};

const transporter = nodemailer.createTransport(SMTP_CONFIG);

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

  // POST /api/send-email - 发送邮件
  if (req.method === 'POST' && req.url === '/api/send-email') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', async () => {
      try {
        const { toEmail, date, weather, content, photos = [] } = JSON.parse(body);

        if (!toEmail || !toEmail.includes('@')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: '请输入正确的邮箱地址' }));
          return;
        }

        // 保存照片
        const photoPaths = [];
        for (const photo of photos.slice(0, 2)) {
          const ext = photo.name?.endsWith('.png') ? '.png' : '.jpg';
          const tmpPath = path.join('/tmp', `photo_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`);
          fs.writeFileSync(tmpPath, Buffer.from(photo.data, 'base64'));
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

        // 发送邮件
        const dateDisplay = `${dateStr.slice(0,4)}年${parseInt(dateStr.slice(5,7))}月${parseInt(dateStr.slice(8))}日`;
        await transporter.sendMail({
          from: '"舍得日报系统" <860635641@qq.com>',
          to: toEmail,
          subject: `舍得酒业夯土墙施工日报_${dateDisplay}`,
          text: `舍得酒业酒文化博物馆建设项目夯土墙施工日报\n日期：${dateDisplay}\n\n请查收附件中的日报文档。`,
          attachments: [
            {
              filename: `舍得酒业夯土墙施工日报_${dateStr.replace(/-/g,'')}.docx`,
              path: outPath
            }
          ]
        });

        // 清理
        photoPaths.forEach(p => { try { fs.unlinkSync(p); } catch(e){} });
        setTimeout(() => { try { fs.unlinkSync(outPath); } catch(e){} }, 300000);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: '已发送到 ' + toEmail }));

      } catch(e) {
        console.error('Email error:', e.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: '发送失败：' + e.message }));
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
