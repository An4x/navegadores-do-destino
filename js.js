/* ==========================================================================
   NAVEGADORES DO DESTINO - MOTOR DO JOGO, MAPA COM TEXTURA E EVENTOS DE NPC
   ========================================================================== */

// CONFIGURAÇÃO DE ÁUDIO 
const AUDIO_CONFIG = {
  useCustomAudioFiles: true, 
  bgmPath: 'audio/navegacao.mp3',
  correctSfxPath: 'audio/acerto.mp3',
  wrongSfxPath: 'audio/erro.mp3'
};

class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.customBgm = null;
    this.currentSfxAudio = null; 
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (AUDIO_CONFIG.useCustomAudioFiles && !this.customBgm && this.enabled) {
      try {
        this.customBgm = new Audio(AUDIO_CONFIG.bgmPath);
        this.customBgm.loop = true;
        this.customBgm.volume = 0.35; 
        this.customBgm.play().catch(e => console.log("Áudio de fundo aguardando interação:", e));
      } catch(e) {}
    }
  }

  pauseBgm() {
    if (this.customBgm) {
      this.customBgm.pause();
    }
  }

  resumeBgm() {
    if (this.customBgm && this.enabled) {
      this.customBgm.play().catch(() => {});
    }
  }

  playTone(freq, type, duration) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch(e) {}
  }

  stopSfx() {
    if (this.currentSfxAudio) {
      this.currentSfxAudio.pause();
      this.currentSfxAudio.currentTime = 0;
      this.currentSfxAudio = null;
    }
  }

  playCorrect() {
    this.stopSfx(); 
    if (AUDIO_CONFIG.useCustomAudioFiles) {
      try {
        this.currentSfxAudio = new Audio(AUDIO_CONFIG.correctSfxPath);
        this.currentSfxAudio.volume = 0.7;
        this.currentSfxAudio.play().catch(()=>{});
      } catch(e) {}
    } else {
      this.playTone(523.25, 'triangle', 0.15);
      setTimeout(() => this.playTone(659.25, 'triangle', 0.3), 150);
    }
  }

  playWrong() {
    this.stopSfx(); 
    if (AUDIO_CONFIG.useCustomAudioFiles) {
      try {
        this.currentSfxAudio = new Audio(AUDIO_CONFIG.wrongSfxPath);
        this.currentSfxAudio.volume = 0.7;
        this.currentSfxAudio.play().catch(()=>{});
      } catch(e) {}
    } else {
      this.playTone(220, 'sawtooth', 0.2);
      setTimeout(() => this.playTone(180, 'sawtooth', 0.3), 200);
    }
  }

  playClick() {
    this.playTone(440, 'sine', 0.04);
  }
}
const audioSys = new SoundSystem();

// CATÁLOGO DA LOJA DE ESPECIARIAS
const SHOP_ITEMS = [
  { id: 'pimenta', name: 'Pimenta-do-reino (Malabar)', cost: 40, xpReward: 50, desc: 'A especiaria mais procurada da Índia. Altamente lucrativa na Europa.' },
  { id: 'cravo', name: 'Cravo-da-índia (Moluccas)', cost: 70, xpReward: 90, desc: 'Raro e aromático, essencial para conservar e temperar banquetes reais.' },
  { id: 'canela', name: 'Canela Fina do Ceilão', cost: 100, xpReward: 130, desc: 'Tesouro cobiçado pelos mercadores venezianos, agora direto em nossas mãos.' },
  { id: 'gengibre', name: 'Raiz de Gengibre Oriental', cost: 30, xpReward: 35, desc: 'Bom para manter a saúde da tripulação contra o escorbuto em alto-mar.' }
];

// OUVINTE PARA ABRIR A LOJA NO SETUP
// (Certifica-te de que adicionas isto dentro da tua função setupListeners() no js.js)
/*
  document.getElementById('btn-open-shop')?.addEventListener('click', openShopModal);
*/

function openShopModal() {
  audioSys.playClick();
  audioSys.pauseBgm();
  
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = "🛒 Loja da Feitoria Real (Comércio de Especiarias)";
  
 document.getElementById('modal-body').innerHTML = `
    <div style="background: rgba(15,23,42,0.9); padding: 12px; border-radius: 8px; border: 1px solid rgba(217,119,6,0.4); margin-bottom: 14px; display: flex; justify-content: space-between; align-items: center;">
      <span style="color: #fde68a; font-size: 0.95rem;">💰 Teus Ducados Atuais: <strong id="shop-ducats">${gameState.ducats}</strong> 𐫱</span>
      <span style="color: #34d399; font-size: 0.95rem;">⭐ XP: <strong id="shop-xp">${gameState.xp}</strong></span>
    </div>

    <div style="display: flex; flex-direction: column; gap: 10px;">
      ${SHOP_ITEMS.map((item, idx) => `
        <div style="background: #020617; border: 1px solid #1e293b; padding: 12px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: bold; color: #fde68a; font-size: 0.95rem; margin-bottom: 3px;">📦 ${item.name}</div>
            <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 4px; line-height: 1.3;">${item.desc}</div>
            <div style="font-size: 0.75rem; color: #34d399;">Recompensa: +${item.xpReward} XP</div>
          </div>
          <button class="btn btn-amber" style="padding: 6px 12px; font-size: 0.8rem;" onclick="window.buySpice(${idx})">Comprar (${item.cost} 𐫱)</button>
        </div>
      `).join('')}
    </div>
  `;

  document.getElementById('modal-footer').innerHTML = `<button class="btn btn-amber" onclick="window.closeModal()">Fechar Feitoria</button>`;
  modal.classList.remove('hidden');
}

