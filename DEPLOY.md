# 部署到 Render.com（免费）

## 需要你操作的步骤

### 第一步：把代码上传到 GitHub

1. 打开 https://github.com/new 创建新仓库，名字叫 `sheda-daily-report`
2. 把 `/home/liujie/.openclaw/workspace/projects/sheda-daily-report-pwa/` 里的文件上传到这个仓库

上传方法（命令行）：
```bash
cd /home/liujie/.openclaw/workspace/projects/sheda-daily-report-pwa
git init
git add .
git commit -m "舍得日报PWA"
git branch -M main
git remote add origin https://github.com/你的用户名/sheda-daily-report.git
git push -u origin main
```

### 第二步：Render 部署

1. 打开 https://render.com 并登录（用 GitHub 账号）
2. 点 **New → Web Service**
3. 连接到你的 GitHub 仓库 `sheda-daily-report`
4. 设置如下：
   - **Root Directory**: （留空）
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. 点 **Create Web Service**

6. 等构建完成后，Render 会给你一个 URL，比如：`https://sheda-daily-report.onrender.com`

### 第三步：使用

手机浏览器打开 Render 给的 URL 即可使用！

---

## 文件说明

```
sheda-daily-report-pwa/
├── index.html          # 前端页面
├── manifest.json       # PWA清单
├── package.json        # Node.js依赖配置
├── server_simple.js    # 服务端（照片接收+生成docx）
└── server/
    └── docx_js.js     # docx生成模块
```

## 注意事项

- Render 免费版 15分钟没请求会休眠，下次访问时会自动唤醒（等待约30秒）
- 如果想一直在线，可以升级付费版（约7美元/月）
- docx 生成依赖 `docx` npm 包，已在 package.json 中声明
