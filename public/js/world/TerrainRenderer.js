import { WorldConfig } from './WorldConfig.js';

export class TerrainRenderer {
    constructor(scene) {
        this.scene = scene;
        this.noise = window.Noise ? new window.Noise(Math.random()) : null;
    }

    // Inline fbm — no object allocation
    _fbm(x, y, scale, octaves, persistence, lacunarity) {
        const n = this.noise;
        let total = 0, amp = 1, freq = scale, max = 0;
        for (let i = 0; i < octaves; i++) {
            total += n.simplex2(x * freq, y * freq) * amp;
            max += amp;
            amp *= persistence;
            freq *= lacunarity;
        }
        return total / max;
    }

    _warped(x, y, strength, warpScale) {
        if (strength <= 0) return this._fbm(x, y, warpScale, 2, 0.5, 2.0);
        const qx = this._fbm(x + 200, y + 300, warpScale, 2, 0.5, 2.0);
        const qy = this._fbm(x + 500, y + 700, warpScale, 2, 0.5, 2.0);
        return this._fbm(x + qx * strength, y + qy * strength, warpScale * 3, 3, 0.5, 2.0);
    }

    async render(gridData, fullSize, tileSize, onProgress) {
        if (!this.noise) throw new Error("Noise library not available");

        // Render at half resolution for performance
        const size = fullSize >> 1; // 4000
        const scale = 2; // sample every 2nd pixel from grid

        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(size, size);
        const data = imgData.data;

        const palettes = WorldConfig.PALETTES;
        const defaultPalette = palettes[0];
        const noise = this.noise;
        const batchSize = 800;

        // Edge detection distance
        const edgeDist = 2;
        const edgeArea = (edgeDist * 2 + 1) ** 2 - 1; // 24

        // Jitter config
        const jScale = 0.08;
        const jThreshold = 0.25;
        const jStrength = 1.2;

        const T = WorldConfig.TERRAIN;

        for (let y = 0; y < size; y++) {
            if (y % batchSize === 0) {
                if (onProgress) onProgress(y / size);
                await new Promise(r => setTimeout(r, 0));
            }

            for (let x = 0; x < size; x++) {
                // Map half-res pixel to full-res grid
                const gx = x * scale;
                const gy = y * scale;

                // Jitter (use half-res coords for noise, map to full grid)
                let sx = gx, sy = gy;
                const jv = noise.simplex2(x * jScale, y * jScale);
                if (jv > jThreshold || jv < -jThreshold) {
                    sx = Math.max(0, Math.min(fullSize - 1,
                        (gx + jv * jStrength + 0.5) | 0));
                    sy = Math.max(0, Math.min(fullSize - 1,
                        (gy + noise.simplex2(x * jScale + 123, y * jScale + 456) * jStrength + 0.5) | 0));
                }

                const type = gridData[sy * fullSize + sx];
                const palette = palettes[type] || defaultPalette;

                // Fast edge detection — sample cardinal + diagonal at distance 2 in half-res space
                let diffCount = 0;
                for (let dy = -edgeDist; dy <= edgeDist; dy++) {
                    const ny = Math.max(0, Math.min(fullSize - 1, gy + dy * scale));
                    const rowOff = ny * fullSize;
                    for (let dx = -edgeDist; dx <= edgeDist; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = Math.max(0, Math.min(fullSize - 1, gx + dx * scale));
                        if (gridData[rowOff + nx] !== type) diffCount++;
                    }
                }
                const edgeRaw = diffCount / edgeArea;
                const edgeStrength = edgeRaw * Math.sqrt(edgeRaw); // ~pow 1.5 approximation

                // Noise per terrain type (using half-res coords for speed)
                let noiseValue;

                if (type === T.DEEP_WATER || type === T.SHALLOW_WATER) {
                    noiseValue =
                        this._fbm(x, y, 0.007, 3, 0.55, 2.0) * 0.7 +
                        this._fbm(x + 80, y + 120, 0.024, 2, 0.5, 2.0) * 0.3;
                } else if (type === T.SAND) {
                    noiseValue = this._warped(x, y, 1.2, 0.006);
                    noiseValue += noise.simplex2(x * 0.003, y * 0.016) * 0.3;
                } else if (type === T.GRASS_LIGHT || type === T.GRASS_DARK) {
                    noiseValue = this._warped(x, y, 0.9, 0.03);
                    noiseValue = noiseValue * 0.7 +
                        this._fbm(x, y, 0.09, 2, 0.5, 2.0) * 0.3;
                } else if (type === T.DIRT) {
                    noiseValue = this._fbm(x, y, 0.05, 4, 0.48, 2.3);
                } else {
                    noiseValue = this._fbm(x, y, 0.02, 3, 0.5, 2.0);
                }

                // Normalize
                if (noiseValue !== noiseValue) noiseValue = 0; // NaN check
                let norm = (noiseValue + 1) * 0.5;

                if (edgeStrength > 0.4) {
                    const fast = noise.simplex2(x * 0.16, y * 0.16);
                    norm = norm * (1 - edgeStrength) + (fast + 1) * 0.5 * edgeStrength;
                }

                norm = Math.pow(norm, 1 + edgeStrength * 1.2);
                if (norm < 0) norm = 0;
                else if (norm > 1) norm = 1;

                let ci = (norm * (palette.length - 0.001)) | 0;
                if (ci < 0 || ci >= palette.length) ci = 0;

                const color = palette[ci] || defaultPalette[0];

                const idx = (y * size + x) << 2;
                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imgData, 0, 0);

        // Smoothing pass: use a separate canvas to avoid self-draw corruption
        const smoothCanvas = document.createElement('canvas');
        smoothCanvas.width = size;
        smoothCanvas.height = size;
        const sCtx = smoothCanvas.getContext('2d');
        sCtx.imageSmoothingEnabled = true;
        sCtx.imageSmoothingQuality = 'high';
        // Downscale to temp, then upscale back with smoothing
        const tmpCanvas = document.createElement('canvas');
        const halfW = size >> 1;
        const halfH = size >> 1;
        tmpCanvas.width = halfW;
        tmpCanvas.height = halfH;
        const tCtx = tmpCanvas.getContext('2d');
        tCtx.imageSmoothingEnabled = true;
        tCtx.imageSmoothingQuality = 'high';
        tCtx.drawImage(canvas, 0, 0, halfW, halfH);
        // Upscale blurred version
        sCtx.drawImage(tmpCanvas, 0, 0, size, size);
        // Blend sharp original on top (60% opacity)
        sCtx.globalAlpha = 0.6;
        sCtx.drawImage(canvas, 0, 0);
        sCtx.globalAlpha = 1.0;

        return new Promise(resolve => {
            this.scene.textures.addCanvas('worldmap', smoothCanvas);
            const img = this.scene.add.image(0, 0, 'worldmap');
            img.setOrigin(0, 0);
            img.setScale(tileSize * scale); // 2.5 * 2 = 5

            // Force LINEAR filtering even with pixelArt:true
            img.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

            resolve(img);
        });
    }
}