// Função para processar a compra de especiarias
window.buySpice = function(itemIdx) {
  const item = SHOP_ITEMS[itemIdx];
  if (gameState.ducats >= item.cost) {
    gameState.ducats -= item.cost;
    gameState.xp += item.xpReward;
    audioSys.playCorrect();
    
    // Atualiza os valores visuais no modal instantaneamente sem fechar
    document.getElementById('shop-ducats').textContent = gameState.ducats;
    document.getElementById('shop-xp').textContent = gameState.xp;
    
    saveGameData();
    updateHUD();
  } else {
    audioSys.playWrong();
    alert("Não tens ducados suficientes! Completa mais missões e desafios no mapa para conseguires moedas.");
  }
};
// ESTADO DO JOGO
let gameState = {
  active: false,
  score: 0,
  timeRemaining: 15,
  shipX: window.innerWidth / 2,
  shipY: window.innerHeight / 2,
  obstacles: [],
  timerInterval: null,
  x: 300,
  y: 150,
  angle: 0,
  speed: 0,
  maxSpeed: 2.5,
  title: "Grumete",
  ducats: 100,
  xp: 0,
  currentQuestIndex: 0,
  day: 1,
  timeOfDay: 12,
  npcMet: false
};

let keys = {};
let touchState = { up: false, down: false, left: false, right: false };

// PONTOS DE INTERESSE (POIs) NO MAPA 2D (Espalhados)
const POIS = [
  { id: 'lisboa', name: 'Portugal (Lisboa)', x: 300, y: 150, radius: 42, color: '#f59e0b' },
  { id: 'costa_africana', name: 'Costa Ocidental Africana', x: 300, y: 320, radius: 42, color: '#3b82f6' },
  { id: 'cabo', name: 'Cabo da Boa Esperança', x: 350, y: 550, radius: 42, color: '#10b981' },
  { id: 'costa_oriental', name: 'Costa Oriental Africana', x: 550, y: 500, radius: 42, color: '#8b5cf6' },
  { id: 'india', name: 'Índia (Calecute)', x: 780, y: 400, radius: 42, color: '#ec4899' },
  { id: 'caribe', name: 'Caribe (San Salvador)', x: 150, y: 280, radius: 42, color: '#06b6d4' },
  { id: 'tordesilhas', name: 'Tratado de Tordesilhas (1494)', x: 180, y: 420, radius: 42, color: '#eab308' },
  { id: 'brasil', name: 'Território do Brasil (Porto Seguro)', x: 200, y: 530, radius: 42, color: '#22c55e' }
];

// NPC ITINERANTE NO OCEANO (Encontro Aleatório)
const OCEAN_NPC = {
  name: "Vasco da Gama",
  title: "Capitão da Armada da Índia",
  x: 520,
  y: 300,
  radius: 30,
  dialog: "Saudações, jovem navegador! Para passares pelo meu setor e ganhares provisões, responde com sabedoria: Qual o nome dado ao ponto mais ao sul da África contornado em 1488?",
  options: [
    "A) Cabo Horn",
    "B) Cabo da Boa Esperança",
    "C) Cabo Verde"
  ],
  correct: 1,
  reward: 80
};

