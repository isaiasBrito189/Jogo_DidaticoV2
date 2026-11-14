'use strict';
/* ====== DADOS: edite aqui perguntas e personagens ====== */
const NEEDED = 3; // assinaturas necessárias
const PLENARY_Q = {
  text: 'Qual poder da República é responsável por criar as leis?',
  opts: ['Poder Executivo', 'Poder Legislativo', 'Poder Judiciário'], ok: 1,
  right: 'Isso! O Legislativo (Câmara e Senado) debate e vota as leis.',
  wrong: 'Não é bem isso. Quem executa as leis (Executivo) e quem julga (Judiciário) têm outras funções. Pense em quem representa o povo no Congresso.'
};
const CITIZENS = [
  { name: 'CARLA', x: 130, y: 88, shirt: '#d65a9b', hair: '#5a2d12',
    ask: 'Sou professora. Se essa lei for aprovada e alguém duvidar dela, quem decide se ela respeita a Constituição?',
    opts: ['O Poder Judiciário (STF)', 'O Poder Executivo', 'A Câmara dos Deputados'], ok: 0,
    hint: 'Pense em quem julga e interpreta a Constituição.' },
  { name: 'JOÃO', x: 300, y: 285, shirt: '#2f6fd1', hair: '#1a1a22',
    ask: 'Se eu assinar, a lei já vale amanhã?',
    opts: ['Sim, a assinatura basta', 'Não: precisa ser votada na Câmara e no Senado e depois sancionada', 'Só vale se o prefeito aprovar'], ok: 1,
    hint: 'Um projeto passa por votação nas duas casas antes da sanção.' },
  { name: 'LUCAS', x: 470, y: 90, shirt: '#2fb37a', hair: '#b4651c',
    ask: 'Eu nem sou político. Cidadão comum pode mesmo propor lei?',
    opts: ['Não, só deputados propõem leis', 'Só por plebiscito, que o presidente convoca', 'Pode, pela iniciativa popular, com assinaturas de eleitores'], ok: 2,
    hint: 'A Constituição prevê a iniciativa popular. Você está coletando exatamente isso.' },
  { name: 'ROBERTO', x: 560, y: 282, shirt: '#8791a6', hair: '#eee',
    ask: 'Eu voto, mas não sei quem me representa em Brasília. Quem faz as leis por mim?',
    opts: ['Os deputados federais e senadores', 'Os ministros do STF', 'Os governadores'], ok: 0,
    hint: 'São eleitos pelo voto para compor o Congresso Nacional.' }
];

const SK = ['#f0c9a0','#c68a5a','#8d5a3a','#f0c9a0'];
CITIZENS.forEach((c, i) => c.skin = SK[i]); CITIZENS[0].long = 1;

/* ====== BASE ====== */
const $ = id => document.getElementById(id);
const cv = $('screen'), g = cv.getContext('2d');
g.imageSmoothingEnabled = false;
let scene = 'title', t = 0, locked = false;
const me = { x: 40, y: 180, tx: null, ty: null };
const keys = {};
let citizens = [];

const shuffle = a => a.map(v => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map(p => p[1]);
const R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), w, h); };

/* ====== SONS (sintetizados, sem arquivos) ====== */
let AC = null, muted = false;
function tone(f, d, type = 'square', v = .05, at = 0, f2) {
  if (!AC || muted) return; const o = AC.createOscillator(), n = AC.createGain(), s = AC.currentTime + at;
  o.type = type; o.frequency.setValueAtTime(f, s); if (f2) o.frequency.exponentialRampToValueAtTime(f2, s + d);
  n.gain.setValueAtTime(v, s); n.gain.exponentialRampToValueAtTime(.0001, s + d); o.connect(n); n.connect(AC.destination); o.start(s); o.stop(s + d);
}
const SFX = {
  blip: p => tone(p, .04, 'square', .02), click: () => tone(520, .06, 'square', .05),
  good: () => [523, 659, 784].forEach((f, i) => tone(f, .12, 'square', .05, i * .1)), bad: () => tone(200, .3, 'sawtooth', .05, 0, 80),
  sign: () => { tone(880, .08, 'triangle', .07); tone(1320, .18, 'triangle', .07, .08); },
  horn: () => { tone(330, .3, 'sawtooth', .03); tone(415, .3, 'sawtooth', .03); }, vote: () => tone(600 + Math.random() * 300, .05, 'square', .03),
  win: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, .2, 'square', .06, i * .15))
};
const sfx = (n, p) => SFX[n] && SFX[n](p);

