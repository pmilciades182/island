class SaveManager {
  static STORAGE_KEY = 'island_survival_saves';

  static _load() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return { nextId: 1, saves: {} };
    return JSON.parse(raw);
  }

  static _save(store) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
  }

  static _defaultPlayer() {
    return {
      x: 16975.83,
      y: 10329.03,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      maxStamina: 100,
      attributes: { strength: 5, agility: 5, intelligence: 5, endurance: 5 },
      inventory: []
    };
  }

  /** Returns sorted array of { id, name, createdAt, updatedAt } */
  static list() {
    const store = this._load();
    return Object.entries(store.saves)
      .map(([id, s]) => ({ id, name: s.name, createdAt: s.createdAt, updatedAt: s.updatedAt }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /** Creates a new save, returns { id, name, player, createdAt, updatedAt } */
  static create(name) {
    const store = this._load();
    const id = String(store.nextId++);
    const save = {
      name: name || `Partida ${id}`,
      player: this._defaultPlayer(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    store.saves[id] = save;
    this._save(store);
    return { id, ...save };
  }

  /** Returns { id, name, player, createdAt, updatedAt } or null */
  static get(id) {
    const store = this._load();
    const save = store.saves[id];
    if (!save) return null;
    return { id, ...save };
  }

  /** Updates player data for a save */
  static update(id, data) {
    const store = this._load();
    const save = store.saves[id];
    if (!save) return null;
    if (data.player) {
      Object.assign(save.player, data.player);
      if (data.player.attributes) {
        Object.assign(save.player.attributes, data.player.attributes);
      }
      if (data.player.inventory !== undefined) {
        save.player.inventory = data.player.inventory;
      }
    }
    save.updatedAt = Date.now();
    this._save(store);
    return { id, ...save };
  }

  /** Renames a save */
  static rename(id, name) {
    const store = this._load();
    const save = store.saves[id];
    if (!save) return null;
    save.name = name || save.name;
    save.updatedAt = Date.now();
    this._save(store);
    return { id, ...save };
  }

  /** Clones a save, returns the new save */
  static clone(id) {
    const store = this._load();
    const original = store.saves[id];
    if (!original) return null;
    const newId = String(store.nextId++);
    const save = {
      name: original.name + ' (copia)',
      player: JSON.parse(JSON.stringify(original.player)),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    store.saves[newId] = save;
    this._save(store);
    return { id: newId, ...save };
  }

  /** Deletes a save, returns true if found */
  static delete(id) {
    const store = this._load();
    if (!store.saves[id]) return false;
    delete store.saves[id];
    this._save(store);
    return true;
  }
}
