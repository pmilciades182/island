export class DayNightCycle {
  constructor(scene) {
    this.scene = scene;
    const WORLD_W = scene.WORLD_W;
    const WORLD_H = scene.WORLD_H;

    // Day/Night Overlay disabled for testing
    this.overlay = null;
    // this.overlay = scene.add.graphics();
    // this.overlay.fillStyle(0x000022, 1);
    // this.overlay.fillRect(-100, -100, scene.cameras.main.width + 200, scene.cameras.main.height + 200);
    // this.overlay.setDepth(9999);
    // this.overlay.setAlpha(0);
    // this.overlay.setScrollFactor(0);

    // Cloud Shadows — max cloud size ~640 world units (10 trees)
    // At scale 1, 1 texture pixel = 1 world unit, so max radius = 320px
    const cloudTexSize = 2048;
    const cloudG = scene.add.graphics();
    cloudG.fillStyle(0xFFFFFF, 1);
    for (let i = 0; i < 30; i++) {
      const cx = Math.random() * cloudTexSize;
      const cy = Math.random() * cloudTexSize;
      // Each cloud blob: 3-5 overlapping circles
      const baseR = 80 + Math.random() * 240; // 80-320px radius
      const blobs = 3 + Math.floor(Math.random() * 3);
      for (let j = 0; j < blobs; j++) {
        const ox = (Math.random() - 0.5) * baseR * 0.8;
        const oy = (Math.random() - 0.5) * baseR * 0.6;
        const r = baseR * (0.5 + Math.random() * 0.5);
        cloudG.fillCircle(cx + ox, cy + oy, r);
      }
    }
    cloudG.generateTexture('clouds', cloudTexSize, cloudTexSize);
    cloudG.destroy();

    // Cloud layer disabled for testing
    this.cloudLayer = null;
    // this.cloudLayer = scene.add.tileSprite(0, 0, WORLD_W, WORLD_H, 'clouds');
    // this.cloudLayer.setOrigin(0, 0);
    // this.cloudLayer.setAlpha(0.03);
    // this.cloudLayer.setBlendMode(Phaser.BlendModes.NORMAL);
    // this.cloudLayer.setDepth(1);
    // this.cloudLayer.setScale(1);

    // State
    this.dayTime = 0;
    this.dayDuration = 120000; // 2 minutes full cycle
    this.cyclePaused = false;
  }

  togglePause() {
    this.cyclePaused = !this.cyclePaused;
    return this.cyclePaused;
  }

  advance(ms) {
    this.dayTime = (this.dayTime + ms + this.dayDuration) % this.dayDuration;
  }

  update(delta) {
    // Cloud movement
    if (this.cloudLayer) {
      this.cloudLayer.tilePositionX += 0.2;
      this.cloudLayer.tilePositionY += 0.1;
    }

    // Advance time
    if (!this.cyclePaused) {
      this.dayTime += delta;
      if (this.dayTime >= this.dayDuration) {
        this.dayTime = 0;
      }
    }

    // Cycle: 0=Noon, 0.5=Midnight
    const progress = this.dayTime / this.dayDuration;
    const angle = progress * Math.PI * 2;
    const darkness = (1 - Math.cos(angle)) / 2;

    if (this.overlay) this.overlay.setAlpha(darkness * 0.5);

    // Time string
    let hours = (progress * 24 + 12) % 24;
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    return { timeStr, darkness };
  }
}