// AS 10 MISSÕES HISTÓRICAS COMPLETAS
const QUESTS = [
  {
    id: 1,
    title: "1. Motivações e Portugal Pioneiro",
    target: "lisboa",
    char: "D. João II / Infante D. Henrique",
    desc: "Visite Lisboa para compreender as motivações econômicas, políticas e religiosas.",
    question: {
      q: "Qual foi o principal objetivo econômico de Portugal ao iniciar as Grandes Navegações no século XV?",
      options: [
        "A) Comprar terras na América do Norte.",
        "B) Encontrar uma rota marítima direta para o comércio de especiarias no Oriente, contornando o monopólio muçulmano-veneziano.",
        "C) Estabelecer feitorias industriais na Europa Central.",
        "D) Substituir o ouro por escambo de peles."
      ],
      correct: 1,
      explanation: "Portugal buscava contornar os intermediários no Mediterrâneo para obter especiarias diretamente na fonte."
    }
  },
  {
    id: 2,
    title: "2. Tecnologias de Navegação e Caravelas",
    target: "lisboa",
    char: "Cartógrafo Real",
    desc: "Estude o uso de instrumentos náuticos e da caravela com velas latinas em Lisboa.",
    question: {
      q: "Qual era a principal vantagem técnica da caravela portuguesa?",
      options: [
        "A) Casco blindado contra monstros marinhos.",
        "B) Uso de velas triangulares (latinas) que permitiam navegar contra o vento (bolinar).",
        "C) Motores a vapor movidos a carvão.",
        "D) Capacidade de voar sobre tempestades."
      ],
      correct: 1,
      explanation: "As velas latinas permitiam o zigue-zague contra o vento, essencial para regressar da costa africana."
    }
  },
  {
    id: 3,
    title: "3. A Costa Ocidental Africana",
    target: "costa_africana",
    char: "Navegador Pioneiro",
    desc: "Navegue até a Costa Ocidental Africana para estabelecer feitorias e mapear o Périplo.",
    question: {
      q: "O que foram as feitorias estabelecidas pelos portugueses na costa da África?",
      options: [
        "A) Fortalezas militares para conquistar o continente inteiro.",
        "B) Entrepostos comerciais fortificados para guardar mercadorias e negociar com os nativos.",
        "C) Templos religiosos obrigatórios.",
        "D) Prisões para marinheiros rebeldes."
      ],
      correct: 1,
      explanation: "As feitorias funcionavam como bases seguras para o comércio sem necessidade de colonizar o interior."
    }
  },
  {
    id: 4,
    title: "4. Bartolomeu Dias e o Cabo da Boa Esperança",
    target: "cabo",
    char: "Bartolomeu Dias (1488)",
    desc: "Navegue até o extremo sul da África e comprove a ligação entre os oceanos.",
    question: {
      q: "Por que o rei D. João II rebatizou o Cabo das Tormentas como 'Cabo da Boa Esperança'?",
      options: [
        "A) Porque ali havia minas de ouro inesgotáveis.",
        "B) Porque o contorno do sul da África renovou as esperanças de alcançar a Índia por via marítima.",
        "C) Para homenagear uma tribo local.",
        "D) Porque o clima era sempre ensolarado."
      ],
      correct: 1,
      explanation: "Demonstrava o otimismo real de que a rota para o mercado indiano estava aberta."
    }
  },
  {
    id: 5,
    title: "5. Cristóvão Colombo e a Chegada ao Caribe",
    target: "caribe",
    char: "Cristóvão Colombo (1492)",
    desc: "Navegue até o Caribe na expedição financiada pela Coroa espanhola.",
    question: {
      q: "Qual foi o equívoco geográfico fundamental de Colombo em 1492?",
      options: [
        "A) Acreditava que a Terra era plana.",
        "B) Subestimou o tamanho da Terra e desconhecia a existência do continente americano no caminho para a Ásia.",
        "C) Navegou apenas por rios interiores.",
        "D) Usou bússolas com defeito de fábrica."
      ],
      correct: 1,
      explanation: "Colombo calculou a circunferência terrestre menor e ignorava a presença da América."
    }
  },
  {
    id: 6,
    title: "6. O Tratado de Tordesilhas (1494)",
    target: "tordesilhas",
    char: "Diplomatas da Coroa",
    desc: "Explore o meridiano que dividiu o mundo entre Portugal e Espanha.",
    question: {
      q: "O que estabelecia o Tratado de Tordesilhas de 1494?",
      options: [
        "A) A partilha do continente africano entre Inglaterra e França.",
        "B) Um meridiano divisor de terras entre Portugal (leste) e Espanha (oeste).",
        "C) A proibição da escravidão no Atlântico.",
        "D) A união das coroas ibéricas."
      ],
      correct: 1,
      explanation: "O meridiano garantiu a Portugal o futuro direito sobre o leste da América do Sul."
    }
  },
  {
    id: 7,
    title: "7. Vasco da Gama e a Chegada à Índia",
    target: "india",
    char: "Vasco da Gama (1498)",
    desc: "Navegue até Calecute e inaugure o comércio direto com o Oriente.",
    question: {
      q: "Qual foi o impacto histórico imediato da chegada de Vasco da Gama a Calecute?",
      options: [
        "A) O fim imediato do Império Otomano.",
        "B) O enfraquecimento do monopólio veneziano-muçulmano e o início da hegemonia portuguesa no Índico.",
        "C) A colonização pacífica da Ásia.",
        "D) A fundação de portos na América do Norte."
      ],
      correct: 1,
      explanation: "Portugal passou a controlar o comércio de especiarias orientais diretamente na fonte."
    }
  },
  {
    id: 8,
    title: "8. Pedro Álvares Cabral e o Brasil (1500)",
    target: "brasil",
    char: "Pedro Álvares Cabral / Pero Vaz de Caminha",
    desc: "Visite o território brasileiro e compreenda a chegada da armada em 1500.",
    question: {
      q: "Antes da chegada da armada de Cabral em 1500, o território brasileiro:",
      options: [
        "A) Era totalmente desabitado.",
        "B) Era habitado por milhões de indígenas de diversas etnias e culturas.",
        "C) Era dominado por colônias vikings.",
        "D) Pertencia ao Império Inca."
      ],
      correct: 1,
      explanation: "A terra já era habitada por centenas de povos originários com rica diversidade cultural."
    }
  },
  {
    id: 9,
    title: "9. Tráfico Transatlântico e Costa Oriental",
    target: "costa_oriental",
    char: "Comerciante Colonial",
    desc: "Analise o sistema mercantilista e o comércio na Costa Oriental Africana.",
    question: {
      q: "Qual foi o papel do tráfico transatlântico de africanos no sistema colonial?",
      options: [
        "A) Fornecer mão de obra forçada para a exploração de plantation e mineração nas Américas.",
        "B) Substituir os cavalos nas viagens transoceânicas.",
        "C) Atuar como diplomatas na Europa.",
        "D) Construir estradas de ferro."
      ],
      correct: 0,
      explanation: "A economia colonial baseou-se fortemente na exploração desumana da mão de obra escravizada."
    }
  },
  {
    id: 10,
    title: "10. Consequências Globais das Navegações",
    target: "lisboa",
    char: "Cronista do Império",
    desc: "Conclua sua jornada em Lisboa avaliando as transformações econômicas e globais.",
    question: {
      q: "Qual foi uma das principais consequências geopolíticas mundiais das Grandes Navegações?",
      options: [
        "A) O isolamento total entre os continentes.",
        "B) A integração econômica global com o deslocamento do eixo comercial do Mediterrâneo para o Atlântico.",
        "C) A extinção do comércio em todo o planeta.",
        "D) A adoção de moeda única mundial em 1510."
      ],
      correct: 1,
      explanation: "O Atlântico tornou-se a grande rodovia marítima mundial, impulsionando o mercantilismo."
    }
  }
];

