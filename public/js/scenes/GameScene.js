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

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }
  // ... (init and preload methods remain the same)
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

    // ... (loading UI setup remains the same)
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

    // ... (data loading and world generation remain the same)
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
    const biome = this.generator.getBiomeAt(p.x, p.y);
    if (biome <= 1) { p.x = WORLD_W / 2; p.y = WORLD_H / 2; }
    if (p.x < 0 || p.x > WORLD_W || p.y < 0 || p.y > WORLD_H) { p.x = WORLD_W / 2; p.y = WORLD_H / 2; }


    // ── Managers ──
    this.vegetation = new VegetationManager(this, this.generator.vegetation);
    this.animManager = new AnimationManager(this);
    this.playerController = new PlayerController(this, this.generator);
    this.taskDistributor = new TaskDistributor(this);
    this.proximityManager = new ProximityManager(this, this.playerController.playerContainer, this.vegetation, this.generator, this.taskDistributor, { radius: 128 });

    // ... (camera, day/night, player stats setup remain the same)
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.playerController.playerContainer, false, 0.15, 0.15);
    this.cameras.main.fadeIn(500, 0, 0, 0);
    this.dayNight = new DayNightCycle(this);
    this.health = p.health;
    this.maxHealth = p.maxHealth;
    this.stamina = p.stamina;
    this.maxStamina = p.maxStamina;
    this.attributes = { ...p.attributes };
    this.inventory = [...p.inventory];
    this.player = this.playerController.playerContainer;
    this.animManager.setIdle('down', this.playerController.playerLayers);

    // ... (HUD and keyboard shortcuts remain the same)
    this.hud = new HUD(this, this.saveData, {
      onExit: () => this.exitToMenu(),
      onToggleCycle: () => this.dayNight.togglePause()
    });
    this.input.keyboard.on('keydown-ESC', () => this.exitToMenu());
    this.input.keyboard.on('keydown-M', () => this.hud.toggle());
    this.input.keyboard.on('keydown-P', () => this.dayNight.togglePause());
    this.input.keyboard.on('keydown', (event) => {
      if (event.key === '+' || event.key === '=') this.dayNight.advance(5000);
      else if (event.key === '-' || event.key === '_') this.dayNight.advance(-5000);
    });

    // Interaction Indicator
    this.interactIndicator = this.add.container(0, 0).setDepth(400000).setVisible(false);
    const indBg = this.add.graphics();
    indBg.fillStyle(0x0a0a0a, 0.8);
    indBg.fillCircle(0, 0, 16);
    indBg.lineStyle(1, 0xeeeeee, 0.9);
    indBg.strokeCircle(0, 0, 16);
    const indText = this.add.text(0, 0, 'E', {
      fontFamily: '"Rubik", sans-serif', fontSize: '16px', color: '#ffffff', fontStyle: '600'
    }).setOrigin(0.5);
    this.interactIndicator.add([indBg, indText]);


    // ... (auto-save timer remains the same)
    this.saveTimer = this.time.addEvent({
      delay: 5000, callback: () => this.autoSave(), loop: true
    });

    // ── Debug Panel (DOM) ──
    this._debugPrevCamX = 0;
    this._debugPrevCamY = 0;
    this._debugPrevPlayerX = 0;
    this._debugPrevPlayerY = 0;
    this._debugFrameTimes = [];
    this._debugLogsEl = document.getElementById('debug-logs');
    this._debugSearchEl = document.getElementById('debug-search');
    this._debugContentEls = new Map();

    const logSections = [
      'PERFORMANCE', 'CAMERA', 'PLAYER', 'GPU INFO', 'RENDER', 'PROXIMITY'
    ];

    if (this._debugLogsEl) {
      this._debugLogsEl.innerHTML = '';
      logSections.forEach(title => {
        const details = document.createElement('details');
        const summary = document.createElement('summary');
        summary.textContent = title;
        const contentDiv = document.createElement('div');
        contentDiv.className = 'log-content';
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'log-actions';
        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(contentDiv.textContent);
          copyBtn.textContent = 'Copied!';
          setTimeout(() => copyBtn.textContent = 'Copy', 1000);
        };
        actionsDiv.appendChild(copyBtn);
        details.appendChild(summary);
        details.appendChild(contentDiv);
        details.appendChild(actionsDiv);
        this._debugLogsEl.appendChild(details);
        this._debugContentEls.set(title, contentDiv);
      });
    }

    if (this._debugSearchEl) {
      this._debugSearchEl.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        this._debugLogsEl.querySelectorAll('details').forEach(log => {
          const summaryText = log.querySelector('summary').textContent.toLowerCase();
          const contentText = log.querySelector('.log-content').textContent.toLowerCase();
          log.style.display = (summaryText.includes(searchTerm) || contentText.includes(searchTerm)) ? '' : 'none';
        });
      });
    }

    try {
      const gl = this.sys.game.renderer.gl;
      if (gl) {
        const maxTex = gl.getParameter(gl.MAX_TEXTURE_SIZE);
        const debugExt = gl.getExtension('WEBGL_debug_renderer_info');
        const gpuVendor = debugExt ? gl.getParameter(debugExt.UNMASKED_VENDOR_WEBGL) : 'N/A';
        const gpuRenderer = debugExt ? gl.getParameter(debugExt.UNMASKED_RENDERER_WEBGL) : 'N/A';
        this._debugGpuInfo = `GPU: ${gpuRenderer}\nVendor: ${gpuVendor}\nMaxTexSize: ${maxTex}`;
      } else {
        this._debugGpuInfo = 'Canvas2D (no GL)';
      }
    } catch (e) {
      this._debugGpuInfo = `Error: ${e.message}`;
    }

    this.ready = true;
  }

  update(time, delta) {
    if (!this.ready) return;

    this.proximityManager.update();
    const moveState = this.playerController.update(delta, this.stamina, this.maxStamina);
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

    if (closestInteractable) {
      this.interactIndicator.setVisible(true);
      this.interactIndicator.setPosition(closestInteractable.x, closestInteractable.y - 48);
    } else {
      this.interactIndicator.setVisible(false);
    }
    
    this.updateDebugPanel(time, delta, moveState, lastPayload, closestInteractable, closestDistSq);

    if (moveState.sprinting) {
      this.stamina = Math.max(0, this.stamina - 20 * (delta / 1000));
    } else {
      this.stamina = Math.min(this.maxStamina, this.stamina + 10 * (delta / 1000));
    }
    if (moveState.moving) {
      const rate = moveState.sprinting ? 16 : 10;
      this.playerController.playerLayers.forEach(s => {
        if (s.anims.currentAnim) s.anims.currentAnim.frameRate = rate;
      });
      this.animManager.playWalk(moveState.facing, this.playerController.playerLayers);
    } else {
      this.animManager.setIdle(moveState.facing, this.playerController.playerLayers);
    }
    this.hud.update({
      health: this.health,
      maxHealth: this.maxHealth,
      stamina: this.stamina,
      maxStamina: this.maxStamina,
      attributes: this.attributes,
      inventory: this.inventory
    });
    this.vegetation.update(this.playerController.x, this.playerController.y);
    const { timeStr } = this.dayNight.update(delta);
    this.hud.setTimeText(timeStr);
  }

  updateDebugPanel(time, delta, moveState, lastPayload, closest, minDistanceSq) {
    if (!this._debugContentEls.size) return;

    this._debugFrameTimes.push(delta);
    if (this._debugFrameTimes.length > 60) this._debugFrameTimes.shift();
    const avgDelta = this._debugFrameTimes.reduce((a, b) => a + b, 0) / this._debugFrameTimes.length;
    const fps = Math.round(1000 / avgDelta);
    this._debugContentEls.get('PERFORMANCE').textContent = `FPS: ${fps} | Delta: ${delta.toFixed(2)}ms`;

    const cam = this.cameras.main;
    this._debugContentEls.get('CAMERA').textContent = `Scroll: ${cam.scrollX.toFixed(2)}, ${cam.scrollY.toFixed(2)}`;
    
    const pc = this.playerController.playerContainer;
    this._debugContentEls.get('PLAYER').textContent = `Pos: ${pc.x.toFixed(2)}, ${pc.y.toFixed(2)}`;

    this._debugContentEls.get('GPU INFO').textContent = this._debugGpuInfo;
    this._debugContentEls.get('RENDER').textContent = `Renderer: ${this.sys.game.renderer.type === 2 ? 'WebGL' : 'Canvas'}`;

    if (lastPayload) {
      const nearbyVeg = lastPayload.vegetation || [];
      const nearbyTerrain = lastPayload.terrain || [];
      
      const vegCounts = {};
      nearbyVeg.forEach(v => { vegCounts[v.type] = (vegCounts[v.type] || 0) + 1; });
      
      let mostAbundant = { type: 'N/A', count: 0 };
      if (Object.keys(vegCounts).length > 0) {
        for (const type in vegCounts) {
          if (vegCounts[type] > mostAbundant.count) mostAbundant = { type, count: vegCounts[type] };
        }
      }
      
      const vegNames = Object.fromEntries(Object.entries(WorldConfig.OBJECTS).map(([k, v]) => [v, k]));
      const terrainNames = Object.fromEntries(Object.entries(WorldConfig.TERRAIN).map(([k, v]) => [v, k]));
      
      const closestName = closest ? (vegNames[closest.type] || terrainNames[closest.type] || 'Unknown') : 'None';
      
      let proximityText = `Radius: ${this.proximityManager.radius}\n`;
      proximityText += `Nearby Veg: ${nearbyVeg.length}\n`;
      proximityText += `Nearby Terrain: ${nearbyTerrain.length}\n\n`;
      proximityText += `Closest: ${closestName} (${Math.sqrt(minDistanceSq).toFixed(1)}px)\n\n`;
      proximityText += `Most Abundant: ${vegNames[mostAbundant.type] || 'N/A'} (${mostAbundant.count}x)\n`;

      this._debugContentEls.get('PROXIMITY').textContent = proximityText;
    }
  }
  // ... (autoSave and exitToMenu methods remain the same)
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