/* ====== PERSONAGEM PIXEL ====== */
function person(x, y, o, label, signed, c = g) {
  x = Math.round(x); y = Math.round(y + Math.sin(t / 8 + x) * (o.walk ? 1.5 : .4));
  const K = (col, a, b, w, h) => { c.fillStyle = col; c.fillRect(a, b, w, h); }, sk = o.skin || '#f0c9a0', st = o.walk ? Math.round(Math.sin(t / 3) * 2) : 0;
  K('#0006', x - 9, y + 27, 22, 5);
  K('#0d1020', x - 5, y + 19 + st, 5, 8); K('#0d1020', x + 3, y + 19 - st, 5, 8);
  K('#222', x - 6, y + 26 + st, 7, 3); K('#222', x + 3, y + 26 - st, 7, 3);
  K(o.shirt, x - 7, y + 6, 16, 14); K('rgba(0,0,0,.18)', x - 7, y + 16, 16, 4);
  K(o.shirt, x - 10, y + 7, 4, 11); K(o.shirt, x + 9, y + (o.up ? -6 : 7), 4, o.up ? 14 : 11);
  K(sk, x - 10, y + 17, 4, 3); K(sk, x + 9, y + (o.up ? -9 : 17), 4, 3);
  K('#fff', x - 2, y + 6, 6, 3); if (o.tie) K(o.tie, x, y + 8, 3, 9);
  K(sk, x - 5, y - 7, 12, 14); K(o.hair, x - 6, y - 9, 14, 5); K(o.hair, x - 6, y - 5, 2, 6); K(o.hair, x + 6, y - 5, 2, 6);
  if (o.long) { K(o.hair, x - 6, y + 1, 3, 9); K(o.hair, x + 5, y + 1, 3, 9); }
  K('#fff', x - 3, y - 2, 3, 3); K('#fff', x + 2, y - 2, 3, 3); K('#14182a', x - 2, y - 1, 2, 2); K('#14182a', x + 3, y - 1, 2, 2); K('#a5574a', x - 1, y + 3, 4, 1);
  if (label) {
    g.font = '8px "Press Start 2P",monospace';
    const w = g.measureText(label).width + 10;
    R('#000a', x + 1 - w / 2, y - 24, w, 12);
    g.fillStyle = signed ? '#44c28a' : '#f2b632'; g.fillText(label, x + 6 - w / 2, y - 14);
  }
}
const fc = $('face').getContext('2d');
function face(o) {
  $('face').hidden = !o; if (!o) return;
  fc.setTransform(1, 0, 0, 1, 0, 0); fc.imageSmoothingEnabled = false; fc.fillStyle = '#24325f'; fc.fillRect(0, 0, 72, 72);
  fc.setTransform(2.4, 0, 0, 2.4, 0, 0); person(15, 13, { ...o, walk: 0, up: 0 }, null, 0, fc); fc.setTransform(1, 0, 0, 1, 0, 0);
}

