/* ==========================================================================
   NAVEGADORES DO DESTINO - MOTOR RPG COMPLETO (DIÁLOGOS, PENALIDADE E APROFUNDAMENTO)
   ========================================================================== */

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
    if (this.customBgm) this.customBgm.pause();
  }

  resumeBgm() {
    if (this.customBgm && this.enabled) this.customBgm.play().catch(() => {});
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

// ESTADO DO JOGO
let gameState = {
  x: 300,
  y: 150,
  angle: 0,
  speed: 0,
  maxSpeed: 2.5,
  title: "Grumete",
  ducats: 150,
  xp: 0,
  currentQuestIndex: 0,
  day: 1,
  timeOfDay: 12,
  morale: 100 // Nova mecânica de RPG: Moral da tripulação
};

let keys = {};
let touchState = { up: false, down: false, left: false, right: false };

// PONTOS DE INTERESSE (POIs) NO MAPA 2D
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

// MISSÕES RPG NÍVEL VESTIBULAR (Avançadas e Complexas)
const QUESTS = [
  {
    id: 1,
    title: "1. O Périplo Africano e o Bloqueio Comercial",
    target: "lisboa",
    npcName: "Infante D. Henrique",
    npcRole: "O Navegador",
    introDialog: "Saudações, capitão. Antes de zarparmos, compreenda o peso de nossa empreitada: a Queda de Constantinopla em 1453 sufocou nossas rotas tradicionais terrestres. Qual foi a consequência geopolítica imediata que forçou Portugal a buscar o caminho contornando a África?",
    options: [
      "A) A imposição de taxas abusivas e monopólio de intermediários muçulmanos e venezianos sobre as especiarias orientais.",
      "B) A descoberta de minas de prata no interior do Saara que exigiam escoamento marítimo imediato.",
      "C) O decreto papal que proibiu a navegação no Mar Mediterrâneo a todas as nações ibéricas.",
      "D) A aliança militar entre o Império Otomano e a Coroa Espanhola para dominar o Atlântico."
    ],
    correct: 0,
    explanation: "O controle turco-otomano e veneziano encareceu drasticamente as especiarias, tornando vital uma rota atlântica exclusiva."
  },
  {
    id: 2,
    title: "2. A Revolução Náutica e a Caravela",
    target: "lisboa",
    npcName: "Mestre dos Estaleiros",
    npcRole: "Especialista em Cartografia",
    introDialog: "Nossa caravela é nossa vida. Mas qual foi a inovação tecnológica náutica crucial desenvolvida ou adaptada pelos portugueses que permitiu o retorno pela costa africana contra os ventos dominantes?",
    options: [
      "A) A invenção da máquina a vapor adaptada a rodas de pás de madeira.",
      "B) O uso combinado de velas triangulares (latinas) com o casco caravélico, viabilizando o bordo (navegar em zigue-zague contra o vento).",
      "C) O uso exclusivo de remadores escravizados no porão inferior para garantir velocidade constante.",
      "D) O mapeamento via satélites rudimentares de astrolábios de vidro."
    ],
    correct: 1,
    explanation: "A vela latina permitia o fenômeno do bordo, essencial para vencer os ventos contrários no regresso da África."
  },
  {
    id: 3,
    title: "3. Feitorias do Périplo",
    target: "costa_africana",
    npcName: "Gomes Eanes de Zurara",
    npcRole: "Cronista Real",
    introDialog: "Aportamos na Costa Ocidental. Em vez de colonizar o interior africano de imediato, optamos por um modelo econômico específico. O que caracterizava as feitorias?",
    options: [
      "A) Cidades fortificadas com leis civis portuguesas para moradia de famílias inteiras.",
      "B) Entrepostos comerciais fortificados litorâneos destinados à acumulação de mercadorias e negociação rápida sem ocupação territorial profunda.",
      "C) Mosteiros religiosos obrigatórios para conversão forçada de monarcas locais.",
      "D) Campos agrícolas de monocultura de cana-de-açúcar."
    ],
    correct: 1,
    explanation: "As feitorias funcionavam como pontos fortificados de troca comercial e armazéns, evitando guerras de conquista custosas."
  },
  {
    id: 4,
    title: "4. O Cabo das Tormentas",
    target: "cabo",
    char: "Bartolomeu Dias",
    npcName: "Bartolomeu Dias",
    npcRole: "Desbravador do Sul",
    introDialog: "enfrentamos tempestades titânicas no extremo sul africano! D. João II rebatizou o local. Por que essa passagem alterou os rumos do mercantilismo mundial?",
    options: [
      "A) Porque provou que os oceanos Atlântico e Índico comunicavam-se diretamente, viabilizando a rota para as Índias.",
      "B) Porque revelou jazidas imensas de ouro puro nas praias da região.",
      "C) Porque estabeleceu o fim definitivo das navegações espanholas.",
      "D) Porque evitou que navios naufragassem em correntes geladas."
    ],
    correct: 0,
    explanation: "A união dos oceanos abriu o caminho físico tão sonhado para o comércio asiático direto."
  },
  {
    id: 5,
    title: "5. O Equívoco de Colombo",
    target: "caribe",
    npcName: "Espanhol Desiludido",
    npcRole: "Tripulante de Colombo",
    introDialog: "Espanha apostou em Colombo. Contudo, qual foi o erro de cálculo geográfico cometido por ele em 1492?",
    options: [
      "A) Ele achava que a Terra era quadrada.",
      "B) Ele subestimou severamente a circunferência da Terra e ignorou a existência do continente americano no trajeto.",
      "C) Ele navegou apenas por rios navegáveis internos.",
      "D) Ele utilizou mapas falsificados por piratas ingleses."
    ],
    correct: 1,
    explanation: "Colombo calculou um raio terrestre muito menor e desconhecia o obstáculo continental da América."
  },
  {
    id: 6,
    title: "6. Tratado de Tordesilhas",
    target: "tordesilhas",
    npcName: "Diplomata da Coroa",
    npcRole: "Embaixador de Portugal",
    introDialog: "A diplomacia ibérica precisava evitar conflitos armados entre Portugal e Espanha. O que estipulava o Tratado de Tordesilhas de 1494?",
    options: [
      "A) A divisão de todo o globo terrestre através de um meridiano fixado a uma quantidade de léguas a oeste de Cabo Verde.",
      "B) A fusão imediata dos reinos de Portugal e Espanha sob um único monarca.",
      "C) A proibição de exploração comercial a norte do Equador.",
      "D) A partilha exclusiva do continente asiático."
    ],
    correct: 0,
    explanation: "O meridiano de Tordesilhas dividiu as terras descobertas e por descobrir entre as duas coroas ibéricas."
  },
  {
    id: 7,
    title: "7. Vasco da Gama em Calecute",
    target: "india",
    npcName: "Zamorim de Calecute",
    npcRole: "Soberano Local",
    introDialog: "Aportamos na Índia em 1498! Qual foi o impacto econômico imediato da viagem de Vasco da Gama para a Europa?",
    options: [
      "A) A quebra imediata do monopólio de Veneza e dos mercadores árabes sobre as especiarias.",
      "B) A colonização pacífica de todo o subcontinente indiano por Portugal.",
      "C) A substituição das especiarias orientais por cacau americano.",
      "D) O fechamento de todos os portos europeus."
    ],
    correct: 0,
    explanation: "Portugal passou a importar diretamente e a preços muito inferiores, desestabilizando o comércio tradicional veneziano."
  },
  {
    id: 8,
    title: "8. A Armada de Cabral e o Brasil",
    target: "brasil",
    npcName: "Pero Vaz de Caminha",
    npcRole: "Escrivão da Frota",
    introDialog: "Chegamos a Porto Seguro em abril de 1500. Como a historiografia moderna interpreta primariamente a viagem de Cabral?",
    options: [
      "A) Um desvio puramente acidental causado por tempestades violentas no Atlântico.",
      "B) Uma expedição com rota intencional para tomar posse oficial da porção atlântica pertencente a Portugal segundo Tordesilhas.",
      "C) Uma missão secreta para combater piratas franceses no Caribe.",
      "D) Uma viagem perdida rumo à África Oriental."
    ],
    correct: 1,
    explanation: "A magnitude da armada e a rota adotada indicam forte intencionalidade estratégica de reconhecimento e posse."
  },
  {
    id: 9,
    title: "9. Tráfico e Exploração Colonial",
    target: "costa_oriental",
    npcName: "Comerciante de Feitoria",
    npcRole: "Fator Real",
    introDialog: "O mercantilismo exigia lucros exponenciais. Qual foi o papel central do tráfico transatlântico de africanos escravizados?",
    options: [
      "A) Servir exclusivamente como tripulantes de alta patente nas caravelas.",
      "B) Prover mão de obra forçada intensiva para os sistemas de plantation e mineração nas colônias americanas.",
      "C) Substituir os animais de carga nas cidades europeias.",
      "D) Atuar como diplomatas perante os reinos indígenas."
    ],
    correct: 0,
    explanation: "A economia colonial dependeu estruturalmente da exploração desumana da força de trabalho escravizada."
  },
  {
    id: 10,
    title: "10. Consequências Globais e o Sistema-Mundo",
    target: "lisboa",
    char: "Rei D. Manuel I",
    npcName: "Rei D. Manuel I",
    npcRole: "O Venturoso",
    introDialog: "Retornamos a Lisboa coroados de glória. Qual foi a principal consequência estrutural global das Grandes Navegações para a economia mundial?",
    options: [
      "A) O deslocamento do eixo econômico mundial do Mar Mediterrâneo para o Oceano Atlântico.",
      "B) O isolamento comercial absoluto entre os continentes.",
      "C) A adoção de um padrão monetário único global baseado em papel-moeda.",
      "D) A extinção do mercantilismo em favor do liberalismo pleno."
    ],
    correct: 0,
    explanation: "O Atlântico tornou-se o centro nevralgico do comércio internacional, impulsionando a acumulação primitiva de capital."
  }
];

// BIBLIOTECA E SIMULADO
const LIBRARY_CHAPTERS = [
  { title: "1. O Contexto de 1453", text: "A queda de Constantinopla encerrou o acesso seguro pelas rotas terrestres do Levante, encarecendo produtos asiáticos." },
  { title: "2. Pioneirismo Português", text: "Estabilidade político-administrativa precoce pós-Revolução de Avis (1385), centralização e aliança com a burguesia mercantil." },
  { title: "3. O Périplo Africano", text: "Estratégia gradual de exploração e mapeamento sistemático da costa da África rumo ao sul." }
];

const QUIZ_QUESTIONS = [
  { q: "Qual o fator político interno chave para o pioneirismo português?", options: ["Absolutismo tardio", "Revolução de Avis", "Guerra das Duas Rosas", "Reforma Protestante"], correct: 1, explanation: "A Revolução de Avis uniu coroa e burguesia mercantil." }
];

const FLASHCARDS = [
  { front: "Tratado de Tordesilhas", back: "1494 - Divisão do mundo ultramarino entre Portugal e Espanha." }
];

let canvas, ctx;

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();
  
  // O resto do teu código do jogo (como o loop de animação, imagens, etc.) pode vir aqui dentro ou abaixo
});

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

