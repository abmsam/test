const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const highScoreEl = document.getElementById("highScore");
const levelLabel = document.getElementById("levelLabel");
const timeLabel = document.getElementById("timeLabel");
const gamesPlayedEl = document.getElementById("gamesPlayed");
const avgScoreEl = document.getElementById("avgScore");
const bestScoreEl = document.getElementById("bestScore");
const bestLevelEl = document.getElementById("bestLevel");
const difficultySelect = document.getElementById("difficultySelect");
const modeSelect = document.getElementById("modeSelect");
const wrapToggle = document.getElementById("wrapToggle");
const overlay = document.getElementById("overlay");
const statusTitle = document.getElementById("statusTitle");
const statusHint = document.getElementById("statusHint");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");
const resetKeysBtn = document.getElementById("resetKeysBtn");
const controlButtons = Array.from(document.querySelectorAll("[data-action]"));
const keybindButtons = Array.from(document.querySelectorAll(".keybind"));
const toast = document.getElementById("toast");

const GRID_SIZE = 20;
const CELL_SIZE = canvas.width / GRID_SIZE;
const SCORE_PER_LEVEL = 5;
const TIMED_DURATION_MS = 60000;
const STORAGE_KEY = "snake_stats";
const KEYBINDS_KEY = "snake_keybinds";
const POWERUP_TTL_MS = 9000;
const POWERUP_EFFECT_MS = 6000;

const DIFFICULTY = {
  easy: { label: "Easy", tick: 150, speedPerLevel: 4, obstaclesPerLevel: 1 },
  normal: { label: "Normal", tick: 110, speedPerLevel: 6, obstaclesPerLevel: 2 },
  hard: { label: "Hard", tick: 95, speedPerLevel: 8, obstaclesPerLevel: 3 },
};

const MODES = {
  classic: { label: "Classic" },
  timed: { label: "Timed" },
};

const LEVEL_TINTS = [
  { background: "#121a1f", border: "#1f2830" },
  { background: "#151d22", border: "#222c35" },
  { background: "#172027", border: "#25313b" },
  { background: "#19232b", border: "#283644" },
  { background: "#1c2630", border: "#2b3a49" },
  { background: "#1e2936", border: "#2e3f52" },
];

const POWERUPS = {
  speed: { label: "Speed", color: "#e66b6b", multiplier: 0.8 },
  slow: { label: "Slow", color: "#6aa7f5", multiplier: 1.25 },
};

const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const DEFAULT_KEYBINDS = {
  up: "arrowup",
  down: "arrowdown",
  left: "arrowleft",
  right: "arrowright",
};

const KEY_LABELS = {
  arrowup: "Arrow Up",
  arrowdown: "Arrow Down",
  arrowleft: "Arrow Left",
  arrowright: "Arrow Right",
  " ": "Space",
  escape: "Esc",
};

function loadStats() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { gamesPlayed: 0, totalScore: 0, bestScore: 0, bestLevel: 1 };
    }
    const parsed = JSON.parse(raw);
    return {
      gamesPlayed: Number(parsed.gamesPlayed) || 0,
      totalScore: Number(parsed.totalScore) || 0,
      bestScore: Number(parsed.bestScore) || 0,
      bestLevel: Number(parsed.bestLevel) || 1,
    };
  } catch (error) {
    return { gamesPlayed: 0, totalScore: 0, bestScore: 0, bestLevel: 1 };
  }
}

function saveStats(stats) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

function loadKeybinds() {
  try {
    const raw = window.localStorage.getItem(KEYBINDS_KEY);
    if (!raw) return { ...DEFAULT_KEYBINDS };
    const parsed = JSON.parse(raw);
    return {
      up: parsed.up || DEFAULT_KEYBINDS.up,
      down: parsed.down || DEFAULT_KEYBINDS.down,
      left: parsed.left || DEFAULT_KEYBINDS.left,
      right: parsed.right || DEFAULT_KEYBINDS.right,
    };
  } catch (error) {
    return { ...DEFAULT_KEYBINDS };
  }
}

function saveKeybinds(bindings) {
  window.localStorage.setItem(KEYBINDS_KEY, JSON.stringify(bindings));
}

function formatKeyLabel(key) {
  if (!key) return "Unbound";
  return KEY_LABELS[key] || key.toUpperCase();
}

