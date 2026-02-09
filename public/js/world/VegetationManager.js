import { WorldConfig } from './WorldConfig.js';
import * as Objects from '../objects/index.js';
import { createRNG } from '../util/rng.js';
import { createTreeTextures } from '../objects/tree/textures.js';
import { createRockSmallTextures } from '../objects/rock_small/textures.js';
import { createRockMediumTextures } from '../objects/rock_medium/textures.js';
import { createRockLargeTextures } from '../objects/rock_large/textures.js';
import { createBushSandTextures } from '../objects/bush_sand/textures.js';
import { createBushGrassTextures } from '../objects/bush_grass/textures.js';
import { createBushDirtTextures } from '../objects/bush_dirt/textures.js';
import { createFlowerTextures } from '../objects/flower/textures.js';
import { createAppleTextures } from '../objects/apple/textures.js';

export class VegetationManager {
  constructor(scene, vegetationData, seed = 0) {
    this.scene = scene;
    this.vegetationData = vegetationData;
    this.rng = createRNG(seed + 2);
    this.CHUNK_SIZE = 500;
    this.spriteMap = new Map();

    // Tree Management Group
    this.treesGroup = scene.add.group();
    this.activeTreeChunks = new Set();

    // Create procedural textures (delegated per-object)
    this._createTextures();

    // Atmospheric Particles
    this._createParticles();
    this.currentTerrainType = -1;
  }

