import { WorldConfig } from './WorldConfig.js';

export class VegetationManager {
  constructor(scene, vegetationData) {
    this.scene = scene;
    this.vegetationData = vegetationData;
    this.CHUNK_SIZE = 500;

    // Tree Management Group
    this.treesGroup = scene.add.group();
    this.activeTreeChunks = new Set();

    // Create procedural textures
    this._createTextures();

    // Atmospheric Particles
    this._createParticles();
    this.currentTerrainType = -1;
  }

  _createTextures() {
    const scene = this.scene;

    // Tree Texture (64x64)
    const treeG = scene.add.graphics();
    treeG.fillStyle(0x000000, 0.4);
    treeG.fillEllipse(32, 58, 24, 10);
    treeG.fillStyle(0x6B4E3C, 1);
    treeG.fillRect(26, 40, 12, 18);
    treeG.fillStyle(0x2D6238, 1);
    treeG.fillCircle(32, 32, 24);
    treeG.fillCircle(20, 40, 16);
    treeG.fillCircle(44, 40, 16);
    treeG.fillStyle(0x346640, 1);
    treeG.fillCircle(32, 28, 18);
    treeG.fillCircle(22, 36, 12);
    treeG.fillCircle(42, 36, 12);
    treeG.fillStyle(0x58A460, 1);
    treeG.fillCircle(32, 24, 10);
    treeG.generateTexture('tree', 64, 64);
    treeG.destroy();

    // Tree Dark Grass variant: yellowish/autumn foliage (64x64)
    const treeDG = scene.add.graphics();
    treeDG.fillStyle(0x000000, 0.4);
    treeDG.fillEllipse(32, 58, 24, 10);
    treeDG.fillStyle(0x6B4E3C, 1);
    treeDG.fillRect(26, 40, 12, 18);
    treeDG.fillStyle(0x7A8C32, 1);        // olive-yellow base
    treeDG.fillCircle(32, 32, 24);
    treeDG.fillCircle(20, 40, 16);
    treeDG.fillCircle(44, 40, 16);
    treeDG.fillStyle(0x9AA840, 1);        // yellow-green mid
    treeDG.fillCircle(32, 28, 18);
    treeDG.fillCircle(22, 36, 12);
    treeDG.fillCircle(42, 36, 12);
    treeDG.fillStyle(0xBBC24A, 1);        // bright yellow-green highlights
    treeDG.fillCircle(32, 24, 10);
    treeDG.generateTexture('tree_dark', 64, 64);
    treeDG.destroy();

    // Rock Small (16x16)
    const r1 = scene.add.graphics();
    r1.fillStyle(0x8A7A6B, 1);
    r1.fillCircle(8, 8, 6);
    r1.fillStyle(0x000000, 0.3);
    r1.fillEllipse(8, 14, 8, 4);
    r1.generateTexture('rock_small', 16, 16);
    r1.destroy();

    // Rock Medium (32x32)
    const r2 = scene.add.graphics();
    r2.fillStyle(0x8A7A6B, 1);
    r2.fillCircle(16, 16, 12);
    r2.fillStyle(0xA89B8E, 1);
    r2.fillCircle(12, 12, 8);
    r2.fillStyle(0x000000, 0.3);
    r2.fillEllipse(16, 28, 16, 6);
    r2.generateTexture('rock_medium', 32, 32);
    r2.destroy();

    // Rock Large (64x64)
    const r3 = scene.add.graphics();
    r3.fillStyle(0x6B5D54, 1);
    r3.fillCircle(32, 32, 24);
    r3.fillStyle(0x8A7A6B, 1);
    r3.fillCircle(24, 24, 16);
    r3.fillStyle(0x000000, 0.3);
    r3.fillEllipse(32, 56, 32, 10);
    r3.generateTexture('rock_large', 64, 64);
    r3.destroy();

    // Bush Sand: low, wide, dry scrub (32x24)
    WorldConfig.BUSH_COLORS.SAND.forEach((color, i) => {
      const b = scene.add.graphics();
      b.fillStyle(0x000000, 0.25);
      b.fillEllipse(16, 22, 28, 6);
      b.fillStyle(color, 1);
      b.fillEllipse(16, 14, 26, 14);
      b.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(15).color, 1);
      b.fillEllipse(12, 12, 12, 8);
      b.fillEllipse(22, 10, 10, 7);
      b.generateTexture(`bush_sand_${i}`, 32, 24);
      b.destroy();
    });