function createInitialState() {
  const mid = Math.floor(GRID_SIZE / 2);
  const initialSnake = [
    { x: mid + 1, y: mid },
    { x: mid, y: mid },
    { x: mid - 1, y: mid },
  ];
  const food = spawnFood(initialSnake, []);
  const obstacles = spawnObstacles(
    DIFFICULTY[currentDifficulty].obstaclesPerLevel,
    initialSnake,
    food,
    []
  );
  return {
    snake: initialSnake,
    direction: "right",
    queuedDirection: "right",
    food,
    obstacles,
    score: 0,
    level: 1,
    running: false,
    gameOver: false,
    mode: modeSelect.value,
    timeRemainingMs: modeSelect.value === "timed" ? TIMED_DURATION_MS : null,
    powerUp: null,
    activeEffect: null,
    wrapWalls: wrapToggle.checked,
  };
}

function spawnFood(snake, obstacles) {
  const occupied = new Set([
    ...snake.map((segment) => `${segment.x},${segment.y}`),
    ...obstacles.map((block) => `${block.x},${block.y}`),
  ]);
  const candidates = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }
  if (candidates.length === 0) {
    return null;
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function spawnPowerUp(snake, obstacles, food) {
  const occupied = new Set([
    ...snake.map((segment) => `${segment.x},${segment.y}`),
    ...obstacles.map((block) => `${block.x},${block.y}`),
  ]);
  if (food) {
    occupied.add(`${food.x},${food.y}`);
  }
  const candidates = [];
  for (let y = 1; y < GRID_SIZE - 1; y += 1) {
    for (let x = 1; x < GRID_SIZE - 1; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }
  if (candidates.length === 0) {
    return null;
  }
  const position = candidates[Math.floor(Math.random() * candidates.length)];
  const types = Object.keys(POWERUPS);
  const type = types[Math.floor(Math.random() * types.length)];
  return { type, position, ttlMs: POWERUP_TTL_MS };
}

function spawnObstacles(count, snake, food, existing) {
  const occupied = new Set([
    ...snake.map((segment) => `${segment.x},${segment.y}`),
    ...existing.map((block) => `${block.x},${block.y}`),
  ]);
  if (food) {
    occupied.add(`${food.x},${food.y}`);
  }
  const candidates = [];
  for (let y = 1; y < GRID_SIZE - 1; y += 1) {
    for (let x = 1; x < GRID_SIZE - 1; x += 1) {
      if (!occupied.has(`${x},${y}`)) {
        candidates.push({ x, y });
      }
    }
  }
  const next = [...existing];
  for (let i = 0; i < count && candidates.length > 0; i += 1) {
    const index = Math.floor(Math.random() * candidates.length);
    next.push(candidates.splice(index, 1)[0]);
  }
  return next;
}

function calculateLevel(score) {
  return Math.floor(score / SCORE_PER_LEVEL) + 1;
}

function getTickMs(level, difficultyKey, effect) {
  const config = DIFFICULTY[difficultyKey];
  const base = config.tick;
  const speedBonus = (level - 1) * config.speedPerLevel;
  const raw = Math.max(55, base - speedBonus);
  if (!effect) return raw;
  const multiplier = POWERUPS[effect.type]?.multiplier || 1;
  return Math.max(45, Math.round(raw * multiplier));
}

function wrapPosition(value) {
  if (value < 0) return GRID_SIZE - 1;
  if (value >= GRID_SIZE) return 0;
  return value;
}

function stepState(state) {
  if (!state.running || state.gameOver) {
    return state;
  }

  const direction = state.queuedDirection;
  const vector = DIRECTIONS[direction];
  const head = state.snake[0];
  let next = { x: head.x + vector.x, y: head.y + vector.y };

  if (state.wrapWalls) {
    next = { x: wrapPosition(next.x), y: wrapPosition(next.y) };
  }

  const hitWall =
    !state.wrapWalls &&
    (next.x < 0 || next.y < 0 || next.x >= GRID_SIZE || next.y >= GRID_SIZE);
  const hitSelf = state.snake.some((segment) => segment.x === next.x && segment.y === next.y);
  const hitObstacle = state.obstacles.some((block) => block.x === next.x && block.y === next.y);

  if (hitWall || hitSelf || hitObstacle) {
    return { ...state, running: false, gameOver: true };
  }

  const grew = state.food && next.x === state.food.x && next.y === state.food.y;
  const hitPower = state.powerUp &&
    next.x === state.powerUp.position.x &&
    next.y === state.powerUp.position.y;

  const nextSnake = [next, ...state.snake];
  if (!grew) {
    nextSnake.pop();
  }

  const nextScore = grew ? state.score + 1 : state.score;
  const nextLevel = calculateLevel(nextScore);
  const leveledUp = nextLevel > state.level;
  const nextFood = grew ? spawnFood(nextSnake, state.obstacles) : state.food;
  const nextObstacles = leveledUp
    ? spawnObstacles(
        DIFFICULTY[currentDifficulty].obstaclesPerLevel,
        nextSnake,
        nextFood,
        state.obstacles
      )
    : state.obstacles;

  const nextPowerUp = hitPower
    ? null
    : state.powerUp;

  const nextEffect = hitPower
    ? { type: state.powerUp.type, remainingMs: POWERUP_EFFECT_MS }
    : state.activeEffect;

  const shouldSpawnPower =
    !hitPower &&
    !state.powerUp &&
    grew &&
    Math.random() < 0.35;

  const spawnedPower = shouldSpawnPower
    ? spawnPowerUp(nextSnake, nextObstacles, nextFood)
    : null;

  return {
    ...state,
    snake: nextSnake,
    direction,
    food: nextFood,
    obstacles: nextObstacles,
    score: nextScore,
    level: nextLevel,
    powerUp: spawnedPower || nextPowerUp,
    activeEffect: nextEffect,
  };
}

function canChangeDirection(current, next) {
  return current !== next && OPPOSITES[current] !== next;
}

let stats = loadStats();
let state = createInitialState();
let timerId = null;
let currentDifficulty = "normal";
let keybinds = loadKeybinds();
let listeningFor = null;
let toastTimeout = null;

function setOverlay(visible, title, hint) {
  if (visible) {
    overlay.classList.add("show");
    statusTitle.textContent = title;
    statusHint.textContent = hint;
  } else {
    overlay.classList.remove("show");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 1200);
}

function startTimer() {
  if (timerId) {
    clearInterval(timerId);
  }
  timerId = setInterval(
    tick,
    getTickMs(state.level, currentDifficulty, state.activeEffect)
  );
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function getLevelTint(level) {
  return LEVEL_TINTS[(level - 1) % LEVEL_TINTS.length];
}

function drawGrid() {
  const tint = getLevelTint(state.level);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = tint.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i += 1) {
    const pos = i * CELL_SIZE;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(canvas.width, pos);
    ctx.stroke();
  }

  ctx.strokeStyle = tint.border;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, canvas.width - 3, canvas.height - 3);
}

function drawSnake() {
  state.snake.forEach((segment, index) => {
    const inset = index === 0 ? 2 : 4;
    const isHead = index === 0;
    ctx.fillStyle = isHead ? "#67e08f" : "#3bbf6b";
    ctx.fillRect(
      segment.x * CELL_SIZE + inset,
      segment.y * CELL_SIZE + inset,
      CELL_SIZE - inset * 2,
      CELL_SIZE - inset * 2
    );

    if (isHead) {
      ctx.fillStyle = "#0f1418";
      const eyeOffset = CELL_SIZE * 0.2;
      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
      let eyeX = 0;
      let eyeY = 0;
      if (state.direction === "up") {
        eyeX = centerX;
        eyeY = centerY - eyeOffset;
      } else if (state.direction === "down") {
        eyeX = centerX;
        eyeY = centerY + eyeOffset;
      } else if (state.direction === "left") {
        eyeX = centerX - eyeOffset;
        eyeY = centerY;
      } else {
        eyeX = centerX + eyeOffset;
        eyeY = centerY;
      }
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function drawFood() {
  if (!state.food) return;
  const centerX = state.food.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = state.food.y * CELL_SIZE + CELL_SIZE / 2;
  ctx.fillStyle = state.level % 2 === 0 ? "#f6a73d" : "#f28aa0";
  ctx.beginPath();
  ctx.arc(centerX, centerY, CELL_SIZE / 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawPowerUp() {
  if (!state.powerUp) return;
  const { position, type } = state.powerUp;
  const color = POWERUPS[type].color;
  const centerX = position.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = position.y * CELL_SIZE + CELL_SIZE / 2;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(centerX, centerY, CELL_SIZE / 3.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawObstacles() {
  ctx.fillStyle = "#44545f";
  state.obstacles.forEach((block) => {
    ctx.fillRect(
      block.x * CELL_SIZE + 3,
      block.y * CELL_SIZE + 3,
      CELL_SIZE - 6,
      CELL_SIZE - 6
    );
  });
}

function formatTime(ms) {
  if (ms == null) return "--";
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${seconds}s`;
}

function updateStatsUI() {
  const average = stats.gamesPlayed ? stats.totalScore / stats.gamesPlayed : 0;
  gamesPlayedEl.textContent = stats.gamesPlayed;
  avgScoreEl.textContent = average.toFixed(1);
  bestScoreEl.textContent = stats.bestScore;
  bestLevelEl.textContent = stats.bestLevel;
  highScoreEl.textContent = stats.bestScore;
}

function render() {
  drawGrid();
  drawFood();
  drawPowerUp();
  drawObstacles();
  drawSnake();
  scoreEl.textContent = state.score;
  levelLabel.textContent = state.level;
  timeLabel.textContent = formatTime(state.timeRemainingMs);
}

function updateTimedState() {
  if (state.mode !== "timed" || state.timeRemainingMs == null) {
    return state;
  }
  const tickMs = getTickMs(state.level, currentDifficulty, state.activeEffect);
  const nextRemaining = state.timeRemainingMs - tickMs;
  if (nextRemaining <= 0) {
    return { ...state, timeRemainingMs: 0, running: false, gameOver: true };
  }
  return { ...state, timeRemainingMs: nextRemaining };
}

function updatePowerUpTimers(nextState) {
  if (nextState.powerUp) {
    const tickMs = getTickMs(nextState.level, currentDifficulty, nextState.activeEffect);
    const ttl = nextState.powerUp.ttlMs - tickMs;
    if (ttl <= 0) {
      nextState = { ...nextState, powerUp: null };
    } else {
      nextState = {
        ...nextState,
        powerUp: { ...nextState.powerUp, ttlMs: ttl },
      };
    }
  }
  if (nextState.activeEffect) {
    const tickMs = getTickMs(nextState.level, currentDifficulty, nextState.activeEffect);
    const remaining = nextState.activeEffect.remainingMs - tickMs;
    if (remaining <= 0) {
      nextState = { ...nextState, activeEffect: null };
    } else {
      nextState = {
        ...nextState,
        activeEffect: { ...nextState.activeEffect, remainingMs: remaining },
      };
    }
  }
  return nextState;
}

function finishGame(nextState) {
  stats.gamesPlayed += 1;
  stats.totalScore += nextState.score;
  if (nextState.score > stats.bestScore) {
    stats.bestScore = nextState.score;
  }
  if (nextState.level > stats.bestLevel) {
    stats.bestLevel = nextState.level;
  }
  saveStats(stats);
  updateStatsUI();
}

function tick() {
  let nextState = stepState(state);

  if (nextState.level > state.level) {
    showToast(`Level ${nextState.level}`);
  }

  nextState = updatePowerUpTimers(nextState);

  if (nextState.running) {
    nextState = updateTimedState(nextState);
  }

  if (nextState.gameOver && !state.gameOver) {
    stopTimer();
    finishGame(nextState);
    const message = state.mode === "timed" ? "Time's up" : "Game Over";
    setOverlay(true, message, "Press Restart or Space to try again.");
  }

  state = nextState;
  render();
  if (state.running) {
    startTimer();
  }
}

function startGame() {
  if (state.gameOver) {
    state = createInitialState();
  }
  state.running = true;
  setOverlay(false);
  startTimer();
}

function pauseGame() {
  state.running = false;
  stopTimer();
  setOverlay(true, "Paused", "Press Start or Space to continue.");
}

function restartGame() {
  state = createInitialState();
  stopTimer();
  setOverlay(true, "Press Start", "Use arrow keys, WASD, or swipe to move.");
  render();
}

function handleDirectionChange(nextDirection) {
  if (canChangeDirection(state.direction, nextDirection)) {
    state.queuedDirection = nextDirection;
  }
}

function handleKeybindCapture(event) {
  if (!listeningFor) return false;
  const key = event.key.toLowerCase();
  if (key === "escape") {
    setListening(null);
    return true;
  }
  applyKeybind(listeningFor, key);
  setListening(null);
  return true;
}

function handleKey(event) {
  if (handleKeybindCapture(event)) {
    event.preventDefault();
    return;
  }
  const key = event.key.toLowerCase();
  if (key === " " || key === "space") {
    if (state.running) {
      pauseGame();
    } else {
      startGame();
    }
    return;
  }

  if (key === "r") {
    restartGame();
    return;
  }

  const direction = Object.keys(keybinds).find((dir) => keybinds[dir] === key);
  if (direction) {
    event.preventDefault();
    handleDirectionChange(direction);
  }
}

function setDifficulty(value) {
  if (!DIFFICULTY[value]) {
    return;
  }
  currentDifficulty = value;
  if (state.running) {
    startTimer();
  }
}

function setMode(value) {
  if (!MODES[value]) {
    return;
  }
  const keepRunning = state.running;
  state = {
    ...state,
    mode: value,
    timeRemainingMs: value === "timed" ? TIMED_DURATION_MS : null,
    running: keepRunning,
    gameOver: false,
  };
  if (keepRunning) {
    startTimer();
  } else {
    stopTimer();
  }
  render();
}

function setWrapWalls(value) {
  state = { ...state, wrapWalls: value };
}

function updateKeybindUI() {
  keybindButtons.forEach((button) => {
    const bind = button.dataset.bind;
    const label = formatKeyLabel(keybinds[bind]);
    const labelEl = button.querySelector("strong");
    if (labelEl) {
      labelEl.textContent = label;
    }
  });
}

function setListening(direction) {
  listeningFor = direction;
  keybindButtons.forEach((button) => {
    if (button.dataset.bind === direction) {
      button.classList.add("listening");
      button.innerHTML = `${button.dataset.bind.toUpperCase()}: <strong>Press a key</strong>`;
    } else {
      button.classList.remove("listening");
    }
  });
  if (!direction) {
    updateKeybindUI();
  }
}

function applyKeybind(direction, key) {
  const normalized = key.toLowerCase();
  const previousKey = keybinds[direction];
  const duplicate = Object.keys(keybinds).find(
    (dir) => dir !== direction && keybinds[dir] === normalized
  );
  if (duplicate) {
    keybinds[duplicate] = previousKey;
  }
  keybinds[direction] = normalized;
  saveKeybinds(keybinds);
  updateKeybindUI();
}

function resetKeybinds() {
  keybinds = { ...DEFAULT_KEYBINDS };
  saveKeybinds(keybinds);
  updateKeybindUI();
}

let touchStart = null;

function handleTouchStart(event) {
  const touch = event.touches[0];
  touchStart = { x: touch.clientX, y: touch.clientY };
}

function handleTouchMove(event) {
  if (!touchStart) return;
  const touch = event.touches[0];
  const dx = touch.clientX - touchStart.x;
  const dy = touch.clientY - touchStart.y;
  const threshold = 24;
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) {
    return;
  }
  if (Math.abs(dx) > Math.abs(dy)) {
    handleDirectionChange(dx > 0 ? "right" : "left");
  } else {
    handleDirectionChange(dy > 0 ? "down" : "up");
  }
  touchStart = null;
}

startBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
restartBtn.addEventListener("click", restartGame);
resetKeysBtn.addEventListener("click", resetKeybinds);

difficultySelect.addEventListener("change", (event) => {
  setDifficulty(event.target.value);
});

modeSelect.addEventListener("change", (event) => {
  setMode(event.target.value);
});

wrapToggle.addEventListener("change", (event) => {
  setWrapWalls(event.target.checked);
});

keybindButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setListening(button.dataset.bind);
  });
});

controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.action;
    handleDirectionChange(action);
  });
});

document.addEventListener("keydown", handleKey);
canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
canvas.addEventListener("touchmove", handleTouchMove, { passive: true });

updateKeybindUI();
updateStatsUI();
render();
setOverlay(true, "Press Start", "Use arrow keys, WASD, or swipe to move.");