/* ====== CENÁRIOS ====== */
const SUIT = ['#1d3a8a', '#3b3b4a', '#6b3fa0', '#2a5c4a', '#8a2c3a'], HAIR = ['#14182a', '#4a2a12', '#aaa', '#b4651c'];
function mini(x, y, k, yes) {
  const s = SUIT[k % 5], sk = SK[k % 4];
  R('#5a3f27', x - 12, y + 12, 28, 10); R(s, x - 6, y + 4, 13, 9);
  if (yes) { R(s, x + 6, y - 4, 3, 10); R(sk, x + 6, y - 7, 3, 3); R('#44c28a', x - 1, y + 5, 3, 3); }
  R(sk, x - 3, y - 5, 8, 9); R(HAIR[(k * 3) % 4], x - 3, y - 6, 8, 3);
}
function drawPlenary(votes) {
  R('#0c1430', 0, 0, 640, 360); R('#1a2550', 0, 0, 640, 110);
  R('#2a3a78', 220, 18, 200, 70); R('#e6b830', 232, 28, 176, 50); R('#2c8a4e', 244, 36, 152, 34);
  g.font = '10px "Press Start 2P"'; g.fillStyle = '#fff'; g.fillText('CONGRESSO', 262, 58);
  R('#3b2a1c', 0, 110, 640, 250);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 12; i++) { const k = r * 12 + i; mini(40 + i * 48 + (r % 2) * 20, 130 + r * 34, k, votes !== undefined && k < votes); }
  R('#2a1a10', 0, 272, 640, 88);
}
const BUILD = ['#d9c2a0', '#c98f7a', '#a9bfd6', '#e0d3a3', '#b6c9a0', '#cfa9c9'], AWN = ['#d8404a', '#2f6fd1', '#2fb37a', '#f2b632'];
function drawStreet() {
  R('#9bb7d4', 0, 0, 640, 360);
  for (let i = 0; i < 8; i++) { const x = i * 80; R(BUILD[i % 6], x, 0, 80, 58); R('#9fd4f0', x + 10, 10, 18, 16); R('#9fd4f0', x + 52, 10, 18, 16); R(AWN[i % 4], x, 38, 80, 10); R('#6b4a30', x + 34, 28, 12, 10); }
  R('#0002', 0, 58, 640, 6); R('#b8bcc8', 0, 58, 640, 52); R('#8d93a3', 0, 106, 640, 4);
  for (let x = 0; x < 640; x += 40) R('#a3a8b7', x, 58, 2, 48);
  R('#4a4f5c', 0, 110, 640, 140); R('#fff', 0, 113, 640, 2); R('#fff', 0, 245, 640, 2);
  for (let x = 0; x < 640; x += 50) { R('#cfd3de', x, 143, 24, 2); R('#cfd3de', x, 217, 24, 2); }
  for (let x = 0; x < 640; x += 60) R('#e0b43a', x, 178, 34, 3);
  R('#8d93a3', 0, 250, 640, 4); R('#b8bcc8', 0, 254, 640, 56);
  for (let x = 0; x < 640; x += 40) R('#a3a8b7', x, 254, 2, 56);
  R('#5f9b52', 0, 310, 640, 50);
  for (let i = 0; i < 6; i++) { const x = 30 + i * 110; R('#5a3a24', x + 11, 332, 6, 20); R('#2f7a3c', x, 312, 28, 26); R('#3f9a4e', x + 4, 316, 12, 10); }
  for (let x = 70; x < 640; x += 170) { R('#555d70', x, 66, 3, 38); R('#555d70', x, 66, 10, 3); R('#ffe9a8', x + 8, 69, 4, 3); }
}
const DEP = { shirt: '#1d3a8a', hair: '#14182a', tie: '#d8404a', skin: '#f0c9a0' };
const ASS = { shirt: '#6b3fa0', hair: '#4a2a12', long: 1, skin: '#c68a5a' };
const CC = ['#d8404a', '#2f6fd1', '#f2b632', '#eee', '#2fb37a', '#8b5fd0'], LANES = [[128, -1], [158, -1], [202, 1], [232, 1]], CARS = [];
function spawnCars() { CARS.length = 0; LANES.forEach(([y, d], i) => [0, 1].forEach(k => CARS.push({ x: k * 340 + i * 90, y, d, sp: 1.3 + Math.random() * 1.3, col: CC[(i * 2 + k) % 6] }))); }
function drawCar(c) {
  const x = Math.round(c.x), y = c.y, d = c.d;
  R('#0004', x - 23, y + 8, 46, 6);
  R(c.col, x - 23, y - 10, 46, 20); R('#0002', x - 23, y + 4, 46, 6); R('#9fd4f0', x + d * 10 - 3, y - 8, 7, 16); R('#9fd4f0', x - d * 16 - 2, y - 8, 5, 16); R('#0003', x - 8, y - 7, 14, 14);
  R('#111', x - 17, y - 12, 9, 3); R('#111', x + 8, y - 12, 9, 3); R('#111', x - 17, y + 9, 9, 3); R('#111', x + 8, y + 9, 9, 3);
  R('#ffe27a', x + d * 22, y - 8, 2, 4); R('#ffe27a', x + d * 22, y + 4, 2, 4);
}

