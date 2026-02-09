import * as Tree from './tree/vars.js';
import * as RockSmall from './rock_small/vars.js';
import * as RockMedium from './rock_medium/vars.js';
import * as RockLarge from './rock_large/vars.js';
import * as Flower from './flower/vars.js';
import * as BushSand from './bush_sand/vars.js';
import * as BushGrass from './bush_grass/vars.js';
import * as BushDirt from './bush_dirt/vars.js';
import * as Apple from './apple/vars.js';

export const IDS = {
  TREE: Tree.ID,
  ROCK_SMALL: RockSmall.ID,
  ROCK_MEDIUM: RockMedium.ID,
  ROCK_LARGE: RockLarge.ID,
  FLOWER: Flower.ID,
  BUSH_SAND: BushSand.ID,
  BUSH_GRASS: BushGrass.ID,
  BUSH_DIRT: BushDirt.ID
  ,APPLE: Apple.ID
};

export const CONFIG = {
  TREE: Tree.CONFIG,
  ROCK_SMALL: RockSmall.CONFIG,
  ROCK_MEDIUM: RockMedium.CONFIG,
  ROCK_LARGE: RockLarge.CONFIG,
  FLOWER: Flower.CONFIG,
  BUSH_SAND: BushSand.CONFIG,
  BUSH_GRASS: BushGrass.CONFIG,
  BUSH_DIRT: BushDirt.CONFIG
  ,APPLE: Apple.CONFIG
};

// Palettes are now available as `CONFIG.*.colors` on each object module

export { default as TreeDef } from './tree/definition.js';
export { default as RockSmallDef } from './rock_small/definition.js';
export { default as RockMediumDef } from './rock_medium/definition.js';
export { default as RockLargeDef } from './rock_large/definition.js';
export { default as FlowerDef } from './flower/definition.js';
export { default as BushSandDef } from './bush_sand/definition.js';
export { default as BushGrassDef } from './bush_grass/definition.js';
export { default as BushDirtDef } from './bush_dirt/definition.js';
export { default as AppleDef } from './apple/definition.js';
