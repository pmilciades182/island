import { WorldConfig } from './WorldConfig.js';

export class IslandGenerator {
    constructor(seed, worldSize, tileSize) {
        this.seed = seed;
        this.noise = new Noise(seed);
        this.worldSize = worldSize; // 20000
        this.tileSize = tileSize;   // 2.5
        this.gridSize = Math.floor(worldSize / tileSize); // 8000
        this.data = new Uint8Array(this.gridSize * this.gridSize);
        // Vegetation data: 0=None, 1=Tree
        this.vegetation = new Uint8Array(this.gridSize * this.gridSize);
    }

    async generate(onProgress) {
        const width = this.gridSize;
        const height = this.gridSize;
        const batchSize = 100;

        for (let y = 0; y < height; y++) {
            if (y % batchSize === 0) {
                if (onProgress) onProgress(y / height);
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            for (let x = 0; x < width; x++) {
                const nx = (x / width) * 2 - 1;
                const ny = (y / height) * 2 - 1;

                // --- TERRAIN ---
                const dist = Math.sqrt(nx * nx + ny * ny);
                let falloff = Math.pow(dist, 2.2);
                if (dist > 0.95) falloff = 10;

                let elevation = 0;
                elevation += 1.0 * this.noise.simplex2(nx * 1.5, ny * 1.5);
                elevation += 0.5 * this.noise.simplex2(nx * 3, ny * 3);
                elevation += 0.25 * this.noise.simplex2(nx * 6, ny * 6);

                elevation = elevation / 1.75;
                elevation = (elevation + 1) / 2;

                const value = elevation - falloff;
                const detail = this.noise.simplex2(nx * 10, ny * 10);

                let tileType = 0;
                if (value < -0.05) tileType = WorldConfig.TERRAIN.DEEP_WATER; // 0
                else if (value < 0.05) tileType = WorldConfig.TERRAIN.SHALLOW_WATER; // 1
                else if (value < 0.12) tileType = WorldConfig.TERRAIN.SAND; // 2
                else {
                    if (detail < -0.2) tileType = WorldConfig.TERRAIN.DIRT; // 5
                    else if (detail > 0.5) tileType = WorldConfig.TERRAIN.GRASS_DARK; // 4
                    else tileType = WorldConfig.TERRAIN.GRASS_LIGHT; // 3
                }

                this.data[y * width + x] = tileType;

                // --- VEGETATION & OBJECTS ---
                // Trees: Only on Allowed Terrains (Grass Light & Dark)
                if (WorldConfig.OBJECTS.ALLOWED_TERRAINS_TREES.includes(tileType)) {
                    // Tree noise
                    const treeNoise = this.noise.simplex2(nx * 400, ny * 400);

                    // Threshold calculation:
                    // Previous thresholds were around 0.6.
                    // We want 5% of previous density.
                    // Previous: ~40% of land had trees? (noise > 0.6 is top 20% + scaling)
                    // Let's just drastically raise the threshold.
                    // If noise is [-1, 1], > 0.6 is ~20% area.
                    // We want 5% of that -> 1% area total?
                    // To get top 1%, threshold needs to be high. ~0.9?
                    // Or we just checking against random chance? No time for random.
                    // Let's trust the noise but raise threshold to 0.93?
                    // Or keep noise but add a secondary check? 
                    // No, simplex is expensive.

                    // Let's look at previous threshold logic:
                    // dark (4) -> 0.3 (>0.3 is 35% area)
                    // light (3) -> 0.65 (>0.65 is 17% area)

                    // Reduce density to 50% of previous (0.05). Previous threshold was 0.92.
                    // We need even less density. 
                    // Let's use 0.96 for trees.
                    const threshold = 0.96;

                    if (treeNoise > threshold) {
                        this.vegetation[y * width + x] = WorldConfig.OBJECTS.TREE; // 1
                    }
                }

                // Rocks: On Allowed Terrains (Sand, Grass Light, Dirt)
                // Use a different noise frequency to decorrelate from trees
                if (WorldConfig.OBJECTS.ALLOWED_TERRAINS_ROCKS.includes(tileType)) {
                    // Check if there is already a tree
                    if (this.vegetation[y * width + x] !== 0) continue;

                    const rockNoise = this.noise.simplex2(nx * 500 + 100, ny * 500 + 100);
                    // Sparse rocks. Must be less than trees (threshold 0.96).
                    // Increasing threshold to 0.985 to drastically reduce count.
                    if (rockNoise > 0.985) {
                        // Randomly assign size
                        // Use another noise or just hash coordinate?
                        // Hash coordinate for determinism.
                        const hash = (x * 73856093 ^ y * 19349663) * 83492791;
                        const rand = (hash & 0xFFFF) / 65536.0;

                        let rockType = WorldConfig.OBJECTS.ROCK_SMALL;
                        if (rand > 0.6) rockType = WorldConfig.OBJECTS.ROCK_MEDIUM;
                        if (rand > 0.9) rockType = WorldConfig.OBJECTS.ROCK_LARGE;

                        this.vegetation[y * width + x] = rockType;
                    }
                }

                // Flowers: On Grass terrains only
                // Half the density of small rocks (threshold 0.985)
                if (WorldConfig.OBJECTS.ALLOWED_TERRAINS_FLOWERS.includes(tileType)) {
                    // Check if there is already vegetation
                    if (this.vegetation[y * width + x] !== 0) continue;

                    const flowerNoise = this.noise.simplex2(nx * 600 + 200, ny * 600 + 200);
                    // Half of rock density: threshold ~0.9925
                    if (flowerNoise > 0.9925) {
                        this.vegetation[y * width + x] = WorldConfig.OBJECTS.FLOWER; // 5
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
}