// BIBLIOTECA DE HISTÓRIA
const LIBRARY_CHAPTERS = [
  { title: "1. O Contexto Europeu", text: "Transição do feudalismo para o capitalismo mercantil. A tomada de Constantinopla em 1453 elevou o preço das especiarias." },
  { title: "2. Os Motivos das Navegações", text: "Fatores econômicos (escassez de metais), políticos (Estados Nacionais) e religiosos." },
  { title: "3. Portugal Pioneiro", text: "Revolução de Avis (1385), posição geográfica e burguesia mercantil forte." },
  { title: "4. Tecnologias Náuticas", text: "Uso da bússola, astrolábio e caravela com velas latinas." },
  { title: "5. A Rota para a Índia", text: "Bartolomeu Dias (1488) e Vasco da Gama (1498)." },
  { title: "6. Colombo e a Espanha", text: "Expedição de 1492 financiada pelos Reis Católicos rumo ao Caribe." },
  { title: "7. Tratado de Tordesilhas", text: "Acordo de 1494 dividindo terras entre Portugal e Espanha." },
  { title: "8. A Viagem de Cabral", text: "Chegada ao litoral baiano em abril de 1500." },
  { title: "9. Impacto Indígena e Escravidão", text: "Choque microbiano, dizimação e tráfico de escravizados africanos." },
  { title: "10. Consequências Globais", text: "Deslocamento comercial para o Atlântico e consolidação do mercantilismo." }
];

const QUIZ_QUESTIONS = [
  { q: "Qual país pioneiro iniciou a expansão marítima?", options: ["Espanha", "Portugal", "Inglaterra", "França"], correct: 1, explanation: "Portugal foi pioneiro." },
  { q: "Quem contornou o Cabo da Boa Esperança em 1488?", options: ["Colombo", "Vasco da Gama", "Bartolomeu Dias", "Cabral"], correct: 2, explanation: "Bartolomeu Dias atingiu o extremo sul africano." },
  { q: "O que estabelecia o Tratado de Tordesilhas?", options: ["Partilha da África", "Meridiano divisor entre Portugal e Espanha", "Fim da escravidão", "Aliança militar"], correct: 1, explanation: "Dividiu as terras do globo entre as duas potências ibéricas." },
  { q: "Em que ano a armada de Cabral chegou ao Brasil?", options: ["1492", "1498", "1500", "1530"], correct: 2, explanation: "Aportou em Porto Seguro em abril de 1500." }
];

const FLASHCARDS = [
  { front: "Tratado de Tordesilhas (1494)", back: "Acordo entre Portugal e Espanha dividindo terras por meridiano." },
  { front: "Bartolomeu Dias", back: "Navegador que contornou o Cabo da Boa Esperança em 1488." },
  { front: "Velas Latinas", back: "Velas triangulares que permitiam navegar contra o vento." },
  { front: "Mercantilismo", back: "Sistema econômico baseado no metalismo e intervenção estatal." }
];

let canvas, ctx;

window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('gameCanvas');
  if (canvas) {
    ctx = canvas.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
  }

  loadGameData();
  setupListeners();
  updateHUD();

  requestAnimationFrame(gameLoop);
});

function resizeCanvas() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function setupListeners() {
  window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  const startBtn = document.getElementById('btn-start-new');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      audioSys.init(); 
      audioSys.playClick();
      gameState = { x: 300, y: 150, angle: 0, speed: 0, maxSpeed: 2.5, title: "Grumete", ducats: 150, xp: 0, currentQuestIndex: 0, day: 1, timeOfDay: 10, npcMet: false };
      saveGameData();
      document.getElementById('start-screen').classList.add('hidden');
      openQuestModal(0);
    });
  }

  // --- MINIGAME: DESVIO DE BOMBAS E TESOUROS ---
function openMinigameModal() {
  audioSys.playClick();
  audioSys.pauseBgm();
  
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = "⚡ Minigame: Desvio na Tempestade";
  
  document.getElementById('modal-body').innerHTML = `
    <div style="background: rgba(15,23,42,0.9); padding: 14px; border-radius: 8px; border: 1px solid rgba(217,119,6,0.4); margin-bottom: 16px; text-align: center;">
      <p style="color: #cbd5e1; font-size: 0.9rem; margin-bottom: 8px;">Usa as setas do teclado (ou toque) para desviar das <strong>Bombas (💣)</strong> e apanhar o máximo de <strong>Tesouros (💰)</strong> antes que o tempo acabe!</p>
      <div id="mg-hud" style="font-size: 1.1rem; font-weight: bold; color: #fde68a;">Tempo: 15s | Tesouros: 0</div>
    </div>
    <div id="minigame-container" style="position: relative; width: 100%; height: 260px; background: #020617; border-radius: 8px; border: 1px solid #1e293b; overflow: hidden; display: flex; align-items: center; justify-content: center;">
      <canvas id="mgCanvas" width="450" height="250" style="background: #0c3b5e; border-radius: 6px;"></canvas>
    </div>
  `;

  document.getElementById('modal-footer').innerHTML = `
    <button class="btn btn-amber" onclick="window.closeModal()">Sair do Minigame</button>
  `;

  modal.classList.remove('hidden');
  startMinigameLoop();
}

