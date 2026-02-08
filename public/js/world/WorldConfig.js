import * as Objects from '../objects/index.js';

export const WorldConfig = {
    // World Dimensions
    SIZE: 20000,
    TILE_SIZE: 2.5,
    GRID_SIZE: 8000,
    CHUNK_SIZE: 500,

    // Terrain Types (IDs)
    TERRAIN: {
        DEEP_WATER: 0,
        SHALLOW_WATER: 1,
        SAND: 2,
        GRASS_LIGHT: 3,
        GRASS_DARK: 4,
        DIRT: 5
    },

    // Texture Generation Settings (Dual Noise)
    // Scale: Higher = smaller details (high frequency)
    // Mix: Multiplier for the second noise layer
    TEXTURE_CONFIG: {
        // Deep Water: Large slow waves + small ripples
        0: { scale1: 0.05, scale2: 0.3, mix: 0.4 },
        // Shallow Water: Medium waves + fine ripples
        1: { scale1: 0.08, scale2: 0.4, mix: 0.3 },
        // Sand: Smooth dunes + fine grain
        2: { scale1: 0.03, scale2: 0.8, mix: 0.6 },
        // Grass Light: Large patches + blade detail
        3: { scale1: 0.04, scale2: 0.6, mix: 0.5 },
        // Grass Dark: Dense foliage + texture
        4: { scale1: 0.04, scale2: 0.5, mix: 0.5 },
        // Dirt: Clumpy + gritty
        5: { scale1: 0.1, scale2: 0.9, mix: 0.7 }
    },

    // Harmonized AAA-style Palettes (tight color ranges)
    PALETTES: {
        // 0: Deep Water (Navy - cohesive dark blue)
        0: [
            [18, 42, 78], [20, 45, 82], [22, 48, 86], [19, 44, 80],
            [21, 46, 84], [17, 41, 76], [23, 49, 88], [18, 43, 79],
            [20, 44, 81], [19, 45, 83], [21, 47, 85], [18, 42, 78]
        ],
        // 1: Shallow Water (Turquoise - natural water tones)
        1: [
            [52, 138, 167], [55, 142, 171], [58, 146, 175], [50, 135, 164],
            [54, 140, 169], [56, 144, 173], [53, 139, 168], [57, 145, 174],
            [51, 137, 166], [55, 141, 170], [54, 139, 167], [56, 143, 172]
        ],
        // 2: Sand (Warm Beige - beach tones)
        2: [
            [218, 186, 140], [222, 190, 144], [214, 182, 136], [220, 188, 142],
            [216, 184, 138], [224, 192, 146], [215, 183, 137], [221, 189, 143],
            [217, 185, 139], [223, 191, 145], [219, 187, 141], [213, 181, 135]
        ],
        // 3: Grass Light (Fresh Green - vibrant grass)
        3: [
            [88, 164, 96], [92, 168, 100], [84, 160, 92], [90, 166, 98],
            [86, 162, 94], [94, 170, 102], [85, 161, 93], [91, 167, 99],
            [87, 163, 95], [93, 169, 101], [89, 165, 97], [83, 159, 91]
        ],
        // 4: Grass Dark (Forest Green - deep vegetation)
        4: [
            [48, 98, 56], [52, 102, 60], [44, 94, 52], [50, 100, 58],
            [46, 96, 54], [54, 104, 62], [45, 95, 53], [51, 101, 59],
            [47, 97, 55], [53, 103, 61], [49, 99, 57], [43, 93, 51]
        ],
        // 5: Dirt (Rich Brown - earthy)
        5: [
            [112, 78, 56], [116, 82, 60], [108, 74, 52], [114, 80, 58],
            [110, 76, 54], [118, 84, 62], [109, 75, 53], [115, 81, 59],
            [111, 77, 55], [117, 83, 61], [113, 79, 57], [107, 73, 51]
        ]
    },

    // Vegetation & Objects (delegated to object modules)
    OBJECTS: {
        TREE: Objects.IDS.TREE,
        ROCK_SMALL: Objects.IDS.ROCK_SMALL,
        ROCK_MEDIUM: Objects.IDS.ROCK_MEDIUM,
        ROCK_LARGE: Objects.IDS.ROCK_LARGE,
        FLOWER: Objects.IDS.FLOWER,
        BUSH_SAND: Objects.IDS.BUSH_SAND,
        BUSH_GRASS: Objects.IDS.BUSH_GRASS,
        BUSH_DIRT: Objects.IDS.BUSH_DIRT,

        TREE_SCALE: Objects.CONFIG.TREE.scale,
        ALLOWED_TERRAINS_TREES: Objects.CONFIG.TREE.allowedTerrains,
        ALLOWED_TERRAINS_ROCKS: Objects.CONFIG.ROCK_SMALL.allowedTerrains,
        ALLOWED_TERRAINS_FLOWERS: Objects.CONFIG.FLOWER.allowedTerrains,
        ALLOWED_TERRAINS_BUSH_SAND: Objects.CONFIG.BUSH_SAND.allowedTerrains,
        ALLOWED_TERRAINS_BUSH_GRASS: Objects.CONFIG.BUSH_GRASS.allowedTerrains,
        ALLOWED_TERRAINS_BUSH_DIRT: Objects.CONFIG.BUSH_DIRT.allowedTerrains
    },

    // Object color palettes moved to `public/js/objects/*` modules
    // e.g. Objects.CONFIG and Objects.COLORS
    
};