    // Bush Grass: round and leafy, taller (28x28)
    WorldConfig.BUSH_COLORS.GRASS.forEach((color, i) => {
      const b = scene.add.graphics();
      b.fillStyle(0x000000, 0.25);
      b.fillEllipse(14, 26, 22, 6);
      b.fillStyle(color, 1);
      b.fillCircle(14, 16, 12);
      b.fillCircle(8, 18, 8);
      b.fillCircle(20, 18, 8);
      b.fillStyle(Phaser.Display.Color.IntegerToColor(color).brighten(20).color, 1);
      b.fillCircle(14, 12, 7);
      b.fillCircle(10, 16, 5);
      b.generateTexture(`bush_grass_${i}`, 28, 28);
      b.destroy();
    });

    // Bush Dirt: gnarled woody shrub with twisted branches (32x28)
    WorldConfig.BUSH_COLORS.DIRT.forEach((color, i) => {
      const b = scene.add.graphics();
      const dark = Phaser.Display.Color.IntegerToColor(color).darken(25).color;
      const light = Phaser.Display.Color.IntegerToColor(color).brighten(18).color;
      // Shadow
      b.fillStyle(0x000000, 0.2);
      b.fillEllipse(16, 26, 26, 5);
      // Woody stems
      b.fillStyle(0x5C4033, 1);
      b.fillRect(14, 18, 3, 8);
      b.fillRect(9, 16, 2, 7);
      b.fillRect(20, 17, 2, 6);
      // Dense foliage clusters at different heights
      b.fillStyle(dark, 1);
      b.fillCircle(10, 13, 7);
      b.fillCircle(22, 14, 6);
      b.fillCircle(16, 10, 8);
      // Mid layer
      b.fillStyle(color, 1);
      b.fillCircle(12, 11, 6);
      b.fillCircle(20, 12, 5);
      b.fillCircle(16, 8, 6);
      // Highlights
      b.fillStyle(light, 1);
      b.fillCircle(14, 7, 3);
      b.fillCircle(10, 10, 2.5);
      b.fillCircle(20, 10, 2);
      b.generateTexture(`bush_dirt_${i}`, 32, 28);
      b.destroy();
    });

