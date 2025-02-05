const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

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
    const palavrasChave = ['blockchain', 'bitcoin', 'ethereum', 'criptomoeda', 'smart contract', 'token','suplay','bnb'];
    return palavrasChave.some(palavra => mensagem.toLowerCase().includes(palavra));
}

// Função para verificar se a mensagem é sobre trabalho de motorista
function ehSobreMotorista(mensagem) {
    const palavrasChave = ['motorista', 'caminhão', 'entrega', 'frete','viagem','natal','mossoro'];
    return palavrasChave.some(palavra => mensagem.toLowerCase().includes(palavra));
}

// Inicializa o cliente do WhatsApp
const client = new Client({
    authStrategy: new LocalAuth() // Salva a sessão localmente para não precisar escanear o QR code toda vez
});

// Gera o QR code para autenticação
client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

// Confirmação de que o cliente está pronto
client.on('ready', () => {
    console.log('Client is ready!');
});

// Escuta as mensagens recebidas
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

// Inicia o cliente
client.initialize();