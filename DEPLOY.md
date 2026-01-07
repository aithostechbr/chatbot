# 🚀 Deploy do Chatbot Aithos Tech - 24/7

## Opção 1: VPS (Recomendado) - ~R$20-50/mês

### Provedores recomendados:
- **Hostinger VPS** - A partir de R$19/mês
- **DigitalOcean** - $6/mês (Droplet básico)
- **Contabo** - €4.99/mês (melhor custo-benefício)
- **Oracle Cloud** - GRÁTIS (Always Free Tier)

### Passos para deploy em VPS Ubuntu:

```bash
# 1. Conectar via SSH
ssh root@seu-ip

# 2. Atualizar sistema
apt update && apt upgrade -y

# 3. Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs

# 4. Instalar PM2 globalmente
npm install -g pm2

# 5. Instalar dependências do Puppeteer
apt install -y chromium-browser libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2

# 6. Criar pasta do projeto
mkdir -p /var/www/chatbot
cd /var/www/chatbot

# 7. Fazer upload dos arquivos (via SFTP ou git)
# Use FileZilla ou WinSCP para enviar os arquivos

# 8. Instalar dependências
npm install

# 9. Primeira execução (para escanear QR Code)
node chatbot.js

# 10. Após conectar, parar com Ctrl+C e iniciar com PM2
pm2 start ecosystem.config.js

# 11. Configurar inicialização automática
pm2 startup
pm2 save

# 12. Verificar status
pm2 status
pm2 logs aithos-bot
```

---

## Opção 2: Railway.app (Mais fácil) - ~$5/mês

1. Crie conta em https://railway.app
2. Conecte seu GitHub
3. Crie novo projeto > Deploy from GitHub
4. Selecione o repositório do chatbot
5. O QR Code aparece nos logs

**⚠️ Problema:** Difícil escanear QR Code nos logs

---

## Opção 3: Render.com - Gratuito (com limitações)

1. Crie conta em https://render.com
2. Novo Web Service > Connect GitHub
3. Configure:
   - Build Command: `npm install`
   - Start Command: `node chatbot.js`

**⚠️ Problema:** Serviço dorme após 15 min de inatividade

---

## Opção 4: Oracle Cloud (GRÁTIS para sempre)

### Criar VM Always Free:
1. Crie conta em https://cloud.oracle.com
2. Compute > Instances > Create Instance
3. Selecione **Always Free** (VM.Standard.E2.1.Micro)
4. Ubuntu 22.04
5. Gerar chave SSH

### Após criar, siga os passos da Opção 1 (VPS)

---

## Opção 5: Google Cloud (GRÁTIS - 90 dias + Always Free)

### e2-micro gratuito:
1. Crie conta em https://cloud.google.com (ganhe $300 créditos)
2. Compute Engine > VM Instances > Create
3. Selecione **e2-micro** (gratuito para sempre em algumas regiões)
4. Regiões gratuitas: us-west1, us-central1, us-east1
5. Ubuntu 22.04

**✅ Vantagem:** Interface mais fácil que Oracle

---

## Opção 6: AWS Free Tier (GRÁTIS - 12 meses)

### EC2 t2.micro gratuito por 1 ano:
1. Crie conta em https://aws.amazon.com
2. EC2 > Launch Instance
3. Selecione **t2.micro** (Free Tier eligible)
4. Ubuntu 22.04
5. Após 12 meses, migre para outra opção gratuita

---

## Opção 7: Fly.io (GRÁTIS - tier generoso)

### 3 VMs gratuitas:
1. Crie conta em https://fly.io
2. Instale CLI: `curl -L https://fly.io/install.sh | sh`
3. No projeto: `fly launch`
4. Deploy: `fly deploy`

**✅ Vantagem:** Não precisa de cartão de crédito para começar

---

## Opção 8: Seu próprio PC (GRÁTIS)

### Deixar seu computador ligado 24/7:

```powershell
# No Windows, configurar para não desligar
powercfg -change -standby-timeout-ac 0
powercfg -change -monitor-timeout-ac 0

# Iniciar bot com PM2
pm2 start ecosystem.config.js
pm2 save

# Criar script de inicialização automática
pm2 startup
```

**⚠️ Desvantagens:**
- Gasto de energia elétrica (~R$30-50/mês)
- Se a internet cair, o bot para
- Computador precisa ficar sempre ligado

---

## 🏆 Ranking das opções GRATUITAS:

| Opção | Duração | Dificuldade | Recomendação |
|-------|---------|-------------|--------------|
| **Oracle Cloud** | ♾️ Sempre | ⭐⭐⭐ | 🥇 Melhor opção |
| **Google Cloud** | ♾️ Sempre* | ⭐⭐ | 🥈 Mais fácil |
| **Fly.io** | ♾️ Sempre | ⭐⭐ | 🥉 Sem cartão |
| **AWS** | 12 meses | ⭐⭐⭐ | Temporário |
| **Seu PC** | ♾️ Sempre | ⭐ | Gasta luz |

*\*Em regiões específicas dos EUA*

---

## 📋 Checklist antes do deploy

- [ ] Testar bot localmente
- [ ] Verificar se WhatsApp está conectado
- [ ] Copiar pasta `.wwebjs_auth` (sessão do WhatsApp)
- [ ] Verificar número do admin no `CONFIG.adminNumber`

---

## 🔧 Comandos úteis PM2

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs aithos-bot

# Reiniciar
pm2 restart aithos-bot

# Parar
pm2 stop aithos-bot

# Monitoramento
pm2 monit
```

---

## ⚠️ Importante sobre o QR Code

Na primeira execução em um servidor novo, você precisa escanear o QR Code.

**Solução:** Execute `node chatbot.js` diretamente no terminal SSH, escaneie o QR, e depois inicie com PM2.

A sessão fica salva na pasta `.wwebjs_auth` e não precisa escanear novamente.