/* ====== DIÁLOGO ====== */
let typer = null;
const LOOK = s => s === 'DEPUTADO CARLOS' || s === 'DEPUTADO' ? DEP : s === 'ASSESSOR' ? ASS : CITIZENS.find(c => c.name === s);
function show(speaker, text, done) {
  $('dialog').hidden = false; $('speaker').textContent = speaker; face(LOOK(speaker));
  $('options').innerHTML = ''; $('next').hidden = true; $('prompt').hidden = true;
  const p = 180 + (speaker.length % 5) * 45; let i = 0; const el = $('text'); el.textContent = ''; clearInterval(typer);
  const finish = () => { clearInterval(typer); el.textContent = text; done && done(); };
  typer = setInterval(() => { el.textContent = text.slice(0, ++i); if (i % 2 === 0) sfx('blip', p); if (i >= text.length) finish(); }, 16);
  el.onclick = () => { if (el.textContent !== text) finish(); };
}
function say(speaker, text, cb) {
  locked = true;
  show(speaker, text, () => { $('next').hidden = false; $('next').focus(); $('next').onclick = () => { sfx('click'); $('dialog').hidden = true; locked = false; cb && cb(); }; });
}
function ask(speaker, text, q, onResult) {
  locked = true;
  show(speaker, text, () => {
    shuffle(q.opts.map((o, i) => [o, i])).forEach(([o, i]) => {
      const b = document.createElement('button'); b.className = 'opt'; b.textContent = o;
      b.onclick = () => {
        const good = i === q.ok; sfx(good ? 'good' : 'bad');
        [...$('options').children].forEach(x => x.disabled = true);
        b.classList.add(good ? 'ok' : 'no');
        setTimeout(() => { $('dialog').hidden = true; locked = false; onResult(good); }, 650);
      };
      $('options').appendChild(b);
    });
  });
}
function chain(steps, end) { // steps: [[quem, fala], ...]
  const n = i => i < steps.length ? say(steps[i][0], steps[i][1], () => n(i + 1)) : end && end();
  n(0);
}

/* ====== FLUXO ====== */
function setScene(s) { scene = s; $('prompt').hidden = true; }
function banner(txt) { $('banner').hidden = !txt; $('banner').textContent = txt || ''; }

function startPlenary() {
  setScene('plenary'); $('title').hidden = true; $('hud').hidden = true; banner();
  chain([
    ['DEPUTADO CARLOS', 'Precisamos de mais leis! O trânsito da cidade está um caos e o povo cobra solução.'],
    ['ASSESSOR', 'Concordo, deputado. Mas antes de levar um projeto à frente, preciso conferir uma coisa.']
  ], plenaryQuestion);
}
function plenaryQuestion() {
  ask('ASSESSOR', PLENARY_Q.text, PLENARY_Q, good => {
    say('ASSESSOR', good ? PLENARY_Q.right : PLENARY_Q.wrong, () => good
      ? chain([['DEPUTADO CARLOS', 'Então vou às ruas colher assinaturas de apoio para o projeto de lei. Precisamos de ' + NEEDED + '.']], startStreet)
      : plenaryQuestion());
  });
}
function startStreet() {
  setScene('street'); me.x = 40; me.y = 282; me.tx = null; spawnCars();
  citizens = CITIZENS.map(c => ({ ...c, tries: 0, state: 'open' }));
  $('hud').hidden = false; updateHud();
}
const signed = () => citizens.filter(c => c.state === 'signed').length;
function updateHud() {
  $('hud-count').textContent = signed() + '/' + NEEDED;
  $('meter-fill').style.width = Math.min(100, signed() / NEEDED * 75) + '%';
}
function near() { return citizens.find(c => Math.hypot(c.x - me.x, c.y - me.y) < 38); }

function talk(c) {
  if (locked) return;
  if (c.state === 'signed') return say(c.name, 'Já assinei, deputado. Boa sorte no plenário!');
  if (c.state === 'refused') return say(c.name, 'Já conversamos. Minha decisão está tomada.');
  const first = c.tries === 0;
  const intro = first ? c.ask : 'Você voltou? Tá, vou ouvir de novo. ' + c.ask;
  ask(c.name, intro, c, good => {
    if (good) {
      c.state = 'signed'; updateHud(); setTimeout(() => sfx('sign'), 200);
      return say(c.name, first ? 'Faz sentido! Pode contar com a minha assinatura.' : 'Agora você me convenceu. Mudei de ideia, assino sim!', checkEnd);
    }
    c.tries++;
    if (c.tries >= 2) { c.state = 'refused'; return say(c.name, 'Não me convenceu de novo. Não vou assinar.', checkEnd); }
    say(c.name, 'Hum, não me convenceu. Dica do seu assessor no rádio: ' + c.hint + ' Volte a falar comigo!', checkEnd);
  });
}
function checkEnd() {
  const open = citizens.filter(c => c.state !== 'refused' && c.state !== 'signed').length;
  if (signed() >= NEEDED) return setTimeout(startVote, 300);
  if (signed() + open < NEEDED) say('ASSESSOR', 'Faltam eleitores dispostos a assinar. O projeto não terá apoio suficiente. Vamos tentar de novo?', startStreet);
}
function startVote() {
  setScene('vote'); $('hud').hidden = true; me.votes = 0; $('dialog').hidden = true;
  chain([['NARRADOR', 'Com as assinaturas, o projeto chega ao plenário da Câmara dos Deputados. Hora da votação.']], () => { locked = true; me.vt = t; });
}
function endVote() {
  banner('LEI APROVADA!'); sfx('win');
  setTimeout(() => { banner(); say('NARRADOR', 'Você conseguiu a aprovação da lei! O Legislativo transformou a vontade do povo em norma.', () => {
    ask('NARRADOR', 'Quer jogar de novo?', { opts: ['Jogar de novo', 'Voltar ao início'], ok: 0 }, () => location.reload());
  }); }, 2200);
}

