export const INITIAL_FILES: Record<string, { ext: string, dir: string, content: string }> = {
  'game.js': {
    ext: 'js',
    dir: 'src',
    content: `// ╔══════════════════════════════════╗
// ║  GameyCode — game.js  🎮         ║
// ╚══════════════════════════════════╝

import { Player }   from './player.js';
import { Physics }  from './physics.js';
import { Renderer } from './renderer.js';

/**
 * Core game engine.
 * Manages the main loop, entities, and all subsystems.
 */
class GameEngine {
  constructor(config = {}) {
    this.canvas   = document.getElementById('canvas');
    this.ctx      = this.canvas.getContext('2d');
    this.fps      = config.fps ?? 60;
    this.running  = false;
    this.entities = new Map();
    this.physics  = new Physics();
    this.renderer = new Renderer(this.ctx);
  }

  start() {
    if (this.running) return;
    this.running  = true;
    this.lastTime = performance.now();
    requestAnimationFrame(t => this.loop(t));
    console.log(\`🚀 GameyCode running @ \${this.fps}fps\`);
  }

  loop(now) {
    if (!this.running) return;
    const dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    this.physics.step(dt, this.entities);
    this.renderer.draw(this.entities);
    requestAnimationFrame(t => this.loop(t));
  }

  spawn(entity) {
    const id = crypto.randomUUID();
    this.entities.set(id, entity);
    return id;
  }

  stop() {
    this.running = false;
  }
}

const engine = new GameEngine({ fps: 60 });
const hero   = new Player({ x: 100, y: 200, speed: 5 });
engine.spawn(hero);
engine.start();`
  },
  'player.js': {
    ext: 'js',
    dir: 'src',
    content: `// player.js — Player entity

export class Player {
  constructor({ x=0, y=0, speed=3 }) {
    this.x      = x;
    this.y      = y;
    this.speed  = speed;
    this.health = 100;
    this.keys   = new Set();
    this._bindInput();
  }

  _bindInput() {
    addEventListener('keydown', e => this.keys.add(e.key));
    addEventListener('keyup',   e => this.keys.delete(e.key));
  }

  update(dt) {
    const v = this.speed * dt;
    if (this.keys.has('ArrowLeft'))  this.x -= v;
    if (this.keys.has('ArrowRight')) this.x += v;
    if (this.keys.has('ArrowUp'))    this.y -= v;
    if (this.keys.has('ArrowDown'))  this.y += v;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    if (this.health === 0) this.onDeath();
  }

  onDeath() {
    console.log('💀 Player died');
  }
}`
  },
  'physics.js': {
    ext: 'js',
    dir: 'src',
    content: `// physics.js — Physics engine

export class Physics {
  constructor() {
    this.gravity = 9.8;
  }

  step(dt, entities) {
    for (const [id, entity] of entities) {
      if (entity.update) {
        entity.update(dt);
      }
    }
  }
}`
  },
  'renderer.js': {
    ext: 'js',
    dir: 'src',
    content: `// renderer.js — Rendering engine

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
  }

  draw(entities) {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    this.ctx.fillStyle = '#2dd4bf';
    
    for (const [id, entity] of entities) {
      if (entity.x !== undefined && entity.y !== undefined) {
        this.ctx.fillRect(entity.x, entity.y, 32, 32);
      }
    }
  }
}`
  },
  'sprites.css': {
    ext: 'css',
    dir: 'assets',
    content: `/* sprites.css */
body {
  background-color: #0d1117;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  margin: 0;
}
canvas {
  border: 2px solid #1e2d40;
  border-radius: 8px;
  background-color: #111620;
}`
  },
  'index.html': {
    ext: 'html',
    dir: 'assets',
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport"
        content="width=device-width,initial-scale=1"/>
  <title>My Game</title>
  <link rel="stylesheet" href="./sprites.css"/>
</head>
<body>
  <canvas id="canvas"
          width="800"
          height="600"></canvas>
  <script type="module"
          src="../src/game.js"></script>
</body>
</html>`
  },
  'config.json': {
    ext: 'json',
    dir: '',
    content: `{
  "name": "my-game",
  "version": "1.0.0",
  "engine": "GameyCode",
  "settings": {
    "fps": 60,
    "resolution": [800, 600],
    "debug": false
  }
}`
  },
  'README.md': {
    ext: 'md',
    dir: '',
    content: `# my-game

A 2D game built with GameyCode.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Controls

- Arrow keys to move
- Space to jump
- Z to attack

## License
MIT`
  }
};

export type TreeNode = {
  type: 'folder' | 'file';
  name: string;
  open?: boolean;
  children?: string[];
};

export const INITIAL_TREE: TreeNode[] = [
  { type: 'folder', name: 'src', open: true, children: ['game.js', 'player.js', 'physics.js', 'renderer.js'] },
  { type: 'folder', name: 'assets', open: true, children: ['index.html', 'sprites.css'] },
  { type: 'file', name: 'config.json' },
  { type: 'file', name: 'README.md' }
];
