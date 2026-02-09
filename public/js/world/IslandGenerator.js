import { WorldConfig } from './WorldConfig.js';
import * as Objects from '../objects/index.js';

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
        const MIN_TREE_SPACING = 3; // minimum distance in grid tiles (~50% of tree size)

        // Pre-compute allowed terrain lookups as bitfields
        const T = WorldConfig.TERRAIN;
        const treeTerrain = new Uint8Array(6);
        const rockTerrain = new Uint8Array(6);
        const flowerTerrain = new Uint8Array(6);
        const bushSandT = new Uint8Array(6);
        const bushGrassT = new Uint8Array(6);
        const bushDirtT = new Uint8Array(6);

        // read allowed terrains from objects config
        Objects.CONFIG.TREE.allowedTerrains.forEach(t => treeTerrain[t] = 1);
        Objects.CONFIG.ROCK_SMALL.allowedTerrains.forEach(t => rockTerrain[t] = 1);
        Objects.CONFIG.FLOWER.allowedTerrains.forEach(t => flowerTerrain[t] = 1);
        Objects.CONFIG.BUSH_SAND.allowedTerrains.forEach(t => bushSandT[t] = 1);
        Objects.CONFIG.BUSH_GRASS.allowedTerrains.forEach(t => bushGrassT[t] = 1);
        Objects.CONFIG.BUSH_DIRT.allowedTerrains.forEach(t => bushDirtT[t] = 1);

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
                } else if (value < 0.10) {
                    // Widen shallow water band to be at least ~200% wider than original (0.05 -> 0.10)
                    tileType = T.SHALLOW_WATER;
                } else if (value < 0.33) {
                    // Widen sand band (~400% wider than previous 0.12 threshold)
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

                // if a vegetation/object was already placed here (e.g. an apple
                // placed earlier by a neighboring tree), don't overwrite it.
                if (veg[idx] !== 0) continue;

                // Trees
                if (treeTerrain[tileType]) {
                    const tn = noise.simplex2(nx * 400, ny * 400);
                    if (tn > 0.96) {
                        // Check minimum spacing: no tree within MIN_TREE_SPACING tiles
                        let canPlace = true;
                        for (let dy = -MIN_TREE_SPACING; dy <= MIN_TREE_SPACING && canPlace; dy++) {
                            for (let dx = -MIN_TREE_SPACING; dx <= MIN_TREE_SPACING && canPlace; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                    const nidx = ny * width + nx;
                                    if (veg[nidx] === Objects.IDS.TREE) {
                                        canPlace = false;
                                    }
                                }
                            }
                        }
                        if (canPlace) {
                            veg[idx] = Objects.IDS.TREE;
                        }
                        continue;
                    }
                }

                // Rocks
                if (rockTerrain[tileType]) {
                    const rn = noise.simplex2(nx * 500 + 100, ny * 500 + 100);
                    if (rn > 0.985) {
                        const hash = ((x * 73856093) ^ (y * 19349663)) * 83492791;
                        const rand = (hash & 0xFFFF) / 65536.0;
                        veg[idx] = rand > 0.9 ? Objects.IDS.ROCK_LARGE : rand > 0.6 ? Objects.IDS.ROCK_MEDIUM : Objects.IDS.ROCK_SMALL;
                        continue;
                    }
                }

                // Flowers
                if (flowerTerrain[tileType]) {
                    const fn = noise.simplex2(nx * 600 + 200, ny * 600 + 200);
                    if (fn > 0.9925) {
                        veg[idx] = Objects.IDS.FLOWER;
                        continue;
                    }
                }

                // Bushes
                const bn = noise.simplex2(nx * 550 + 300, ny * 550 + 300);
                if (bn > 0.9925) {
                    if (bushSandT[tileType]) veg[idx] = Objects.IDS.BUSH_SAND;
                    else if (bushGrassT[tileType]) veg[idx] = Objects.IDS.BUSH_GRASS;
                    else if (bushDirtT[tileType]) veg[idx] = Objects.IDS.BUSH_DIRT;
                }
            }
        }
        // --- APPLE GENERATION (separate pass, optimized for tree zones) ---
        const APPLE_BASE_PROB = 0.25; // base 25% chance per-tree (more common)
        const neighborRadius = 2; // measure local tree density in a 5x5 area
        const offsets = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]];

        for (let ty = 0; ty < height; ty++) {
            const rowOffT = ty * width;
            for (let tx = 0; tx < width; tx++) {
                const tidx = rowOffT + tx;
                if (veg[tidx] !== Objects.IDS.TREE) continue;

                // compute local tree density
                let treeNeighbors = 0;
                for (let oy = -neighborRadius; oy <= neighborRadius; oy++) {
                    const gy = ty + oy;
                    if (gy < 0 || gy >= height) continue;
                    const rowOffN = gy * width;
                    for (let ox = -neighborRadius; ox <= neighborRadius; ox++) {
                        const gx = tx + ox;
                        if (gx < 0 || gx >= width) continue;
                        if (ox === 0 && oy === 0) continue;
                        if (veg[rowOffN + gx] === Objects.IDS.TREE) treeNeighbors++;
                    }
                }

                // increase chance in denser tree patches (cap to avoid excess)
                let prob = APPLE_BASE_PROB * (1 + (treeNeighbors / 2));
                if (prob > 0.9) prob = 0.9;

                const hash = ((tx * 73856093) ^ (ty * 19349663)) * 83492791;
                const rand = (hash & 0xFFFF) / 65536.0;
                if (rand >= prob) continue;

                // pick a nearby free tile to place the apple
                const pick = Math.floor((((hash >>> 16) & 0xFFFF) / 65536.0) * offsets.length);
                const ox = offsets[pick][0];
                const oy = offsets[pick][1];
                const nxG = tx + ox;
                const nyG = ty + oy;
                if (nxG >= 0 && nxG < width && nyG >= 0 && nyG < height) {
                    const nidx = nyG * width + nxG;
                    if (veg[nidx] === 0 && data[nidx] > 1) {
                        veg[nidx] = Objects.IDS.APPLE;
                    }
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
