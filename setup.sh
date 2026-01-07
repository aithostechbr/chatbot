#!/bin/bash
# ===========================================
# SCRIPT DE INSTALAÇÃO AUTOMÁTICA - AITHOS BOT
# Execute: bash setup.sh
# ===========================================

echo "🚀 Iniciando instalação do Aithos Chatbot..."
echo ""

# Atualizar sistema
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20
echo "📦 Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalação
echo "✅ Node.js instalado: $(node -v)"
echo "✅ NPM instalado: $(npm -v)"

# Instalar PM2
echo "📦 Instalando PM2..."
sudo npm install -g pm2

# Instalar dependências do Chromium/Puppeteer
echo "📦 Instalando dependências do navegador..."
sudo apt install -y \
    chromium-browser \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    fonts-liberation \
    --no-install-recommends

# Criar pasta do projeto
echo "📁 Criando pasta do projeto..."
mkdir -p ~/chatbot
cd ~/chatbot

# Instalar dependências do projeto
echo "📦 Instalando dependências do projeto..."
npm install

echo ""
echo "✅ =========================================="
echo "✅ INSTALAÇÃO CONCLUÍDA!"
echo "✅ =========================================="
echo ""
echo "📋 Próximos passos:"
echo "   1. Faça upload dos arquivos do chatbot para ~/chatbot"
echo "   2. Execute: cd ~/chatbot && npm install"
echo "   3. Execute: node chatbot.js (para escanear QR Code)"
echo "   4. Após conectar, pressione Ctrl+C"
echo "   5. Execute: pm2 start ecosystem.config.js"
echo "   6. Execute: pm2 save && pm2 startup"
echo ""
