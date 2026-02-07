const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── In-memory store ──
const saves = new Map();
let nextId = 1;

function createDefaultPlayer() {
  return {
    x: 2500,
    y: 2500,
    health: 100,
    maxHealth: 100,
    stamina: 100,
    maxStamina: 100,
    attributes: {
      strength: 5,
      agility: 5,
      intelligence: 5,
      endurance: 5
    },
    inventory: []
  };
}

// GET /api/saves — listar partidas
app.get('/api/saves', (req, res) => {
  const list = [];
  for (const [id, save] of saves) {
    list.push({ id, name: save.name, createdAt: save.createdAt, updatedAt: save.updatedAt });
  }
  list.sort((a, b) => b.updatedAt - a.updatedAt);
  res.json(list);
});

// POST /api/saves — nueva partida
app.post('/api/saves', (req, res) => {
  const id = String(nextId++);
  const name = req.body.name || `Partida ${id}`;
  const save = {
    name,
    player: createDefaultPlayer(),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  saves.set(id, save);
  res.json({ id, ...save });
});

// GET /api/saves/:id
app.get('/api/saves/:id', (req, res) => {
  const save = saves.get(req.params.id);
  if (!save) return res.status(404).json({ error: 'Not found' });
  res.json({ id: req.params.id, ...save });
});

// PUT /api/saves/:id — actualizar partida (posición, stats, inventario)
app.put('/api/saves/:id', (req, res) => {
  const save = saves.get(req.params.id);
  if (!save) return res.status(404).json({ error: 'Not found' });
  if (req.body.player) {
    Object.assign(save.player, req.body.player);
    if (req.body.player.attributes) {
      Object.assign(save.player.attributes, req.body.player.attributes);
    }
    if (req.body.player.inventory !== undefined) {
      save.player.inventory = req.body.player.inventory;
    }
  }
  save.updatedAt = Date.now();
  res.json({ id: req.params.id, ...save });
});

// PATCH /api/saves/:id/rename
app.patch('/api/saves/:id/rename', (req, res) => {
  const save = saves.get(req.params.id);
  if (!save) return res.status(404).json({ error: 'Not found' });
  save.name = req.body.name || save.name;
  save.updatedAt = Date.now();
  res.json({ id: req.params.id, ...save });
});

// POST /api/saves/:id/clone
app.post('/api/saves/:id/clone', (req, res) => {
  const original = saves.get(req.params.id);
  if (!original) return res.status(404).json({ error: 'Not found' });
  const id = String(nextId++);
  const save = {
    name: original.name + ' (copia)',
    player: JSON.parse(JSON.stringify(original.player)),
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  saves.set(id, save);
  res.json({ id, ...save });
});

// DELETE /api/saves/:id
app.delete('/api/saves/:id', (req, res) => {
  if (!saves.has(req.params.id)) return res.status(404).json({ error: 'Not found' });
  saves.delete(req.params.id);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
