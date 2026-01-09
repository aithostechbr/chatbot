const qrcode = require("qrcode-terminal");
const { Client, LocalAuth } = require("whatsapp-web.js");

const CONFIG = {
  delays: { typing: 1500, beforeSend: 1500 },
  formLink: "https://aithostech.com/briefing",
  adminNumber: ["5511996961151@c.us", "5511947813352@c.us", "5511968551256@c.us", "5511945402503@c.us"],
  cooldownMs: 30000,
  sessionTimeout: 600000,
  maxReconnectAttempts: 5,
  puppeteer: {
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--single-process"],
  },
};

const userSessions = new Map();
const stats = { messagesSent: 0, messagesReceived: 0, errors: 0, startTime: Date.now() };
let reconnectAttempts = 0;

const FLOW_STATES = {
  IDLE: "idle",
  MENU: "menu",
  SERVICE_SELECTED: "service_selected",
  COLLECTING_NAME: "collecting_name",
  COLLECTING_NAME_ATTENDANT: "collecting_name_attendant",
  COLLECTING_BUSINESS: "collecting_business",
  COLLECTING_DETAILS: "collecting_details",
  COLLECTING_BUDGET: "collecting_budget",
  COLLECTING_DEADLINE: "collecting_deadline",
  WAITING_ATTENDANT: "waiting_attendant",
  FINISHED: "finished",
};

const SERVICES = {
  "1": { name: "Sites e Soluções Web", emoji: "🌐" },
  "2": { name: "Sistemas e Ferramentas", emoji: "🔧" },
  "3": { name: "Produtos Digitais Criativos", emoji: "✨" },
  "4": { name: "Automação & Comunicação", emoji: "💬" },
  "5": { name: "Outro / Não sei ainda", emoji: "🤔" },
  "6": { name: "Falar com atendente", emoji: "👤" },
};

