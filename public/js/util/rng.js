export function createRNG(seed) {
  // Mulberry32 PRNG — fast, small, deterministic
  let s = 0;
  if (typeof seed === 'number') {
    // support floats by scaling
    s = Math.floor(seed * 1000000) >>> 0;
  } else if (typeof seed === 'string') {
    // simple string hash to uint32
    let h = 2166136261 >>> 0;
    for (let i = 0; i < seed.length; i++) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    s = h >>> 0;
  } else {
    s = (Math.random() * 0xFFFFFFFF) >>> 0;
  }

  function mulberry32(a) {
    return function() {
      let t = (a += 0x6D2B79F5) | 0;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const fn = mulberry32(s);
  return {
    // returns [0,1)
    rand: () => fn(),
    // integer in [0, max)
    int: (max) => Math.floor(fn() * max),
    // float in [min, max)
    range: (min, max) => min + fn() * (max - min),
    // choice from array
    choice: (arr) => arr[Math.floor(fn() * arr.length)]
  };
}