  // ... _createTextures and _createParticles methods remain the same
  _createTextures() {
    const scene = this.scene;
    // delegate texture creation to per-object modules
    createTreeTextures(scene);
    createRockSmallTextures(scene);
    createRockMediumTextures(scene);
    createRockLargeTextures(scene);
    createBushSandTextures(scene);
    createBushGrassTextures(scene);
    createBushDirtTextures(scene);
    createFlowerTextures(scene);
    createAppleTextures(scene);
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

    const visibleChunks = new Set();
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        visibleChunks.add(`${chunkX + dx},${chunkY + dy}`);
      }
    }

    this.activeTreeChunks.forEach(key => {
      if (!visibleChunks.has(key)) {
        this.treesGroup.children.each(child => {
          if (child.chunkKey === key) {
            this.spriteMap.delete(child.gridIndex);
            child.destroy();
          }
        });
        this.activeTreeChunks.delete(key);
      }
    });

    visibleChunks.forEach(key => {
      if (!this.activeTreeChunks.has(key)) {
        this._createTreesInChunk(key);
        this.activeTreeChunks.add(key);
      }
    });

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

  _createTreesInChunk(chunkKey) {
    const [chunkX, chunkY] = chunkKey.split(',').map(Number);

    const worldMinX = chunkX * this.CHUNK_SIZE;
    const worldMinY = chunkY * this.CHUNK_SIZE;
    const worldMaxX = worldMinX + this.CHUNK_SIZE;
    const worldMaxY = worldMinY + this.CHUNK_SIZE;

    const gridMinX = Math.floor(worldMinX / 2.5);
    const gridMinY = Math.floor(worldMinY / 2.5);
    const gridMaxX = Math.ceil(worldMaxX / 2.5);
    const gridMaxY = Math.ceil(worldMaxY / 2.5);

    if (gridMaxX <= 0 || gridMaxY <= 0 || gridMinX >= 8000 || gridMinY >= 8000) {
      return;
    }

    const GRID_WIDTH = 8000;
    const terrainData = this.scene.generator?.data ?? null;

    for (let gy = Math.max(0, gridMinY); gy < Math.min(GRID_WIDTH, gridMaxY); gy++) {
      for (let gx = Math.max(0, gridMinX); gx < Math.min(GRID_WIDTH, gridMaxX); gx++) {
        const index = gy * GRID_WIDTH + gx;
        const objType = this.vegetationData[index];

        if (objType <= 0) continue;
        
        const terrain = terrainData ? terrainData[index] : -1;
        const isDarkGrass = terrain === WorldConfig.TERRAIN.GRASS_DARK;

        let textureKey = isDarkGrass ? 'tree_dark' : 'tree';
        let originY = 0.9;
        let ySort = true;

        switch (objType) {
          case Objects.IDS.ROCK_SMALL:
            textureKey = 'rock_small'; originY = 0.7; ySort = false; break;
          case Objects.IDS.ROCK_MEDIUM:
            textureKey = 'rock_medium'; originY = 0.8; ySort = false; break;
          case Objects.IDS.ROCK_LARGE:
            textureKey = 'rock_large'; originY = 0.85; break;
          case Objects.IDS.FLOWER:
            textureKey = `flower_${this.rng ? this.rng.int(16) : Math.floor(Math.random() * 16)}`; originY = 0.8; ySort = false; break;
          case Objects.IDS.BUSH_SAND:
            textureKey = `bush_sand_${this.rng ? this.rng.int(4) : Math.floor(Math.random() * 4)}`; originY = 0.85; ySort = false; break;
          case Objects.IDS.BUSH_GRASS:
            textureKey = `bush_grass_${this.rng ? this.rng.int(4) : Math.floor(Math.random() * 4)}`; originY = 0.85; ySort = false; break;
          case Objects.IDS.BUSH_DIRT:
            textureKey = `bush_dirt_${this.rng ? this.rng.int(4) : Math.floor(Math.random() * 4)}`; originY = 0.85; ySort = false; break;
          case Objects.IDS.APPLE:
            textureKey = 'apple_spr'; originY = 0.6; ySort = true; break;
        }

        const baseX = gx * 2.5;
        const baseY = gy * 2.5;
        const worldX = baseX + ((this.rng ? this.rng.range(-1, 1) : (Math.random() * 2 - 1)));
        const worldY = baseY + ((this.rng ? this.rng.range(-1, 1) : (Math.random() * 2 - 1)));

        const sprite = this.scene.add.image(worldX, worldY, textureKey);
        sprite.setOrigin(0.5, originY);
        // Ensure apples render above trees: if apple, push depth slightly higher than worldY
        if (objType === Objects.IDS.APPLE) {
          sprite.setDepth(worldY + 1);
        } else {
          sprite.setDepth(ySort ? worldY : 2);
        }
        sprite.chunkKey = chunkKey;
        sprite.gridIndex = index;

        this.treesGroup.add(sprite);
        this.spriteMap.set(index, sprite);
      }
    }
  }

  getVegetationInRadius(playerX, playerY, radius) {
    if (!this.vegetationData) {
      console.log('[VegetationManager] getVegetationInRadius: vegetationData is null.');
      return [];
    }

    const nearby = [];
    const radiusSq = radius * radius;
    const GRID_WIDTH = 8000;
    const CELL_SIZE = 2.5;

    const minGx = Math.floor((playerX - radius) / CELL_SIZE);
    const maxGx = Math.ceil((playerX + radius) / CELL_SIZE);
    const minGy = Math.floor((playerY - radius) / CELL_SIZE);
    const maxGy = Math.ceil((playerY + radius) / CELL_SIZE);

    // console.log(`[VegetationManager] getVegetationInRadius: Searching bbox [${minGx},${minGy}] to [${maxGx},${maxGy}] for player (${playerX.toFixed(0)},${playerY.toFixed(0)})`);

    for (let gy = Math.max(0, minGy); gy < Math.min(GRID_WIDTH, maxGy); gy++) {
      for (let gx = Math.max(0, minGx); gx < Math.min(GRID_WIDTH, maxGx); gx++) {
        const index = gy * GRID_WIDTH + gx;
        const objType = this.vegetationData[index];

        if (objType > 0) {
          const objX = gx * CELL_SIZE;
          const objY = gy * CELL_SIZE;
          const dx = objX - playerX;
          const dy = objY - playerY;

          if (dx * dx + dy * dy <= radiusSq) {
            nearby.push({
              x: objX,
              y: objY,
              type: objType,
              gridIndex: index,
              sprite: this.spriteMap.get(index) || null,
            });
            // console.log(`[VegetationManager] Found and added objType ${objType} at (${objX.toFixed(0)},${objY.toFixed(0)})`);
          }
        }
      }
    }
    // console.log('[VegetationManager] getVegetationInRadius: Found', nearby.length, 'objects.');
    return nearby;
  }
}
