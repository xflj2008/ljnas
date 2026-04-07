#!/bin/bash
# 飞牛 NAS 部署脚本
# 用法: bash deploy.sh

NAS_HOST="192.168.5.80"
NAS_USER="liujie"
NAS_PASS="Xflj1982.."
NAS_DIR="/openclaw临时/sheda-daily-report"

echo "=== 连接到飞牛 NAS ==="

# 创建远程目录
echo "创建目录..."
sshpass -p "$NAS_PASS" ssh -o StrictHostKeyChecking=no $NAS_USER@$NAS_HOST "mkdir -p $NAS_DIR"

# 上传文件
echo "上传文件..."
sshpass -p "$NAS_PASS" scp -o StrictHostKeyChecking=no \
  Dockerfile package.json server_simple.js server/docx_js.js index.html manifest.json \
  $NAS_USER@$NAS_HOST:$NAS_DIR/

echo "=== 构建 Docker 镜像 ==="
sshpass -p "$NAS_PASS" ssh -o StrictHostKeyChecking=no $NAS_USER@$NAS_HOST "cd $NAS_DIR && docker build -t sheda-report . && docker rm -f sheda-report || true && docker run -d --name sheda-report -p 3001:3001 --restart always sheda-report"

echo "=== 部署完成 ==="
echo "访问地址: http://$NAS_HOST:3001"
