# 舍得日报 PWA 使用说明

## 功能
- 移动端优化的施工日报生成工具
- 可添加到手机主屏幕，像原生 App 一样使用
- 自动获取当天天气
- 支持照片上传
- 生成标准格式 .docx 日报文件

## 访问地址

**在同一 WiFi 下，用手机浏览器打开：**

```
http://192.168.5.122:3001
```

## 安装到手机（像 App 一样用）

### Android
1. 用 Chrome 打开上面的地址
2. 点右上角菜单 `⋮`
3. 选择「添加到主屏幕」或「安装应用」

### iPhone
1. 用 Safari 打开上面的地址
2. 点底部分享按钮 `↗`
3. 选择「添加到主屏幕」

## 启动服务

如果服务停了，运行：
```bash
node /home/liujie/.openclaw/workspace/projects/sheda-daily-report-pwa/server/server.js
```

## 文件位置
- 前端：`projects/sheda-daily-report-pwa/index.html`
- 服务端：`projects/sheda-daily-report-pwa/server/server.js`
- Python生成模块：`projects/sheda-daily-report-pwa/server/docx_gen.py`