window.addEventListener('resize', resizeCanvas);

resizeCanvas(); 

function setupListeners() {
  document.getElementById('btn-open-shop')?.addEventListener('click', openShopModal);
  window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

  const startBtn = document.getElementById('btn-start-new');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      audioSys.init(); 
      audioSys.playClick();
      gameState = { x: 300, y: 150, angle: 0, speed: 0, maxSpeed: 2.5, title: "Grumete", ducats: 150, xp: 0, currentQuestIndex: 0, day: 1, timeOfDay: 10, morale: 100 };
      saveGameData();
      document.getElementById('start-screen').classList.add('hidden');
      openQuestModal(0);
    });
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
    if (confirm("Deseja reiniciar a expedição?")) {
      localStorage.removeItem('nav_rpg_save');
      location.reload();
    }
  });

  document.getElementById('btn-toggle-audio')?.addEventListener('click', () => {
    audioSys.enabled = !audioSys.enabled;
    if (audioSys.customBgm) audioSys.customBgm.muted = !audioSys.enabled;
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

// SISTEMA DE DETECÇÃO DE MISSÕES
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
    <div style="background: rgba(15,23,42,0.9); padding: 14px; border-radius: 8px; border: 1px solid rgba(217,119,6,0.4); margin-bottom: 16px;">
      <div style="font-size: 11px; color: #f59e0b; margin-bottom: 4px;">CONVERSA COM O NPC HISTÓRICO:</div>
      <div style="font-weight: bold; color: #fde68a; font-size: 1rem; margin-bottom: 8px;">👤 ${quest.npcName} <span style="font-size: 0.8rem; color: #94a3b8;">(${quest.npcRole})</span></div>
      <p style="color: #cbd5e1; font-size: 0.9rem; line-height: 1.5; font-style: italic;">"${quest.introDialog}"</p>
    </div>

    <div style="background: #020617; padding: 16px; border-radius: 8px; border: 1px solid #1e293b;">
      <div style="font-size: 11px; color: #f59e0b; margin-bottom: 6px;">QUESTÃO DE ANÁLISE HISTÓRICA:</div>
      <div class="space-y-2">
        ${quest.options.map((opt, idx) => `
          <button class="quiz-option" onclick="window.answerMission(${idx}, ${quest.correct})">${opt}</button>
        `).join('')}
      </div>
      <div id="quiz-feedback" style="margin-top: 12px; font-size: 0.85rem; display: none;"></div>
    </div>
  `;

  document.getElementById('modal-footer').innerHTML = `
    <button id="btn-next-quest" class="btn btn-amber hidden" onclick="window.nextMission()">Prosseguir Expedição ➔</button>
  `;

  modal.classList.remove('hidden');
  updateHUD();
}

window.answerMission = function(selected, correct) {
  const options = document.querySelectorAll('.quiz-option');
  const feedback = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('btn-next-quest');
  const quest = QUESTS[gameState.currentQuestIndex];

  // Trava todas as opções imediatamente (sem poder clicar de novo para adivinhar)
  options.forEach((btn, idx) => {
    btn.style.pointerEvents = 'none';
    if (idx === correct) btn.classList.add('selected-correct');
    else if (idx === selected) btn.classList.add('selected-wrong');
  });

  feedback.style.display = 'block';
  if (selected === correct) {
    audioSys.playCorrect();
    gameState.ducats += 80;
    gameState.xp += 150;
    feedback.innerHTML = `<span style="color: #34d399; font-weight: bold;">✔ Resposta Correta!</span><br><span style="color: #cbd5e1;">${quest.explanation}</span>`;
    if (nextBtn) nextBtn.classList.remove('hidden');
    saveGameData();
    updateHUD();
  } else {
    audioSys.playWrong();
    gameState.ducats = Math.max(0, gameState.ducats - 40); // Penalidade por erro
    feedback.innerHTML = `<span style="color: #f87171; font-weight: bold;">✖ Resposta Incorreta! (-40 ducados)</span><br><span style="color: #cbd5e1;">A resposta certa era a alternativa <strong>${String.fromCharCode(65 + correct)}</strong>.<br>${quest.explanation}</span>`;
    if (nextBtn) nextBtn.classList.remove('hidden'); // Permite avançar mas com penalidade
    saveGameData();
    updateHUD();
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
  document.getElementById('modal-title').textContent = "📚 Biblioteca de História (Vestibulares)";
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
  document.getElementById('modal-title').textContent = "✏️ Cartões de Memória";
  document.getElementById('modal-body').innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
      ${FLASHCARDS.map(fc => `
        <div class="flashcard" onclick="this.style.borderColor = this.style.borderColor === 'rgb(245, 158, 11)' ? '#1e293b' : '#f59e0b'">
          <div style="font-size: 10px; color: #f59e0b; margin-bottom: 4px;">CONCEITO-CHAVE</div>
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
  document.getElementById('modal-title').textContent = "✍️ Simulado Final (Fuvest/Unicamp)";
  document.getElementById('modal-body').innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 16px;">
      ${QUIZ_QUESTIONS.map((q, idx) => `
        <div style="background: #020617; padding: 14px; border-radius: 8px; border: 1px solid #1e293b;">
          <div style="font-size: 10px; color: #f59e0b; margin-bottom: 4px;">Questão Avançada ${idx + 1}</div>
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

  if (gameState.xp >= 600) gameState.title = "Capitão Real";
  else if (gameState.xp >= 300) gameState.title = "Navegador Mestre";

  let currentQ = QUESTS[gameState.currentQuestIndex];
  if (currentQ) {
    document.getElementById('quest-progress-tag').textContent = `${gameState.currentQuestIndex + 1}/${QUESTS.length}`;
    document.getElementById('active-quest-title').textContent = currentQ.title;
    document.getElementById('active-quest-desc').textContent = `Fale com ${currentQ.npcName} em ${currentQ.target}.`;
  } else {
    document.getElementById('active-quest-title').textContent = "Expedição Concluída!";
    document.getElementById('active-quest-desc').textContent = "Você dominou todas as rotas e conceitos das Grandes Navegações!";
  }
}

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