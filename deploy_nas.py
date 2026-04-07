#!/usr/bin/env python3
"""上传到飞牛 NAS 并构建 Docker"""
import ftplib
import ssl
import os
import paramiko

NAS_HOST = "192.168.5.80"
NAS_USER = "liujie"
NAS_PASS = "Xflj1982.."
NAS_DIR  = "/openclaw临时/sheda-daily-report"
LOCAL_DIR = os.path.dirname(os.path.abspath(__file__))

files = [
    "Dockerfile",
    "package.json",
    "server_simple.js",
    "index.html",
    "manifest.json",
    "server/docx_js.js",
]

# 1. 上传文件
print("=== 连接飞牛 NAS ===")
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

ftp = ftplib.FTP_TLS(NAS_HOST, context=ctx, timeout=30)
ftp.login(NAS_USER, NAS_PASS)
ftp.prot_p()

# 创建目录
try:
    ftp.mkd(NAS_DIR)
except:
    pass

os.chdir(LOCAL_DIR)
for fname in files:
    local_path = fname
    remote_path = f"{NAS_DIR}/{fname}"
    print(f"上传 {fname}...")
    with open(local_path, "rb") as f:
        ftp.storbinary(f"STOR {remote_path}", f)

ftp.quit()
print("上传完成!")

# 2. SSH 执行 docker 构建
print("=== 构建 Docker 镜像 ===")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(NAS_HOST, username=NAS_USER, password=NAS_PASS, timeout=30)

# 构建
stdin, stdout, stderr = ssh.exec_command(f"cd {NAS_DIR} && docker build -t sheda-report . 2>&1")
output = stdout.read().decode()
err = stderr.read().decode()
print(output)
if err: print("ERR:", err)

# 运行
print("=== 启动容器 ===")
ssh.exec_command(f"cd {NAS_DIR} && docker rm -f sheda-report 2>/dev/null; docker run -d --name sheda-report -p 3001:3001 --restart always sheda-report 2>&1")
stdin, stdout, stderr = ssh.exec_command("docker ps --format '{{.Names}} {{.Status}}'")
print(stdout.read().decode())

ssh.close()
print(f"\n✅ 部署完成! 访问: http://{NAS_HOST}:3001")
