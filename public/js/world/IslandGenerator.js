import { WorldConfig } from './WorldConfig.js';

export class IslandGenerator {
    constructor(seed, worldSize, tileSize) {
        this.seed = seed;
        this.noise = new Noise(seed);
        this.worldSize = worldSize; // 20000
        this.tileSize = tileSize;   // 2.5
        this.gridSize = Math.floor(worldSize / tileSize); // 8000
        this.data = new Uint8Array(this.gridSize * this.gridSize);
        this.vegetation = new Uint8Array(this.gridSize * this.gridSize);
    }

    async generate(onProgress) {
        const width = this.gridSize;
        const height = this.gridSize;
        const batchSize = 500;
        const noise = this.noise;
        const data = this.data;
        const veg = this.vegetation;

        // Pre-compute allowed terrain lookups as bitfields
        const T = WorldConfig.TERRAIN;
        const O = WorldConfig.OBJECTS;
        const treeTerrain = new Uint8Array(6);
        const rockTerrain = new Uint8Array(6);
        const flowerTerrain = new Uint8Array(6);
        const bushSandT = new Uint8Array(6);
        const bushGrassT = new Uint8Array(6);
        const bushDirtT = new Uint8Array(6);
        
        O.ALLOWED_TERRAINS_TREES.forEach(t => treeTerrain[t] = 1);
        O.ALLOWED_TERRAINS_ROCKS.forEach(t => rockTerrain[t] = 1);
        O.ALLOWED_TERRAINS_FLOWERS.forEach(t => flowerTerrain[t] = 1);
        O.ALLOWED_TERRAINS_BUSH_SAND.forEach(t => bushSandT[t] = 1);
        O.ALLOWED_TERRAINS_BUSH_GRASS.forEach(t => bushGrassT[t] = 1);
        O.ALLOWED_TERRAINS_BUSH_DIRT.forEach(t => bushDirtT[t] = 1);

        const invW = 2.0 / width;
        const invH = 2.0 / height;

        for (let y = 0; y < height; y++) {
            if (y % batchSize === 0) {
                if (onProgress) onProgress(y / height);
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            const ny = y * invH - 1;
            const rowOff = y * width;

            for (let x = 0; x < width; x++) {
                const nx = x * invW - 1;

                // --- TERRAIN ---
                const distSq = nx * nx + ny * ny;
                let falloff;
                if (distSq > 0.9025) { // 0.95^2
                    falloff = 10;
                } else {
                    const dist = Math.sqrt(distSq);
                    falloff = dist * dist * Math.pow(dist, 0.2);
                }

                const e1 = noise.simplex2(nx * 1.5, ny * 1.5);
                const e2 = noise.simplex2(nx * 3, ny * 3);
                const e3 = noise.simplex2(nx * 6, ny * 6);

                const elevation = (e1 + 0.5 * e2 + 0.25 * e3) / 1.75;
                const value = (elevation + 1) * 0.5 - falloff;

                let tileType;
                if (value < -0.05) {
                    tileType = T.DEEP_WATER;
                } else if (value < 0.05) {
                    tileType = T.SHALLOW_WATER;
                } else if (value < 0.12) {
                    tileType = T.SAND;
                } else {
                    const detail = noise.simplex2(nx * 10, ny * 10);
                    if (detail < -0.2) tileType = T.DIRT;
                    else if (detail > 0.5) tileType = T.GRASS_DARK;
                    else tileType = T.GRASS_LIGHT;
                }

                const idx = rowOff + x;
                data[idx] = tileType;

                // --- VEGETATION (skip water) ---
                if (tileType <= 1) continue;

                // Trees
                if (treeTerrain[tileType]) {
                    const tn = noise.simplex2(nx * 400, ny * 400);
                    if (tn > 0.96) {
                        veg[idx] = O.TREE;
                        continue;
                    }
                }

                // Rocks
                if (rockTerrain[tileType]) {
                    const rn = noise.simplex2(nx * 500 + 100, ny * 500 + 100);
                    if (rn > 0.985) {
                        const hash = ((x * 73856093) ^ (y * 19349663)) * 83492791;
                        const rand = (hash & 0xFFFF) / 65536.0;
                        veg[idx] = rand > 0.9 ? O.ROCK_LARGE : rand > 0.6 ? O.ROCK_MEDIUM : O.ROCK_SMALL;
                        continue;
                    }
                }

                // Flowers
                if (flowerTerrain[tileType]) {
                    const fn = noise.simplex2(nx * 600 + 200, ny * 600 + 200);
                    if (fn > 0.9925) {
                        veg[idx] = O.FLOWER;
                        continue;
                    }
                }

                // Bushes
                const bn = noise.simplex2(nx * 550 + 300, ny * 550 + 300);
                if (bn > 0.9925) {
                    if (bushSandT[tileType]) veg[idx] = O.BUSH_SAND;
                    else if (bushGrassT[tileType]) veg[idx] = O.BUSH_GRASS;
                    else if (bushDirtT[tileType]) veg[idx] = O.BUSH_DIRT;
                }
            }
        }
        return { terrain: this.data, vegetation: this.vegetation };
    }

    getBiomeAt(worldX, worldY) {
        const x = Math.floor(worldX / this.tileSize);
        const y = Math.floor(worldY / this.tileSize);
        if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) return 0;
        return this.data[y * this.gridSize + x];
    }

    getTerrainInRadius(worldX, worldY, radius) {
        if (!this.data) {
            console.log('[IslandGenerator] getTerrainInRadius: data is null.');
            return [];
        }

        const nearby = [];
        const radiusSq = radius * radius;
        const TILE_SIZE = this.tileSize;
        const GRID_SIZE = this.gridSize;

        const minGx = Math.floor((worldX - radius) / TILE_SIZE);
        const maxGx = Math.ceil((worldX + radius) / TILE_SIZE);
        const minGy = Math.floor((worldY - radius) / TILE_SIZE);
        const maxGy = Math.ceil((worldY + radius) / TILE_SIZE);

        // console.log(`[IslandGenerator] getTerrainInRadius: Searching bbox [${minGx},${minGy}] to [${maxGx},${maxGy}] for player (${worldX.toFixed(0)},${worldY.toFixed(0)})`);

        for (let gy = Math.max(0, minGy); gy < Math.min(GRID_SIZE, maxGy); gy++) {
            for (let gx = Math.max(0, minGx); gx < Math.min(GRID_SIZE, maxGx); gx++) {
                const tileX = gx * TILE_SIZE;
                const tileY = gy * TILE_SIZE;
                const dx = tileX - worldX;
                const dy = tileY - worldY;

                if (dx * dx + dy * dy <= radiusSq) {
                    const index = gy * GRID_SIZE + gx;
                    nearby.push({
                        x: tileX,
                        y: tileY,
                        type: this.data[index],
                        gridIndex: index,
                    });
                    // console.log(`[IslandGenerator] Found and added tileType ${this.data[index]} at (${tileX.toFixed(0)},${tileY.toFixed(0)})`);
                }
            }
        }
        // console.log('[IslandGenerator] getTerrainInRadius: Found', nearby.length, 'tiles.');
        return nearby;
    }
}
