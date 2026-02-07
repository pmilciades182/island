import { WorldConfig } from '../world/WorldConfig.js';
import { IslandGenerator } from '../world/IslandGenerator.js';
import { TerrainRenderer } from '../world/TerrainRenderer.js';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.saveId = data.saveId;
    this.ready = false;
    this.facing = 'down';
  }

  preload() {
    const base = 'assets/lpc_entry/png';

    // Body
    this.load.spritesheet('body_walk', `${base}/walkcycle/BODY_male.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('body_slash', `${base}/slash/BODY_human.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('body_hurt', `${base}/hurt/BODY_male.png`, { frameWidth: 64, frameHeight: 64 });

    // Equipment layers — walkcycle
    this.load.spritesheet('legs_walk', `${base}/walkcycle/LEGS_pants_greenish.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('feet_walk', `${base}/walkcycle/FEET_shoes_brown.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('torso_walk', `${base}/walkcycle/TORSO_leather_armor_torso.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('head_walk', `${base}/walkcycle/HEAD_hair_blonde.png`, { frameWidth: 64, frameHeight: 64 });

    // Equipment layers — slash
    this.load.spritesheet('legs_slash', `${base}/slash/LEGS_pants_greenish.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('feet_slash', `${base}/slash/FEET_shoes_brown.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('torso_slash', `${base}/slash/TORSO_leather_armor_torso.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('head_slash', `${base}/slash/HEAD_hair_blonde.png`, { frameWidth: 64, frameHeight: 64 });
  }

  async create() {
    const WORLD_W = 20000;
    const WORLD_H = 20000;
    this.WORLD_W = WORLD_W;
    this.WORLD_H = WORLD_H;

    // Loading Text
    const loadingText = this.add.text(this.cameras.main.width / 2, this.cameras.main.height / 2, 'Generating World...', {
      fontSize: '32px',
      fontFamily: 'Inter',
      color: '#ffffff'
    }).setOrigin(0.5).setScrollFactor(0);


    // Cargar datos del backend
    const res = await fetch(`/api/saves/${this.saveId}`);
    this.saveData = await res.json();
    const p = this.saveData.player;

    // Mundo
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // Generación de Terreno
    this.generator = new IslandGenerator(0.42, WORLD_W, 2.5);

    // Generar (async)
    // Update loading text
    const onProgress = (prog) => {
      loadingText.setText(`Generating World... ${Math.round(prog * 100)}%`);
    };

    // Returns { terrain, vegetation }
    // Note: IslandGenerator.prototype.generate() signature changed above,
    // but in GameScene we used `const gridData` before.
    // Now we need to update usage.
    const genResult = await this.generator.generate(onProgress);
    const gridData = this.generator.data; // The terrain Uint8Array
    this.vegetationData = this.generator.vegetation;

    // Renderizar
    loadingText.setText('Rendering Texture...');
    const renderer = new TerrainRenderer(this);
    // Render 8000x8000 texture scaled by 2.5
    await renderer.render(gridData, 8000, 2.5);

    loadingText.destroy();

    // Create Tree Texture (Procedural Pixel Art)
    // 64x64px canvas for 4x scale feel
    const treeG = this.add.graphics();

    // Shadow (oval at bottom)
    treeG.fillStyle(0x000000, 0.4);
    treeG.fillEllipse(32, 58, 24, 10);

    // Trunk (Warm Brown - matches dirt palette)
    treeG.fillStyle(0x6B4E3C, 1);
    treeG.fillRect(26, 40, 12, 18);

    // Leaves (Layered circles - matches grass dark palette)
    // Darker bottom layer
    treeG.fillStyle(0x2D6238, 1); // Forest Green
    treeG.fillCircle(32, 32, 24);
    treeG.fillCircle(20, 40, 16);
    treeG.fillCircle(44, 40, 16);

    // Lighter top layer
    treeG.fillStyle(0x346640, 1); // Medium Forest Green
    treeG.fillCircle(32, 28, 18);
    treeG.fillCircle(22, 36, 12);
    treeG.fillCircle(42, 36, 12);

    // Highlight
    treeG.fillStyle(0x58A460, 1); // Light Green (grass light palette)
    treeG.fillCircle(32, 24, 10);

    treeG.generateTexture('tree', 64, 64);
    treeG.destroy();

    // Create Rock Textures (Harmonized with terrain)
    // Small
    const r1 = this.add.graphics();
    r1.fillStyle(0x8A7A6B, 1); // Warm gray-brown
    r1.fillCircle(8, 8, 6);
    r1.fillStyle(0x000000, 0.3);
    r1.fillEllipse(8, 14, 8, 4);
    r1.generateTexture('rock_small', 16, 16);
    r1.destroy();

    // Medium
    const r2 = this.add.graphics();
    r2.fillStyle(0x8A7A6B, 1);
    r2.fillCircle(16, 16, 12);
    r2.fillStyle(0xA89B8E, 1); // Lighter highlight
    r2.fillCircle(12, 12, 8);
    r2.fillStyle(0x000000, 0.3);
    r2.fillEllipse(16, 28, 16, 6);
    r2.generateTexture('rock_medium', 32, 32);
    r2.destroy();

    // Large
    const r3 = this.add.graphics();
    r3.fillStyle(0x6B5D54, 1); // Darker warm base
    r3.fillCircle(32, 32, 24);
    r3.fillStyle(0x8A7A6B, 1);
    r3.fillCircle(24, 24, 16);
    r3.fillStyle(0x000000, 0.3);
    r3.fillEllipse(32, 56, 32, 10);
    r3.generateTexture('rock_large', 64, 64);
    r3.destroy();

    // Create Flower Textures (16 colors, minimalist design)
    // Size similar to small rock (16x16)
    WorldConfig.FLOWER_COLORS.forEach((color, index) => {
      const f = this.add.graphics();

      // Shadow
      f.fillStyle(0x000000, 0.3);
      f.fillEllipse(8, 14, 6, 3);

      // Stem (harmonized green)
      f.fillStyle(0x3D6142, 1);
      f.fillRect(7, 8, 2, 6);

      // Petals (simple 4-petal flower)
      f.fillStyle(color, 1);
      // Top petal
      f.fillCircle(8, 5, 2.5);
      // Bottom petal
      f.fillCircle(8, 11, 2.5);
      // Left petal
      f.fillCircle(5, 8, 2.5);
      // Right petal
      f.fillCircle(11, 8, 2.5);

      // Center (yellow)
      f.fillStyle(0xffd700, 1);
      f.fillCircle(8, 8, 2);

      f.generateTexture(`flower_${index}`, 16, 16);
      f.destroy();
    });

    // Tree Management Group
    this.treesGroup = this.add.group();
    // Use spatial chunks for optimization
    this.activeTreeChunks = new Set();
    this.CHUNK_SIZE = 500; // 500px chunks

    // Safety Check: si el spawn cae en agua, mover al centro
    // Usar nueva logica de bioma
    const biome = this.generator.getBiomeAt(p.x, p.y);
    if (biome <= 1) { // Water
      p.x = WORLD_W / 2;
      p.y = WORLD_H / 2;
    }

    // Also check bounds
    if (p.x < 0 || p.x > WORLD_W || p.y < 0 || p.y > WORLD_H) {
      p.x = WORLD_W / 2;
      p.y = WORLD_H / 2;
    }

    // ── Crear animaciones LPC ──
    this.createAnimations();

    // ── Jugador: container con capas ──
    this.playerContainer = this.add.container(p.x, p.y);
    this.physics.world.enable(this.playerContainer);
    this.playerContainer.body.setSize(24, 24);
    this.playerContainer.body.setOffset(-12, -12);
    this.playerContainer.body.setCollideWorldBounds(true);
    // this.physics.add.collider(this.playerContainer, this.terrainLayer); // Removed tilemap collider

    // Capas del personaje (orden de render: body, feet, legs, torso, head)
    this.bodySprite = this.add.sprite(0, 0, 'body_walk', 0);
    this.feetSprite = this.add.sprite(0, 0, 'feet_walk', 0);
    this.legsSprite = this.add.sprite(0, 0, 'legs_walk', 0);
    this.torsoSprite = this.add.sprite(0, 0, 'torso_walk', 0);
    this.headSprite = this.add.sprite(0, 0, 'head_walk', 0);

    this.playerLayers = [this.bodySprite, this.feetSprite, this.legsSprite, this.torsoSprite, this.headSprite];
    this.playerLayers.forEach(s => this.playerContainer.add(s));

    // Referencia para posición en HUD/save
    this.player = this.playerContainer;

    // Stats
    this.health = p.health;
    this.maxHealth = p.maxHealth;
    this.stamina = p.stamina;
    this.maxStamina = p.maxStamina;
    this.attributes = { ...p.attributes };
    this.inventory = [...p.inventory];

    // Cámara
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.playerContainer, true, 0.08, 0.08);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    // ── Day / Night Cycle Overlay ──
    // Create a dark overlay that we will tween alpha/color
    this.dayNightOverlay = this.add.graphics();
    this.dayNightOverlay.fillStyle(0x000033, 1); // Dark Blue Night
    this.dayNightOverlay.fillRect(0, 0, WORLD_W + 2000, WORLD_H + 2000); // Oversize to cover camera bounds
    this.dayNightOverlay.setScrollFactor(0); // Actually, scroll factor 0 covers screen?
    // Graphics with scroll factor 0 covers screen if drawn relative to 0,0.
    // Let's use a rectangle covering the viewport.
    this.dayNightOverlay.clear();
    this.dayNightOverlay.fillStyle(0x000022, 1);
    this.dayNightOverlay.fillRect(-100, -100, this.cameras.main.width + 200, this.cameras.main.height + 200);
    this.dayNightOverlay.setDepth(9999); // Above everything except HUD?
    this.dayNightOverlay.setAlpha(0); // Start at Day (0 alpha)
    this.dayNightOverlay.setScrollFactor(0);


    // ── Cloud Shadows ──
    // Need a cloud texture. Let's maximize reuse of procedural generation.
    // Generate a low-res noise texture for clouds.
    const cloudG = this.add.graphics();
    cloudG.fillStyle(0xFFFFFF, 1);
    // Draw some random blobs
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const r = 20 + Math.random() * 40;
      cloudG.fillCircle(x, y, r);
    }
    cloudG.generateTexture('clouds', 256, 256);
    cloudG.destroy();

    // Create TileSprite for repeating clouds
    this.cloudLayer = this.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'clouds');
    this.cloudLayer.setOrigin(0, 0);
    this.cloudLayer.setAlpha(0.15); // Slight shadow
    this.cloudLayer.setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.cloudLayer.setDepth(9000); // Below HUD, above trees?
    // Trees are at depth Y. Clouds should be above terrain but...
    // If clouds are shadows, they should be on ground (depth 0).
    // But they need to overlay trees too?
    // Real shadows are on ground.
    // Let's put at depth 1 (above terrain, below player/trees sorted by Y).
    this.cloudLayer.setDepth(1);
    this.cloudLayer.setScale(4); // Make clouds big

    // Cycle Timer
    this.dayTime = 0;
    this.dayDuration = 120000; // 2 minutes (120s) full cycle
    this.isNight = false;
    this.cyclePaused = false;

    // ── Atmospheric Particles ──
    // Create particle texture (larger, glowing dot)
    const particleG = this.add.graphics();
    // Outer glow
    particleG.fillStyle(0xffffff, 0.3);
    particleG.fillCircle(8, 8, 8);
    // Inner bright core
    particleG.fillStyle(0xffffff, 1);
    particleG.fillCircle(8, 8, 4);
    particleG.generateTexture('particle', 16, 16);
    particleG.destroy();

    // Particle emitter (starts inactive)
    this.atmosphericParticles = this.add.particles(0, 0, 'particle', {
      x: { min: 0, max: this.cameras.main.width },
      y: { min: -20, max: 0 },
      lifespan: 4000,
      speedY: { min: 20, max: 50 },
      speedX: { min: -10, max: 10 },
      scale: { start: 2.0, end: 0.5 },
      alpha: { start: 0.9, end: 0 },
      quantity: 3,
      frequency: 80,
      tint: 0xffffff,
      blendMode: Phaser.BlendModes.ADD
    });

    this.atmosphericParticles.setDepth(200001); // Above UI
    this.atmosphericParticles.setScrollFactor(0); // Fixed to camera
    this.atmosphericParticles.stop(); // Start stopped

    // Track current terrain type for particle effects
    this.currentTerrainType = -1;

    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    this.speed = 180;
    this.sprinting = false;
    this.shiftKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
    this.mKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.input.keyboard.on('keydown-ESC', () => this.exitToMenu());
    this.input.keyboard.on('keydown-M', () => this.toggleUI());
    this.input.keyboard.on('keydown-P', () => {
      this.cyclePaused = !this.cyclePaused;
      console.log(`Day/Night cycle ${this.cyclePaused ? 'PAUSED' : 'RESUMED'}`);
    });

    // Set idle facing down

    // Set idle facing down
    this.setIdleFrame('down');

    // HUD
    this.createHUD();

    // Auto-save cada 5s
    this.saveTimer = this.time.addEvent({
      delay: 5000, callback: () => this.autoSave(), loop: true
    });

    this.ready = true;
  }

  // ══════════════════════════════════════
  //  ANIMACIONES LPC
  // ══════════════════════════════════════
  //  Walkcycle: 9 cols x 4 rows (up=0, left=1, down=2, right=3)
  //  Row N starts at frame N*9, idle = first frame of each row
  // ══════════════════════════════════════

  createAnimations() {
    const dirs = [
      { name: 'up', row: 0 },
      { name: 'left', row: 1 },
      { name: 'down', row: 2 },
      { name: 'right', row: 3 }
    ];

    // Walk layers
    const walkLayers = ['body_walk', 'legs_walk', 'feet_walk', 'torso_walk', 'head_walk'];
    const walkCols = 9;

    dirs.forEach(dir => {
      walkLayers.forEach(layer => {
        const key = `${layer}_${dir.name}`;
        if (!this.anims.exists(key)) {
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(layer, {
              start: dir.row * walkCols + 1,
              end: dir.row * walkCols + 8
            }),
            frameRate: 10,
            repeat: -1
          });
        }
      });
    });

    // Slash layers
    const slashLayers = ['body_slash', 'legs_slash', 'feet_slash', 'torso_slash', 'head_slash'];
    const slashCols = 6;

    dirs.forEach(dir => {
      slashLayers.forEach(layer => {
        const key = `${layer}_${dir.name}`;
        if (!this.anims.exists(key)) {
          this.anims.create({
            key,
            frames: this.anims.generateFrameNumbers(layer, {
              start: dir.row * slashCols,
              end: dir.row * slashCols + 5
            }),
            frameRate: 12,
            repeat: 0
          });
        }
      });
    });
  }

  setIdleFrame(dir) {
    const dirMap = { up: 0, left: 1, down: 2, right: 3 };
    const row = dirMap[dir];
    const frame = row * 9; // first frame of walkcycle row = idle

    const walkKeys = ['body_walk', 'feet_walk', 'legs_walk', 'torso_walk', 'head_walk'];
    const sprites = [this.bodySprite, this.feetSprite, this.legsSprite, this.torsoSprite, this.headSprite];

    sprites.forEach((s, i) => {
      s.stop();
      s.setTexture(walkKeys[i], frame);
    });
  }

  playWalkAnim(dir) {
    const walkKeys = ['body_walk', 'feet_walk', 'legs_walk', 'torso_walk', 'head_walk'];
    const sprites = [this.bodySprite, this.feetSprite, this.legsSprite, this.torsoSprite, this.headSprite];

    sprites.forEach((s, i) => {
      const animKey = `${walkKeys[i]}_${dir}`;
      if (s.anims.currentAnim?.key !== animKey) {
        s.play(animKey);
      }
    });
  }

  // ── Glass panel helper ──
  drawGlassPanel(graphics, x, y, w, h, radius) {
    graphics.fillStyle(0x000000, 0.45);
    graphics.fillRoundedRect(x, y, w, h, radius);
    graphics.lineStyle(1, 0xffffff, 0.08);
    graphics.strokeRoundedRect(x, y, w, h, radius);
  }

  // ── Rounded bar helper ──
  drawBar(graphics, x, y, w, h, ratio, color) {
    const r = h / 2;
    graphics.fillStyle(0xffffff, 0.08);
    graphics.fillRoundedRect(x, y, w, h, r);
    if (ratio > 0) {
      graphics.fillStyle(color, 0.9);
      graphics.fillRoundedRect(x, y, Math.max(w * ratio, h), h, r);
    }
  }

  createHUD() {
    const H = this.cameras.main.height;
    const W = this.cameras.main.width;

    // Config
    this.sidebarWidth = 300;
    this.uiVisible = true;
    this.sidebarX = 0;

    // ── Sidebar Container ──
    // Depth must be higher than world height (20000) so trees don't overlap
    this.hudContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(200000);

    // Background (Solid Opaque, MacOS style)
    this.hudPanel = this.add.graphics();
    this.hudPanel.fillStyle(0x18181b, 1); // Solid Zinc-900
    this.hudPanel.fillRect(0, 0, this.sidebarWidth, H);
    // Right Border (Accent)
    this.hudPanel.lineStyle(1, 0x3f3f46, 1); // Zinc-700
    this.hudPanel.lineBetween(this.sidebarWidth, 0, this.sidebarWidth, H);
    this.hudContainer.add(this.hudPanel);

    // ── Toggle Button (Close Sidebar) ──
    const closeBtn = this.add.container(this.sidebarWidth - 40, 20);
    this.hudContainer.add(closeBtn);

    // Background for close button
    const cBg = this.add.graphics();
    cBg.fillStyle(0x27272a, 1);
    cBg.fillRoundedRect(0, 0, 32, 32, 6);
    closeBtn.add(cBg);

    const cTxt = this.add.text(16, 16, '<', {
      fontFamily: '"JetBrains Mono", monospace', fontSize: '18px', color: '#fff', fontStyle: '700'
    }).setOrigin(0.5);
    closeBtn.add(cTxt);

    // Interactive
    const cZone = this.add.zone(16, 16, 32, 32).setInteractive({ useHandCursor: true });
    cZone.on('pointerdown', () => this.toggleUI());
    closeBtn.add(cZone);

    // ── Header Info ──
    // Player Name
    this.hudName = this.add.text(32, 60, this.saveData.name.toUpperCase(), {
      fontSize: '20px',
      fontFamily: '"Rubik", sans-serif',
      color: '#ffffff',
      fontStyle: '700'
    });
    this.hudContainer.add(this.hudName);

    // Time (Digital Clock style)
    this.timeText = this.add.text(this.sidebarWidth - 32, 64, '12:00', {
      fontSize: '16px',
      fontFamily: '"JetBrains Mono", monospace',
      color: '#10b981', // Emerald-500
      fontStyle: '500'
    }).setOrigin(1, 0);
    this.hudContainer.add(this.timeText);

    // Pause Cycle Button (Small icon next to time)
    const pauseBtn = this.add.text(this.sidebarWidth - 90, 64, '⏸', {
      fontSize: '16px', color: '#a1a1aa'
    }).setInteractive({ useHandCursor: true });

    pauseBtn.on('pointerdown', () => {
      this.cyclePaused = !this.cyclePaused;
      pauseBtn.setColor(this.cyclePaused ? '#fcd34d' : '#a1a1aa'); // Yellow when paused
      pauseBtn.setText(this.cyclePaused ? '▶' : '⏸');
    });
    this.hudContainer.add(pauseBtn);

    // Divider
    const div1 = this.add.graphics();
    div1.lineStyle(1, 0x3f3f46, 1);
    div1.lineBetween(32, 96, this.sidebarWidth - 32, 96);
    this.hudContainer.add(div1);

    // ── Stats Section ──
    let y = 120;

    // HP Bar
    this.hudContainer.add(this.add.text(32, y, 'VITALS', {
      fontSize: '11px', fontFamily: '"JetBrains Mono", monospace', color: '#9ca3af', fontStyle: '700'
    }));
    y += 20;

    // Health
    this.healthBarBg = this.add.graphics();
    this.healthBar = this.add.graphics();
    this.hudContainer.add(this.healthBarBg);
    this.hudContainer.add(this.healthBar);

    // HP Text
    this.healthText = this.add.text(this.sidebarWidth - 32, y - 2, '', {
      fontSize: '12px', fontFamily: '"JetBrains Mono", monospace', color: '#f87171'
    }).setOrigin(1, 0);
    this.hudContainer.add(this.healthText);

    y += 36;

    // Stamina
    this.staminaBarBg = this.add.graphics();
    this.staminaBar = this.add.graphics();
    this.hudContainer.add(this.staminaBarBg);
    this.hudContainer.add(this.staminaBar);

    this.staminaText = this.add.text(this.sidebarWidth - 32, y - 2, '', {
      fontSize: '12px', fontFamily: '"JetBrains Mono", monospace', color: '#60a5fa'
    }).setOrigin(1, 0);
    this.hudContainer.add(this.staminaText);

    y += 48;

    // ── Attributes Panel (Mac Widget style) ──
    const attrBg = this.add.graphics();
    attrBg.fillStyle(0x27272a, 1); // Zinc-800
    attrBg.fillRoundedRect(32, y, this.sidebarWidth - 64, 90, 8);
    this.hudContainer.add(attrBg);

    const a = this.attributes;
    this.attrText = this.add.text(44, y + 12, '', {
      fontSize: '12px',
      fontFamily: '"JetBrains Mono", monospace',
      color: '#d4d4d8', // Zinc-300
      lineSpacing: 8
    });
    this.hudContainer.add(this.attrText);

    y += 110;

    // ── Inventory Section ──
    this.hudContainer.add(this.add.text(32, y, 'INVENTORY', {
      fontSize: '11px', fontFamily: '"JetBrains Mono", monospace', color: '#9ca3af', fontStyle: '700'
    }));
    y += 24;

    this.invText = this.add.text(32, y, '', {
      fontSize: '13px',
      fontFamily: '"Rubik", sans-serif',
      color: '#f4f4f5',
      lineSpacing: 6,
      wordWrap: { width: this.sidebarWidth - 64 }
    });
    this.hudContainer.add(this.invText);

    // ── Exit Button ──
    // Bottom of Sidebar
    this.createExitButton(32, H - 80);

    // ── Floating Toggle Button (Visible when Sidebar hidden) ──
    // Increase depth to match sidebar
    this.toggleBtnContainer = this.add.container(20, 20).setScrollFactor(0).setDepth(200000).setVisible(false);

    // Icon background
    const tBg = this.add.graphics();
    tBg.fillStyle(0x18181b, 1);
    tBg.lineStyle(2, 0x3f3f46, 1);
    // Make it a bit more prominent
    tBg.fillRoundedRect(0, 0, 48, 48, 8);
    tBg.strokeRoundedRect(0, 0, 48, 48, 8);
    this.toggleBtnContainer.add(tBg);

    // Hamguger / Menu Icon
    const tIcon = this.add.text(24, 24, 'MENU', {
      fontFamily: '"Rubik", sans-serif', fontSize: '12px', color: '#ffffff', fontStyle: '700'
    }).setOrigin(0.5);
    this.toggleBtnContainer.add(tIcon);

    const tZone = this.add.zone(24, 24, 48, 48).setInteractive({ useHandCursor: true });
    tZone.on('pointerdown', () => this.toggleUI());
    this.toggleBtnContainer.add(tZone);
  }

  toggleUI() {
    if (this.isToggling) return;
    this.isToggling = true;
    this.uiVisible = !this.uiVisible;

    const targetX = this.uiVisible ? 0 : -this.sidebarWidth;

    // Hide floating button immediately if opening
    if (this.uiVisible) {
      this.toggleBtnContainer.setVisible(false);
      this.hudContainer.setVisible(true); // Ensure sidebar is visible
    }

    this.tweens.add({
      targets: this.hudContainer,
      x: targetX,
      duration: 300,
      ease: 'Cubic.easeInOut',
      onComplete: () => {
        this.isToggling = false;
        // Show toggle button if closed
        if (!this.uiVisible) {
          this.toggleBtnContainer.setVisible(true);
        }
      }
    });
  }

  createExitButton(x, y) {
    const btnW = this.sidebarWidth - 64;
    const btnH = 40;

    const container = this.add.container(x, y); // Top-left relative
    this.hudContainer.add(container);

    const bg = this.add.graphics();
    // Danger Red Button (Survival style)
    bg.fillStyle(0x7f1d1d, 1); // Red-900
    bg.fillRoundedRect(0, 0, btnW, btnH, 6);
    bg.lineStyle(1, 0xef4444, 0.5);
    bg.strokeRoundedRect(0, 0, btnW, btnH, 6);
    container.add(bg);

    const txt = this.add.text(btnW / 2, btnH / 2, 'EXIT WORLD [ESC]', {
      fontSize: '13px', fontFamily: '"Rubik", sans-serif', color: '#fecaca', fontStyle: '600', letterSpacing: 1
    }).setOrigin(0.5);
    container.add(txt);

    const zone = this.add.zone(btnW / 2, btnH / 2, btnW, btnH).setInteractive({ useHandCursor: true });
    container.add(zone);

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x991b1b, 1); // Red-800
      bg.fillRoundedRect(0, 0, btnW, btnH, 6);
      bg.lineStyle(1, 0xffffff, 0.8);
      bg.strokeRoundedRect(0, 0, btnW, btnH, 6);
      txt.setColor('#ffffff');
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x7f1d1d, 1); // Red-900
      bg.fillRoundedRect(0, 0, btnW, btnH, 6);
      bg.lineStyle(1, 0xef4444, 0.5);
      bg.strokeRoundedRect(0, 0, btnW, btnH, 6);
      txt.setColor('#fecaca');
    });

    zone.on('pointerdown', () => this.exitToMenu());
  }

  updateHUD() {
    const startX = 32;
    const barW = this.sidebarWidth - 64;
    const barH = 8;

    // HP - Y=140
    let hpY = 140;

    // Move text up
    this.healthText.setOrigin(1, 1);
    this.healthText.setPosition(startX + barW, hpY - 4);
    this.healthText.setText(`${Math.round(this.health)}/${this.maxHealth}`);

    const hpRatio = Math.max(0, this.health / this.maxHealth);

    // Background bar
    this.healthBarBg.clear();
    this.healthBarBg.fillStyle(0x3f3f46, 1);
    this.healthBarBg.fillRoundedRect(startX, hpY, barW, barH, 4);

    // Fill bar
    this.healthBar.clear();
    if (hpRatio > 0) {
      this.healthBar.fillStyle(0xf87171, 1);
      this.healthBar.fillRoundedRect(startX, hpY, Math.max(barW * hpRatio, barH), barH, 4);
    }

    // Stamina - Y + 36
    const stY = hpY + 36;

    // Move text up
    this.staminaText.setOrigin(1, 1);
    this.staminaText.setPosition(startX + barW, stY - 4);
    this.staminaText.setText(`${Math.round(this.stamina)}/${this.maxStamina}`);

    const stRatio = Math.max(0, this.stamina / this.maxStamina);

    this.staminaBarBg.clear();
    this.staminaBarBg.fillStyle(0x3f3f46, 1);
    this.staminaBarBg.fillRoundedRect(startX, stY, barW, barH, 4);

    this.staminaBar.clear();
    if (stRatio > 0) {
      this.staminaBar.fillStyle(0x60a5fa, 1);
      this.staminaBar.fillRoundedRect(startX, stY, Math.max(barW * stRatio, barH), barH, 4);
    }

    // this.posText.setText(`${Math.round(this.player.x)}, ${Math.round(this.player.y)}`); // Removed or moved?

    const a = this.attributes;
    this.attrText.setText(`STR  ${a.strength}  INT  ${a.intelligence}\nAGI  ${a.agility}  END  ${a.endurance}`);

    if (this.inventory.length === 0) {
      this.invText.setText('// EMPTY');
    } else {
      this.invText.setText(this.inventory.map(it => `[${it.quantity}] ${it.name}`).join('\n'));
    }
  }

  update(time, delta) {
    if (!this.ready) return;

    const body = this.playerContainer.body;
    body.setVelocity(0, 0);

    this.sprinting = this.shiftKey.isDown && this.stamina > 0;
    const currentSpeed = this.sprinting ? this.speed * 1.8 : this.speed;

    if (this.sprinting) {
      this.stamina = Math.max(0, this.stamina - 20 * (delta / 1000));
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 10 * (delta / 1000));
    }

    const left = this.cursors.left.isDown || this.wasd.left.isDown;
    const right = this.cursors.right.isDown || this.wasd.right.isDown;
    const up = this.cursors.up.isDown || this.wasd.up.isDown;
    const down = this.cursors.down.isDown || this.wasd.down.isDown;

    let vx = 0, vy = 0;
    if (left) vx = -currentSpeed;
    if (right) vx = currentSpeed;
    if (up) vy = -currentSpeed;
    if (down) vy = currentSpeed;

    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    body.setVelocity(vx, vy);

    // Custom Terrain Collision
    if (this.generator) {
      const nextX = this.playerContainer.x + body.velocity.x * (delta / 1000);
      const nextY = this.playerContainer.y + body.velocity.y * (delta / 1000);

      // Check center point for now (simplification)
      const biome = this.generator.getBiomeAt(nextX, nextY);

      // Water (0 or 1) blocks movement
      if (biome <= 1) {
        body.setVelocity(0, 0);
      }
    }



    // Animación según dirección
    const moving = vx !== 0 || vy !== 0;

    if (moving) {
      // Determinar dirección principal
      let dir;
      if (Math.abs(vy) >= Math.abs(vx)) {
        dir = vy < 0 ? 'up' : 'down';
      } else {
        dir = vx < 0 ? 'left' : 'right';
      }
      this.facing = dir;

      // Ajustar frameRate según sprint
      const rate = this.sprinting ? 16 : 10;
      this.playerLayers.forEach(s => {
        if (s.anims.currentAnim) s.anims.currentAnim.frameRate = rate;
      });

      this.playWalkAnim(dir);
    } else {
      this.setIdleFrame(this.facing);
    }

    this.updateHUD();
    this.updateVegetation();

    // Update Cloud Movement
    if (this.cloudLayer) {
      this.cloudLayer.tilePositionX += 0.2; // Slow wind
      this.cloudLayer.tilePositionY += 0.1;
    }

    // ── Update Atmospheric Particles Based on Terrain ──
    // Get terrain type under player
    const playerGridX = Math.floor(this.playerContainer.x / WorldConfig.TILE_SIZE);
    const playerGridY = Math.floor(this.playerContainer.y / WorldConfig.TILE_SIZE);

    if (playerGridX >= 0 && playerGridX < WorldConfig.GRID_SIZE &&
      playerGridY >= 0 && playerGridY < WorldConfig.GRID_SIZE) {
      const terrainIndex = playerGridY * WorldConfig.GRID_SIZE + playerGridX;
      const terrainType = this.terrainData ? this.terrainData[terrainIndex] : -1;

      // Only update if terrain changed
      if (terrainType !== this.currentTerrainType) {
        this.currentTerrainType = terrainType;
        this.updateParticleEffect(terrainType);
      }
    }

    // Update Day/Night Cycle
    if (!this.cyclePaused) {
      this.dayTime += delta;
      if (this.dayTime >= this.dayDuration) {
        this.dayTime = 0;
      }
    }

    // Cycle: 0 -> Noon (Bright) -> Dusk -> Midnight (Dark) -> Dawn -> Noon
    // Use Sine wave for smooth transition
    // progress 0..1
    const progress = this.dayTime / this.dayDuration;
    // We want bright (0 alpha) at 0.25 and 0.75? 
    // Let's say 0 is Noon. 0.5 is Midnight.
    // cos(0) = 1. cos(PI) = -1.
    // We want alpha 0 at Noon. Alpha 0.7 at Midnight.
    // Angle = progress * 2 * PI.
    // val = (1 - Math.cos(angle)) / 2; // 0 to 1
    // At 0 (Noon), val is 0. At 0.5 (Midnight), val is 1.

    const angle = progress * Math.PI * 2;
    const darkness = (1 - Math.cos(angle)) / 2; // 0..1

    // Max darkness e.g. 0.85
    this.dayNightOverlay.setAlpha(darkness * 0.85);

    // Update Time Display (0.0 = 12:00, 0.5 = 24:00)
    // Hours: (progress * 24 + 12) % 24
    let hours = (progress * 24 + 12) % 24;
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    if (this.timeText) this.timeText.setText(timeStr);

    // Optional: Tint global scene?
    // this.cameras.main.setTint(...) is expensive if not done right.
    // Overlay is cheaper.
  }

  updateVegetation() {
    if (!this.vegetationData) return;

    // Determine current chunk
    const px = this.playerContainer.x;
    const py = this.playerContainer.y;
    const chunkX = Math.floor(px / this.CHUNK_SIZE);
    const chunkY = Math.floor(py / this.CHUNK_SIZE);

    // Determine visible chunks (3x3 grid around player)
    const visibleChunks = new Set();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const key = `${chunkX + dx},${chunkY + dy}`;
        visibleChunks.add(key);
      }
    }

    // Remove distant chunks
    this.activeTreeChunks.forEach(key => {
      if (!visibleChunks.has(key)) {
        // Destroy trees in this chunk (tagged with chunkKey)
        this.treesGroup.children.each(child => {
          if (child.chunkKey === key) {
            child.destroy();
          }
        });
        this.activeTreeChunks.delete(key);
      }
    });

    // Add new chunks
    visibleChunks.forEach(key => {
      if (!this.activeTreeChunks.has(key)) {
        this.createTreesInChunk(key);
        this.activeTreeChunks.add(key);
      }
    });

    this.playerContainer.setDepth(this.playerContainer.y);
  }

  createTreesInChunk(key) {
    const [cx, cy] = key.split(',').map(Number);
    const startX = cx * this.CHUNK_SIZE;
    const startY = cy * this.CHUNK_SIZE;
    const endX = startX + this.CHUNK_SIZE;
    const endY = startY + this.CHUNK_SIZE;

    // Convert to grid coordinates
    // Grid scale: 2.5px per tile.
    const gStartX = Math.floor(startX / 2.5);
    const gStartY = Math.floor(startY / 2.5);
    const gEndX = Math.ceil(endX / 2.5);
    const gEndY = Math.ceil(endY / 2.5);

    // Bounds check
    if (gStartX < 0 || gStartY < 0 || gStartX >= 8000 || gStartY >= 8000) return;

    const width = 8000; // grid size

    // Adding random factor to avoid grid look?
    // Vegetation data is binary (1 or 0). 
    // We iterate grid within chunk bounds.
    for (let y = gStartY; y < gEndY; y++) {
      for (let x = gStartX; x < gEndX; x++) {
        if (x < 0 || x >= width || y < 0 || y >= width) continue;

        const index = y * width + x;
        const objType = this.vegetationData[index];

        if (objType > 0) {
          // Determine texture key
          let textureKey = 'tree'; // Renamed to avoid conflict with function argument 'key'
          let originY = 0.9;

          if (objType === WorldConfig.OBJECTS.ROCK_SMALL) { textureKey = 'rock_small'; originY = 0.7; }
          else if (objType === WorldConfig.OBJECTS.ROCK_MEDIUM) { textureKey = 'rock_medium'; originY = 0.8; }
          else if (objType === WorldConfig.OBJECTS.ROCK_LARGE) { textureKey = 'rock_large'; originY = 0.85; }
          else if (objType === WorldConfig.OBJECTS.FLOWER) {
            // Random flower color (0-15)
            const colorIndex = Math.floor(Math.random() * 16);
            textureKey = `flower_${colorIndex}`;
            originY = 0.8;
          }

          // Spawn object
          const worldX = x * 2.5;
          const worldY = y * 2.5;

          // Add some jitter
          const jx = worldX + (Math.random() * 2 - 1);
          const jy = worldY + (Math.random() * 2 - 1);

          const obj = this.add.image(jx, jy, textureKey);
          obj.setOrigin(0.5, originY); // Anchor at bottom
          obj.setDepth(jy);
          obj.chunkKey = key; // 'key' here refers to function argument (chunk coords)
          this.treesGroup.add(obj);
        }
      }
    }
  }

  updateParticleEffect(terrainType) {
    if (!this.atmosphericParticles) return;

    // Stop current particles
    this.atmosphericParticles.stop();

    // Configure based on terrain type
    switch (terrainType) {
      case WorldConfig.TERRAIN.DEEP_WATER:
      case WorldConfig.TERRAIN.SHALLOW_WATER:
        // Bubbles rising
        this.atmosphericParticles.setConfig({
          x: { min: 0, max: this.cameras.main.width },
          y: { min: this.cameras.main.height, max: this.cameras.main.height + 20 },
          lifespan: 3000,
          speedY: { min: -60, max: -30 }, // Rise up
          speedX: { min: -5, max: 5 },
          scale: { start: 1.2, end: 1.8 }, // Larger
          alpha: { start: 0.7, end: 0 }, // More visible
          quantity: 2,
          frequency: 100,
          tint: terrainType === WorldConfig.TERRAIN.DEEP_WATER ? 0x4da6ff : 0x80d4ff,
          blendMode: Phaser.BlendModes.ADD
        });
        this.atmosphericParticles.start();
        break;

      case WorldConfig.TERRAIN.SAND:
        // Sand dust particles
        this.atmosphericParticles.setConfig({
          x: { min: 0, max: this.cameras.main.width },
          y: { min: -20, max: 0 },
          lifespan: 2500,
          speedY: { min: 15, max: 30 },
          speedX: { min: -20, max: 20 },
          scale: { start: 1.0, end: 0.3 }, // Larger
          alpha: { start: 0.6, end: 0 }, // More visible
          quantity: 2,
          frequency: 120,
          tint: 0xf4d03f,
          blendMode: Phaser.BlendModes.NORMAL
        });
        this.atmosphericParticles.start();
        break;

      case WorldConfig.TERRAIN.GRASS_LIGHT:
      case WorldConfig.TERRAIN.GRASS_DARK:
        // Pollen/seeds floating
        this.atmosphericParticles.setConfig({
          x: { min: 0, max: this.cameras.main.width },
          y: { min: -20, max: 0 },
          lifespan: 4000,
          speedY: { min: 10, max: 25 },
          speedX: { min: -15, max: 15 },
          scale: { start: 1.2, end: 0.5 }, // Larger
          alpha: { start: 0.8, end: 0 }, // More visible
          quantity: 2,
          frequency: 150,
          tint: 0xd4f1a5,
          blendMode: Phaser.BlendModes.ADD
        });
        this.atmosphericParticles.start();
        break;

      case WorldConfig.TERRAIN.DIRT:
        // Dust particles
        this.atmosphericParticles.setConfig({
          x: { min: 0, max: this.cameras.main.width },
          y: { min: -20, max: 0 },
          lifespan: 2000,
          speedY: { min: 20, max: 40 },
          speedX: { min: -10, max: 10 },
          scale: { start: 0.8, end: 0.3 }, // Larger
          alpha: { start: 0.7, end: 0 }, // More visible
          quantity: 2,
          frequency: 100,
          tint: 0x8b4513,
          blendMode: Phaser.BlendModes.NORMAL
        });
        this.atmosphericParticles.start();
        break;

      default:
        // No particles for unknown terrain
        this.atmosphericParticles.stop();
        break;
    }
  }

  async autoSave() {
    await fetch(`/api/saves/${this.saveId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player: {
          x: Math.round(this.player.x),
          y: Math.round(this.player.y),
          health: this.health,
          stamina: this.stamina,
          maxHealth: this.maxHealth,
          maxStamina: this.maxStamina,
          attributes: this.attributes,
          inventory: this.inventory
        }
      })
    });
  }

  async exitToMenu() {
    await this.autoSave();
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('MenuScene');
    });
  }
}

window.GameScene = GameScene;