function startMinigameLoop() {
  minigameState.active = true;
  minigameState.score = 0;
  minigameState.timeRemaining = 15;
  minigameState.shipX = 225;
  minigameState.shipY = 125;
  minigameState.obstacles = [];

  // Criar itens iniciais
  for (let i = 0; i < 4; i++) {
    minigameState.obstacles.push({
      x: Math.random() * 400 + 25,
      y: Math.random() * 200 + 25,
      type: Math.random() > 0.4 ? 'bomb' : 'treasure',
      speed: Math.random() * 1.5 + 1
    });
  }

  const mgCanvas = document.getElementById('mgCanvas');
  if (!mgCanvas) return;
  const mgCtx = mgCanvas.getContext('2d');

  // Temporizador regressivo
  minigameState.timerInterval = setInterval(() => {
    minigameState.timeRemaining--;
    const hud = document.getElementById('mg-hud');
    if (hud) hud.innerHTML = `Tempo: ${minigameState.timeRemaining}s | Tesouros: ${minigameState.score}`;

    if (minigameState.timeRemaining <= 0) {
      clearInterval(minigameState.timerInterval);
      minigameState.active = false;
      audioSys.playCorrect();
      gameState.ducats += minigameState.score * 20;
      saveGameData();
      updateHUD();
      if (hud) hud.innerHTML = `<span style="color: #34d399;">Fim do Jogo! Ganhaste +${minigameState.score * 20} ducados!</span>`;
    }
  }, 1000);

  // Controles de movimento no minigame
  const mgKeyHandler = (e) => {
    if (!minigameState.active) return;
    if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') minigameState.shipX -= 15;
    if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') minigameState.shipX += 15;
    if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w') minigameState.shipY -= 15;
    if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') minigameState.shipY += 15;
    
    minigameState.shipX = Math.max(20, Math.min(430, minigameState.shipX));
    minigameState.shipY = Math.max(20, Math.min(230, minigameState.shipY));
  };
  window.addEventListener('keydown', mgKeyHandler);

  // Loop de renderização do minigame
  function runMg() {
    if (!minigameState.active) {
      window.removeEventListener('keydown', mgKeyHandler);
      return;
    }

    mgCtx.clearRect(0, 0, 450, 250);

    // Desenhar obstáculos e tesouros
    minigameState.obstacles.forEach(item => {
      item.x -= item.speed;
      if (item.x < 0) {
        item.x = 450;
        item.y = Math.random() * 200 + 25;
        item.type = Math.random() > 0.4 ? 'bomb' : 'treasure';
      }

      mgCtx.font = '20px sans-serif';
      mgCtx.textAlign = 'center';
      mgCtx.fillText(item.type === 'bomb' ? '💣' : '💰', item.x, item.y);

      // Colisão com o navio
      let dist = Math.hypot(minigameState.shipX - item.x, minigameState.shipY - item.y);
      if (dist < 22) {
        if (item.type === 'treasure') {
          audioSys.playClick();
          minigameState.score++;
          item.x = 450; // Reposiciona
        } else {
          audioSys.playWrong();
          minigameState.score = Math.max(0, minigameState.score - 2); // Penalidade
          item.x = 450;
        }
      }
    });

    // Desenhar navio no minigame
    mgCtx.fillStyle = '#f59e0b';
    mgCtx.beginPath();
    mgCtx.arc(minigameState.shipX, minigameState.shipY, 12, 0, Math.PI * 2);
    mgCtx.fill();
    mgCtx.font = '16px sans-serif';
    mgCtx.fillText('⛵', minigameState.shipX, minigameState.shipY + 6);

    requestAnimationFrame(runMg);
  }
  runMg();
}

  const contBtn = document.getElementById('btn-continue');
  if (contBtn) {
    contBtn.addEventListener('click', () => {
      audioSys.init(); 
      audioSys.playClick();
      loadGameData();
      document.getElementById('start-screen').classList.add('hidden');
    });
  }

  document.getElementById('btn-reset-data')?.addEventListener('click', () => {
    if (confirm("Deseja apagar o progresso salvo?")) {
      localStorage.removeItem('nav_rpg_save');
      location.reload();
    }
  });

  document.getElementById('btn-toggle-audio')?.addEventListener('click', () => {
    audioSys.enabled = !audioSys.enabled;
    if (audioSys.customBgm) {
      audioSys.customBgm.muted = !audioSys.enabled;
    }
    const btn = document.getElementById('btn-toggle-audio');
    if (btn) btn.textContent = audioSys.enabled ? "🔊 Áudio" : "🔇 Mudo";
  });

  document.getElementById('btn-open-quests')?.addEventListener('click', () => openQuestModal(gameState.currentQuestIndex));
  document.getElementById('btn-open-library')?.addEventListener('click', openLibraryModal);
  document.getElementById('btn-open-tools')?.addEventListener('click', openStudyToolsModal);
  document.getElementById('btn-open-simulado')?.addEventListener('click', openSimuladoModal);

  const bindTouch = (id, key) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', (e) => { e.preventDefault(); touchState[key] = true; });
    el.addEventListener('touchend', (e) => { e.preventDefault(); touchState[key] = false; });
    el.addEventListener('mousedown', () => { touchState[key] = true; });
    el.addEventListener('mouseup', () => { touchState[key] = false; });
  };
  bindTouch('btn-touch-up', 'up');
  bindTouch('btn-touch-down', 'down');
  bindTouch('btn-touch-left', 'left');
  bindTouch('btn-touch-right', 'right');
}

// LOOP PRINCIPAL
function gameLoop() {
  updateGame();
  renderGame();
  requestAnimationFrame(gameLoop);
}

function updateGame() {
  let steer = 0;
  let accel = 0;

  if (keys['w'] || keys['arrowup'] || touchState.up) accel += 0.08;
  if (keys['s'] || keys['arrowdown'] || touchState.down) accel -= 0.06;
  if (keys['a'] || keys['arrowleft'] || touchState.left) steer -= 0.04;
  if (keys['d'] || keys['arrowright'] || touchState.right) steer += 0.04;

  gameState.angle += steer;
  gameState.speed += accel;
  if (gameState.speed > gameState.maxSpeed) gameState.speed = gameState.maxSpeed;
  if (gameState.speed < -0.8) gameState.speed = -0.8;
  if (!accel) gameState.speed *= 0.98;

  gameState.x += Math.cos(gameState.angle) * gameState.speed;
  gameState.y += Math.sin(gameState.angle) * gameState.speed;

  if (canvas) {
    gameState.x = Math.max(50, Math.min(canvas.width - 50, gameState.x));
    gameState.y = Math.max(50, Math.min(canvas.height - 50, gameState.y));
  }

  checkPOIs();
  checkOceanNPC();
}