const MESSAGES = {
  welcome: (saudacao) => `
${saudacao}! 👋  
Seja bem-vindo(a) à *Aithos Tech* 🚀

🤖 Sou o assistente virtual e vou te ajudar a entender melhor nossas soluções.

Para começar, *digite o número* da área que mais te interessa:

━━━━━━━━━━━━━━━━━━
🌐 *1.* Sites e Soluções Web
   _Landing pages, portfólios, cardápios digitais_

🔧 *2.* Sistemas e Ferramentas
   _Agendamento, estoque, formulários, integrações_

✨ *3.* Produtos Digitais Criativos
   _Convites digitais, sites românticos, contadores_

💬 *4.* Automação & Comunicação
   _Newsletters, chatbots, automações_

🤔 *5.* Outro / Não sei ainda
   _Me conta sua ideia que ajudo!_

👤 *6.* Falar com atendente
   _Atendimento humano_
━━━━━━━━━━━━━━━━━━

📝 *Responda com o número (1 a 6)*
  `.trim(),

  serviceDetails: {
    "1": `
🌐 *Sites e Soluções Web*

Desenvolvemos soluções web sob medida:

• *Landing Pages* — Páginas de alta conversão para vendas
• *Portfólios* — Mostre seu trabalho de forma profissional
• *Cardápios Digitais* — Com QR Code para restaurantes
• *Link na Bio* — Página personalizada para suas redes

💰 *Investimento:* A partir de R$ 297
⏱️ *Prazo médio:* 3 a 7 dias úteis

Para seguirmos, preciso conhecer você melhor!
*Qual é o seu nome?*
    `.trim(),

    "2": `
🔧 *Sistemas e Ferramentas*

Criamos sistemas que facilitam sua rotina:

• *Agendamento Online* — Clientes marcam horários sozinhos
• *Controle de Estoque* — Organize seus produtos
• *Formulários Inteligentes* — Com lógica condicional
• *Integrações* — Conecte planilhas, CRMs e e-mails

💰 *Investimento:* A partir de R$ 497
⏱️ *Prazo médio:* 5 a 15 dias úteis

Para seguirmos, preciso conhecer você melhor!
*Qual é o seu nome?*
    `.trim(),

    "3": `
✨ *Produtos Digitais Criativos*

Projetos especiais e únicos:

• *Convites Digitais* — Interativos e personalizados
• *Sites Românticos* — Para surpreender quem você ama
• *Contadores Regressivos* — Para eventos e lançamentos
• *Experiências Digitais* — Ideias criativas sob medida

💰 *Investimento:* A partir de R$ 197
⏱️ *Prazo médio:* 2 a 5 dias úteis

Para seguirmos, preciso conhecer você melhor!
*Qual é o seu nome?*
    `.trim(),

    "4": `
💬 *Automação & Comunicação*

Automatize sua comunicação:

• *Chatbots* — Para WhatsApp e sites
• *Newsletters* — E-mails automáticos programados
• *Fluxos Automáticos* — Respostas e ações inteligentes
• *Integrações* — Entre plataformas e ferramentas

💰 *Investimento:* A partir de R$ 397
⏱️ *Prazo médio:* 5 a 10 dias úteis

Para seguirmos, preciso conhecer você melhor!
*Qual é o seu nome?*
    `.trim(),

    "5": `
🤔 *Sem problemas!*

Trabalhamos com projetos personalizados.
Conta pra mim sua ideia que vamos encontrar a melhor solução!

Para seguirmos, preciso conhecer você melhor.
*Qual é o seu nome?*
    `.trim(),

    "6": `
👤 *Falar com Atendente*

Você será direcionado para um de nossos atendentes humanos.

Para agilizar, me diz rapidinho:
*Qual é o seu nome?*
    `.trim(),
  },

  askBusiness: (name) => `
Prazer, *${name}*! 😊

Agora me conta: você tem um negócio/empresa ou é um projeto pessoal?

*Responda com:*
1️⃣ Tenho uma empresa/negócio
2️⃣ É um projeto pessoal
3️⃣ Estou começando agora
  `.trim(),

  askDetails: (context) => `
Perfeito! 📝

Agora a parte mais importante:
*Descreva em poucas palavras o que você precisa.*

Por exemplo:
_"Preciso de um site para minha loja de roupas"_
_"Quero um sistema de agendamento para meu salão"_
_"Um convite digital para meu casamento"_

✍️ *Escreva sua ideia:*
  `.trim(),

  askBudget: `
💰 *Qual é a sua expectativa de investimento?*

1️⃣ Até R$ 300
2️⃣ R$ 300 a R$ 500
3️⃣ R$ 500 a R$ 1.000
4️⃣ Acima de R$ 1.000
5️⃣ Ainda não sei
  `.trim(),

  askDeadline: `
⏰ *Qual é a sua urgência?*

1️⃣ Preciso para ontem! (urgente)
2️⃣ Próximas 2 semanas
3️⃣ Próximo mês
4️⃣ Sem pressa, quero bem feito
  `.trim(),

  summary: (data) => `
✅ *Perfeito! Recebi todas as informações.*

━━━━━━━━━━━━━━━━━━
📋 *Resumo do seu pedido:*

👤 *Nome:* ${data.name}
🏢 *Tipo:* ${data.businessType}
${data.service ? `📦 *Serviço:* ${data.service}` : ""}
💬 *Descrição:* ${data.details}
💰 *Orçamento:* ${data.budget}
⏰ *Prazo:* ${data.deadline}
━━━━━━━━━━━━━━━━━━

🚀 *Próximos passos:*

1️⃣ Nosso time vai analisar seu pedido
2️⃣ Em até *24 horas úteis* entraremos em contato
3️⃣ Você receberá uma proposta personalizada

📝 *Opcional:* Se quiser adiantar, preencha nosso formulário completo:
${CONFIG.formLink}

Obrigado pelo interesse! 💙
*Aithos Tech — tecnologia sob medida.*
  `.trim(),

  invalidOption: `
❌ Opção inválida!

Por favor, responda apenas com o *número* da opção desejada.
Ou digite *menu* para voltar ao início.
  `.trim(),

  timeout: `
⏰ Sua sessão expirou por inatividade.

Digite *oi* ou *menu* para começar novamente!
  `.trim(),
};

