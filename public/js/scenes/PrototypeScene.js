import { AnimationManager } from '../player/AnimationManager.js';

class PrototypeScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PrototypeScene' });
  }

  preload() {
    const base = 'assets/lpc_entry/png';

    // Body
    this.load.spritesheet('body_walk', `${base}/walkcycle/BODY_male.png`, { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('body_slash', `${base}/slash/BODY_human.png`, { frameWidth: 64, frameHeight: 64 });

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

  create() {
    const WORLD_W = 800;
    const WORLD_H = 800;
    this.WORLD_W = WORLD_W;
    this.WORLD_H = WORLD_H;

    // Physics bounds
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // -- Generate grass ground texture --
    this._createGrassTexture(WORLD_W, WORLD_H);
    this.add.image(WORLD_W / 2, WORLD_H / 2, 'proto_grass');

    // -- Grid overlay for spatial reference --
    this._drawGrid(WORLD_W, WORLD_H, 64);

    // -- Player character (static, bottom-left corner) --
    const playerX = 80;
    const playerY = WORLD_H - 80;

    this.playerContainer = this.add.container(playerX, playerY);
    this.physics.world.enable(this.playerContainer);
    this.playerContainer.body.setSize(24, 24);
    this.playerContainer.body.setCollideWorldBounds(true);

    this.bodySprite = this.add.sprite(0, 0, 'body_walk', 0);
    this.feetSprite = this.add.sprite(0, 0, 'feet_walk', 0);
    this.legsSprite = this.add.sprite(0, 0, 'legs_walk', 0);
    this.torsoSprite = this.add.sprite(0, 0, 'torso_walk', 0);
    this.headSprite = this.add.sprite(0, 0, 'head_walk', 0);

    this.playerLayers = [this.bodySprite, this.feetSprite, this.legsSprite, this.torsoSprite, this.headSprite];
    this.playerLayers.forEach(s => this.playerContainer.add(s));

    // Create animations and set idle facing down
    this.animManager = new AnimationManager(this);
    this.animManager.setIdle('down', this.playerLayers);

    // -- Camera --
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.centerOn(WORLD_W / 2, WORLD_H / 2);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // -- HUD: Prototype mode label --
    this._createHUD();

    // -- Feedback state --
    this.feedbackOpen = false;
    this.feedbackNotes = '';

    // -- Input --
    this.input.keyboard.on('keydown-ESC', () => this._onExit());

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

    // Base grass color palette (light grass)
    const grassColors = [
      [88, 164, 96], [92, 168, 100], [84, 160, 92], [90, 166, 98],
      [86, 162, 94], [94, 170, 102], [85, 161, 93], [91, 167, 99]
    ];

    // Dark grass accents
    const darkGrass = [
      [48, 98, 56], [52, 102, 60], [44, 94, 52], [50, 100, 58]
    ];

    const imgData = ctx.createImageData(w, h);
    const data = imgData.data;

    // Simple seeded random for deterministic output
    let seed = 12345;
    const rand = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;

        // Mix light and dark grass with noise-like variation
        const n = rand();
        let color;
        if (n < 0.75) {
          color = grassColors[Math.floor(rand() * grassColors.length)];
        } else {
          color = darkGrass[Math.floor(rand() * darkGrass.length)];
        }

        // Slight per-pixel jitter
        const jitter = Math.floor(rand() * 8) - 4;
        data[idx] = Math.max(0, Math.min(255, color[0] + jitter));
        data[idx + 1] = Math.max(0, Math.min(255, color[1] + jitter));
        data[idx + 2] = Math.max(0, Math.min(255, color[2] + jitter));
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imgData, 0, 0);

    // Add to Phaser texture manager
    if (this.textures.exists('proto_grass')) {
      this.textures.remove('proto_grass');
    }
    this.textures.addCanvas('proto_grass', canvas);
  }

  // ══════════════════════════════════════
  //  GRID OVERLAY
  // ══════════════════════════════════════

  _drawGrid(w, h, cellSize) {
    const gfx = this.add.graphics();
    gfx.lineStyle(1, 0x000000, 0.08);

    for (let x = 0; x <= w; x += cellSize) {
      gfx.moveTo(x, 0);
      gfx.lineTo(x, h);
    }
    for (let y = 0; y <= h; y += cellSize) {
      gfx.moveTo(0, y);
      gfx.lineTo(w, y);
    }
    gfx.strokePath();
  }

  // ══════════════════════════════════════
  //  HUD
  // ══════════════════════════════════════

  _createHUD() {
    const pad = 8;

    // Top bar background
    const topBar = this.add.graphics().setScrollFactor(0).setDepth(1000);
    topBar.fillStyle(0x000000, 0.5);
    topBar.fillRect(0, 0, this.cameras.main.width, 28);

    // Label
    this.add.text(pad, 6, 'PROTOTYPE MODE', {
      fontSize: '11px',
      fontFamily: '"JetBrains Mono", monospace',
      color: '#10b981',
      fontStyle: '700'
    }).setScrollFactor(0).setDepth(1001);

    // ESC hint
    this.add.text(this.cameras.main.width - pad, 6, '[ESC] Exit + Feedback', {
      fontSize: '9px',
      fontFamily: '"JetBrains Mono", monospace',
      color: 'rgba(255,255,255,0.4)'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(1001);

    // Coordinates label (bottom-left)
    this.coordsText = this.add.text(pad, this.cameras.main.height - 20, 'Player: 80, 720', {
      fontSize: '9px',
      fontFamily: '"JetBrains Mono", monospace',
      color: 'rgba(255,255,255,0.35)'
    }).setScrollFactor(0).setDepth(1001);

    // World size label (bottom-right)
    this.add.text(this.cameras.main.width - pad, this.cameras.main.height - 20, `World: ${this.WORLD_W}x${this.WORLD_H}`, {
      fontSize: '9px',
      fontFamily: '"JetBrains Mono", monospace',
      color: 'rgba(255,255,255,0.35)'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(1001);
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

    // Overlay
    const overlay = this.add.graphics().setScrollFactor(0).setDepth(2000);
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, W, H);
    this.fbItems.push(overlay);

    // Panel
    const panel = this.add.graphics().setScrollFactor(0).setDepth(2001);
    panel.fillStyle(0x161b26, 1);
    panel.fillRoundedRect(cx - mW / 2, cy - mH / 2, mW, mH, 14);
    panel.lineStyle(1, 0x10b981, 0.3);
    panel.strokeRoundedRect(cx - mW / 2, cy - mH / 2, mW, mH, 14);
    this.fbItems.push(panel);

    // Title
    this.fbItems.push(
      this.add.text(cx, cy - mH / 2 + 24, 'PROTOTYPE FEEDBACK', {
        fontSize: '13px', fontFamily: '"JetBrains Mono", monospace',
        color: '#10b981', fontStyle: '700'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(2002)
    );

    // Subtitle
    this.fbItems.push(
      this.add.text(cx, cy - mH / 2 + 46, 'Notes about this prototype session:', {
        fontSize: '10px', fontFamily: '"Inter", sans-serif',
        color: 'rgba(255,255,255,0.5)'
      }).setOrigin(0.5).setScrollFactor(0).setDepth(2002)
    );

    // Input area background
    const inputW = mW - 40;
    const inputH = 80;
    const inputX = cx - inputW / 2;
    const inputY = cy - mH / 2 + 62;

    const inputBg = this.add.graphics().setScrollFactor(0).setDepth(2002);
    inputBg.fillStyle(0x000000, 0.4);
    inputBg.fillRoundedRect(inputX, inputY, inputW, inputH, 8);
    inputBg.lineStyle(1, 0xffffff, 0.1);
    inputBg.strokeRoundedRect(inputX, inputY, inputW, inputH, 8);
    this.fbItems.push(inputBg);

    // Input text
    this.feedbackNotes = '';
    this.fbInputText = this.add.text(inputX + 8, inputY + 8, '', {
      fontSize: '10px', fontFamily: '"JetBrains Mono", monospace',
      color: '#e4e4e7', wordWrap: { width: inputW - 16 }, lineSpacing: 4
    }).setScrollFactor(0).setDepth(2003);
    this.fbItems.push(this.fbInputText);

    // Cursor
    this.fbCursor = this.add.text(inputX + 8, inputY + 8, '|', {
      fontSize: '10px', fontFamily: '"JetBrains Mono", monospace',
      color: 'rgba(16,185,129,0.8)'
    }).setScrollFactor(0).setDepth(2003);
    this.tweens.add({ targets: this.fbCursor, alpha: 0, duration: 500, repeat: -1, yoyo: true });
    this.fbItems.push(this.fbCursor);

    // Buttons
    const btnY = cy + mH / 2 - 40;
    this._createFBButton(cx - 70, btnY, 'Skip', false, () => this._closeFeedback(true));
    this._createFBButton(cx + 70, btnY, 'Save & Exit', true, () => this._closeFeedback(true));

    // Keyboard handler
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
      // Update cursor position
      const bounds = this.fbInputText.getBounds();
      this.fbCursor.x = Math.min(bounds.x + this.fbInputText.width + 1, inputX + inputW - 12);
      this.fbCursor.y = bounds.y + Math.max(0, this.fbInputText.height - 14);
    };
    this.input.keyboard.on('keydown', this._fbKeyHandler);
  }

  _createFBButton(x, y, label, primary, callback) {
    const btnW = 110;
    const btnH = 30;

    const bg = this.add.graphics().setScrollFactor(0).setDepth(2002);
    if (primary) {
      bg.fillStyle(0x10b981, 1);
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
    }).setOrigin(0.5).setScrollFactor(0).setDepth(2003);
    this.fbItems.push(txt);

    const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(2004);
    zone.on('pointerdown', callback);
    this.fbItems.push(zone);
  }

  _closeFeedback(exit) {
    // Log feedback to console for now
    if (this.feedbackNotes.trim()) {
      console.log('[PrototypeScene] Feedback:', this.feedbackNotes.trim());
    }

    // Cleanup
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

  update(time, delta) {
    if (!this.ready) return;

    // Update coords display
    const px = Math.round(this.playerContainer.x);
    const py = Math.round(this.playerContainer.y);
    if (this.coordsText) {
      this.coordsText.setText(`Player: ${px}, ${py}`);
    }
  }
}

window.PrototypeScene = PrototypeScene;