function renderGame() {
  if (!ctx || !canvas) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let isNight = gameState.timeOfDay < 6 || gameState.timeOfDay > 19;
  ctx.fillStyle = isNight ? '#060913' : '#0c3b5e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Textura do Mar (Ondinhas)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  for (let x = 60; x < canvas.width; x += 100) {
    for (let y = 50; y < canvas.height; y += 90) {
      let offsetX = (y % 180 === 0) ? 40 : 0;
      ctx.beginPath();
      ctx.moveTo(x + offsetX - 12, y);
      ctx.quadraticCurveTo(x + offsetX - 6, y - 6, x + offsetX, y);
      ctx.quadraticCurveTo(x + offsetX + 6, y + 6, x + offsetX + 12, y);
      ctx.stroke();
    }
  }

  // Linhas de Rumpe
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 140) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 140) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // RENDERIZAR NPC ITINERANTE NO OCEANO (Se ainda não foi encontrado)
  if (!gameState.npcMet) {
    ctx.save();
    ctx.translate(OCEAN_NPC.x, OCEAN_NPC.y);
    // Pulso do NPC
    ctx.beginPath();
    ctx.arc(0, 0, OCEAN_NPC.radius + Math.sin(Date.now() * 0.008) * 6, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(236, 72, 153, 0.3)';
    ctx.fill();

    // Navio do NPC
    ctx.fillStyle = '#831843';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(-8, 8);
    ctx.lineTo(-12, 0);
    ctx.lineTo(-8, -8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nome flutuante do NPC
    ctx.fillStyle = '#fce7f3';
    ctx.font = 'bold 10px Cinzel, serif';
    ctx.textAlign = 'center';
    ctx.fillText("⛵ " + OCEAN_NPC.name, 0, -18);
    ctx.restore();
  }

  // RENDERIZAR ILHAS E PORTOS
  POIS.forEach(poi => {
    let currentQ = QUESTS[gameState.currentQuestIndex];
    let isTarget = currentQ && currentQ.target === poi.id;

    ctx.save();
    ctx.translate(poi.x, poi.y);

    if (isTarget) {
      let pulse = poi.radius + Math.sin(Date.now() * 0.006) * 8;
      ctx.beginPath();
      ctx.arc(0, 0, pulse, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.8)';
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]); 
    }

    ctx.beginPath();
    ctx.arc(0, 0, poi.radius * 0.75, 0, Math.PI * 2);
    let islandGrad = ctx.createRadialGradient(-5, -5, 5, 0, 0, poi.radius);
    islandGrad.addColorStop(0, '#334155');
    islandGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = islandGrad;
    ctx.fill();
    
    ctx.lineWidth = 3;
    ctx.strokeStyle = poi.color;
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⚓', 0, 6);

    ctx.font = 'bold 11px Cinzel, serif';
    let textWidth = ctx.measureText(poi.name).width;
    
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(-textWidth / 2 - 8, poi.radius + 6, textWidth + 16, 20);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#d97706';
    ctx.strokeRect(-textWidth / 2 - 8, poi.radius + 6, textWidth + 16, 20);

    ctx.fillStyle = '#fde68a';
    ctx.fillText(poi.name, 0, poi.radius + 21);

    ctx.restore();
  });

  // RENDERIZAR O NAVIO DO JOGADOR
  ctx.save();
  ctx.translate(gameState.x, gameState.y);
  ctx.rotate(gameState.angle);

  if (Math.abs(gameState.speed) > 0.2) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.moveTo(-18, -5);
    ctx.lineTo(-32, -10);
    ctx.lineTo(-26, 0);
    ctx.lineTo(-32, 10);
    ctx.lineTo(-18, 5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.moveTo(18, 0);
  ctx.lineTo(-10, 10);
  ctx.lineTo(-16, 6);
  ctx.lineTo(-16, -6);
  ctx.lineTo(-10, -10);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#b45309';
  ctx.stroke();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.moveTo(-2, -7);
  ctx.lineTo(10, 0);
  ctx.lineTo(-2, 7);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#cbd5e1';
  ctx.stroke();

  ctx.restore();
}

// SISTEMA DE DETECÇÃO DE MISSÕES E NPCs NO OCEANO
let modalLock = false;

function checkPOIs() {
  if (modalLock) return;
  let currentQ = QUESTS[gameState.currentQuestIndex];
  if (!currentQ) return;

  POIS.forEach(poi => {
    if (poi.id === currentQ.target) {
      let dist = Math.hypot(gameState.x - poi.x, gameState.y - poi.y);
      if (dist < poi.radius + 15) {
        modalLock = true;
        audioSys.playClick();
        openQuestModal(gameState.currentQuestIndex);
      }
    }
  });
}

function checkOceanNPC() {
  if (modalLock || gameState.npcMet) return;
  let dist = Math.hypot(gameState.x - OCEAN_NPC.x, gameState.y - OCEAN_NPC.y);
  if (dist < OCEAN_NPC.radius + 20) {
    modalLock = true;
    gameState.npcMet = true;
    audioSys.playClick();
    openNpcEncounterModal();
  }
}