/* ====== LOOP ====== */
function loop() {
  t++;
  if (scene === 'plenary') {
    drawPlenary(); person(190, 215, { ...DEP }, 'CARLOS'); person(450, 215, ASS, 'ASSESSOR');
  } else if (scene === 'street') {
    let dx = 0, dy = 0;
    if (!locked) {
      if (keys.arrowleft || keys.a) dx--; if (keys.arrowright || keys.d) dx++;
      if (keys.arrowup || keys.w) dy--; if (keys.arrowdown || keys.s) dy++;
      if (me.tx !== null && !dx && !dy) { const l = Math.hypot(me.tx - me.x, me.ty - me.y); if (l > 4) { dx = (me.tx - me.x) / l; dy = (me.ty - me.y) / l; } }
    }
    me.x = Math.max(14, Math.min(626, me.x + dx * 2.2)); me.y = Math.max(74, Math.min(304, me.y + dy * 2.2));
    drawStreet();
    const walkers = [me, ...citizens];
    CARS.forEach(c => {
      const bl = walkers.some(w => c.d * (w.x - c.x) > 0 && c.d * (w.x - c.x) < 80 && Math.abs(w.y - c.y) < 28);
      if (bl && !c.hn) sfx('horn'); c.hn = bl; if (!bl) c.x += c.d * c.sp;
      if (c.d > 0 && c.x > 700) { c.x = -60; c.col = CC[Math.random() * 6 | 0]; } if (c.d < 0 && c.x < -60) { c.x = 700; c.col = CC[Math.random() * 6 | 0]; }
      drawCar(c);
    });
    const n = near();
    $('prompt').hidden = !n || locked; if (n) $('prompt').textContent = '[E] falar com ' + n.name;
    citizens.slice().concat([{ me: 1, y: me.y }]).sort((a, b) => a.y - b.y).forEach(c => c.me
      ? person(me.x, me.y, { ...DEP, walk: dx || dy }, 'DEPUTADO')
      : person(c.x, c.y, c, c.name, c.state === 'signed'));
    citizens.forEach(c => { if (c.state === 'open') { g.fillStyle = '#f2b632'; g.fillText(c.tries ? '?' : '!', c.x + 2, c.y - 30 + Math.sin(t / 6) * 2); } });
  } else if (scene === 'vote') {
    const v = me.vt ? Math.min(48, Math.floor((t - me.vt) / 3)) : 0;
    drawPlenary(v); if (v !== me.lv) { me.lv = v; if (v % 2 === 0 && v > 0 && v < 48) sfx('vote'); }
    person(290, 296, { ...DEP, up: v >= 48 }, 'CARLOS'); person(350, 296, { ...ASS, up: v >= 48 }, 'ASSESSOR');
    g.font = '12px "Press Start 2P"'; g.fillStyle = '#fff'; g.fillText('SIM: ' + v * 8, 250, 262);
    if (v >= 48 && !me.done) { me.done = true; endVote(); }
  }
  requestAnimationFrame(loop);
}

/* ====== ENTRADAS ====== */
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); keys[k] = true;
  if (scene === 'street' && (k === 'e' || k === ' ') && !locked) { const n = near(); if (n) { e.preventDefault(); talk(n); } }
  if (k.startsWith('arrow')) e.preventDefault();
});
addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);
cv.addEventListener('pointerdown', e => {
  if (scene !== 'street' || locked) return;
  const r = cv.getBoundingClientRect(); me.tx = (e.clientX - r.left) * 640 / r.width; me.ty = (e.clientY - r.top) * 360 / r.height;
  const n = citizens.find(c => Math.hypot(c.x - me.tx, c.y - me.ty) < 28);
  if (n && Math.hypot(n.x - me.x, n.y - me.y) < 60) talk(n);
});
$('start').onclick = () => { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); sfx('click'); startPlenary(); };
$('mute').onclick = e => { muted = !muted; e.target.textContent = muted ? '🔇' : '🔊'; };
loop();
