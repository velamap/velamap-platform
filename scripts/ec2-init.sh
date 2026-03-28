#!/bin/bash
# EC2 Ubuntu 24 一次性初始化脚本
# 运行: bash scripts/ec2-init.sh

set -e

echo "=== 安装 Docker ==="
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo usermod -aG docker $USER

echo "=== 创建 .env 文件 ==="
cat > ~/velamap-platform/.env << 'EOF'
GITHUB_REPOSITORY=wuyongpeng/velamap-platform
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=your-supabase-db-connection-string
ALLOWED_ORIGIN=https://velamap.com
EOF

echo ""
echo "=== 完成 ==="
echo "1. 编辑 ~/velamap-platform/.env 填入真实的环境变量"
echo "2. 重新登录使 docker 权限生效: exit && ssh ..."
echo "3. 然后运行: cd ~/velamap-platform && docker compose up -d"