// MODAL DE ENCONTRO COM O NPC NO OCEANO
function openNpcEncounterModal() {
  audioSys.pauseBgm();
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = "🌊 Encontro em Alto-Mar: " + OCEAN_NPC.name;
  
  document.getElementById('modal-body').innerHTML = `
    <div style="background: rgba(15,23,42,0.85); padding: 14px; border-radius: 8px; border: 1px solid rgba(236,72,153,0.4); margin-bottom: 16px;">
      <div style="font-size: 11px; color: #f43f5e; margin-bottom: 4px;">CAPITÃO ENCONTRADO:</div>
      <div style="font-weight: bold; color: #fce7f3; font-size: 1rem; margin-bottom: 8px;">👤 ${OCEAN_NPC.name} (${OCEAN_NPC.title})</div>
      <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.5;">${OCEAN_NPC.dialog}</p>
    </div>

    <div style="background: #020617; padding: 16px; border-radius: 8px; border: 1px solid #1e293b;">
      <div style="font-size: 11px; color: #f43f5e; margin-bottom: 6px;">DESAFIO DE CAPITÃO:</div>
      <div class="space-y-2">
        ${OCEAN_NPC.options.map((opt, idx) => `
          <button class="quiz-option" onclick="window.answerNpc(${idx}, ${OCEAN_NPC.correct}, ${OCEAN_NPC.reward})">${opt}</button>
        `).join('')}
      </div>
      <div id="npc-feedback" style="margin-top: 12px; font-size: 0.85rem; display: none;"></div>
    </div>
  `;

  document.getElementById('modal-footer').innerHTML = `
    <button id="btn-close-npc" class="btn btn-amber hidden" onclick="window.closeModal()">Seguir Viagem ➔</button>
  `;

  modal.classList.remove('hidden');
}

window.answerNpc = function(selected, correct, reward) {
  const options = document.querySelectorAll('.quiz-option');
  const feedback = document.getElementById('npc-feedback');
  const closeBtn = document.getElementById('btn-close-npc');

  options.forEach((btn, idx) => {
    btn.style.pointerEvents = 'none';
    if (idx === correct) btn.classList.add('selected-correct');
    else if (idx === selected) btn.classList.add('selected-wrong');
  });

  feedback.style.display = 'block';
  if (selected === correct) {
    audioSys.playCorrect();
    gameState.ducats += reward;
    feedback.innerHTML = `<span style="color: #34d399; font-weight: bold;">✔ Acertaste!</span><br><span style="color: #cbd5e1;">Vasco da Gama sorri e oferece-te +${reward} ducados de recompensa!</span>`;
    saveGameData();
    updateHUD();
  } else {
    audioSys.playWrong();
    feedback.innerHTML = `<span style="color: #f87171; font-weight: bold;">✖ Resposta Errada.</span><br><span style="color: #cbd5e1;">Vasco da Gama abana a cabeça desapontado e segue rumo ao sul.</span>`;
  }
  if (closeBtn) closeBtn.classList.remove('hidden');
};

function openQuestModal(qIndex) {
  if (qIndex >= QUESTS.length) {
    openSimuladoModal();
    return;
  }
  gameState.currentQuestIndex = qIndex;
  const quest = QUESTS[qIndex];
  
  audioSys.pauseBgm();
  
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = quest.title;
  
  document.getElementById('modal-body').innerHTML = `
    <div style="background: rgba(15,23,42,0.8); padding: 14px; border-radius: 8px; border: 1px solid rgba(217,119,6,0.4); margin-bottom: 16px;">
      <div style="font-size: 11px; color: #f59e0b; margin-bottom: 4px;">PERSONAGEM HISTÓRICO:</div>
      <div style="font-weight: bold; color: #fde68a; font-size: 1rem; margin-bottom: 8px;">👤 ${quest.char}</div>
      <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.5;">${quest.desc}</p>
    </div>

    <div style="background: #020617; padding: 16px; border-radius: 8px; border: 1px solid #1e293b;">
      <div style="font-size: 11px; color: #f59e0b; margin-bottom: 6px;">DESAFIO DE REVISÃO:</div>
      <p style="font-weight: 600; color: #f8fafc; margin-bottom: 12px; font-size: 0.95rem;">${quest.question.q}</p>
      <div class="space-y-2">
        ${quest.question.options.map((opt, idx) => `
          <button class="quiz-option" onclick="window.answerMission(${idx}, ${quest.question.correct})">${opt}</button>
        `).join('')}
      </div>
      <div id="quiz-feedback" style="margin-top: 12px; font-size: 0.85rem; display: none;"></div>
    </div>
  `;

  document.getElementById('modal-footer').innerHTML = `
    <button id="btn-next-quest" class="btn btn-amber hidden" onclick="window.nextMission()">Próxima Missão ➔</button>
  `;

  modal.classList.remove('hidden');
  updateHUD();
}

window.answerMission = function(selected, correct) {
  const options = document.querySelectorAll('.quiz-option');
  const feedback = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('btn-next-quest');
  const quest = QUESTS[gameState.currentQuestIndex];

  options.forEach((btn, idx) => {
    btn.style.pointerEvents = 'none';
    if (idx === correct) btn.classList.add('selected-correct');
    else if (idx === selected) btn.classList.add('selected-wrong');
  });

  feedback.style.display = 'block';
  if (selected === correct) {
    audioSys.playCorrect();
    gameState.ducats += 50;
    gameState.xp += 100;
    feedback.innerHTML = `<span style="color: #34d399; font-weight: bold;">✔ Resposta Correta!</span><br><span style="color: #cbd5e1;">${quest.question.explanation}</span>`;
    if (nextBtn) nextBtn.classList.remove('hidden');
    saveGameData();
    updateHUD();
  } else {
    audioSys.playWrong();
    feedback.innerHTML = `<span style="color: #f87171; font-weight: bold;">✖ Incorreto.</span><br><span style="color: #cbd5e1;">Explicação: ${quest.question.explanation}</span>`;
    if (nextBtn) nextBtn.classList.remove('hidden');
  }
};