const BUDGET_OPTIONS = {
  "1": "Até R$ 300",
  "2": "R$ 300 a R$ 500",
  "3": "R$ 500 a R$ 1.000",
  "4": "Acima de R$ 1.000",
  "5": "Ainda não definido",
};

const DEADLINE_OPTIONS = {
  "1": "Urgente",
  "2": "Próximas 2 semanas",
  "3": "Próximo mês",
  "4": "Sem pressa",
};

const BUSINESS_OPTIONS = {
  "1": "Empresa/Negócio",
  "2": "Projeto pessoal",
  "3": "Começando agora",
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getSaudacao = () => {
  const hora = new Date().getHours();
  if (hora >= 5 && hora < 12) return "Bom dia";
  if (hora >= 12 && hora < 18) return "Boa tarde";
  return "Boa noite";
};

const isValidPrivateMessage = (msg) => msg.from && !msg.from.endsWith("@g.us");

const getSession = (userId) => {
  let session = userSessions.get(userId);
  if (!session || Date.now() - session.lastActivity > CONFIG.sessionTimeout) {
    session = {
      state: FLOW_STATES.IDLE,
      data: {},
      lastActivity: Date.now(),
    };
    userSessions.set(userId, session);
  }
  return session;
};

const updateSession = (userId, updates) => {
  const session = getSession(userId);
  Object.assign(session, updates, { lastActivity: Date.now() });
  userSessions.set(userId, session);
};

const resetSession = (userId) => {
  userSessions.set(userId, {
    state: FLOW_STATES.IDLE,
    data: {},
    lastActivity: Date.now(),
  });
};

const simulateTyping = async (chat) => {
  await delay(CONFIG.delays.typing);
  try {
    if (chat.sendStateTyping) {
      await chat.sendStateTyping();
    }
  } catch (e) {
  }
  await delay(CONFIG.delays.beforeSend);
};

const getTimestamp = () => new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });

const getUptime = () => {
  const ms = Date.now() - stats.startTime;
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  return `${hours}h ${minutes}m`;
};

const logger = {
  info: (msg) => console.log(`[${getTimestamp()}] ℹ️  ${msg}`),
  success: (msg) => console.log(`[${getTimestamp()}] ✅ ${msg}`),
  warn: (msg) => console.log(`[${getTimestamp()}] ⚠️  ${msg}`),
  error: (msg, err) => console.error(`[${getTimestamp()}] ❌ ${msg}`, err || ""),
  qr: (msg) => console.log(`[${getTimestamp()}] 📲 ${msg}`),
  stats: () => console.log(`[${getTimestamp()}] 📊 Uptime: ${getUptime()} | Enviadas: ${stats.messagesSent} | Recebidas: ${stats.messagesReceived} | Erros: ${stats.errors}`),
  lead: (data) => console.log(`[${getTimestamp()}] 🎯 NOVO LEAD: ${data.name} | ${data.service} | ${data.budget}`),
};

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: CONFIG.puppeteer,
});

client.on("qr", (qr) => {
  logger.qr("Escaneie o QR Code abaixo para conectar:");
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  reconnectAttempts = 0;
  logger.success("WhatsApp conectado com sucesso!");
  logger.info("Bot aguardando mensagens...");
  setInterval(() => logger.stats(), 300000);
});

client.on("authenticated", () => logger.success("Autenticação realizada com sucesso!"));
client.on("auth_failure", (msg) => {
  stats.errors++;
  logger.error("Falha na autenticação:", msg);
});

client.on("disconnected", async (reason) => {
  logger.warn(`Cliente desconectado: ${reason}`);
  if (reconnectAttempts < CONFIG.maxReconnectAttempts) {
    reconnectAttempts++;
    logger.info(`Tentando reconectar... (${reconnectAttempts}/${CONFIG.maxReconnectAttempts})`);
    await delay(5000);
    client.initialize();
  } else {
    logger.error("Máximo de tentativas de reconexão atingido.");
  }
});

const sendMessage = async (msg, chat, text) => {
  await simulateTyping(chat);
  await client.sendMessage(msg.from, text);
  stats.messagesSent++;
};

