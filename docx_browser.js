/**
 * 舍得日报 - 纯浏览器端 docx 生成
 * 使用 docx.js CDN 版本，无须后端
 */
const docxPath = 'https://cdn.jsdelivr.net/npm/docx@9.6.1/dist/index.umd.cjs';

const WEEKDAY = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];

function dateDisplay(dateStr) {
  return `${dateStr.slice(0,4)}年${parseInt(dateStr.slice(5,7))}月${parseInt(dateStr.slice(8))}日`;
}

function weekDay(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return WEEKDAY[d.getDay()];
}

// 加载 docx 库（浏览器环境）
let docxLib = null;
async function loadDocx() {
  if (docxLib) return docxLib;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = docxPath;
    script.onload = () => {
      docxLib = window.Docx;
      resolve(docxLib);
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function generateDocx({ date, weather, content, photoBase64s }) {
  const Docx = await loadDocx();
  const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Table, TableRow, TableCell, WidthType } = Docx;

  const dateStr = dateDisplay(date);
  const wd = weekDay(date);
  const children = [];

  // 主标题
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: 520 },
    children: [new TextRun({ text: '工程日报', font: '宋体', size: 44, bold: true })],
  }));

  // 日期天气
  children.push(new Paragraph({
    spacing: { line: 300 },
    children: [new TextRun({ text: `日期：${dateStr} ${wd} 天气：${weather}`, font: '宋体', size: 24 })],
  }));

  // 项目名
  children.push(new Paragraph({
    spacing: { line: 300 },
    children: [new TextRun({ text: '项目名称：舍得酒业酒文化博物馆建设项目夯土墙施工日报', font: '宋体', size: 24 })],
  }));

  children.push(new Paragraph({ children: [] }));

  const sections = [
    { title: '一、基本情况', lines: content.基本情况 || [] },
    { title: '二、人员设备', lines: content.人员设备 || [] },
    { title: '三、当日完成', lines: content.当日完成 || [] },
    { title: '四、次日计划', lines: content.次日计划 || [] },
    { title: '五、需要协调解决问题', lines: [content.协调问题 || '无'] },
  ];

  for (const sec of sections) {
    children.push(new Paragraph({
      spacing: { line: 300 },
      children: [new TextRun({ text: sec.title, font: '宋体', size: 24, bold: true })],
    }));
    for (const line of sec.lines) {
      children.push(new Paragraph({
        spacing: { line: 300 },
        indent: { firstLine: 480 },
        children: [new TextRun({ text: line, font: '宋体', size: 24 })],
      }));
    }
    children.push(new Paragraph({ children: [] }));
  }

  // 照片
  if (photoBase64s && photoBase64s.length > 0) {
    const cells = [];
    for (const { data, name } of photoBase64s.slice(0, 2)) {
      try {
        const mediaType = name?.endsWith('.png') ? 'image/png' : 'image/jpeg';
        const imgRun = new ImageRun({
          data: data,
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

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBlob(doc);
}

// 直接下载
async function generateAndDownload({ date, weather, content, photos }) {
  const blob = await generateDocx({ date, weather, content, photoBase64s: photos });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const dateStr = date.replace(/-/g, '');
  a.href = url;
  a.download = `舍得酒业夯土墙施工日报_${dateStr}.docx`;
  a.click();
  URL.revokeObjectURL(url);
}
