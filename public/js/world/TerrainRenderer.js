import { WorldConfig } from './WorldConfig.js';

export class TerrainRenderer {
    constructor(scene) {
        this.scene = scene;
        this.noise = window.Noise ? new window.Noise(Math.random()) : null;

        // ── Configuración centralizada ────────────────────────────────────────
        this.config = {
            // General
            jitter: {
                scale: 0.08,
                threshold: 0.25,
                strength: 1.2
            },
            fbmDefaults: {
                octaves: 5,
                persistence: 0.5,
                lacunarity: 2.0
            },
            edge: {
                checkDistance: 4,
                power: 1.4,
                fastNoiseThreshold: 0.4,
                contrastBoost: 1.2
            },

            // Por tipo de terreno
            terrains: {
                [WorldConfig.TERRAIN.DEEP_WATER]: {
                    baseScale: 0.0035,
                    detailScale: 0.012,
                    warpStrength: 0.0,
                    octaves: 4,
                    persistence: 0.55,
                    contrast: 0.9,
                    mixLargeSmall: 0.7
                },
                [WorldConfig.TERRAIN.SHALLOW_WATER]: {
                    baseScale: 0.0035,
                    detailScale: 0.012,
                    warpStrength: 0.0,
                    octaves: 4,
                    persistence: 0.55,
                    contrast: 0.9,
                    mixLargeSmall: 0.7
                },
                [WorldConfig.TERRAIN.SAND]: {
                    baseScale: 0.003,
                    warpStrength: 1.2,
                    warpScale: 0.003,
                    windDirectionScale: { x: 0.0015, y: 0.008 },
                    windInfluence: 0.3,
                    contrast: 1.1
                },
                [WorldConfig.TERRAIN.GRASS_LIGHT]: {
                    baseScale: 0.015,
                    warpStrength: 0.9,
                    warpScale: 0.015,
                    detailInfluence: 0.3,
                    contrast: 1.0
                },
                [WorldConfig.TERRAIN.GRASS_DARK]: {
                    baseScale: 0.015,
                    warpStrength: 0.9,
                    warpScale: 0.015,
                    detailInfluence: 0.3,
                    contrast: 1.0
                },
                [WorldConfig.TERRAIN.DIRT]: {
                    baseScale: 0.025,
                    octaves: 6,
                    persistence: 0.48,
                    lacunarity: 2.3,
                    contrast: 1.15
                },
                default: {
                    baseScale: 0.01,
                    octaves: 5,
                    persistence: 0.5,
                    contrast: 0.9
                }
            },

            // Post-procesado
            global: {
                ditherAmount: 0.0,
                finalContrastPower: 1.0
            }
        };
    }