const notifyAttendant = async (name, rawPhone, contact, msg) => {
  try {
    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const contactName = contact?.pushname || contact?.name || name;
    
    // Verificar se é LID (Logical Identifier - privacidade do WhatsApp)
    const isLID = rawPhone.toLowerCase().includes("lid");
    
    // Tentar múltiplas fontes para o número
    let cleanPhone = null;
    
    if (contact?.number) {
      cleanPhone = String(contact.number).replace(/\D/g, "");
    }
    else if (contact?.id?.user && !contact.id.user.toLowerCase().includes("lid")) {
      cleanPhone = String(contact.id.user).replace(/\D/g, "");
    }
    else if (!isLID) {
      cleanPhone = rawPhone.replace(/@.*$/, "").replace(/\D/g, "");
    }
    
    if (cleanPhone && cleanPhone.length > 15) {
      cleanPhone = cleanPhone.slice(-13);
    }
    
    const templateMsg = encodeURIComponent(`Olá ${name}! 👋\n\nAqui é da *Aithos Tech*. Vi que você solicitou atendimento humano.\n\nComo posso te ajudar?`);
    
    let contactInfo = "";
    let clickToContact = "";
    
    if (cleanPhone && cleanPhone.length >= 10) {
      contactInfo = `📱 *Telefone:* +${cleanPhone}`;
      clickToContact = `📲 *Clique para contato:*\nhttps://wa.me/${cleanPhone}?text=${templateMsg}`;
    } else {
      contactInfo = `📱 *Telefone:* ⚠️ Privado (WhatsApp LID)`;
      clickToContact = `💬 *Para responder:* Abra o WhatsApp do bot e responda diretamente ao cliente "${contactName}".\n\n🆔 *Chat ID:* ${rawPhone}`;
    }
    
    const attendantMessage = `
🔔 *SOLICITAÇÃO DE ATENDENTE*
━━━━━━━━━━━━━━━━━━

📅 *Data/Hora:* ${now}

👤 *Nome:* ${name}
👤 *Nome WhatsApp:* ${contactName}
${contactInfo}

⚡ *Cliente solicitou atendimento humano!*

━━━━━━━━━━━━━━━━━━
${clickToContact}
    `.trim();

    for (const admin of CONFIG.adminNumber) {
      await client.sendMessage(admin, attendantMessage);
    }
    logger.success(`Solicitação de atendente enviada: ${name} | ID: ${rawPhone.split("@")[0]}`);
  } catch (error) {
    logger.error("Erro ao notificar atendente:", error);
  }
};

const notifyAdmin = async (leadData, contact, msg, rawUserId) => {
  try {
    const now = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const contactName = contact?.pushname || contact?.name || leadData.name;
    
    // Verificar se é LID (Logical Identifier - privacidade do WhatsApp)
    const isLID = rawUserId?.toLowerCase().includes("lid") || false;
    
    // Tentar múltiplas fontes para o número
    let phoneNumber = null;
    
    if (contact?.number) {
      phoneNumber = String(contact.number).replace(/\D/g, "");
    }
    else if (contact?.id?.user && !contact.id.user.toLowerCase().includes("lid")) {
      phoneNumber = String(contact.id.user).replace(/\D/g, "");
    }
    else if (leadData.phone && !leadData.phone.toLowerCase().includes("lid")) {
      phoneNumber = String(leadData.phone).replace(/\D/g, "");
    }
    
    if (phoneNumber && phoneNumber.length > 15) {
      phoneNumber = phoneNumber.slice(-13);
    }
    
    const templateMsg = encodeURIComponent(`Olá ${leadData.name}! 👋\n\nAqui é da *Aithos Tech*. Recebemos seu pedido de ${leadData.service}.\n\nVamos conversar sobre seu projeto?`);
    
    let contactInfo = "";
    let clickToContact = "";
    
    if (phoneNumber && phoneNumber.length >= 10) {
      contactInfo = `📱 *Telefone:* +${phoneNumber}`;
      clickToContact = `📲 *Clique para contato:*\nhttps://wa.me/${phoneNumber}?text=${templateMsg}`;
    } else {
      contactInfo = `📱 *Telefone:* ⚠️ Privado (WhatsApp LID)`;
      clickToContact = `💬 *Para responder:* Abra o WhatsApp do bot e responda diretamente ao cliente "${contactName}".\n\n🆔 *Chat ID:* ${rawUserId || "N/A"}`;
    }
    
    const leadMessage = `
🎯 *NOVO LEAD CAPTURADO!*
━━━━━━━━━━━━━━━━━━

📅 *Data/Hora:* ${now}

👤 *Nome informado:* ${leadData.name}
👤 *Nome WhatsApp:* ${contactName}
${contactInfo}
🏢 *Tipo:* ${leadData.businessType}
📦 *Serviço:* ${leadData.service || "Não especificado"}

💬 *Descrição:*
${leadData.details}

💰 *Orçamento:* ${leadData.budget}
⏰ *Prazo:* ${leadData.deadline}

━━━━━━━━━━━━━━━━━━
${clickToContact}
    `.trim();

    for (const admin of CONFIG.adminNumber) {
      await client.sendMessage(admin, leadMessage);
    }
    logger.success(`Lead enviado para admins: ${leadData.name} | ID: ${rawUserId?.split("@")[0] || phoneNumber}`);
  } catch (error) {
    logger.error("Erro ao notificar admin:", error);
  }
};