window.nextMission = function() {
  gameState.currentQuestIndex++;
  modalLock = false;
  closeModal();
  if (gameState.currentQuestIndex >= QUESTS.length) {
    openSimuladoModal();
  }
}

// BIBLIOTECA
function openLibraryModal() {
  audioSys.playClick();
  audioSys.pauseBgm(); 
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = "📚 Biblioteca de História (Ensino Médio)";
  document.getElementById('modal-body').innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${LIBRARY_CHAPTERS.map(ch => `
        <div style="background: #020617; border: 1px solid rgba(217,119,6,0.3); padding: 14px; border-radius: 8px;">
          <h4 style="color: #fde68a; font-family: 'Cinzel', serif; font-size: 1rem; margin-bottom: 6px;">${ch.title}</h4>
          <p style="color: #cbd5e1; font-size: 0.85rem; line-height: 1.5;">${ch.text}</p>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('modal-footer').innerHTML = `<button class="btn btn-amber" onclick="window.closeModal()">Fechar</button>`;
  modal.classList.remove('hidden');
}

// FERRAMENTAS DE ESTUDO
function openStudyToolsModal() {
  audioSys.playClick();
  audioSys.pauseBgm(); 
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = "✏️ Ferramentas de Estudo e Revisão";
  document.getElementById('modal-body').innerHTML = `
    <h3 style="color: #fde68a; margin-bottom: 12px; font-size: 1rem;">Cartões de Memória (Flashcards)</h3>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
      ${FLASHCARDS.map(fc => `
        <div class="flashcard" onclick="this.style.borderColor = this.style.borderColor === 'rgb(245, 158, 11)' ? '#1e293b' : '#f59e0b'">
          <div style="font-size: 10px; color: #f59e0b; margin-bottom: 4px;">CONCEITO</div>
          <div style="font-weight: bold; color: #fef3c7; font-size: 0.9rem; margin-bottom: 8px;">${fc.front}</div>
          <div style="font-size: 0.8rem; color: #94a3b8; line-height: 1.4;">${fc.back}</div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('modal-footer').innerHTML = `<button class="btn btn-amber" onclick="window.closeModal()">Fechar</button>`;
  modal.classList.remove('hidden');
}

// SIMULADO
function openSimuladoModal() {
  audioSys.playClick();
  audioSys.pauseBgm(); 
  const modal = document.getElementById('modal-overlay');
  document.getElementById('modal-title').textContent = "✍️ Simulado Preparatório (Enem & Vestibulares)";
  document.getElementById('modal-body').innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      ${QUIZ_QUESTIONS.map((q, idx) => `
        <div style="background: #020617; padding: 14px; border-radius: 8px; border: 1px solid #1e293b;">
          <div style="font-size: 10px; color: #f59e0b; margin-bottom: 4px;">Questão ${idx + 1}</div>
          <p style="font-weight: 600; color: #f8fafc; font-size: 0.9rem; margin-bottom: 10px;">${q.q}</p>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            ${q.options.map((opt, oIdx) => `
              <button class="quiz-option" onclick="window.answerSim(${idx}, ${oIdx}, ${q.correct})">${opt}</button>
            `).join('')}
          </div>
          <div id="sim-exp-${idx}" style="margin-top: 8px; font-size: 0.8rem; display: none;"></div>
        </div>
      `).join('')}
    </div>
  `;
  document.getElementById('modal-footer').innerHTML = `<button class="btn btn-amber" onclick="window.closeModal()">Concluir</button>`;
  modal.classList.remove('hidden');
}

window.answerSim = function(qIdx, selected, correct) {
  const q = QUIZ_QUESTIONS[qIdx];
  const expBox = document.getElementById(`sim-exp-${qIdx}`);
  expBox.style.display = 'block';
  if (selected === correct) {
    audioSys.playCorrect();
    expBox.innerHTML = `<span style="color: #34d399; font-weight: bold;">✔ Correto!</span> ${q.explanation}`;
  } else {
    audioSys.playWrong();
    expBox.innerHTML = `<span style="color: #f87171; font-weight: bold;">✖ Incorreto.</span> ${q.explanation}`;
  }
};

window.closeModal = function() {
  modalLock = false;
  audioSys.stopSfx(); 
  document.getElementById('modal-overlay').classList.add('hidden');
  audioSys.resumeBgm(); 
}

function updateHUD() {
  document.getElementById('player-title').textContent = gameState.title;
  document.getElementById('player-ducats').textContent = gameState.ducats;
  document.getElementById('player-xp').textContent = gameState.xp;

  if (gameState.xp >= 300) gameState.title = "Capitão Real";
  else if (gameState.xp >= 150) gameState.title = "Navegador Mestre";

  let currentQ = QUESTS[gameState.currentQuestIndex];
  if (currentQ) {
    document.getElementById('quest-progress-tag').textContent = `${gameState.currentQuestIndex + 1}/${QUESTS.length}`;
    document.getElementById('active-quest-title').textContent = currentQ.title;
    document.getElementById('active-quest-desc').textContent = currentQ.desc;
  } else {
    document.getElementById('active-quest-title').textContent = "Expedição Concluída!";
    document.getElementById('active-quest-desc').textContent = "Você dominou todos os conceitos das Grandes Navegações!";
  }
}

function saveGameData() {
  localStorage.setItem('nav_rpg_save', JSON.stringify(gameState));
}

function loadGameData() {
  const saved = localStorage.getItem('nav_rpg_save');
  if (saved) {
    try {
      gameState = JSON.parse(saved);
      document.getElementById('btn-continue')?.classList.remove('hidden');
    } catch(e) {}
  }
}