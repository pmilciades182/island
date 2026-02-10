import { WorldConfig } from '../world/WorldConfig.js';
import * as Objects from '../objects/index.js';
import { createRNG } from '../util/rng.js';

export class PlayerController {
  constructor(scene, generator, soundManager = null, seed = 0) {
    this.scene = scene;
    this.generator = generator;
    this.soundManager = soundManager;
    this.speed = 180;
    this.sprinting = false;
    this.rng = createRNG(seed + 1);

    // Create player container and sprites
    const p = scene.saveData.player;
    this.playerContainer = scene.add.container(p.x, p.y);
    scene.physics.world.enable(this.playerContainer);
    this.playerContainer.body.setSize(24, 24);
    this.playerContainer.body.setOffset(-12, -12);
    this.playerContainer.body.setCollideWorldBounds(true);

    // Character layers (render order: body, feet, legs, torso, head)
    this.bodySprite = scene.add.sprite(0, 0, 'body_walk', 0);
    this.feetSprite = scene.add.sprite(0, 0, 'feet_walk', 0);
    this.legsSprite = scene.add.sprite(0, 0, 'legs_walk', 0);
    this.torsoSprite = scene.add.sprite(0, 0, 'torso_walk', 0);
    this.headSprite = scene.add.sprite(0, 0, 'head_walk', 0);

    this.playerLayers = [this.bodySprite, this.feetSprite, this.legsSprite, this.torsoSprite, this.headSprite];
    this.playerLayers.forEach(s => this.playerContainer.add(s));

    // Input
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });
    this.shiftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);

    // Gamepad
    this.gamepad = null;
    this._padDeadzone = 0.2;

    this.facing = 'down';
    // Track last keydown timestamps to resolve conflicting opposite presses
    this._keyTimes = {};
    this.scene.input.keyboard.on('keydown', (ev) => {
      this._keyTimes[ev.keyCode] = Date.now();
    });

    // ── Foot particles ──
    const dustG = scene.add.graphics();
    dustG.fillStyle(0xffffff, 1);
    dustG.fillCircle(4, 4, 4);
    dustG.generateTexture('dust_particle', 8, 8);
    dustG.destroy();

    // Manual dust spawning — no emitter, for full control
    this.dustEmitter = null;
    this._currentDustTint = 0xc8b898;
    this._dustTimer = 0;
    this._dustInterval = 55; // ms between spawns

    // Terrain tint map for dust
    this._dustTints = {
      [WorldConfig.TERRAIN.SAND]: 0xd4be8c,
      [WorldConfig.TERRAIN.GRASS_LIGHT]: 0x7aa66e,
      [WorldConfig.TERRAIN.GRASS_DARK]: 0x4a7a42,
      [WorldConfig.TERRAIN.DIRT]: 0x8a6e50
    };

    // ── Footprint trail ──
    const fpG = scene.add.graphics();
    fpG.fillStyle(0x000000, 1);
    fpG.fillEllipse(4, 2, 5, 3);
    fpG.generateTexture('footprint', 8, 4);
    fpG.destroy();

    this.trailMarks = [];
    this.trailTimer = 0;
    this.trailInterval = 120; // ms between marks
    this.trailMaxAge = 3000;  // ms until fully faded
  }

  get x() { return this.playerContainer.x; }
  get y() { return this.playerContainer.y; }

  _getObjectInRadius(worldX, worldY, radius) {
    const ts = WorldConfig.TILE_SIZE;
    const gs = WorldConfig.GRID_SIZE;
    const veg = this.generator.vegetation;
    if (!veg) return 0;

    const cells = Math.ceil(radius / ts);
    const centerGx = Math.floor(worldX / ts);
    const centerGy = Math.floor(worldY / ts);

    let foundSolid = false;
    let foundSlow = false;

    for (let dy = -cells; dy <= cells; dy++) {
      for (let dx = -cells; dx <= cells; dx++) {
        const gx = centerGx + dx;
        const gy = centerGy + dy;
        if (gx < 0 || gx >= gs || gy < 0 || gy >= gs) continue;

        // Check actual world distance
        const cellCenterX = (gx + 0.5) * ts;
        const cellCenterY = (gy + 0.5) * ts;
        const dist = Math.abs(worldX - cellCenterX) + Math.abs(worldY - cellCenterY);
        if (dist > radius) continue;

        const obj = veg[gy * gs + gx];
        if (obj === Objects.IDS.TREE || obj === Objects.IDS.ROCK_LARGE) {
          foundSolid = true;
        } else if (
          obj === Objects.IDS.ROCK_SMALL ||
          obj === Objects.IDS.ROCK_MEDIUM ||
          obj === Objects.IDS.BUSH_SAND ||
          obj === Objects.IDS.BUSH_GRASS ||
          obj === Objects.IDS.BUSH_DIRT
        ) {
          foundSlow = true;
        }
      }
    }

    if (foundSolid) return 2; // block
    if (foundSlow) return 1;  // slow
    return 0;                  // clear
  }

  update(delta, stamina, maxStamina, staminaCooldown = false) {
    const body = this.playerContainer.body;
    body.setVelocity(0, 0);

    // Grab first connected gamepad
    if (!this.gamepad || !this.gamepad.connected) {
      this.gamepad = this.scene.input.gamepad?.pad1 || null;
    }

    // Gamepad sprint: left trigger (LT) or A button (index 0)
    const padSprint = this.gamepad
      ? (this.gamepad.buttons[6]?.value > 0.3 || this.gamepad.A)
      : false;

    const virtualSprint = window.virtualInput && window.virtualInput.buttonB;
    this.sprinting = (this.shiftKey.isDown || padSprint || virtualSprint) && stamina > 0 && !staminaCooldown;
    let currentSpeed = this.sprinting ? this.speed * 1.8 : this.speed;

    // Terrain speed modifier at current position
    if (this.generator) {
      const biome = this.generator.getBiomeAt(this.playerContainer.x, this.playerContainer.y);
      if (biome === WorldConfig.TERRAIN.SAND) {
        currentSpeed *= 0.6;
      } else if (biome === WorldConfig.TERRAIN.GRASS_DARK) {
        currentSpeed *= 0.9;
      }
    }

    let left = this.cursors.left.isDown || this.wasd.left.isDown;
    let right = this.cursors.right.isDown || this.wasd.right.isDown;
    let up = this.cursors.up.isDown || this.wasd.up.isDown;
    let down = this.cursors.down.isDown || this.wasd.down.isDown;

    // Resolve opposite presses by preferring the most-recent keydown
    const codeLeft = Phaser.Input.Keyboard.KeyCodes.LEFT;
    const codeRight = Phaser.Input.Keyboard.KeyCodes.RIGHT;
    const codeUp = Phaser.Input.Keyboard.KeyCodes.UP;
    const codeDown = Phaser.Input.Keyboard.KeyCodes.DOWN;

    if (left && right) {
      const tL = this._keyTimes[codeLeft] || 0;
      const tR = this._keyTimes[codeRight] || 0;
      if (tL >= tR) { right = false; } else { left = false; }
    }
    if (up && down) {
      const tU = this._keyTimes[codeUp] || 0;
      const tD = this._keyTimes[codeDown] || 0;
      if (tU >= tD) { down = false; } else { up = false; }
    }

    let vx = 0, vy = 0;
    if (left) vx = -currentSpeed;
    if (right) vx = currentSpeed;
    if (up) vy = -currentSpeed;
    if (down) vy = currentSpeed;

    // Gamepad left stick
    if (this.gamepad) {
      const lx = this.gamepad.leftStick.x;
      const ly = this.gamepad.leftStick.y;
      if (Math.abs(lx) > this._padDeadzone || Math.abs(ly) > this._padDeadzone) {
        vx = lx * currentSpeed;
        vy = ly * currentSpeed;
      }
    }

    // Virtual joystick (touch/mobile)
    const vi = window.virtualInput;
    if (vi && vi.joystickActive) {
      if (Math.abs(vi.joystickX) > 0.15 || Math.abs(vi.joystickY) > 0.15) {
        vx = vi.joystickX * currentSpeed;
        vy = vi.joystickY * currentSpeed;
      }
    }

    if (vx !== 0 && vy !== 0) {
      const mag = Math.sqrt(vx * vx + vy * vy);
      if (mag > currentSpeed) {
        vx = (vx / mag) * currentSpeed;
        vy = (vy / mag) * currentSpeed;
      }
    }

    body.setVelocity(vx, vy);

    // Collision checks at next position
    if (this.generator) {
      const nextX = this.playerContainer.x + body.velocity.x * (delta / 1000);
      const nextY = this.playerContainer.y + body.velocity.y * (delta / 1000);

      // Water block
      const biome = this.generator.getBiomeAt(nextX, nextY);
      if (biome <= 1) {
        body.setVelocity(0, 0);
      } else {
        // Object collision — scan 12px radius around next position
        const result = this._getObjectInRadius(nextX, nextY, 12);
        if (result === 2) {
          body.setVelocity(0, 0);
        } else if (result === 1) {
          body.setVelocity(body.velocity.x * 0.7, body.velocity.y * 0.7);
        }
      }
    }

    // Determine direction
    const moving = body.velocity.x !== 0 || body.velocity.y !== 0;

    if (moving) {
      if (Math.abs(body.velocity.y) >= Math.abs(body.velocity.x)) {
        this.facing = body.velocity.y < 0 ? 'up' : 'down';
      } else {
        this.facing = body.velocity.x < 0 ? 'left' : 'right';
      }
    }

    // Update depth for Y-sorting
    this.playerContainer.setDepth(this.playerContainer.y);

    // ── Foot dust & trail ──
    // Terrain tint
    const curBiome = this.generator
      ? this.generator.getBiomeAt(this.playerContainer.x, this.playerContainer.y)
      : -1;
    const tint = this._dustTints[curBiome] || 0xc8b898;
    this._currentDustTint = tint;

    // Footstep sounds
    if (moving && this.soundManager) {
      this.soundManager.playFootstep(curBiome, this.sprinting);
    }

    // Foot offset depends on facing direction
    const feetOffY = (this.facing === 'left' || this.facing === 'right') ? 23 : 12;

    if (moving) {
      // Dust particles — manual spawning for irregular placement
      this._dustTimer += delta;
      if (this._dustTimer >= this._dustInterval) {
        this._dustTimer = 0;
          const px = this.playerContainer.x + (this.rng.rand() - 0.5) * 14;
          const py = this.playerContainer.y + feetOffY + (this.rng.rand() - 0.5) * 6;
          const dust = this.scene.add.image(px, py, 'dust_particle');
          const size = 0.3 + this.rng.rand() * 0.5;
        dust.setScale(size);
          dust.setAlpha(0.5 + this.rng.rand() * 0.3);
        dust.setTint(tint);
        dust.setDepth(this.playerContainer.y + 1);
        dust.bornAt = this.scene.time.now;
          dust.maxLife = 200 + this.rng.rand() * 200; // 200-400ms
        this.trailMarks.push(dust);
      }

      // Footprint trail
      this.trailTimer += delta;
      if (this.trailTimer >= this.trailInterval) {
        this.trailTimer = 0;
        const px = this.playerContainer.x + (this.rng.rand() - 0.5) * 4;
        const py = this.playerContainer.y + feetOffY;
        const mark = this.scene.add.image(px, py, 'footprint');
        mark.setAlpha(0.25);
        mark.setDepth(1);
        mark.setTint(tint);
        mark.bornAt = this.scene.time.now;
        mark.maxLife = this.trailMaxAge;
        this.trailMarks.push(mark);
      }
    } else {
      this._dustTimer = 0;
      this.trailTimer = 0;
    }

    // Fade & cleanup all marks (dust + footprints)
    const now = this.scene.time.now;
    for (let i = this.trailMarks.length - 1; i >= 0; i--) {
      const m = this.trailMarks[i];
      const age = now - m.bornAt;
      const life = m.maxLife || this.trailMaxAge;
      if (age >= life) {
        m.destroy();
        this.trailMarks.splice(i, 1);
      } else {
        const startAlpha = m.texture.key === 'dust_particle' ? 0.5 : 0.2;
        m.setAlpha(startAlpha * (1 - age / life));
      }
    }

    return { moving, facing: this.facing, sprinting: this.sprinting };
  }
}
