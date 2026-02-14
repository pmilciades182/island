import { AnimationManager } from '../player/AnimationManager.js';
import { PlayerController } from '../player/PlayerController.js';
import { HUD } from '../ui/HUD.js';
import { DayNightCycle } from '../world/DayNightCycle.js';
import { SoundManager } from '../audio/SoundManager.js';

class RiverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'RiverScene' });
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
    const WORLD_W = 5000;
    const WORLD_H = 5000;
    this.WORLD_W = WORLD_W;
    this.WORLD_H = WORLD_H;

    const worldSeed = 0.42;

    // World bounds
    this.physics.world.setBounds(0, 0, WORLD_W, WORLD_H);

    // Ground texture with rivers and peace zone
    this._createRiverTexture(WORLD_W, WORLD_H);
    this.add.image(WORLD_W / 2, WORLD_H / 2, 'river_ground');

    // Build water collision bodies
    this._buildWaterColliders();

    // Find dry spawn point (between rivers, away from center pool)
    const spawnPos = this._findDrySpawn(WORLD_W, WORLD_H);

    // Fake save data (no persistence)
    this.saveData = {
      player: {
        x: spawnPos.x,
        y: spawnPos.y,
        health: 100,
        maxHealth: 100,
        stamina: 100,
        maxStamina: 100,
        attributes: { strength: 5, agility: 5, intelligence: 5, endurance: 5 },
        inventory: []
      }
    };

    const p = this.saveData.player;

    this.generator = null;

    // Managers
    this.soundManager = new SoundManager();
    this.soundManager.init();

    this.animManager = new AnimationManager(this);
    this.playerController = new PlayerController(this, null, this.soundManager, worldSeed);

    // Collide player with water
    this.physics.add.collider(this.playerController.playerContainer, this.waterGroup);

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
  //  RIVER TEXTURE GENERATION
  // ══════════════════════════════════════

  _createRiverTexture(w, h) {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');

    const cx = w / 2;
    const cy = h / 2;
    const peaceRadius = 500;
    const riverWidth = 384;
    const poolRadius = 600;
    const grassBand = riverWidth * 2; // green zone each side of river
    const grassTotalW = riverWidth + grassBand * 2; // total grass strip width
    const poolGrassRadius = poolRadius + grassBand; // grass around pool

    // Store geometry for collision building
    this._riverData = {
      cx, cy, riverWidth, poolRadius,
      curves: []
    };

    // ── 1) Sand base (arid terrain everywhere) ──
    ctx.fillStyle = '#c4a862';
    ctx.fillRect(0, 0, w, h);

    // Sand texture variation
    for (let i = 0; i < 20000; i++) {
      const gx = Math.random() * w;
      const gy = Math.random() * h;
      const shade = Math.random() * 25 - 12;
      ctx.fillStyle = `rgba(${196 + shade}, ${168 + shade}, ${98 + shade * 0.5}, 0.35)`;
      ctx.fillRect(gx, gy, 3 + Math.random() * 5, 3 + Math.random() * 5);
    }

    // Darker sand patches
    for (let i = 0; i < 3000; i++) {
      const gx = Math.random() * w;
      const gy = Math.random() * h;
      ctx.fillStyle = `rgba(160, 130, 70, ${0.05 + Math.random() * 0.08})`;
      ctx.fillRect(gx, gy, 8 + Math.random() * 15, 8 + Math.random() * 15);
    }

    // ── 2) Compute river curves first (needed for grass strips) ──
    const riverAngles = [270, 30, 150];
    const curveDataList = riverAngles.map(angleDeg =>
      this._computeRiverCurve(cx, cy, angleDeg, w, h)
    );

    // ── 3) Draw grass strips along rivers ──
    // Grass with soft edge transition along each river path
    curveDataList.forEach(c => {
      // Outer grass fade (sand→grass transition)
      ctx.save();
      ctx.strokeStyle = 'rgba(72, 140, 76, 0.25)';
      ctx.lineWidth = grassTotalW + 80;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(c.sx, c.sy);
      ctx.bezierCurveTo(c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.ex, c.ey);
      ctx.stroke();
      ctx.restore();

      // Main grass strip
      ctx.save();
      ctx.strokeStyle = '#5aa460';
      ctx.lineWidth = grassTotalW;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(c.sx, c.sy);
      ctx.bezierCurveTo(c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.ex, c.ey);
      ctx.stroke();
      ctx.restore();
    });

    // Grass circle around pool
    const poolGrassGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, poolGrassRadius + 80);
    poolGrassGrad.addColorStop(0, 'rgba(90, 164, 96, 1)');
    poolGrassGrad.addColorStop(0.75, 'rgba(90, 164, 96, 1)');
    poolGrassGrad.addColorStop(0.9, 'rgba(90, 164, 96, 0.5)');
    poolGrassGrad.addColorStop(1, 'rgba(90, 164, 96, 0)');
    ctx.fillStyle = poolGrassGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, poolGrassRadius + 80, 0, Math.PI * 2);
    ctx.fill();

    // ── 4) Grass texture variation (only in green areas) ──
    // We clip to the grass paths to add detail only there
    ctx.save();
    ctx.beginPath();
    // Pool grass area
    ctx.arc(cx, cy, poolGrassRadius, 0, Math.PI * 2);
    // River grass strips
    curveDataList.forEach(c => {
      // Trace both sides of the grass strip by offsetting the curve
      // Approximation: use thick stroke region
      // Instead, just draw particles broadly and they'll blend fine
    });
    ctx.closePath();

    for (let i = 0; i < 12000; i++) {
      const gx = Math.random() * w;
      const gy = Math.random() * h;
      // Only draw grass detail if this point is in a grass zone
      if (this._isNearRiverGrass(gx, gy, curveDataList, cx, cy, grassTotalW / 2 + 40, poolGrassRadius)) {
        const shade = Math.random() * 30 - 15;
        const g = 164 + shade;
        ctx.fillStyle = `rgba(${80 + shade}, ${g}, ${86 + shade}, 0.3)`;
        ctx.fillRect(gx, gy, 3 + Math.random() * 5, 3 + Math.random() * 5);
      }
    }
    ctx.restore();

    // ── 5) Draw rivers (water) on top ──
    curveDataList.forEach(c => {
      this._drawRiverWater(ctx, c, cx, cy, riverWidth);
    });

    // Store curves for collision
    curveDataList.forEach(c => {
      this._riverData.curves.push(c);
    });

    // ── 6) Central water pool ──
    const poolGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, poolRadius);
    poolGrad.addColorStop(0, 'rgba(25, 85, 165, 0.95)');
    poolGrad.addColorStop(0.5, 'rgba(35, 110, 190, 0.9)');
    poolGrad.addColorStop(0.8, 'rgba(45, 130, 205, 0.8)');
    poolGrad.addColorStop(1, 'rgba(55, 145, 210, 0.0)');
    ctx.fillStyle = poolGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, poolRadius, 0, Math.PI * 2);
    ctx.fill();

    // ── 7) Peace zone circle ──
    const peaceGrad = ctx.createRadialGradient(cx, cy, peaceRadius * 0.3, cx, cy, peaceRadius);
    peaceGrad.addColorStop(0, 'rgba(218, 185, 120, 0.35)');
    peaceGrad.addColorStop(0.7, 'rgba(218, 185, 120, 0.2)');
    peaceGrad.addColorStop(1, 'rgba(218, 185, 120, 0.0)');
    ctx.fillStyle = peaceGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, peaceRadius, 0, Math.PI * 2);
    ctx.fill();

    // Peace zone border ring
    ctx.strokeStyle = 'rgba(218, 185, 120, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.arc(cx, cy, peaceRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (this.textures.exists('river_ground')) {
      this.textures.remove('river_ground');
    }
    this.textures.addCanvas('river_ground', canvas);
  }

  _isNearRiverGrass(px, py, curveDataList, cx, cy, grassHalfW, poolGrassR) {
    // Near pool grass?
    const pdx = px - cx;
    const pdy = py - cy;
    if (pdx * pdx + pdy * pdy < poolGrassR * poolGrassR) return true;

    // Near any river grass strip?
    for (const c of curveDataList) {
      for (let i = 0; i <= 40; i++) {
        const t = i / 40;
        const pt = this._bezierPoint(t, c.sx, c.sy, c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.ex, c.ey);
        const dx = px - pt.x;
        const dy = py - pt.y;
        if (dx * dx + dy * dy < grassHalfW * grassHalfW) return true;
      }
    }
    return false;
  }

  // ══════════════════════════════════════
  //  WATER COLLISION
  // ══════════════════════════════════════

  _buildWaterColliders() {
    const { cx, cy, riverWidth, poolRadius, curves } = this._riverData;
    this.waterGroup = this.physics.add.staticGroup();

    // Invisible square texture for colliders
    const gfx = this.add.graphics();
    gfx.fillStyle(0x0000ff, 0); // invisible
    gfx.fillRect(0, 0, 1, 1);
    gfx.generateTexture('water_col', 1, 1);
    gfx.destroy();

    const halfW = riverWidth / 2;
    const step = 40; // place a collider box every 40px along curve

    // Colliders along each river bezier curve
    curves.forEach(c => {
      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const pt = this._bezierPoint(t, c.sx, c.sy, c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.ex, c.ey);

        // Skip points inside the pool (pool collider covers that)
        const dx = pt.x - cx;
        const dy = pt.y - cy;
        if (dx * dx + dy * dy < poolRadius * poolRadius * 0.7) continue;

        const box = this.waterGroup.create(pt.x, pt.y, 'water_col');
        box.setDisplaySize(step, riverWidth).refreshBody();
        box.setVisible(false);

        // Rotate collider body to be perpendicular to curve tangent
        const tNext = Math.min(1, t + 0.01);
        const ptNext = this._bezierPoint(tNext, c.sx, c.sy, c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.ex, c.ey);
        const angle = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x);

        // Arcade physics doesn't rotate, so use an axis-aligned box
        // sized to cover the river width perpendicular to the flow
        const absC = Math.abs(Math.cos(angle));
        const absS = Math.abs(Math.sin(angle));
        const bw = step * absC + riverWidth * absS;
        const bh = step * absS + riverWidth * absC;
        box.setDisplaySize(bw, bh).refreshBody();
      }
    });

    // Central pool collider (circle approximated with boxes)
    const poolCollRadius = poolRadius * 0.75;
    const ringStep = 60;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.15) {
      for (let r = 0; r < poolCollRadius; r += ringStep) {
        const bx = cx + Math.cos(angle) * r;
        const by = cy + Math.sin(angle) * r;
        const box = this.waterGroup.create(bx, by, 'water_col');
        box.setDisplaySize(ringStep, ringStep).refreshBody();
        box.setVisible(false);
      }
    }
  }

  _bezierPoint(t, sx, sy, cp1x, cp1y, cp2x, cp2y, ex, ey) {
    const u = 1 - t;
    const tt = t * t;
    const uu = u * u;
    const uuu = uu * u;
    const ttt = tt * t;
    return {
      x: uuu * sx + 3 * uu * t * cp1x + 3 * u * tt * cp2x + ttt * ex,
      y: uuu * sy + 3 * uu * t * cp1y + 3 * u * tt * cp2y + ttt * ey
    };
  }

  _isInWater(px, py) {
    const { cx, cy, riverWidth, poolRadius, curves } = this._riverData;

    // Check central pool
    const dx = px - cx;
    const dy = py - cy;
    if (dx * dx + dy * dy < poolRadius * poolRadius * 0.75) return true;

    // Check each river curve
    const halfW = riverWidth / 2 + 10;
    for (const c of curves) {
      for (let i = 0; i <= 60; i++) {
        const t = i / 60;
        const pt = this._bezierPoint(t, c.sx, c.sy, c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.ex, c.ey);
        const rdx = px - pt.x;
        const rdy = py - pt.y;
        if (rdx * rdx + rdy * rdy < halfW * halfW) return true;
      }
    }
    return false;
  }

  _findDrySpawn(w, h) {
    // Try spawning at angle 90° (east from center), far enough from pool
    // This puts the player between the north river (270°) and SE river (30°)
    const cx = w / 2;
    const cy = h / 2;

    // Try several candidate positions at different distances and angles
    // Angles between rivers: 330° (between 270° and 30°), 90° (between 30° and 150°), 210° (between 150° and 270°)
    const candidateAngles = [90, 330, 210];

    for (const angleDeg of candidateAngles) {
      const angleRad = (angleDeg * Math.PI) / 180;
      for (let dist = 800; dist < w * 0.4; dist += 100) {
        const px = cx + Math.cos(angleRad) * dist;
        const py = cy + Math.sin(angleRad) * dist;
        if (px > 50 && px < w - 50 && py > 50 && py < h - 50) {
          if (!this._isInWater(px, py)) {
            return { x: px, y: py };
          }
        }
      }
    }

    // Fallback: top-left corner
    return { x: 200, y: 200 };
  }

  _computeRiverCurve(cx, cy, angleDeg, w, h) {
    const angleRad = (angleDeg * Math.PI) / 180;

    // Edge intersection
    const dist = Math.max(w, h);
    const edgeX = cx + Math.cos(angleRad) * dist;
    const edgeY = cy + Math.sin(angleRad) * dist;

    const dx = edgeX - cx;
    const dy = edgeY - cy;
    let t = 1;

    if (dx !== 0) {
      const tLeft = -cx / dx;
      const tRight = (w - cx) / dx;
      if (tLeft > 0) t = Math.min(t, tLeft);
      if (tRight > 0) t = Math.min(t, tRight);
    }
    if (dy !== 0) {
      const tTop = -cy / dy;
      const tBottom = (h - cy) / dy;
      if (tTop > 0) t = Math.min(t, tTop);
      if (tBottom > 0) t = Math.min(t, tBottom);
    }

    const startX = cx + dx * t;
    const startY = cy + dy * t;

    // Much more pronounced S-curves
    const perpX = -Math.sin(angleRad);
    const perpY = Math.cos(angleRad);
    const riverLen = Math.sqrt((startX - cx) ** 2 + (startY - cy) ** 2);
    const curveOffset = riverLen * 0.35;

    // Two control points at 1/3 and 2/3 of the path, displaced in opposite directions
    const t1 = 0.33;
    const t2 = 0.66;
    const p1x = startX + (cx - startX) * t1;
    const p1y = startY + (cy - startY) * t1;
    const p2x = startX + (cx - startX) * t2;
    const p2y = startY + (cy - startY) * t2;

    const cp1x = p1x + perpX * curveOffset;
    const cp1y = p1y + perpY * curveOffset;
    const cp2x = p2x - perpX * curveOffset * 0.7;
    const cp2y = p2y - perpY * curveOffset * 0.7;

    return { sx: startX, sy: startY, cp1x, cp1y, cp2x, cp2y, ex: cx, ey: cy };
  }

  _drawRiverWater(ctx, c, cx, cy, riverWidth) {
    ctx.save();

    // River bank edge (dark green border between grass and water)
    ctx.strokeStyle = 'rgba(35, 75, 45, 0.5)';
    ctx.lineWidth = riverWidth + 16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.sx, c.sy);
    ctx.bezierCurveTo(c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.ex, c.ey);
    ctx.stroke();

    // Main water body
    const riverGrad = ctx.createLinearGradient(c.sx, c.sy, cx, cy);
    riverGrad.addColorStop(0, 'rgba(35, 110, 190, 0.85)');
    riverGrad.addColorStop(0.5, 'rgba(45, 130, 210, 0.9)');
    riverGrad.addColorStop(1, 'rgba(30, 95, 175, 0.95)');

    ctx.strokeStyle = riverGrad;
    ctx.lineWidth = riverWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.sx, c.sy);
    ctx.bezierCurveTo(c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.ex, c.ey);
    ctx.stroke();

    // Center highlight
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.25)';
    ctx.lineWidth = riverWidth * 0.35;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.sx, c.sy);
    ctx.bezierCurveTo(c.cp1x, c.cp1y, c.cp2x, c.cp2y, c.ex, c.ey);
    ctx.stroke();

    ctx.restore();
  }

  // ══════════════════════════════════════
  //  TOP BAR
  // ══════════════════════════════════════

  _createTopBar() {
    const pad = 8;
    const topBar = this.add.graphics().setScrollFactor(0).setDepth(100000);
    topBar.fillStyle(0x000000, 0.5);
    topBar.fillRect(0, 0, this.cameras.main.width, 28);

    this.add.text(pad, 6, 'RIVER PROTOTYPE', {
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
      console.log('[RiverScene] Feedback:', this.feedbackNotes.trim());
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

window.RiverScene = RiverScene;
