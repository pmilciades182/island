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

    // Vegetation & Objects
    OBJECTS: {
        TREE: 1,
        ROCK_SMALL: 2,
        ROCK_MEDIUM: 3,
        ROCK_LARGE: 4,
        FLOWER: 5,
        BUSH_SAND: 6,
        BUSH_GRASS: 7,
        BUSH_DIRT: 8,

        TREE_SCALE: 4.0,
        ALLOWED_TERRAINS_TREES: [3, 4],
        ALLOWED_TERRAINS_ROCKS: [2, 3, 5], // Sand, Grass Light, Dirt
        ALLOWED_TERRAINS_FLOWERS: [3, 4], // Grass Light, Grass Dark
        ALLOWED_TERRAINS_BUSH_SAND: [2],       // Sand
        ALLOWED_TERRAINS_BUSH_GRASS: [3, 4],   // Grass Light, Grass Dark
        ALLOWED_TERRAINS_BUSH_DIRT: [5]         // Dirt
    },

    // Bush color palettes per terrain (harmonized with terrain palettes)
    BUSH_COLORS: {
        // Sand bushes: dry, muted sage greens and tan
        SAND: [0xA8B06A, 0xB5A86B, 0x8E9960, 0xC2B87A],
        // Grass bushes: vibrant leafy greens
        GRASS: [0x4A8C3F, 0x5DA84E, 0x3B7A34, 0x6BB85A],
        // Dirt bushes: deep olive and brown-greens
        DIRT: [0x6B7A3A, 0x5C6832, 0x7A8844, 0x4E5B2B]
    },

    // Harmonized Flower Colors (AAA-style, cohesive with environment)
    FLOWER_COLORS: [
        0xE74C3C, // Warm Red
        0xF39C12, // Golden Orange
        0xF1C40F, // Sunny Yellow
        0xE8DAEF, // Soft Lavender
        0xAF7AC5, // Purple
        0x5DADE2, // Sky Blue
        0x48C9B0, // Turquoise
        0x52BE80, // Emerald Green
        0xF8B88B, // Peach
        0xEC7063, // Coral
        0xF7DC6F, // Light Yellow
        0xBB8FCE, // Light Purple
        0x85C1E2, // Powder Blue
        0x76D7C4, // Mint
        0xF5B7B1, // Pink
        0xFAD7A0  // Cream
    ]
};