    // Flower Textures (16 colors)
    WorldConfig.FLOWER_COLORS.forEach((color, index) => {
      const f = scene.add.graphics();
      f.fillStyle(0x000000, 0.3);
      f.fillEllipse(8, 14, 6, 3);
      f.fillStyle(0x3D6142, 1);
      f.fillRect(7, 8, 2, 6);
      f.fillStyle(color, 1);
      f.fillCircle(8, 5, 2.5);
      f.fillCircle(8, 11, 2.5);
      f.fillCircle(5, 8, 2.5);
      f.fillCircle(11, 8, 2.5);
      f.fillStyle(0xffd700, 1);
      f.fillCircle(8, 8, 2);
      f.generateTexture(`flower_${index}`, 16, 16);
      f.destroy();
    });
  }

  _createParticles() {
    const scene = this.scene;

    // Particle texture
    const particleG = scene.add.graphics();
    particleG.fillStyle(0xffffff, 0.3);
    particleG.fillCircle(8, 8, 8);
    particleG.fillStyle(0xffffff, 1);
    particleG.fillCircle(8, 8, 4);
    particleG.generateTexture('particle', 16, 16);
    particleG.destroy();

    this.atmosphericParticles = scene.add.particles(0, 0, 'particle', {
      x: { min: 0, max: scene.cameras.main.width },
      y: { min: -20, max: 0 },
      lifespan: 4000,
      speedY: { min: 10, max: 30 },
      speedX: { min: -5, max: 5 },
      scale: { start: 0.6, end: 0.2 },
      alpha: { start: 0.3, end: 0 },
      quantity: 1,
      frequency: 200,
      tint: 0xffffff,
      blendMode: Phaser.BlendModes.ADD
    });

    this.atmosphericParticles.setDepth(300000);
    this.atmosphericParticles.setScrollFactor(0);
    this.atmosphericParticles.stop();
  }

  updateParticles(terrainType) {
    if (!this.atmosphericParticles) return;

    this.atmosphericParticles.stop();
    const camW = this.scene.cameras.main.width;
    const camH = this.scene.cameras.main.height;

    switch (terrainType) {
      case WorldConfig.TERRAIN.DEEP_WATER:
      case WorldConfig.TERRAIN.SHALLOW_WATER:
        this.atmosphericParticles.setConfig({
          x: { min: 0, max: camW },
          y: { min: camH, max: camH + 20 },
          lifespan: 3000,
          speedY: { min: -30, max: -15 },
          speedX: { min: -3, max: 3 },
          scale: { start: 0.5, end: 0.8 },
          alpha: { start: 0.25, end: 0 },
          quantity: 1,
          frequency: 250,
          tint: terrainType === WorldConfig.TERRAIN.DEEP_WATER ? 0x4da6ff : 0x80d4ff,
          blendMode: Phaser.BlendModes.ADD
        });
        this.atmosphericParticles.start();
        break;

      case WorldConfig.TERRAIN.SAND:
        this.atmosphericParticles.setConfig({
          x: { min: 0, max: camW },
          y: { min: -20, max: 0 },
          lifespan: 2500,
          speedY: { min: 8, max: 18 },
          speedX: { min: -10, max: 10 },
          scale: { start: 0.4, end: 0.15 },
          alpha: { start: 0.2, end: 0 },
          quantity: 1,
          frequency: 280,
          tint: 0xf4d03f,
          blendMode: Phaser.BlendModes.NORMAL
        });
        this.atmosphericParticles.start();
        break;

      case WorldConfig.TERRAIN.GRASS_LIGHT:
      case WorldConfig.TERRAIN.GRASS_DARK:
        this.atmosphericParticles.setConfig({
          x: { min: 0, max: camW },
          y: { min: -20, max: 0 },
          lifespan: 4000,
          speedY: { min: 5, max: 15 },
          speedX: { min: -8, max: 8 },
          scale: { start: 0.5, end: 0.2 },
          alpha: { start: 0.25, end: 0 },
          quantity: 1,
          frequency: 300,
          tint: 0xd4f1a5,
          blendMode: Phaser.BlendModes.ADD
        });
        this.atmosphericParticles.start();
        break;

      case WorldConfig.TERRAIN.DIRT:
        this.atmosphericParticles.setConfig({
          x: { min: 0, max: camW },
          y: { min: -20, max: 0 },
          lifespan: 2000,
          speedY: { min: 10, max: 25 },
          speedX: { min: -5, max: 5 },
          scale: { start: 0.35, end: 0.1 },
          alpha: { start: 0.25, end: 0 },
          quantity: 1,
          frequency: 250,
          tint: 0x8b4513,
          blendMode: Phaser.BlendModes.NORMAL
        });
        this.atmosphericParticles.start();
        break;

      default:
        this.atmosphericParticles.stop();
        break;
    }
  }

  update(playerX, playerY) {
    if (!this.vegetationData) return;

    const chunkX = Math.floor(playerX / this.CHUNK_SIZE);
    const chunkY = Math.floor(playerY / this.CHUNK_SIZE);

    // Visible chunks (3x3 grid around player)
    const visibleChunks = new Set();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        visibleChunks.add(`${chunkX + dx},${chunkY + dy}`);
      }
    }

    // Remove distant chunks
    this.activeTreeChunks.forEach(key => {
      if (!visibleChunks.has(key)) {
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
        this._createTreesInChunk(key);
        this.activeTreeChunks.add(key);
      }
    });

    // Update particles based on terrain under player
    const playerGridX = Math.floor(playerX / WorldConfig.TILE_SIZE);
    const playerGridY = Math.floor(playerY / WorldConfig.TILE_SIZE);

    if (playerGridX >= 0 && playerGridX < WorldConfig.GRID_SIZE &&
      playerGridY >= 0 && playerGridY < WorldConfig.GRID_SIZE) {
      const terrainIndex = playerGridY * WorldConfig.GRID_SIZE + playerGridX;
      const terrainData = this.scene.generator ? this.scene.generator.data : null;
      const terrainType = terrainData ? terrainData[terrainIndex] : -1;

      if (terrainType !== this.currentTerrainType) {
        this.currentTerrainType = terrainType;
        this.updateParticles(terrainType);
      }
    }
  }

  _createTreesInChunk(key) {
    const [cx, cy] = key.split(',').map(Number);
    const startX = cx * this.CHUNK_SIZE;
    const startY = cy * this.CHUNK_SIZE;
    const endX = startX + this.CHUNK_SIZE;
    const endY = startY + this.CHUNK_SIZE;

    const gStartX = Math.floor(startX / 2.5);
    const gStartY = Math.floor(startY / 2.5);
    const gEndX = Math.ceil(endX / 2.5);
    const gEndY = Math.ceil(endY / 2.5);

    if (gStartX < 0 || gStartY < 0 || gStartX >= 8000 || gStartY >= 8000) return;

    const width = 8000;

    for (let y = gStartY; y < gEndY; y++) {
      for (let x = gStartX; x < gEndX; x++) {
        if (x < 0 || x >= width || y < 0 || y >= width) continue;

        const index = y * width + x;
        const objType = this.vegetationData[index];

        if (objType > 0) {
          const terrainData = this.scene.generator ? this.scene.generator.data : null;
          const terrain = terrainData ? terrainData[index] : -1;
          let textureKey = terrain === WorldConfig.TERRAIN.GRASS_DARK ? 'tree_dark' : 'tree';
          let originY = 0.9;

          if (objType === WorldConfig.OBJECTS.ROCK_SMALL) { textureKey = 'rock_small'; originY = 0.7; }
          else if (objType === WorldConfig.OBJECTS.ROCK_MEDIUM) { textureKey = 'rock_medium'; originY = 0.8; }
          else if (objType === WorldConfig.OBJECTS.ROCK_LARGE) { textureKey = 'rock_large'; originY = 0.85; }
          else if (objType === WorldConfig.OBJECTS.FLOWER) {
            const colorIndex = Math.floor(Math.random() * 16);
            textureKey = `flower_${colorIndex}`;
            originY = 0.8;
          } else if (objType === WorldConfig.OBJECTS.BUSH_SAND) {
            textureKey = `bush_sand_${Math.floor(Math.random() * 4)}`;
            originY = 0.85;
          } else if (objType === WorldConfig.OBJECTS.BUSH_GRASS) {
            textureKey = `bush_grass_${Math.floor(Math.random() * 4)}`;
            originY = 0.85;
          } else if (objType === WorldConfig.OBJECTS.BUSH_DIRT) {
            textureKey = `bush_dirt_${Math.floor(Math.random() * 4)}`;
            originY = 0.85;
          }

          const worldX = x * 2.5;
          const worldY = y * 2.5;
          const jx = worldX + (Math.random() * 2 - 1);
          const jy = worldY + (Math.random() * 2 - 1);

          const obj = this.scene.add.image(jx, jy, textureKey);
          obj.setOrigin(0.5, originY);
          obj.setDepth(jy);
          obj.chunkKey = key;
          this.treesGroup.add(obj);
        }
      }
    }
  }
}
