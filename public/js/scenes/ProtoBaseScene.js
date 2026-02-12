import { WorldConfig } from '../world/WorldConfig.js';
import { IslandGenerator } from '../world/IslandGenerator.js';
import { TerrainRenderer } from '../world/TerrainRenderer.js';
import { AnimationManager } from '../player/AnimationManager.js';
import { PlayerController } from '../player/PlayerController.js';
import { HUD } from '../ui/HUD.js';
import { DayNightCycle } from '../world/DayNightCycle.js';
import { VegetationManager } from '../world/VegetationManager.js';
import { ProximityManager } from '../world/ProximityManager.js';
import { TaskDistributor } from '../world/TaskDistributor.js';
import { InteractIndicator } from '../ui/InteractIndicator.js';
import { InteractPopup } from '../ui/InteractPopup.js';
import { SoundManager } from '../audio/SoundManager.js';

class ProtoBaseScene extends Phaser.Scene {
  constructor() {
    super({ key: 'ProtoBaseScene' });
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

  async create() {
    const WORLD_W = 2000;
    const WORLD_H = 2000;
    this.WORLD_W = WORLD_W;
    this.WORLD_H = WORLD_H;

    const TILE_SIZE = 2.5;
    const GRID_SIZE = Math.floor(WORLD_W / TILE_SIZE); // 800
    const worldSeed = 0.42;

    // Loading UI
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    const barW = 280;
    const barH = 6;

    const loadContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(999999);

    const loadTitle = this.add.text(cx, cy - 40, 'PROTO BASE', {
      fontSize: '22px', fontFamily: '"Rubik", sans-serif', color: '#10b981', fontStyle: '700'
    }).setOrigin(0.5);
    loadContainer.add(loadTitle);

    const loadStep = this.add.text(cx, cy - 10, 'Initializing...', {
      fontSize: '12px', fontFamily: '"JetBrains Mono", monospace', color: '#a1a1aa'
    }).setOrigin(0.5);
    loadContainer.add(loadStep);

    const barY = cy + 12;
    const barBg = this.add.graphics();
    barBg.fillStyle(0x27272a, 1);
    barBg.fillRoundedRect(cx - barW / 2, barY, barW, barH, 3);
    loadContainer.add(barBg);

    const barFill = this.add.graphics();
    loadContainer.add(barFill);

    const loadPct = this.add.text(cx, barY + barH + 8, '0%', {
      fontSize: '11px', fontFamily: '"JetBrains Mono", monospace', color: '#10b981'
    }).setOrigin(0.5, 0);
    loadContainer.add(loadPct);

    const drawBar = (ratio) => {
      barFill.clear();
      if (ratio > 0) {
        barFill.fillStyle(0x10b981, 1);
        barFill.fillRoundedRect(cx - barW / 2, barY, Math.max(barW * ratio, barH), barH, 3);
      }
      loadPct.setText(`${Math.round(ratio * 100)}%`);
    };

    const setStep = (text, pct) => {
      loadStep.setText(text);
      drawBar(pct);
    };

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

    // Generate terrain
    setStep('Generating terrain...', 0.05);
    this.generator = new IslandGenerator(worldSeed, WORLD_W, TILE_SIZE);

    await this.generator.generate((prog) => {
      setStep('Generating terrain...', 0.05 + prog * 0.45);
    });

    // Render texture
    setStep('Rendering texture...', 0.50);
    const renderer = new TerrainRenderer(this, worldSeed);
    this.terrainImage = await renderer.render(this.generator.data, GRID_SIZE, TILE_SIZE, (prog) => {
      setStep('Rendering texture...', 0.50 + prog * 0.40);
    });

    // Placing vegetation
    setStep('Placing vegetation...', 0.90);
    await new Promise(r => setTimeout(r, 0));

    // Initializing systems
    setStep('Initializing systems...', 0.95);
    await new Promise(r => setTimeout(r, 0));

    loadContainer.destroy();

    // Validate spawn position
    const biome = this.generator.getBiomeAt(p.x, p.y);
    if (biome <= 1) { p.x = WORLD_W / 2; p.y = WORLD_H / 2; }

    // Managers
    this.soundManager = new SoundManager();
    this.soundManager.init();

    this.vegetation = new VegetationManager(this, this.generator.vegetation, worldSeed, GRID_SIZE, TILE_SIZE);
    this.animManager = new AnimationManager(this);
    this.playerController = new PlayerController(this, this.generator, this.soundManager, worldSeed);
    this.taskDistributor = new TaskDistributor(this);
    this.proximityManager = new ProximityManager(this, this.playerController.playerContainer, this.vegetation, this.generator, this.taskDistributor, { radius: 128 });

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

    // HUD (no auto-save callback, exit goes to feedback)
    this.hud = new HUD(this, this.saveData, {
      onExit: () => this._onExit(),
      onToggleCycle: () => this.dayNight.togglePause()
    });

    // Interaction systems
    this.interactIndicator = new InteractIndicator(this);
    this.interactPopup = new InteractPopup(this);
    this.input.keyboard.on('keydown-E', () => this._handleInteract());
    this._padInteractHeld = false;
    this._virtualInteractHeld = false;

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-ESC', () => this._onExit());
    this.input.keyboard.on('keydown-M', () => this.hud.toggle());
    this.input.keyboard.on('keydown-P', () => this.dayNight.togglePause());
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === '+' || event.key === '=') this.dayNight.advance(5000);
      else if (event.key === '-' || event.key === '_') this.dayNight.advance(-5000);
    });

    // Top bar label: PROTO BASE
    this._createTopBar();

    // Feedback state
    this.feedbackOpen = false;
    this.feedbackNotes = '';

    this.ready = true;
  }

  _createTopBar() {
    const pad = 8;
    const topBar = this.add.graphics().setScrollFactor(0).setDepth(100000);
    topBar.fillStyle(0x000000, 0.5);
    topBar.fillRect(0, 0, this.cameras.main.width, 28);

    this.add.text(pad, 6, 'PROTO BASE', {
      fontSize: '11px', fontFamily: '"JetBrains Mono", monospace',
      color: '#10b981', fontStyle: '700'
    }).setScrollFactor(0).setDepth(100001);

    this.add.text(this.cameras.main.width - pad, 6, '[ESC] Exit + Feedback', {
      fontSize: '9px', fontFamily: '"JetBrains Mono", monospace',
      color: 'rgba(255,255,255,0.4)'
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(100001);
  }

  _handleInteract() {
    const target = this.interactIndicator.currentObject;
    if (this.interactPopup.isOpen) {
      this.soundManager.playClick();
      this.interactPopup.close();
    } else if (target) {
      this.soundManager.playInteract();
      this.interactPopup.open(target);
    }
  }

  update(time, delta) {
    if (!this.ready) return;

    // Gamepad X → interact
    const pad = this.playerController.gamepad;
    if (pad) {
      const xPressed = pad.X;
      if (xPressed && !this._padInteractHeld) {
        this._padInteractHeld = true;
        this._handleInteract();
      } else if (!xPressed) {
        this._padInteractHeld = false;
      }
    }

    // Virtual A → interact
    const vi = window.virtualInput;
    if (vi) {
      if (vi.buttonA && !this._virtualInteractHeld) {
        this._virtualInteractHeld = true;
        this._handleInteract();
      } else if (!vi.buttonA) {
        this._virtualInteractHeld = false;
      }
    }

    this.proximityManager.update();
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

    const lastPayload = this.taskDistributor.lastPayload;
    let closestInteractable = null;
    let closestDistSq = Infinity;

    if (lastPayload) {
      const nearbyVeg = lastPayload.vegetation || [];
      nearbyVeg.forEach(obj => {
        const distSq = Phaser.Math.Distance.Squared(this.player.x, this.player.y, obj.x, obj.y);
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestInteractable = obj;
        }
      });
    }

    this.interactIndicator.update(closestInteractable);

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

    this.vegetation.update(this.playerController.x, this.playerController.y);
    const { timeStr } = this.dayNight.update(delta);
    this.hud.setTimeText(timeStr);
  }

  // ══════════════════════════════════════
  //  FEEDBACK MODAL (exit to selector)
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
      console.log('[ProtoBaseScene] Feedback:', this.feedbackNotes.trim());
    }

    this.input.keyboard.off('keydown', this._fbKeyHandler);
    this.fbItems.forEach(obj => { if (obj && obj.destroy) obj.destroy(); });
    this.fbItems = [];
    this.feedbackOpen = false;

    if (exit) {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('PrototypeScene');
      });
    }
  }
}

window.ProtoBaseScene = ProtoBaseScene;
