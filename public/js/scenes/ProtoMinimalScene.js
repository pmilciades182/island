import { AnimationManager } from '../player/AnimationManager.js';
import { PlayerController } from '../player/PlayerController.js';
import { HUD } from '../ui/HUD.js';
import { DayNightCycle } from '../world/DayNightCycle.js';
import { SoundManager } from '../audio/SoundManager.js';

class ProtoMinimalScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ProtoMinimalScene' });
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

    const worldSeed = 0.42;

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
    this.add.image(WORLD_W / 2, WORLD_H / 2, 'proto_grass');

    // No generator — player moves freely, no biome modifiers, no water
    this.generator = null;

    // Managers
    this.soundManager = new SoundManager();
    this.soundManager.init();

    this.animManager = new AnimationManager(this);
    this.playerController = new PlayerController(this, null, this.soundManager, worldSeed);

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

    ctx.fillStyle = '#5aa460';
    ctx.fillRect(0, 0, w, h);

    if (this.textures.exists('proto_grass')) {
      this.textures.remove('proto_grass');
    }
    this.textures.addCanvas('proto_grass', canvas);
  }

  // ══════════════════════════════════════
  //  TOP BAR
  // ══════════════════════════════════════

  _createTopBar() {
    const pad = 8;
    const topBar = this.add.graphics().setScrollFactor(0).setDepth(100000);
    topBar.fillStyle(0x000000, 0.5);
    topBar.fillRect(0, 0, this.cameras.main.width, 28);

    this.add.text(pad, 6, 'PROTO MINIMAL', {
      fontSize: '11px', fontFamily: '"JetBrains Mono", monospace',
      color: '#60a5fa', fontStyle: '700'
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
    panel.lineStyle(1, 0x10b981, 0.3);
    panel.strokeRoundedRect(cx - mW / 2, cy - mH / 2, mW, mH, 14);
    this.fbItems.push(panel);

    this.fbItems.push(
      this.add.text(cx, cy - mH / 2 + 24, 'PROTOTYPE FEEDBACK', {
        fontSize: '13px', fontFamily: '"JetBrains Mono", monospace',
        color: '#10b981', fontStyle: '700'
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
      color: 'rgba(16,185,129,0.8)'
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
    }).setOrigin(0.5).setScrollFactor(0).setDepth(200003);
    this.fbItems.push(txt);

    const zone = this.add.zone(x, y, btnW, btnH).setInteractive({ useHandCursor: true }).setScrollFactor(0).setDepth(200004);
    zone.on('pointerdown', callback);
    this.fbItems.push(zone);
  }

  _closeFeedback(exit) {
    if (this.feedbackNotes.trim()) {
      console.log('[ProtoMinimalScene] Feedback:', this.feedbackNotes.trim());
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

window.ProtoMinimalScene = ProtoMinimalScene;