    fbm(x, y, custom = {}) {
        const cfg = { ...this.config.fbmDefaults, ...custom };
        let total = 0;
        let amplitude = 1;
        let frequency = cfg.scale || 0.01;  // importante: usamos scale si viene
        let maxValue = 0;

        for (let i = 0; i < cfg.octaves; i++) {
            total += this.noise.simplex2(x * frequency, y * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= cfg.persistence;
            frequency *= cfg.lacunarity;
        }
        return total / maxValue;
    }

    warped(x, y, strength, warpScale = 0.008) {
        if (strength <= 0) return this.fbm(x, y, { scale: warpScale });

        const qx = this.fbm(x + 200, y + 300, { octaves: 3, scale: warpScale });
        const qy = this.fbm(x + 500, y + 700, { octaves: 3, scale: warpScale });
        return this.fbm(
            x + qx * strength,
            y + qy * strength,
            { scale: warpScale * 3 }
        );
    }

    async render(gridData, size, tileSize) {
        if (!this.noise) throw new Error("Noise library not available");

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;

        const palettes = WorldConfig.PALETTES;
        const defaultPalette = palettes[0];
        const batchSize = 800;

        for (let y = 0; y < size; y++) {
            if (y % batchSize === 0) {
                await new Promise(r => setTimeout(r, 0));
            }

            for (let x = 0; x < size; x++) {
                // Jitter
                let sx = x, sy = y;
                const jitterVal = this.noise.simplex2(x * this.config.jitter.scale, y * this.config.jitter.scale);
                if (Math.abs(jitterVal) > this.config.jitter.threshold) {
                    sx += jitterVal * this.config.jitter.strength;
                    sy += this.noise.simplex2(x * this.config.jitter.scale + 123, y * this.config.jitter.scale + 456) *
                        this.config.jitter.strength;
                    sx = Math.max(0, Math.min(size - 1, Math.round(sx)));
                    sy = Math.max(0, Math.min(size - 1, Math.round(sy)));
                }

                const type = gridData[sy * size + sx];
                const palette = palettes[type] || defaultPalette;
                const terrainCfg = this.config.terrains[type] || this.config.terrains.default;

                // Edge strength
                let edgeStrength = 0;
                let diffCount = 0;
                const area = (this.config.edge.checkDistance * 2 + 1) ** 2 - 1;

                for (let dy = -this.config.edge.checkDistance; dy <= this.config.edge.checkDistance; dy++) {
                    for (let dx = -this.config.edge.checkDistance; dx <= this.config.edge.checkDistance; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = Math.max(0, Math.min(size - 1, x + dx));
                        const ny = Math.max(0, Math.min(size - 1, y + dy));
                        if (gridData[ny * size + nx] !== type) diffCount++;
                    }
                }
                edgeStrength = Math.pow(diffCount / area, this.config.edge.power);

                // ── Ruido según terreno ───────────────────────────────────────
                let noiseValue;

                if (type === WorldConfig.TERRAIN.DEEP_WATER || type === WorldConfig.TERRAIN.SHALLOW_WATER) {
                    noiseValue =
                        this.fbm(x, y, {
                            octaves: terrainCfg.octaves,
                            persistence: terrainCfg.persistence,
                            scale: terrainCfg.baseScale
                        }) * terrainCfg.mixLargeSmall +
                        this.fbm(x + 80, y + 120, { scale: terrainCfg.detailScale }) * (1 - terrainCfg.mixLargeSmall);
                }
                else if (type === WorldConfig.TERRAIN.SAND) {
                    noiseValue = this.warped(x, y, terrainCfg.warpStrength, terrainCfg.warpScale);
                    noiseValue += this.noise.simplex2(
                        x * terrainCfg.windDirectionScale.x,
                        y * terrainCfg.windDirectionScale.y
                    ) * terrainCfg.windInfluence;
                }
                else if (type === WorldConfig.TERRAIN.GRASS_LIGHT || type === WorldConfig.TERRAIN.GRASS_DARK) {
                    noiseValue = this.warped(x, y, terrainCfg.warpStrength, terrainCfg.warpScale || terrainCfg.baseScale);
                    noiseValue = noiseValue * (1 - terrainCfg.detailInfluence) +
                        this.fbm(x, y, { scale: terrainCfg.baseScale * 3 }) * terrainCfg.detailInfluence;
                }
                else if (type === WorldConfig.TERRAIN.DIRT) {
                    noiseValue = this.fbm(x, y, {
                        octaves: terrainCfg.octaves,
                        persistence: terrainCfg.persistence,
                        lacunarity: terrainCfg.lacunarity,
                        scale: terrainCfg.baseScale
                    });
                }
                else {
                    noiseValue = this.fbm(x, y, { scale: terrainCfg.baseScale });
                }

                // Normalizar + borde + contraste
                let norm = (noiseValue + 1) / 2;

                if (edgeStrength > this.config.edge.fastNoiseThreshold) {
                    const fast = this.noise.simplex2(x * 0.08, y * 0.08);
                    norm = norm * (1 - edgeStrength) + (fast + 1) / 2 * edgeStrength;
                }

                norm = Math.pow(norm, 1 + edgeStrength * this.config.edge.contrastBoost);
                norm = Math.max(0, Math.min(1, norm));

                let colorIndex = Math.floor(norm * (palette.length - 0.001));

                const color = palette[colorIndex];

                const idx = (y * size + x) * 4;
                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imgData, 0, 0);

        return new Promise(resolve => {
            this.scene.textures.addCanvas('worldmap', canvas);
            const img = this.scene.add.image(0, 0, 'worldmap');
            img.setOrigin(0, 0);
            img.setScale(tileSize);
            img.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
            resolve(img);
        });
    }
}