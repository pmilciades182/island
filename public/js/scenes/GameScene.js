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

    if (!res.ok) {
      console.error("Save fetch failed:", res.status, res.statusText);
      // You can decide to create new player or go back to menu
      this.saveData = { player: this.getDefaultPlayer() }; // ← fallback
    } else {
      this.saveData = await res.json();
    }

    console.log("Loaded save data:", this.saveData);           // ← inspect this!
    console.log("this.saveData.player =", this.saveData?.player);

    //this.saveData = await res.json();
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
    this.terrainImage = await renderer.render(this.generator.data, 8000, 2.5, (prog) => {
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
    this.cameras.main.startFollow(this.playerController.playerContainer, false, 0.15, 0.15);
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

    // ── Debug Panel (DOM) ──
    this._debugPrevCamX = 0;
    this._debugPrevCamY = 0;
    this._debugPrevPlayerX = 0;
    this._debugPrevPlayerY = 0;
    this._debugFrameTimes = [];
    this._debugEl = document.getElementById('debug-panel');
    this._debugJitterLog = []; // track camera position jumps

    this.ready = true;
  }

  update(time, delta) {
    if (!this.ready) return;

    // Player movement
    const moveState = this.playerController.update(delta, this.stamina, this.maxStamina);

    // ── Debug update (DOM) ──
    if (this._debugEl) {
      const cam = this.cameras.main;
      const pc = this.playerController.playerContainer;
      const body = pc.body;

      // FPS tracking
      this._debugFrameTimes.push(delta);
      if (this._debugFrameTimes.length > 60) this._debugFrameTimes.shift();
      const avgDelta = this._debugFrameTimes.reduce((a, b) => a + b, 0) / this._debugFrameTimes.length;
      const fps = Math.round(1000 / avgDelta);
      const minFps = Math.round(1000 / Math.max(...this._debugFrameTimes));
      const maxFps = Math.round(1000 / Math.min(...this._debugFrameTimes));

      // Camera delta per frame
      const camDx = cam.scrollX - this._debugPrevCamX;
      const camDy = cam.scrollY - this._debugPrevCamY;

      // Jitter detection: direction reversal in consecutive frames
      const jitterX = (this._debugLastCamDx !== undefined && camDx !== 0 && this._debugLastCamDx !== 0 &&
        Math.sign(camDx) !== Math.sign(this._debugLastCamDx));
      const jitterY = (this._debugLastCamDy !== undefined && camDy !== 0 && this._debugLastCamDy !== 0 &&
        Math.sign(camDy) !== Math.sign(this._debugLastCamDy));

      if (jitterX || jitterY) {
        this._debugJitterLog.push({
          t: time.toFixed(0),
          dx: camDx.toFixed(4),
          dy: camDy.toFixed(4),
          pdx: this._debugLastCamDx.toFixed(4),
          pdy: this._debugLastCamDy.toFixed(4)
        });
        if (this._debugJitterLog.length > 8) this._debugJitterLog.shift();
      }

      this._debugLastCamDx = camDx;
      this._debugLastCamDy = camDy;
      this._debugPrevCamX = cam.scrollX;
      this._debugPrevCamY = cam.scrollY;

      // Player delta per frame
      const pDx = pc.x - this._debugPrevPlayerX;
      const pDy = pc.y - this._debugPrevPlayerY;
      this._debugPrevPlayerX = pc.x;
      this._debugPrevPlayerY = pc.y;

      // Terrain image tracking
      const ti = this.terrainImage;
      let terrainHtml = '<span class="err">No terrain ref</span>';
      let terrainShake = '';
      if (ti) {
        const tiScreenX = ti.x - cam.scrollX;
        const tiScreenY = ti.y - cam.scrollY;

        // Track terrain screen position changes
        if (this._debugPrevTiScreenX === undefined) {
          this._debugPrevTiScreenX = tiScreenX;
          this._debugPrevTiScreenY = tiScreenY;
        }
        const tiDx = tiScreenX - this._debugPrevTiScreenX;
        const tiDy = tiScreenY - this._debugPrevTiScreenY;
        this._debugPrevTiScreenX = tiScreenX;
        this._debugPrevTiScreenY = tiScreenY;

        // Detect terrain-specific shake (screen pos should be constant if camera tracks properly)
        const tiMoving = Math.abs(tiDx) > 0.001 || Math.abs(tiDy) > 0.001;
        if (tiMoving && (body.velocity.x !== 0 || body.velocity.y !== 0)) {
          if (!this._debugTerrainShakeLog) this._debugTerrainShakeLog = [];
          this._debugTerrainShakeLog.push(`Δscr(${tiDx.toFixed(4)},${tiDy.toFixed(4)})`);
          if (this._debugTerrainShakeLog.length > 6) this._debugTerrainShakeLog.shift();
        }

        const texSrc = ti.texture.source[0];
        const glTex = texSrc.glTexture;
        const filterName = glTex
          ? (texSrc.scaleMode === 0 ? 'LINEAR' : 'NEAREST')
          : 'Canvas2D';

        terrainHtml = `
          World: ${ti.x.toFixed(2)}, ${ti.y.toFixed(2)}<br>
          Screen: ${tiScreenX.toFixed(4)}, ${tiScreenY.toFixed(4)}<br>
          Δ screen/f: ${tiDx.toFixed(4)}, ${tiDy.toFixed(4)}<br>
          Scale: ${ti.scaleX}x${ti.scaleY}<br>
          Origin: ${ti.originX}, ${ti.originY}<br>
          Depth: ${ti.depth}<br>
          ScrollFactor: ${ti.scrollFactorX}, ${ti.scrollFactorY}<br>
          Filter: ${filterName}<br>
          TexSize: ${texSrc.width}x${texSrc.height}<br>
          Visible: ${ti.visible} Alpha: ${ti.alpha}`;

        terrainShake = (this._debugTerrainShakeLog && this._debugTerrainShakeLog.length > 0)
          ? this._debugTerrainShakeLog.map(s => `<span class="warn">${s}</span>`).join('<br>')
          : '<span style="color:#00ff88">Stable</span>';
      }

      const jitterHtml = this._debugJitterLog.length > 0
        ? this._debugJitterLog.map(j =>
          `<span class="warn">t=${j.t} Δ(${j.dx},${j.dy}) prev(${j.pdx},${j.pdy})</span>`
        ).join('<br>')
        : '<span style="color:#00ff88">None detected</span>';

      this._debugEl.innerHTML = `
        <div class="section">PERFORMANCE</div>
        FPS: ${fps} (min:${minFps} max:${maxFps})<br>
        Delta: ${delta.toFixed(2)}ms<br>
        <div class="section">CAMERA</div>
        Scroll: ${cam.scrollX.toFixed(3)}, ${cam.scrollY.toFixed(3)}<br>
        Frac: ${(cam.scrollX % 1).toFixed(4)}, ${(cam.scrollY % 1).toFixed(4)}<br>
        Δ/frame: ${camDx.toFixed(4)}, ${camDy.toFixed(4)}<br>
        roundPixels: ${cam.roundPixels}<br>
        zoom: ${cam.zoom}<br>
        <div class="section">PLAYER</div>
        Pos: ${pc.x.toFixed(3)}, ${pc.y.toFixed(3)}<br>
        Frac: ${(pc.x % 1).toFixed(4)}, ${(pc.y % 1).toFixed(4)}<br>
        Δ/frame: ${pDx.toFixed(4)}, ${pDy.toFixed(4)}<br>
        Vel: ${body.velocity.x.toFixed(1)}, ${body.velocity.y.toFixed(1)}<br>
        Moving: ${moveState.moving} Sprint: ${moveState.sprinting}<br>
        Facing: ${moveState.facing}<br>
        <div class="section">TERRAIN IMAGE</div>
        ${terrainHtml}<br>
        <div class="section">TERRAIN SHAKE</div>
        ${terrainShake}<br>
        <div class="section">RENDER</div>
        Renderer: ${this.sys.game.renderer.type === 2 ? 'WebGL' : 'Canvas'}<br>
        pixelArt: ${this.sys.game.config.pixelArt}<br>
        roundPx(cfg): ${this.sys.game.config.roundPixels}<br>
        Veg chunks: ${this.vegetation.activeTreeChunks.size}<br>
        Trail marks: ${this.playerController.trailMarks.length}<br>
        <div class="section">JITTER LOG</div>
        ${jitterHtml}
      `;
    }

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
