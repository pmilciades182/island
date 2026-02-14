import { AnimationManager } from '../player/AnimationManager.js';
import { PlayerController } from '../player/PlayerController.js';
import { HUD } from '../ui/HUD.js';
import { DayNightCycle } from '../world/DayNightCycle.js';
import { SoundManager } from '../audio/SoundManager.js';

class GeometricScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GeometricScene' });
  }

  init() {
    this.ready = false;
  }

  preload() {
    const base = 'assets/lpc_entry/png';

    this.load.spritesheet('body_walk', `${base}/walkcycle/BODY_male.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('body_slash', `${base}/slash/BODY_human.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('body_hurt', `${base}/hurt/BODY_male.png`, { frameWidth: 64, frameHeight: 64 });

    this.load.spritesheet('legs_walk', `${base}/walkcycle/LEGS_pants_greenish.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('feet_walk', `${base}/walkcycle/FEET_shoes_brown.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('torso_walk', `${base}/walkcycle/TORSO_leather_armor_torso.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('head_walk', `${base}/walkcycle/HEAD_hair_blonde.png`, { frameWidth: 64, frameHeight: 64 });

    this.load.spritesheet('legs_slash', `${base}/slash/LEGS_pants_greenish.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('feet_slash', `${base}/slash/FEET_shoes_brown.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('torso_slash', `${base}/slash/TORSO_leather_armor_torso.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('head_slash', `${base}/slash/HEAD_hair_blonde.png`, { frameWidth: 64, frameHeight: 64 });
  }

  create() {
    const WORLD_W = 2000;
    const WORLD_H = 2000;
    this.WORLD_W = WORLD_W;
    this.WORLD_H = WORLD_H;

    const worldSeed = 0.77;

    // Fake save data (no persistence)
    this.saveData = {
      player: {
        x: WORLD_W / 2,
        y: WORLD_H / 2,
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        attributes: { strength: 5, agility: 5, intelligence: 5, endurance: 5 },
        inventory: []
      }
    };

    const p = this.saveData.player;

    // World bounds
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // Grass ground texture (flat, no terrain generation)
    this._createGrassTexture(WORLD_W, WORLD_H);
    this.add.image(WORLD_W / 2, WORLD_H / 2, 'geo_grass').setDepth(-99999);

    // No generator — player moves freely
    this.generator = null;

    // Geometric objects container
    this.geometricObjects = [];
    this._generateGeometricObjects();

    // Pushable red cube
    this._createPushableCube();

    // Managers
    this.soundManager = new SoundManager();
    this.soundManager.init();

    this.animManager = new AnimationManager(this);
    this.playerController = new PlayerController(this, null, this.soundManager, worldSeed);

    // Collider: player pushes the red cube
    this.physics.add.collider(this.playerController.playerContainer, this.redCube);

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.playerController.playerContainer, false, 0.15, 0.15);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // Day/Night
    this.dayNight = new DayNightCycle(this, worldSeed);

    // Player stats
    this.health = p.health;
    this.maxHealth = p.maxHealth;
    this.stamina = p.stamina;
    this.maxStamina = p.maxStamina;
    this.staminaCooldown = false;
    this.attributes = { ...p.attributes };
    this.inventory = [...p.inventory];
    this.player = this.playerController.playerContainer;
    this.animManager.setIdle('down', this.playerController.playerLayers);

    // HUD
    this.hud = new HUD(this, this.saveData, {
      onExit: () => this._onExit(),
      onToggleCycle: () => this.dayNight.togglePause()
    });

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-ESC', () => this._onExit());
    this.input.keyboard.on('keydown-M', () => this.hud.toggle());
    this.input.keyboard.on('keydown-P', () => this.dayNight.togglePause());
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === '+' || event.key === '=') this.dayNight.advance(5000);
      else if (event.key === '-' || event.key === '_') this.dayNight.advance(-5000);
    });

    // Top bar label
    this._createTopBar();

    // Feedback state
    this.feedbackOpen = false;
    this.feedbackNotes = '';

    this.ready = true;
  }

  // ══════════════════════════════════════
  //  GRASS TEXTURE GENERATION
  // ══════════════════════════════════════

  _createGrassTexture(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#4a7a50';
    ctx.fillRect(0, 0, w, h);

    if (this.textures.exists('geo_grass')) {
      this.textures.remove('geo_grass');
    }
    this.textures.addCanvas('geo_grass', canvas);
  }

  // ══════════════════════════════════════
  //  PUSHABLE RED CUBE
  // ══════════════════════════════════════

  _createPushableCube() {
    const cubeSize = 50;
    const red = { r: 200, g: 30, b: 30 };

    // Render full cube to canvas
    const pad = 20;
    const texW = Math.ceil(cubeSize * 2.5 + pad * 2);
    const texH = Math.ceil(cubeSize * 2.5 + pad * 2);
    const fullCanvas = document.createElement('canvas');
    fullCanvas.width = texW;
    fullCanvas.height = texH;
    const ctx = fullCanvas.getContext('2d');
    const centerX = texW / 2;
    const centerY = texH / 2 + cubeSize * 0.15;
    this._drawCube(ctx, centerX, centerY, cubeSize, red);

    // Split Y: bottom edge of top face = where side faces begin
    const a = cubeSize * 0.9;
    const isoDy = a * 0.5;
    const isoH = a * 0.9;
    const splitY = Math.round(centerY - isoH + isoDy * 2);

    // Back canvas (top face — will render ABOVE player)
    const backCanvas = document.createElement('canvas');
    backCanvas.width = texW;
    backCanvas.height = texH;
    backCanvas.getContext('2d').drawImage(fullCanvas, 0, 0, texW, splitY, 0, 0, texW, splitY);

    // Front canvas (side faces — will render BELOW player)
    const frontCanvas = document.createElement('canvas');
    frontCanvas.width = texW;
    frontCanvas.height = texH;
    frontCanvas.getContext('2d').drawImage(fullCanvas, 0, splitY, texW, texH - splitY, 0, splitY, texW, texH - splitY);

    // Register textures
    ['red_cube_body', 'red_cube_back', 'red_cube_front'].forEach(k => {
      if (this.textures.exists(k)) this.textures.remove(k);
    });
    this.textures.addCanvas('red_cube_body', fullCanvas);
    this.textures.addCanvas('red_cube_back', backCanvas);
    this.textures.addCanvas('red_cube_front', frontCanvas);

    // Spawn near the player
    const spawnX = this.WORLD_W / 2 + 120;
    const spawnY = this.WORLD_H / 2;

    // Shadow
    this.redCubeShadow = this.add.ellipse(spawnX, spawnY + 35, cubeSize * 1.4, cubeSize * 0.4, 0x000000, 0.25);
    this.redCubeShadow.setDepth(0);

    // Invisible physics body (drives collision + movement)
    this.redCube = this.physics.add.image(spawnX, spawnY, 'red_cube_body');
    this.redCube.setAlpha(0.001);
    this.redCube.setCollideWorldBounds(true);
    this.redCube.setBounce(0.4);
    this.redCube.setDrag(150);
    this.redCube.setMaxVelocity(250);
    this.redCube.body.setSize(cubeSize * 1.2, cubeSize * 1.2);
    this.redCube.body.setOffset(
      (this.redCube.width - cubeSize * 1.2) / 2,
      (this.redCube.height - cubeSize * 1.2) / 2
    );

    // Visual: back layer (top face) — renders ABOVE player
    this.redCubeBack = this.add.image(spawnX, spawnY, 'red_cube_back');

    // Visual: front layer (side faces) — renders BELOW player
    this.redCubeFront = this.add.image(spawnX, spawnY, 'red_cube_front');
  }

  // ══════════════════════════════════════
  //  GEOMETRIC OBJECTS GENERATION (3D)
  // ══════════════════════════════════════

  _generateGeometricObjects() {
    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
    };
    const rand = rng(12345);

    const baseColors = [
      { r: 231, g: 76, b: 60 },   // rojo
      { r: 52, g: 152, b: 219 },  // azul
      { r: 46, g: 204, b: 113 },  // verde
      { r: 243, g: 156, b: 18 },  // naranja
      { r: 155, g: 89, b: 182 },  // morado
      { r: 26, g: 188, b: 156 },  // teal
      { r: 241, g: 196, b: 15 },  // amarillo
      { r: 236, g: 240, b: 241 }, // blanco
    ];
    const margin = 200;
    const types = ['sphere', 'cube', 'pyramid', 'cylinder', 'prism'];

    for (let i = 0; i < 35; i++) {
      const x = margin + rand() * (this.WORLD_W - margin * 2);
      const y = margin + rand() * (this.WORLD_H - margin * 2);
      const col = baseColors[Math.floor(rand() * baseColors.length)];
      const type = types[Math.floor(rand() * types.length)];
      const size = 30 + rand() * 50;

      const texKey = `geo3d_${i}`;
      this._createShape3DTexture(texKey, type, size, col);

      const img = this.add.image(x, y, texKey);
      // Sombra en el suelo
      const shadow = this.add.ellipse(x + size * 0.15, y + size * 0.7, size * 1.4, size * 0.4, 0x000000, 0.25);
      shadow.setDepth(0);
      img.setDepth(1);

      this.geometricObjects.push({ img, shadow, x, y, type, size });
    }
  }

  _createShape3DTexture(key, type, size, col) {
    const pad = 20;
    const w = Math.ceil(size * 2.5 + pad * 2);
    const h = Math.ceil(size * 2.5 + pad * 2);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    const cx = w / 2;
    const cy = h / 2;

    switch (type) {
      case 'sphere':
        this._drawSphere(ctx, cx, cy, size, col);
        break;
      case 'cube':
        this._drawCube(ctx, cx, cy + size * 0.15, size, col);
        break;
      case 'pyramid':
        this._drawPyramid(ctx, cx, cy + size * 0.1, size, col);
        break;
      case 'cylinder':
        this._drawCylinder(ctx, cx, cy, size, col);
        break;
      case 'prism':
        this._drawPrism(ctx, cx, cy + size * 0.1, size, col);
        break;
    }

    if (this.textures.exists(key)) this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
  }

  // -- Helpers de color --
  _colorStr(r, g, b, a = 1) {
    return `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a})`;
  }
  _lighter(c, f) { return { r: Math.min(255, c.r + (255 - c.r) * f), g: Math.min(255, c.g + (255 - c.g) * f), b: Math.min(255, c.b + (255 - c.b) * f) }; }
  _darker(c, f) { return { r: c.r * (1 - f), g: c.g * (1 - f), b: c.b * (1 - f) }; }

  // ── ESFERA ──
  _drawSphere(ctx, cx, cy, r, col) {
    const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.05, cx, cy, r);
    const hi = this._lighter(col, 0.7);
    const mid = col;
    const lo = this._darker(col, 0.5);
    const edge = this._darker(col, 0.7);
    grad.addColorStop(0, this._colorStr(hi.r, hi.g, hi.b));
    grad.addColorStop(0.3, this._colorStr(mid.r, mid.g, mid.b));
    grad.addColorStop(0.7, this._colorStr(lo.r, lo.g, lo.b));
    grad.addColorStop(1, this._colorStr(edge.r, edge.g, edge.b));

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Specular highlight
    const spec = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.35, cy - r * 0.35, r * 0.4);
    spec.addColorStop(0, 'rgba(255,255,255,0.7)');
    spec.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    spec.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = spec;
    ctx.fill();

    // Rim light
    ctx.beginPath();
    ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // ── CUBO ISOMETRICO ──
  _drawCube(ctx, cx, cy, s, col) {
    const a = s * 0.9;
    // Angulos isometricos
    const dx = a * Math.cos(Math.PI / 6);
    const dy = a * Math.sin(Math.PI / 6);
    const h = a * 0.9;

    // Vertices del cubo isometrico
    const top = [
      { x: cx, y: cy - h },
      { x: cx + dx, y: cy - h + dy },
      { x: cx, y: cy - h + dy * 2 },
      { x: cx - dx, y: cy - h + dy }
    ];
    const botRight = [
      { x: cx + dx, y: cy - h + dy },
      { x: cx + dx, y: cy + dy },
      { x: cx, y: cy + dy * 2 },
      { x: cx, y: cy - h + dy * 2 }
    ];
    const botLeft = [
      { x: cx - dx, y: cy - h + dy },
      { x: cx, y: cy - h + dy * 2 },
      { x: cx, y: cy + dy * 2 },
      { x: cx - dx, y: cy + dy }
    ];

    // Cara izquierda (oscura)
    const darkCol = this._darker(col, 0.4);
    this._fillFace(ctx, botLeft, darkCol);

    // Cara derecha (media)
    const midCol = this._darker(col, 0.15);
    this._fillFace(ctx, botRight, midCol);

    // Cara superior (clara)
    const lightCol = this._lighter(col, 0.25);
    this._fillFace(ctx, top, lightCol);

    // Bordes
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    this._strokeFace(ctx, top);
    this._strokeFace(ctx, botRight);
    this._strokeFace(ctx, botLeft);

    // Highlight en borde superior
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(top[3].x, top[3].y);
    ctx.lineTo(top[0].x, top[0].y);
    ctx.lineTo(top[1].x, top[1].y);
    ctx.stroke();
  }

  // ── PIRAMIDE ──
  _drawPyramid(ctx, cx, cy, s, col) {
    const baseW = s * 1.2;
    const baseD = s * 0.6;
    const height = s * 1.4;
    const apex = { x: cx, y: cy - height };

    // Base isometrica (rombo)
    const bl = { x: cx - baseW, y: cy };
    const bf = { x: cx, y: cy + baseD };
    const br = { x: cx + baseW, y: cy };
    const bb = { x: cx, y: cy - baseD };

    // Cara frontal izquierda
    const faceFL = [apex, bl, bf];
    const darkCol = this._darker(col, 0.3);
    this._fillTriFace(ctx, faceFL, darkCol);

    // Cara frontal derecha
    const faceFR = [apex, bf, br];
    this._fillTriFace(ctx, faceFR, col);

    // Cara trasera derecha (mas clara, recibe luz)
    const faceRR = [apex, br, bb];
    const lightCol = this._lighter(col, 0.2);
    this._fillTriFace(ctx, faceRR, lightCol);

    // Cara trasera izquierda (mas oscura)
    const faceRL = [apex, bb, bl];
    const vdark = this._darker(col, 0.5);
    this._fillTriFace(ctx, faceRL, vdark);

    // Bordes
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    [faceFL, faceFR, faceRR, faceRL].forEach(f => this._strokeTriFace(ctx, f));

    // Highlight apex
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bl.x, bl.y);
    ctx.lineTo(apex.x, apex.y);
    ctx.lineTo(br.x, br.y);
    ctx.stroke();
  }

  // ── CILINDRO ──
  _drawCylinder(ctx, cx, cy, s, col) {
    const rx = s * 0.8;
    const ry = s * 0.3;
    const h = s * 1.2;
    const topY = cy - h / 2;
    const botY = cy + h / 2;

    // Cuerpo con gradiente lateral
    const bodyGrad = ctx.createLinearGradient(cx - rx, 0, cx + rx, 0);
    const dk = this._darker(col, 0.45);
    const lt = this._lighter(col, 0.2);
    bodyGrad.addColorStop(0, this._colorStr(dk.r, dk.g, dk.b));
    bodyGrad.addColorStop(0.35, this._colorStr(lt.r, lt.g, lt.b));
    bodyGrad.addColorStop(0.5, this._colorStr(lt.r, lt.g, lt.b));
    bodyGrad.addColorStop(1, this._colorStr(dk.r, dk.g, dk.b));

    ctx.beginPath();
    ctx.ellipse(cx, botY, rx, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - rx, topY);
    ctx.ellipse(cx, topY, rx, ry, 0, Math.PI, 0, true);
    ctx.lineTo(cx + rx, botY);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Borde inferior elipse
    ctx.beginPath();
    ctx.ellipse(cx, botY, rx, ry, 0, 0, Math.PI);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Elipse superior (tapa)
    const topGrad = ctx.createRadialGradient(cx - rx * 0.2, topY - ry * 0.3, 0, cx, topY, rx);
    const topLt = this._lighter(col, 0.45);
    topGrad.addColorStop(0, this._colorStr(topLt.r, topLt.g, topLt.b));
    topGrad.addColorStop(1, this._colorStr(col.r, col.g, col.b));
    ctx.beginPath();
    ctx.ellipse(cx, topY, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = topGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bordes laterales
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - rx, topY);
    ctx.lineTo(cx - rx, botY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + rx, topY);
    ctx.lineTo(cx + rx, botY);
    ctx.stroke();

    // Specular vertical
    const specGrad = ctx.createLinearGradient(cx - rx * 0.15, 0, cx + rx * 0.15, 0);
    specGrad.addColorStop(0, 'rgba(255,255,255,0)');
    specGrad.addColorStop(0.5, 'rgba(255,255,255,0.12)');
    specGrad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.ellipse(cx, botY, rx * 0.3, ry * 0.3, 0, 0, Math.PI);
    ctx.lineTo(cx - rx * 0.3, topY);
    ctx.ellipse(cx, topY, rx * 0.3, ry * 0.3, 0, Math.PI, 0, true);
    ctx.closePath();
    ctx.fillStyle = specGrad;
    ctx.fill();
  }

  // ── PRISMA TRIANGULAR ──
  _drawPrism(ctx, cx, cy, s, col) {
    const baseW = s * 0.9;
    const depth = s * 0.5;
    const height = s * 1.3;

    // Triangulo frontal
    const ftl = { x: cx - baseW, y: cy + depth };
    const ftr = { x: cx + baseW, y: cy + depth };
    const ftop = { x: cx, y: cy + depth - height };

    // Triangulo trasero (offset isometrico)
    const ox = -depth * 0.5;
    const oy = -depth * 0.6;
    const btl = { x: ftl.x + ox, y: ftl.y + oy };
    const btr = { x: ftr.x + ox, y: ftr.y + oy };
    const btop = { x: ftop.x + ox, y: ftop.y + oy };

    // Cara superior izquierda (rampa iluminada)
    const topFace = [ftop, btop, btl, ftl];
    const ltCol = this._lighter(col, 0.25);
    this._fillFace(ctx, topFace, ltCol);

    // Cara superior derecha (rampa sombra)
    const topFaceR = [ftop, btop, btr, ftr];
    const mdCol = this._darker(col, 0.1);
    this._fillFace(ctx, topFaceR, mdCol);

    // Cara frontal
    const frontFace = [ftl, ftr, ftop];
    this._fillTriFace(ctx, frontFace, col);

    // Bordes
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1.5;
    this._strokeFace(ctx, topFace);
    this._strokeFace(ctx, topFaceR);
    this._strokeTriFace(ctx, frontFace);

    // Highlight en arista superior
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ftop.x, ftop.y);
    ctx.lineTo(btop.x, btop.y);
    ctx.stroke();
  }

  // -- Helpers para caras --
  _fillFace(ctx, pts, col) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = this._colorStr(col.r, col.g, col.b);
    ctx.fill();
  }
  _strokeFace(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.stroke();
  }
  _fillTriFace(ctx, pts, col) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.fillStyle = this._colorStr(col.r, col.g, col.b);
    ctx.fill();
  }
  _strokeTriFace(ctx, pts) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    ctx.lineTo(pts[1].x, pts[1].y);
    ctx.lineTo(pts[2].x, pts[2].y);
    ctx.closePath();
    ctx.stroke();
  }

  // ══════════════════════════════════════
  //  TOP BAR
  // ══════════════════════════════════════

  _createTopBar() {
    const pad = 8;
    const topBar = this.add.graphics().setScrollFactor(0).setDepth(100000);
    topBar.fillStyle(0x000000, 0.5);
    topBar.fillRect(0, 0, this.cameras.main.width, 28);

    this.add.text(pad, 6, 'GEOMETRIC PROTOTYPE', {
      fontSize: '11px', fontFamily: '"JetBrains Mono", monospace',
      color: '#f39c12', fontStyle: '700'
    }).setScrollFactor(0).setDepth(100001);

    this.add.text(this.cameras.main.width - pad, 6, '[ESC] Exit + Feedback', {
      fontSize: '9px', fontFamily: '"JetBrains Mono", monospace',
      color: 'rgba(255,255,255,0.4)'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100001);
  }

  // ══════════════════════════════════════
  //  UPDATE
  // ══════════════════════════════════════

  update(time, delta) {
    if (!this.ready) return;

    const moveState = this.playerController.update(delta, this.stamina, this.maxStamina, this.staminaCooldown);
    const cam = this.cameras.main;

    if (moveState.moving) {
      cam.setLerp(0.06, 0.06);
    } else {
      const target = this.playerController.playerContainer;
      const dx = Math.abs((target.x - cam.width / 2) - cam.scrollX);
      const dy = Math.abs((target.y - cam.height / 2) - cam.scrollY);
      if (dx < 1 && dy < 1) cam.setLerp(1, 1);
      else cam.setLerp(0.2, 0.2);
    }

    if (moveState.sprinting) {
      this.stamina = Math.max(0, this.stamina - 40 * (delta / 1000));
      if (this.stamina <= 0) this.staminaCooldown = true;
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 10 * (delta / 1000));
      if (this.staminaCooldown && this.stamina >= this.maxStamina * 0.3) {
        this.staminaCooldown = false;
      }
    }

    if (moveState.moving) {
      const baseRate = 10;
      const speedScale = moveState.sprinting ? 1.4 : 1.0;
      this.playerController.playerLayers.forEach(s => {
        if (s.anims.currentAnim) s.anims.currentAnim.frameRate = Math.round(baseRate * speedScale);
      });
      this.animManager.playWalk(moveState.facing, this.playerController.playerLayers, speedScale);
    } else {
      this.animManager.setIdle(moveState.facing, this.playerController.playerLayers);
    }

    this.hud.update({
      health: this.health,
      maxHealth: this.maxHealth,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      staminaCooldown: this.staminaCooldown,
      attributes: this.attributes,
      inventory: this.inventory
    });

    // Red cube: visual layers follow physics body
    this.redCubeBack.setPosition(this.redCube.x, this.redCube.y);
    this.redCubeFront.setPosition(this.redCube.x, this.redCube.y);
    // Back (top face) always ABOVE player
    this.redCubeBack.setDepth(this.redCube.y + 10000);
    // Front (side faces) always BELOW player
    this.redCubeFront.setDepth(this.redCube.y - 10000);
    // Shadow follows
    this.redCubeShadow.setPosition(this.redCube.x + 8, this.redCube.y + 35);
    this.redCubeShadow.setDepth(this.redCube.y - 10001);

    const { timeStr } = this.dayNight.update(delta);
    this.hud.setTimeText(timeStr);
  }

  // ══════════════════════════════════════
  //  FEEDBACK MODAL
  // ══════════════════════════════════════

  _onExit() {
    if (this.feedbackOpen) return;
    this.feedbackOpen = true;
    this._showFeedbackModal();
  }

  _showFeedbackModal() {
    const W = this.cameras.main.width;
    const H = this.cameras.main.height;
    const cx = W / 2;
    const cy = H / 2;
    const mW = 380;
    const mH = 240;

    this.fbItems = [];

    const overlay = this.add.graphics().setScrollFactor(0).setDepth(200000);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, W, H);
    this.fbItems.push(overlay);

    const panel = this.add.graphics().setScrollFactor(0).setDepth(200001);
    panel.fillStyle(0x161b26, 1);
    panel.fillRoundedRect(cx - mW / 2, cy - mH / 2, mW, mH, 14);
    panel.lineStyle(1, 0xf39c12, 0.3);
    panel.strokeRoundedRect(cx - mW / 2, cy - mH / 2, mW, mH, 14);
    this.fbItems.push(panel);

    this.fbItems.push(
      this.add.text(cx, cy - mH / 2 + 24, 'PROTOTYPE FEEDBACK', {
        fontSize: '13px', fontFamily: '"JetBrains Mono", monospace',
        color: '#f39c12', fontStyle: '700'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(200002)
    );

    this.fbItems.push(
      this.add.text(cx, cy - mH / 2 + 46, 'Notes about this prototype session:', {
        fontSize: '10px', fontFamily: '"Inter", sans-serif',
        color: 'rgba(255,255,255,0.5)'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(200002)
    );

    const inputW = mW - 40;
    const inputH = 80;
    const inputX = cx - inputW / 2;
    const inputY = cy - mH / 2 + 62;

    const inputBg = this.add.graphics().setScrollFactor(0).setDepth(200002);
    inputBg.fillStyle(0x000000, 0.4);
    inputBg.fillRoundedRect(inputX, inputY, inputW, inputH, 8);
    inputBg.lineStyle(1, 0xffffff, 0.1);
    inputBg.strokeRoundedRect(inputX, inputY, inputW, inputH, 8);
    this.fbItems.push(inputBg);

    this.feedbackNotes = '';
    this.fbInputText = this.add.text(inputX + 8, inputY + 8, '', {
      fontSize: '10px', fontFamily: '"JetBrains Mono", monospace',
      color: '#e4e4e7', wordWrap: { width: inputW - 16 }, lineSpacing: 4
    }).setScrollFactor(0).setDepth(200003);
    this.fbItems.push(this.fbInputText);

    this.fbCursor = this.add.text(inputX + 8, inputY + 8, '|', {
      fontSize: '10px', fontFamily: '"JetBrains Mono", monospace',
      color: 'rgba(243,156,18,0.8)'
    }).setScrollFactor(0).setDepth(200003);
    this.tweens.add({ targets: this.fbCursor, alpha: 0, duration: 500, repeat: -1, yoyo: true });
    this.fbItems.push(this.fbCursor);

    const btnY = cy + mH / 2 - 40;
    this._createFBButton(cx - 70, btnY, 'Skip', false, () => this._closeFeedback(true));
    this._createFBButton(cx + 70, btnY, 'Save & Exit', true, () => this._closeFeedback(true));

    this._fbKeyHandler = (e) => {
      if (e.key === 'Backspace') {
        this.feedbackNotes = this.feedbackNotes.slice(0, -1);
      } else if (e.key === 'Enter') {
        this.feedbackNotes += '\n';
      } else if (e.key === 'Escape') {
        this._closeFeedback(true);
        return;
      } else if (e.key.length === 1 && this.feedbackNotes.length < 300) {
        this.feedbackNotes += e.key;
      }
      this.fbInputText.setText(this.feedbackNotes);
      const bounds = this.fbInputText.getBounds();
      this.fbCursor.x = Math.min(bounds.x + this.fbInputText.width + 1, inputX + inputW - 12);
      this.fbCursor.y = bounds.y + Math.max(0, this.fbInputText.height - 14);
    };
    this.input.keyboard.on('keydown', this._fbKeyHandler);
  }

  _createFBButton(x, y, label, primary, callback) {
    const btnW = 110;
    const btnH = 30;

    const bg = this.add.graphics().setScrollFactor(0).setDepth(200002);
    if (primary) {
      bg.fillStyle(0xf39c12, 1);
    } else {
      bg.fillStyle(0xffffff, 0.06);
      bg.lineStyle(1, 0xffffff, 0.1);
    }
    bg.fillRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, btnH / 2);
    if (!primary) bg.strokeRoundedRect(x - btnW / 2, y - btnH / 2, btnW, btnH, btnH / 2);
    this.fbItems.push(bg);

    const txt = this.add.text(x, y, label, {
      fontSize: '11px', fontFamily: '"Inter", sans-serif',
      color: primary ? '#ffffff' : 'rgba(255,255,255,0.7)', fontStyle: '600'
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200003);
    this.fbItems.push(txt);

    const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(200004);
    zone.on('pointerdown', callback);
    this.fbItems.push(zone);
  }

  _closeFeedback(exit) {
    if (this.feedbackNotes.trim()) {
      console.log('[GeometricScene] Feedback:', this.feedbackNotes.trim());
    }

    this.input.keyboard.off('keydown', this._fbKeyHandler);
    this.fbItems.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
    this.fbItems = [];
    this.feedbackOpen = false;

    if (exit) {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('MenuScene');
      });
    }
  }
}

window.GeometricScene = GeometricScene;
