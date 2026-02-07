import { WorldConfig } from '../world/WorldConfig.js';
import { IslandGenerator } from '../world/IslandGenerator.js';
import { TerrainRenderer } from '../world/TerrainRenderer.js';
import { AnimationManager } from '../player/AnimationManager.js';
import { PlayerController } from '../player/PlayerController.js';
import { HUD } from '../ui/HUD.js';
import { DayNightCycle } from '../world/DayNightCycle.js';
import { VegetationManager } from '../world/VegetationManager.js';

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    this.saveId = data.saveId;
    this.ready = false;
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

    // ── Loading UI ──
    const cx = this.cameras.main.width / 2;
    const cy = this.cameras.main.height / 2;
    const barW = 320;
    const barH = 6;

    const loadContainer = this.add.container(0, 0).setScrollFactor(0).setDepth(999999);

    const loadTitle = this.add.text(cx, cy - 50, 'ISLAND SURVIVAL', {
      fontSize: '28px', fontFamily: '"Rubik", sans-serif', color: '#ffffff', fontStyle: '700'
    }).setOrigin(0.5);
    loadContainer.add(loadTitle);

    const loadStep = this.add.text(cx, cy - 10, 'Connecting...', {
      fontSize: '14px', fontFamily: '"JetBrains Mono", monospace', color: '#a1a1aa'
    }).setOrigin(0.5);
    loadContainer.add(loadStep);

    const barY = cy + 16;

    const barBg = this.add.graphics();
    barBg.fillStyle(0x27272a, 1);
    barBg.fillRoundedRect(cx - barW / 2, barY, barW, barH, 3);
    loadContainer.add(barBg);

    const barFill = this.add.graphics();
    loadContainer.add(barFill);

    const loadPct = this.add.text(cx, barY + barH + 10, '0%', {
      fontSize: '12px', fontFamily: '"JetBrains Mono", monospace', color: '#10b981'
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

    // Step 1: Load save data
    setStep('Loading save data...', 0);
    const res = await fetch(`/api/saves/${this.saveId}`);
    this.saveData = await res.json();
    const p = this.saveData.player;

    // World bounds
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // Step 2: Generate terrain (0% - 50%)
    setStep('Generating terrain...', 0.05);
    this.generator = new IslandGenerator(0.42, WORLD_W, 2.5);

    await this.generator.generate((prog) => {
      setStep('Generating terrain...', 0.05 + prog * 0.45);
    });

    // Step 3: Render texture (50% - 90%)
    setStep('Rendering texture...', 0.50);
    const renderer = new TerrainRenderer(this);
    await renderer.render(this.generator.data, 8000, 2.5, (prog) => {
      setStep('Rendering texture...', 0.50 + prog * 0.40);
    });

    // Step 4: Placing objects (90% - 95%)
    setStep('Placing vegetation...', 0.90);
    await new Promise(r => setTimeout(r, 0));

    // Step 5: Initializing systems (95% - 100%)
    setStep('Initializing systems...', 0.95);
    await new Promise(r => setTimeout(r, 0));

    loadContainer.destroy();

    // Safety Check: spawn in water -> move to center
    const biome = this.generator.getBiomeAt(p.x, p.y);
    if (biome <= 1) { p.x = WORLD_W / 2; p.y = WORLD_H / 2; }
    if (p.x < 0 || p.x > WORLD_W || p.y < 0 || p.y > WORLD_H) { p.x = WORLD_W / 2; p.y = WORLD_H / 2; }

    // ── Managers ──
    this.vegetation = new VegetationManager(this, this.generator.vegetation);
    this.animManager = new AnimationManager(this);
    this.playerController = new PlayerController(this, this.generator);

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.playerController.playerContainer, true, 0.08, 0.08);
    this.cameras.main.fadeIn(500, 0, 0, 0);

    this.dayNight = new DayNightCycle(this);

    // Player stats
    this.health = p.health;
    this.maxHealth = p.maxHealth;
    this.stamina = p.stamina;
    this.maxStamina = p.maxStamina;
    this.attributes = { ...p.attributes };
    this.inventory = [...p.inventory];

    // Alias for save compatibility
    this.player = this.playerController.playerContainer;

    // Set initial idle frame
    this.animManager.setIdle('down', this.playerController.playerLayers);

    // HUD
    this.hud = new HUD(this, this.saveData, {
      onExit: () => this.exitToMenu(),
      onToggleCycle: () => this.dayNight.togglePause()
    });

    // Keyboard shortcuts
    this.input.keyboard.on('keydown-ESC', () => this.exitToMenu());
    this.input.keyboard.on('keydown-M', () => this.hud.toggle());
    this.input.keyboard.on('keydown-P', () => this.dayNight.togglePause());
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === '+' || event.key === '=') this.dayNight.advance(5000);
      else if (event.key === '-' || event.key === '_') this.dayNight.advance(-5000);
    });

    // Auto-save every 5s
    this.saveTimer = this.time.addEvent({
      delay: 5000, callback: () => this.autoSave(), loop: true
    });

    this.ready = true;
  }

  update(time, delta) {
    if (!this.ready) return;

    // Player movement
    const moveState = this.playerController.update(delta, this.stamina, this.maxStamina);

    // Sprint stamina drain/regen
    if (moveState.sprinting) {
      this.stamina = Math.max(0, this.stamina - 20 * (delta / 1000));
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 10 * (delta / 1000));
    }

    // Animations
    if (moveState.moving) {
      const rate = moveState.sprinting ? 16 : 10;
      this.playerController.playerLayers.forEach(s => {
        if (s.anims.currentAnim) s.anims.currentAnim.frameRate = rate;
      });
      this.animManager.playWalk(moveState.facing, this.playerController.playerLayers);
    } else {
      this.animManager.setIdle(moveState.facing, this.playerController.playerLayers);
    }

    // HUD
    this.hud.update({
      health: this.health,
      maxHealth: this.maxHealth,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      attributes: this.attributes,
      inventory: this.inventory
    });

    // Vegetation & particles
    this.vegetation.update(this.playerController.x, this.playerController.y);

    // Day/Night
    const { timeStr } = this.dayNight.update(delta);
    this.hud.setTimeText(timeStr);
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
