const express = require('express');
const qrcode = require('qrcode');
const { Client, LocalAuth } = require('whatsapp-web.js');

const app = express();
const port = 3000;

// Configurações de horário e dias da semana
const HORARIO_INICIO = 9; // 9h
const HORARIO_FIM = 18; // 18h
const DIAS_ATIVOS = [1, 2, 3, 4, 5]; // Segunda a Sexta (0 = Domingo, 1 = Segunda, ..., 6 = Sábado)

// Número para encaminhar mensagens relacionadas a blockchain
const NUMERO_BLOCKCHAIN = '5511999999999@c.us'; // Substitua pelo número desejado (formato: código do país + número + @c.us)

// Função para verificar se o bot deve responder
function deveResponder() {
    const agora = new Date();
    const diaDaSemana = agora.getDay();
    const hora = agora.getHours();

    return DIAS_ATIVOS.includes(diaDaSemana) && hora >= HORARIO_INICIO && hora < HORARIO_FIM;
}

// Função para verificar se a mensagem é sobre blockchain
function ehSobreBlockchain(mensagem) {
    const palavrasChave = ['blockchain', 'bitcoin', 'ethereum', 'criptomoeda', 'smart contract'];
    return palavrasChave.some(palavra => mensagem.toLowerCase().includes(palavra));
}

// Função para verificar se a mensagem é sobre trabalho de motorista
function ehSobreMotorista(mensagem) {
    const palavrasChave = ['motorista', 'caminhão', 'entrega', 'frete'];
    return palavrasChave.some(palavra => mensagem.toLowerCase().includes(palavra));
}

// Inicializa o cliente do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(), // Salva a sessão localmente
    puppeteer: { headless: true }  // Executa o navegador em modo headless
});

// Variável para armazenar o QR code
let qrCodeData = null;

// Rota para exibir a página com o QR code
app.get('/', async (req, res) => {
    if (qrCodeData) {
        const qrCodeUrl = await qrcode.toDataURL(qrCodeData);
        res.send(`
            <html>
                <head>
                    <title>WhatsApp Bot - Conectar</title>
                </head>
                <body style="text-align: center; font-family: Arial, sans-serif;">
                    <h1>Conectar WhatsApp Bot</h1>
                    <p>Escaneie o QR code abaixo com o WhatsApp no seu celular:</p>
                    <img src="${qrCodeUrl}" alt="QR Code" style="width: 300px; height: 300px;">
                    <p>Após escanear, o bot estará pronto para uso.</p>
                </body>
            </html>
        `);
    } else {
        res.send(`
            <html>
                <head>
                    <title>WhatsApp Bot - Conectar</title>
                </head>
                <body style="text-align: center; font-family: Arial, sans-serif;">
                    <h1>WhatsApp Bot</h1>
                    <p>Aguardando geração do QR code...</p>
                </body>
            </html>
        `);
    }
});

// Inicializa o cliente do WhatsApp
client.on('qr', (qr) => {
    console.log('QR code recebido. Atualize a página para exibi-lo.');
    qrCodeData = qr; // Armazena o QR code para exibição na página
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('message', async (msg) => {
    // Verifica se a mensagem foi enviada em um grupo
    if (msg.from.endsWith('@g.us')) {
        return; // Ignora completamente mensagens de grupos
    }

    const mensagem = msg.body.toLowerCase();
    const contato = await msg.getContact();

    console.log(`Mensagem recebida de ${contato.pushname}: ${msg.body}`);

    // Verifica se a mensagem é sobre blockchain
    if (ehSobreBlockchain(mensagem)) {
        // Encaminha a mensagem para o número de blockchain
        client.sendMessage(NUMERO_BLOCKCHAIN, `Mensagem de ${contato.pushname} sobre blockchain: ${msg.body}`);
        msg.reply('Sua mensagem sobre blockchain foi encaminhada para o responsável. Entraremos em contato em breve.');
    }
    // Verifica se a mensagem é sobre trabalho de motorista
    else if (ehSobreMotorista(mensagem)) {
        if (deveResponder()) {
            msg.reply('Olá! Estou verificando sua solicitação sobre trabalho de motorista. Aguarde um momento.');
        } else {
            msg.reply('No momento, não estou disponível. Por favor, tente novamente durante o horário comercial.');
        }
    }
    // Resposta padrão para outros assuntos
    else {
        if (deveResponder()) {
            msg.reply('Olá! Como posso ajudar?');
        } else {
            msg.reply('No momento, não estou disponível. Por favor, tente novamente durante o horário comercial.');
        }
    }
});

// Inicia o servidor web
app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}`);
});

// Inicia o cliente do WhatsApp
client.initialize();