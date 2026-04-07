/**
 * 舍得日报 - 纯JS docx生成模块
 * 依赖: npm install docx
 */
const { Document, Packer, Paragraph, TextRun, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle, ImageRun, ShadingType } = require('docx');
const fs = require('fs');
const path = require('path');

const WEEKDAY = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];

function dateDisplay(dateStr) {
  return `${dateStr.slice(0,4)}年${parseInt(dateStr.slice(5,7))}月${parseInt(dateStr.slice(8))}日`;
}

function weekDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return WEEKDAY[d.getDay()];
}

function makeParagraph(text, opts = {}) {
  const { fontSize = 12, fontName = '宋体', bold = false, align = AlignmentType.LEFT, lineSpacing = 1.25, indent = 0 } = opts;
  return new Paragraph({
    alignment: align,
    spacing: { line: lineSpacing * 240, lineRule: 'auto' },
    indent: indent ? { firstLine: indent } : undefined,
    children: [new TextRun({ text, font: fontName, size: fontSize * 2, bold, color: opts.color })],
  });
}

async function generateReport({ date, weather, content, photoPaths, outputPath }) {
  const dateStr = dateDisplay(date);
  const wd = weekDay(date);

  const children = [];

  // 主标题
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 520, lineRule: 'auto' },
    children: [new TextRun({ text: '工程日报', font: '宋体', size: 44, bold: true })],
  }));

  // 日期天气
  children.push(makeParagraph(`日期：${dateStr} ${wd} 天气：${weather}`, { fontSize: 12, indent: 0 }));

  // 项目名
  children.push(makeParagraph('项目名称：舍得酒业酒文化博物馆建设项目夯土墙施工日报', { fontSize: 12 }));

  children.push(new Paragraph({ children: [] }));

  const sections = [
    { title: '一、基本情况', lines: content.基本情况 || [] },
    { title: '二、人员设备', lines: content.人员设备 || [] },
    { title: '三、当日完成', lines: content.当日完成 || [] },
    { title: '四、次日计划', lines: content.次日计划 || [] },
    { title: '五、需要协调解决问题', lines: [content.协调问题 || '无'] },
  ];

  for (const sec of sections) {
    children.push(makeParagraph(sec.title, { fontSize: 12, bold: true, indent: 0 }));
    for (const line of sec.lines) {
      children.push(makeParagraph(line, { fontSize: 12, indent: 24 }));
    }
    children.push(new Paragraph({ children: [] }));
  }

  // 照片
  if (photoPaths && photoPaths.length > 0) {
    const cells = [];
    for (const photoPath of photoPaths.slice(0, 2)) {
      try {
        const img = fs.readFileSync(photoPath);
        const ext = path.extname(photoPath).toLowerCase();
        const mediaType = ext === '.png' ? 'image/png' : 'image/jpeg';
        const base64 = img.toString('base64');
        const imgRun = new ImageRun({
          data: Buffer.from(base64, 'base64'),
          transformation: { width: 118, height: 88 },
          type: mediaType,
        });
        cells.push(new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [imgRun] })],
        }));
        cells.push(new TableCell({
          width: { size: 50, type: WidthType.PERCENTAGE },
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: '三级教育培训', font: '宋体', size: 21 })],
          })],
        }));
      } catch(e) {
        console.error('Photo error:', e.message);
      }
    }

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TableRow({ children: cells })],
    }));
  }

  const doc = new Document({
    sections: [{ children }],
  });

  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buf);
  return outputPath;
}

module.exports = { generateReport };