async function handleConversation(msg, chat, texto) {
  const phoneNumber = msg.from;
  const userId = phoneNumber;
  const session = getSession(userId);

  // Se digitar menu ou voltar, sempre reseta
  if (/^(menu|voltar)$/i.test(texto)) {
    resetSession(userId);
    updateSession(userId, { state: FLOW_STATES.MENU });
    await sendMessage(msg, chat, MESSAGES.welcome(getSaudacao()));
    logger.info(`Menu enviado para: ${userId.split("@c.us")[0]}`);
    return;
  }

  // Se estiver em IDLE, qualquer mensagem inicia o menu
  if (session.state === FLOW_STATES.IDLE) {
    updateSession(userId, { state: FLOW_STATES.MENU });
    await sendMessage(msg, chat, MESSAGES.welcome(getSaudacao()));
    logger.info(`Menu enviado para: ${userId.split("@c.us")[0]}`);
    return;
  }

  switch (session.state) {
    case FLOW_STATES.MENU:
      if (SERVICES[texto]) {
        const service = SERVICES[texto];
        
        // Opção 6 - Falar com atendente (fluxo especial)
        if (texto === "6") {
          updateSession(userId, {
            state: FLOW_STATES.COLLECTING_NAME_ATTENDANT,
            data: { ...session.data, serviceId: texto, service: service.name },
          });
          await sendMessage(msg, chat, MESSAGES.serviceDetails[texto]);
        } else {
          updateSession(userId, {
            state: FLOW_STATES.COLLECTING_NAME,
            data: { ...session.data, serviceId: texto, service: service.name },
          });
          await sendMessage(msg, chat, MESSAGES.serviceDetails[texto]);
        }
      } else {
        await sendMessage(msg, chat, MESSAGES.invalidOption);
      }
      break;

    // Fluxo especial para atendente - só pega nome e notifica
    case FLOW_STATES.COLLECTING_NAME_ATTENDANT:
      if (texto.length < 2 || texto.length > 50) {
        await sendMessage(msg, chat, "Por favor, digite um nome válido:");
        return;
      }
      const attendantName = msg.body.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      
      let attendantContact = null;
      try {
        attendantContact = await msg.getContact();
      } catch (e) {}
      
      await notifyAttendant(attendantName, userId, attendantContact, msg);
      
      updateSession(userId, {
        state: FLOW_STATES.WAITING_ATTENDANT,
        data: { ...session.data, name: attendantName },
      });
      
      await sendMessage(msg, chat, `
Perfeito, *${attendantName}*! 👋

✅ *Um de nossos atendentes foi notificado!*

Aguarde alguns instantes que entraremos em contato.

Se preferir, você também pode:

• E-mail: contato@aithostech.com.br

Obrigado pela paciência! 💙
      `.trim());
      break;

    case FLOW_STATES.WAITING_ATTENDANT:
      await sendMessage(msg, chat, `
Você já está na fila de atendimento! 😊

Um de nossos atendentes entrará em contato em breve.

Se quiser recomeçar, digite *menu*.
      `.trim());
      break;

    case FLOW_STATES.COLLECTING_NAME:
      if (texto.length < 2 || texto.length > 50) {
        await sendMessage(msg, chat, "Por favor, digite um nome válido:");
        return;
      }
      const name = msg.body.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      updateSession(userId, {
        state: FLOW_STATES.COLLECTING_BUSINESS,
        data: { ...session.data, name },
      });
      await sendMessage(msg, chat, MESSAGES.askBusiness(name));
      break;

    case FLOW_STATES.COLLECTING_BUSINESS:
      if (!BUSINESS_OPTIONS[texto]) {
        await sendMessage(msg, chat, MESSAGES.invalidOption);
        return;
      }
      updateSession(userId, {
        state: FLOW_STATES.COLLECTING_DETAILS,
        data: { ...session.data, businessType: BUSINESS_OPTIONS[texto] },
      });
      await sendMessage(msg, chat, MESSAGES.askDetails());
      break;

    case FLOW_STATES.COLLECTING_DETAILS:
      if (texto.length < 10) {
        await sendMessage(msg, chat, "Por favor, descreva um pouco mais sua ideia (mínimo 10 caracteres):");
        return;
      }
      updateSession(userId, {
        state: FLOW_STATES.COLLECTING_BUDGET,
        data: { ...session.data, details: msg.body.trim() },
      });
      await sendMessage(msg, chat, MESSAGES.askBudget);
      break;

    case FLOW_STATES.COLLECTING_BUDGET:
      if (!BUDGET_OPTIONS[texto]) {
        await sendMessage(msg, chat, MESSAGES.invalidOption);
        return;
      }
      updateSession(userId, {
        state: FLOW_STATES.COLLECTING_DEADLINE,
        data: { ...session.data, budget: BUDGET_OPTIONS[texto] },
      });
      await sendMessage(msg, chat, MESSAGES.askDeadline);
      break;

    case FLOW_STATES.COLLECTING_DEADLINE:
      if (!DEADLINE_OPTIONS[texto]) {
        await sendMessage(msg, chat, MESSAGES.invalidOption);
        return;
      }
      let contact = null;
      try {
        contact = await msg.getContact();
      } catch (e) {
        // Ignora erro de getContact
      }
      const rawPhone = userId.replace(/@c\.us$|@s\.whatsapp\.net$/i, "");
      const cleanPhone = rawPhone.replace(/\D/g, "").slice(-13);
      const finalData = { ...session.data, deadline: DEADLINE_OPTIONS[texto], phone: cleanPhone };
      updateSession(userId, {
        state: FLOW_STATES.FINISHED,
        data: finalData,
      });
      await sendMessage(msg, chat, MESSAGES.summary(finalData));
      await notifyAdmin(finalData, contact, msg, userId);
      logger.lead(finalData);
      break;

    case FLOW_STATES.FINISHED:
      await sendMessage(msg, chat, `Já recebemos suas informações! 😊\n\nSe quiser começar um novo atendimento, digite *menu*.\n\nOu aguarde nosso contato em até 24 horas úteis.`);
      break;

    default:
      resetSession(userId);
      await sendMessage(msg, chat, MESSAGES.welcome(getSaudacao()));
  }
}

client.on("message", async (msg) => {
  try {
    stats.messagesReceived++;

    if (!isValidPrivateMessage(msg)) return;
    const chat = await msg.getChat();
    if (chat.isGroup) return;

    const texto = msg.body?.trim().toLowerCase() || "";
    if (!texto) return;

    await handleConversation(msg, chat, texto);
  } catch (error) {
    stats.errors++;
    logger.error("Erro no processamento:", error);
  }
});

const shutdown = async () => {
  logger.warn("Encerrando bot...");
  logger.stats();
  await client.destroy();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

logger.info("Iniciando chatbot...");
client.initialize();
