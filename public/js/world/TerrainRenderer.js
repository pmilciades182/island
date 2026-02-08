import { WorldConfig } from './WorldConfig.js';

export class TerrainRenderer {
    constructor(scene, seed) {
        this.scene = scene;
        const nseed = (typeof seed !== 'undefined') ? seed : Math.random();
        this.noise = window.Noise ? new window.Noise(nseed) : null;
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

        // Render at full resolution to avoid texture swimming (scale 2.5x instead of 5x)
        const size = fullSize; // 8000
        const scale = 1; // 1:1 with grid

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
                let hasShallowNeighbor = false;
                let hasSandNeighbor = false;
                let deepNeighborCount = 0;
                let shallowNeighborCount = 0;
                for (let dy = -edgeDist; dy <= edgeDist; dy++) {
                    const ny = Math.max(0, Math.min(fullSize - 1, gy + dy * scale));
                    const rowOff = ny * fullSize;
                    for (let dx = -edgeDist; dx <= edgeDist; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = Math.max(0, Math.min(fullSize - 1, gx + dx * scale));
                        const neighborType = gridData[rowOff + nx];
                        if (neighborType !== type) diffCount++;
                        if (neighborType === T.SHALLOW_WATER) hasShallowNeighbor = true;
                        if (neighborType === T.SAND) hasSandNeighbor = true;
                        if (neighborType === T.DEEP_WATER) deepNeighborCount++;
                        if (neighborType === T.SHALLOW_WATER) shallowNeighborCount++;
                    }
                }
                const edgeRaw = diffCount / edgeArea;
                const edgeStrength = edgeRaw * Math.sqrt(edgeRaw); // ~pow 1.5 approximation

                // Noise per terrain type (using half-res coords for speed)
                let noiseValue;

                if (type === T.DEEP_WATER || type === T.SHALLOW_WATER) {
                    // Much larger water swirls for deep/shallow water (lower frequency)
                    noiseValue =
                        this._fbm(x, y, 0.0022, 3, 0.55, 2.0) * 0.72 +
                        this._fbm(x + 80, y + 120, 0.010, 2, 0.5, 2.0) * 0.38;
                    // stronger very-low-frequency layer to create very large clumps
                    noiseValue += this._fbm(x + 300, y + 500, 0.0009, 1, 0.5, 2.0) * 0.28;
                } else if (type === T.SAND) {
                    // Make sand clumps ~400% larger: increase warp strength and dramatically lower warp scale
                    noiseValue = this._warped(x, y, 3.0, 0.00075);
                    // lower-frequency detail to emphasize big patches
                    noiseValue += noise.simplex2(x * 0.0006, y * 0.0032) * 0.45;
                    // stronger very-low-frequency bump to accentuate very large patches
                    noiseValue += this._fbm(x + 200, y + 200, 0.001, 1, 0.5, 2.0) * 0.4;
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

                let color = palette[ci] || defaultPalette[0];

                // Water gradient: blend shallow -> deep only for shallow pixels near deep neighbors.
                if (type === T.SHALLOW_WATER) {
                    const shallowPal = palettes[T.SHALLOW_WATER] || palettes[1];
                    const deepPal = palettes[T.DEEP_WATER] || palettes[0];
                    const sCi = (norm * (shallowPal.length - 0.001)) | 0;
                    const dCi = (norm * (deepPal.length - 0.001)) | 0;
                    const cShallow = shallowPal[Math.max(0, Math.min(shallowPal.length - 1, sCi))] || defaultPalette[0];
                    const cDeep = deepPal[Math.max(0, Math.min(deepPal.length - 1, dCi))] || defaultPalette[0];

                    // neighbor ratio of deep tiles around this pixel
                    const neighborRatioDeep = deepNeighborCount / edgeArea;

                    // Confine blending strongly to edge area using edgeStrength
                    let blendDepth = edgeStrength * neighborRatioDeep * 2.3;

                    // subtle per-pixel noise to avoid banding
                    const wNoise = (noise.simplex2(x * 0.12, y * 0.12) + 1) * 0.5;
                    blendDepth = Math.max(0, Math.min(1, blendDepth * 0.85 + wNoise * 0.15));

                    const r = Math.round(cShallow[0] * (1 - blendDepth) + cDeep[0] * blendDepth);
                    const g = Math.round(cShallow[1] * (1 - blendDepth) + cDeep[1] * blendDepth);
                    const b = Math.round(cShallow[2] * (1 - blendDepth) + cDeep[2] * blendDepth);
                    color = [r, g, b];
                }

                // Shore transition: if sand borders shallow water (either pixel
                // is sand with shallow neighbor, or shallow water with sand neighbor)
                if ((type === T.SAND && hasShallowNeighbor) || (type === T.SHALLOW_WATER && hasSandNeighbor)) {
                    // shoreFactor from edgeStrength biased up
                    const shoreFactor = Math.min(1, edgeStrength * 2.2);
                    // bubble noise: higher frequency and bias to create stronger white pockets
                    const bubble = (noise.simplex2(x * 0.18, y * 0.18) + 1) * 0.5; // 0..1
                    // bias towards brighter results (exponent < 1 boosts mid-low values)
                    const bubbleMask = Math.pow(bubble, 0.6);
                    // more aggressive blend, clamp to 1
                    let blend = shoreFactor * bubbleMask * 1.6;
                    if (blend > 1) blend = 1;

                    // mix towards white (255) — stronger pull for more pronounced foam
                    const r = Math.round((color[0] * (1 - blend)) + 255 * blend);
                    const g = Math.round((color[1] * (1 - blend)) + 255 * blend);
                    const b = Math.round((color[2] * (1 - blend)) + 255 * blend);
                    color = [r, g, b];
                }

                const idx = (y * size + x) << 2;
                data[idx] = color[0];
                data[idx + 1] = color[1];
                data[idx + 2] = color[2];
                data[idx + 3] = 255;
            }
        }

        ctx.putImageData(imgData, 0, 0);

        // Smoothing pass: soften texel boundaries to reduce swimming
        const smoothCanvas = document.createElement('canvas');
        smoothCanvas.width = size;
        smoothCanvas.height = size;
        const sCtx = smoothCanvas.getContext('2d');
        sCtx.imageSmoothingEnabled = true;
        sCtx.imageSmoothingQuality = 'high';
        const tmpCanvas = document.createElement('canvas');
        const halfW = size >> 1;
        const halfH = size >> 1;
        tmpCanvas.width = halfW;
        tmpCanvas.height = halfH;
        const tCtx = tmpCanvas.getContext('2d');
        tCtx.imageSmoothingEnabled = true;
        tCtx.imageSmoothingQuality = 'high';
        tCtx.drawImage(canvas, 0, 0, halfW, halfH);
        sCtx.drawImage(tmpCanvas, 0, 0, size, size);
        sCtx.globalAlpha = 0.6;
        sCtx.drawImage(canvas, 0, 0);
        sCtx.globalAlpha = 1.0;

        return new Promise(resolve => {
            this.scene.textures.addCanvas('worldmap', smoothCanvas);

            // CRITICAL: Mark texture source as non-canvas to prevent
            // Phaser from re-uploading 256MB to the GPU every frame
            const texSource = this.scene.textures.get('worldmap').source[0];
            texSource.isCanvas = false;

            const img = this.scene.add.image(0, 0, 'worldmap');
            img.setOrigin(0, 0);
            img.setScale(tileSize * scale); // 2.5 * 1 = 2.5

            img.texture.setFilter(Phaser.Textures.FilterMode.LINEAR);

            resolve(img);
        });
    }
}
