// ============================================================
// RUNVERSE - COMPLETE JAVASCRIPT
// ============================================================

"use strict";

// ============================================================
// 1. CANVAS & ELEMENTS
// ============================================================

const canvas = document.getElementById("game");
const ctx = canvas ? canvas.getContext("2d") : null;

const W = 960;
const H = 540;
const ground = 430;

const $ = id => document.getElementById(id);

function on(id, event, callback) {
  const element = $(id);
  if (element) element.addEventListener(event, callback);
}

function showElement(id, visible) {
  const element = $(id);
  if (!element) return;

  if (visible) {
    element.classList.remove("hidden");

    if (id === "controls") {
      element.style.display = "flex";
    } else {
      element.style.display = "";
    }
  } else {
    element.style.display = "none";
  }
}

function setText(id, value) {
  const element = $(id);
  if (element) element.textContent = value;
}
document.querySelectorAll("button").forEach(button => {
  button.type = "button";
});
// ============================================================
// 2. SAFE STORAGE
// ============================================================

function loadData(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn("Storage unavailable:", error);
  }
}

// ============================================================
// 3. PLAYER DATA
// ============================================================

let coins = loadData("runverseCoins", 0);
let bestScore = loadData("runverseBest", 0);
let totalXP = loadData("runverseXP", 0);
let totalRuns = loadData("runverseRuns", 0);
let lifetimeCoins = loadData("runverseLifetimeCoins", 0);

let unlockedCharacters = loadData(
  "runverseUnlockedCharacters",
  ["runner"]
);

let selectedCharacter = loadData(
  "runverseSelectedCharacter",
  "runner"
);

let unlockedMaps = loadData(
  "runverseUnlockedMaps",
  ["city"]
);

let selectedMap = loadData(
  "runverseSelectedMap",
  "city"
);

let upgrades = loadData("runverseUpgrades", {
  magnet: 0,
  shield: 0,
  boost: 0
});

let claimedAchievements = loadData(
  "runverseAchievements",
  []
);

let dailyClaimed = loadData("runverseDailyClaimed", "");
let soundEnabled = loadData("runverseSound", true);
let musicEnabled = loadData("runverseMusic", true);
let vibrationEnabled = loadData("runverseVibration", true);

const characterPrices = {
  runner: 0,
  hero: 500,
  ninja: 1000
};

const mapPrices = {
  city: 0,
  jungle: 500,
  desert: 1000,
  space: 2000
};

const upgradePrices = {
  magnet: [300, 600, 1000],
  shield: [400, 800, 1200],
  boost: [500, 900, 1400]
};

const characterColors = {
  runner: "#20d9ff",
  hero: "#ffc928",
  ninja: "#b45cff"
};

// ============================================================
// 4. GAME STATE
// ============================================================

let state = "menu";
let animationId = 0;
let lastTime = 0;

let score = 0;
let runCoins = 0;
let speed = 6;
let distance = 0;
let lives = 3;

let obstacles = [];
let coinsOnRoad = [];
let powerUps = [];
let particles = [];

let obstacleTimer = 0;
let coinTimer = 0;
let powerTimer = 0;

let magnetTimer = 0;
let shieldTimer = 0;
let boostTimer = 0;

let messageTimer = 0;
let gameTime = 0;

let slideHeld = false;
let jumpHeld = false;

let cameraShake = 0;
let flashTimer = 0;

// ============================================================
// 5. PLAYER
// ============================================================

const player = {
  x: 150,
  y: ground - 70,
  w: 48,
  h: 70,
  vy: 0,
  gravity: 0.75,
  jumpPower: -15,
  sliding: false,
  onGround: true,
  invincible: 0,
  animation: 0
};

function resetPlayer() {
  player.y = ground - player.h;
  player.vy = 0;
  player.sliding = false;
  player.onGround = true;
  player.invincible = 0;
  player.animation = 0;
}

// ============================================================
// 6. SCREEN NAVIGATION
// ============================================================

const screens = [
  "main-menu",
  "adventure-menu",
  "store-menu",
  "extras-menu",
  "achievements-screen",
  "daily-rewards-screen",
  "characters-screen",
  "maps-screen",
  "shop-screen",
  "settings-screen",
  "pause-screen",
  "game-over"
];

let previousScreen = "main-menu";
function hideAllScreens() {
  screens.forEach(id => {
    const element = $(id);
    if (element) {
      element.classList.add("hidden");
      element.style.display = "";
    }
  });
}

function showScreen(id) {
  
  hideAllScreens();

  const target = $(id);

  if (target) {
    target.classList.remove("hidden");
  }

  showElement("hud", false);
  showElement("controls", false);

  if (id === "main-menu" ||
      id === "adventure-menu" ||
      id === "store-menu" ||
      id === "extras-menu" ||
      id === "characters-screen" ||
      id === "maps-screen" ||
      id === "shop-screen" ||
      id === "settings-screen" ||
      id === "achievements-screen" ||
      id === "daily-rewards-screen") {
    state = "menu";
  }
}

window.openRunversePage = function(id) {
  if (state === "playing" || state === "paused") return;
  showScreen(id);
};


function goBack(id) {
  showScreen(id);
}

// ============================================================
// 7. MENU BUTTONS
// ============================================================

on("play-btn", "click", startGame);

on("maps-btn", "click", () => {
  showScreen("maps-screen");
});

on("adventure-maps-btn", "click", () => {
  showScreen("maps-screen");
});

on("characters-btn", "click", () => {
  updateCharactersUI();
  showScreen("characters-screen");
});

on("shop-btn", "click", () => {
  updateShopUI();
  showScreen("shop-screen");
});

on("daily-rewards-btn", "click", () => {
  updateDailyUI();
  showScreen("daily-rewards-screen");
});

on("achievements-btn", "click", () => {
  updateAchievementsUI();
  showScreen("achievements-screen");
});

on("settings-btn", "click", () => {
  updateSettingsUI();
  showScreen("settings-screen");
});

on("maps-back-btn", "click", () => goBack("main-menu"));
on("characters-back-btn", "click", () => goBack("adventure-menu"));
on("shop-back-btn", "click", () => goBack("store-menu"));
on("achievements-back-btn", "click", () => goBack("extras-menu"));
on("daily-rewards-back-btn", "click", () => goBack("extras-menu"));
on("settings-back-btn", "click", () => goBack("extras-menu"));

// ============================================================
// 8. LEVEL & XP - INCREASING REQUIREMENTS
// ============================================================

function xpNeededForLevel(level) {
  return 300 + (level - 1) * 150;
}

function getLevel() {
  let level = 1;
  let remainingXP = totalXP;

  while (remainingXP >= xpNeededForLevel(level)) {
    remainingXP -= xpNeededForLevel(level);
    level++;
  }

  return level;
}

function getLevelProgress() {
  let level = 1;
  let remainingXP = totalXP;

  while (remainingXP >= xpNeededForLevel(level)) {
    remainingXP -= xpNeededForLevel(level);
    level++;
  }

  return {
    current: remainingXP,
    required: xpNeededForLevel(level)
  };
}

function updateXP(amount) {
  totalXP += amount;
  saveData("runverseXP", totalXP);
  updateMainUI();
}

function updateMainUI() {
  const level = getLevel();
  const progress = getLevelProgress();

  setText("player-level", "LEVEL " + level);
  setText(
    "xp-text",
    progress.current + " / " + progress.required + " XP"
  );

  const fill = $("xp-fill");

  if (fill) {
    fill.style.width =
      (progress.current / progress.required * 100) + "%";
  }

  setText("coin-total", coins);
  setText("best-total", bestScore);
}

// ============================================================
// 9. CHARACTER SYSTEM
// ============================================================

function updateCharactersUI() {
  document.querySelectorAll(".character-select-btn").forEach(button => {
    const character = button.dataset.character;
    const unlocked = unlockedCharacters.includes(character);

    button.textContent =
      character === selectedCharacter
        ? "SELECTED"
        : unlocked
          ? "SELECT"
          : "LOCKED";
  });
}

document.querySelectorAll(".character-select-btn").forEach(button => {
  button.addEventListener("click", () => {
    const character = button.dataset.character;
    if (!character) return;

    if (unlockedCharacters.includes(character)) {
      selectedCharacter = character;
      saveData("runverseSelectedCharacter", character);
      updateCharactersUI();
      showMessage("Character selected!");
    } else {
      showMessage("Unlock this character in the shop!");
    }
  });
});

// ============================================================
// 10. MAP SYSTEM
// ============================================================

function updateMapsUI() {
  document.querySelectorAll(".map-select-btn").forEach(button => {
    const map = button.dataset.map;
    const unlocked = unlockedMaps.includes(map);

    button.textContent =
      map === selectedMap
        ? "SELECTED"
        : unlocked
          ? "SELECT"
          : "LOCKED";
  });
}

document.querySelectorAll(".map-select-btn").forEach(button => {
  button.addEventListener("click", () => {
    const map = button.dataset.map;
    if (!map || mapPrices[map] === undefined) return;

    if (unlockedMaps.includes(map)) {
      selectedMap = map;
      saveData("runverseSelectedMap", map);
      updateMapsUI();
      showMessage("Map selected!");
    } else {
      const price = mapPrices[map];

      if (coins < price) {
        showMessage("Not enough coins!");
        return;
      }

      coins -= price;
      unlockedMaps.push(map);
      selectedMap = map;

      saveData("runverseCoins", coins);
      saveData("runverseUnlockedMaps", unlockedMaps);
      saveData("runverseSelectedMap", selectedMap);

      updateMapsUI();
      updateMainUI();
      showMessage("Map unlocked!");
    }
  });
});

// ============================================================
// 11. SHOP
// ============================================================

function updateShopUI() {
  setText("shop-coins", coins);

  document.querySelectorAll(".shop-buy-btn").forEach(button => {
    const character = button.dataset.character;
    const unlocked = unlockedCharacters.includes(character);

    button.textContent = unlocked
      ? "OWNED"
      : "BUY " + (characterPrices[character] || 0);
  });

  document.querySelectorAll(".shop-upgrade-btn").forEach(button => {
    const upgrade = button.dataset.upgrade;
    const level = upgrades[upgrade] || 0;
    const prices = upgradePrices[upgrade] || [];

    button.textContent = level >= 3
      ? "MAX LEVEL"
      : "UPGRADE " + prices[level] + " COINS";
  });
}

document.querySelectorAll(".shop-buy-btn").forEach(button => {
  button.addEventListener("click", () => {
    const character = button.dataset.character;
    const price = characterPrices[character];

    if (price === undefined) return;

    if (unlockedCharacters.includes(character)) {
      showMessage("Already unlocked!");
      return;
    }

    if (coins < price) {
      showMessage("Not enough coins!");
      return;
    }

    coins -= price;
    unlockedCharacters.push(character);

    saveData("runverseCoins", coins);
    saveData("runverseUnlockedCharacters", unlockedCharacters);

    updateShopUI();
    updateCharactersUI();
    updateMainUI();
    showMessage("Character unlocked!");
  });
});

document.querySelectorAll(".shop-upgrade-btn").forEach(button => {
  button.addEventListener("click", () => {
    const type = button.dataset.upgrade;
    const level = upgrades[type] || 0;
    const prices = upgradePrices[type];

    if (!prices || level >= 3) {
      showMessage("Maximum level reached!");
      return;
    }

    const price = prices[level];

    if (coins < price) {
      showMessage("Not enough coins!");
      return;
    }

    coins -= price;
    upgrades[type]++;

    saveData("runverseCoins", coins);
    saveData("runverseUpgrades", upgrades);

    updateShopUI();
    updateMainUI();
    showMessage("Upgrade purchased!");
  });
});

// ============================================================
// 12. DAILY REWARDS
// ============================================================

function getToday() {
  return new Date().toDateString();
}

function updateDailyUI() {
  const claimed = dailyClaimed === getToday();

  const button = $("claim-reward-btn");
  if (button) {
    button.disabled = claimed;
    button.textContent = claimed ? "CLAIMED TODAY" : "CLAIM REWARD";
  }

  setText(
    "daily-reward-message",
    claimed ? "Come back tomorrow!" : "Your daily reward is ready!"
  );
}

on("claim-reward-btn", "click", () => {
  if (dailyClaimed === getToday()) {
    showMessage("Already claimed today!");
    return;
  }

  coins += 100;
  lifetimeCoins += 100;
  dailyClaimed = getToday();

  saveData("runverseCoins", coins);
  saveData("runverseLifetimeCoins", lifetimeCoins);
  saveData("runverseDailyClaimed", dailyClaimed);

  updateDailyUI();
  updateMainUI();
  showMessage("+100 Daily Coins!");
});

// ============================================================
// 13. ACHIEVEMENTS
// ============================================================

const achievements = [
  { id: "first", target: 1, reward: 50, text: "Play your first run" },
  { id: "coins", target: 100, reward: 100, text: "Collect 100 coins" },
  { id: "speed", target: 20, reward: 150, text: "Reach score 20" },
  { id: "legend", target: 100, reward: 300, text: "Reach score 100" },
  { id: "survivor", target: 3, reward: 100, text: "Play 3 runs" },
  { id: "rich", target: 1000, reward: 250, text: "Collect 1000 lifetime coins" },
  { id: "master", target: 10, reward: 500, text: "Reach level 10" }
];

function achievementProgress(item) {
  switch (item.id) {
    case "first": return totalRuns;
    case "coins": return lifetimeCoins;
    case "speed": return bestScore;
    case "legend": return bestScore;
    case "survivor": return totalRuns;
    case "rich": return lifetimeCoins;
    case "master": return getLevel();
    default: return 0;
  }
}

function updateAchievementsUI() {
  achievements.forEach(item => {
    const card = $("achievement-" + item.id);
    if (!card) return;

    const progress = Math.min(
      achievementProgress(item),
      item.target
    );

    const bar = card.querySelector(".achievement-progress");
    if (bar) bar.style.width = (progress / item.target * 100) + "%";

    const button = card.querySelector(".achievement-claim-btn");

    if (button) {
      button.disabled =
        progress < item.target ||
        claimedAchievements.includes(item.id);

      button.textContent = claimedAchievements.includes(item.id)
        ? "CLAIMED"
        : progress >= item.target
          ? "CLAIM " + item.reward
          : progress + " / " + item.target;
    }
  });
}

document.querySelectorAll(".achievement-claim-btn").forEach(button => {
  button.addEventListener("click", () => {
    const card = button.closest("[id^='achievement-']");
    if (!card) return;

    const id = card.id.replace("achievement-", "");
    const item = achievements.find(a => a.id === id);

    if (!item || claimedAchievements.includes(id)) return;

    if (achievementProgress(item) < item.target) {
      showMessage("Achievement not completed!");
      return;
    }

    coins += item.reward;
    claimedAchievements.push(id);

    saveData("runverseCoins", coins);
    saveData("runverseAchievements", claimedAchievements);

    updateAchievementsUI();
    updateMainUI();
    showMessage("Achievement reward claimed!");
  });
});

// ============================================================
// 14. GAME START
// ============================================================

function startGame() {
  cancelAnimationFrame(animationId);

  state = "playing";

  score = 0;
  runCoins = 0;
  speed = 6;
  distance = 0;
  lives = 3;

  obstacles = [];
  coinsOnRoad = [];
  powerUps = [];
  particles = [];

  obstacleTimer = 0;
  coinTimer = 0;
  powerTimer = 0;

  magnetTimer = 0;
  shieldTimer = 0;
  boostTimer = 0;

  gameTime = 0;
  cameraShake = 0;
  flashTimer = 0;

  stopSlide();
  jumpHeld = false;

  resetPlayer();

  totalRuns++;
  saveData("runverseRuns", totalRuns);

  showElement("hud", true);
  showElement("controls", true);
  hideAllScreens();

  updateHUD();

  lastTime = 0;
  animationId = requestAnimationFrame(gameLoop);
}

// ============================================================
// 15. HUD
// ============================================================

function updateHUD() {
  setText("score", Math.floor(score));
  setText("run-coins", runCoins);
}
// ============================================================
// 16. JUMP & SLIDE
// ============================================================

function jump() {
  if (state !== "playing") return;
  if (!player.onGround || player.sliding) return;

  player.vy = player.jumpPower;
  player.onGround = false;

  playSound("jump");
}

function startSlide() {
  if (state !== "playing") return;
  if (!player.onGround) return;

  slideHeld = true;
  player.sliding = true;
}

function stopSlide() {
  slideHeld = false;
  player.sliding = false;
}
  // ============================================================
// 17. MOBILE BUTTONS
// ============================================================

const jumpButton = $("jump-btn");
const slideButton = $("slide-btn");

if (jumpButton) {
  jumpButton.style.touchAction = "none";

  jumpButton.addEventListener("pointerdown", event => {
    event.preventDefault();
    if (event.button !== undefined && event.button !== 0) return;
    jump();
  });
}

if (slideButton) {
  slideButton.style.touchAction = "none";

  slideButton.addEventListener("pointerdown", event => {
    event.preventDefault();
    if (event.button !== undefined && event.button !== 0) return;

    slideHeld = true;
    startSlide();

    try {
      slideButton.setPointerCapture(event.pointerId);
    } catch {}
  });

  slideButton.addEventListener("pointerup", event => {
    event.preventDefault();
    stopSlide();
  });

  slideButton.addEventListener("pointercancel", stopSlide);
  slideButton.addEventListener("lostpointercapture", stopSlide);
}

window.addEventListener("pointerup", stopSlide);
window.addEventListener("pointercancel", stopSlide);
window.addEventListener("blur", stopSlide);

window.addEventListener("keydown", event => {
  if (event.repeat) return;

  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    jump();
  }

  if (event.code === "ArrowDown" || event.code === "KeyS") {
    event.preventDefault();
    startSlide();
  }

  if (event.code === "Escape") {
    if (state === "playing") pauseGame();
    else if (state === "paused") resumeGame();
  }
});

window.addEventListener("keyup", event => {
  if (event.code === "ArrowDown" || event.code === "KeyS") {
    stopSlide();
  }
});
// ============================================================
// 18. PLAYER UPDATE
// ============================================================

function updatePlayer(dt) {
  const frameScale = dt / 16.67;

  if (!player.onGround) {
    player.vy += player.gravity * frameScale;
    player.y += player.vy * frameScale;

    if (player.y >= ground - player.h) {
      player.y = ground - player.h;
      player.vy = 0;
      player.onGround = true;
    }
  }

  player.sliding = slideHeld && player.onGround;
  player.animation += dt * 0.02;

  if (player.invincible > 0) {
    player.invincible -= dt;
  }
}
// ============================================================
// 19. SPAWN OBSTACLES
// ============================================================

function spawnObstacle() {
  const types = ["crate", "cone", "overhead"];
  const type = types[Math.floor(Math.random() * types.length)];

  if (type === "overhead") {
    // Is obstacle ko slide karke cross karna hoga
    obstacles.push({
      x: W + 40,
      y: ground - 72,
      w: 105,
      h: 22,
      type: "overhead"
    });
  } else if (type === "crate") {
    obstacles.push({
      x: W + 40,
      y: ground - 38,
      w: 42,
      h: 38,
      type: "crate"
    });
  } else {
    obstacles.push({
      x: W + 40,
      y: ground - 42,
      w: 42,
      h: 42,
      type: "cone"
    });
  }
}
// ============================================================
// 20. SPAWN COIN GROUPS
// ============================================================

function spawnCoinGroup() {
  const count = Math.floor(Math.random() * 4) + 1;

  const height = Math.random() > 0.5 ? 110 : 65;
  const spacing = 38;

  for (let i = 0; i < count; i++) {
    coinsOnRoad.push({
      x: W + 30 + i * spacing,
      y: ground - height,
      r: 13,
      rotation: 0
    });
  }
}
// ============================================================
// 21. SPAWN POWER-UPS
// ============================================================

function spawnPowerUp() {
  const types = ["magnet", "shield", "boost"];
  const type = types[Math.floor(Math.random() * types.length)];

  powerUps.push({
    x: W + 30,
    y: ground - 70,
    r: 19,
    type,
    rotation: 0,
    pulse: 0
  });
}
// ============================================================
// 22. COLLISION
// ============================================================

function rectanglesCollide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function getPlayerBox() {
  return {
    x: player.x + 5,
    y: player.sliding ? player.y + 35 : player.y + 5,
    w: player.w - 10,
    h: player.sliding ? 35 : player.h - 10
  };
}

// ============================================================
// 23. HIT PLAYER
// ============================================================

function hitPlayer() {
  if (player.invincible > 0) return;
  if (shieldTimer > 0) {
    shieldTimer = 0;
    player.invincible = 900;
    showMessage("Shield protected you!");
    return;
  }

  lives--;
  player.invincible = 1200;
  cameraShake = 12;
  flashTimer = 180;

  if (vibrationEnabled && navigator.vibrate) {
    navigator.vibrate(100);
  }

  if (lives <= 0) {
    endGame();
  }
}

// ============================================================
// 24. COLLECT COINS
// ============================================================

function collectCoin() {
  runCoins++;
  coins++;
  lifetimeCoins++;

  saveData("runverseCoins", coins);
  saveData("runverseLifetimeCoins", lifetimeCoins);

  createParticles(
    player.x + 25,
    player.y + 20,
    "#ffd43b",
    8
  );
}
// ============================================================
// 25. COLLECT POWER-UPS
// ============================================================

function collectPowerUp(type) {
  if (type === "magnet") {
    magnetTimer = 6000 + upgrades.magnet * 1500;
    showMessage("MAGNET ACTIVATED!");
  }

  if (type === "shield") {
    shieldTimer = 5000 + upgrades.shield * 1500;
    showMessage("SHIELD ACTIVATED!");
  }

  if (type === "boost") {
    boostTimer = 3500 + upgrades.boost * 1000;
    showMessage("SPEED BOOST!");
  }

  playSound("power");

  createParticles(
    player.x + 25,
    player.y + 25,
    "#62f5ff",
    22
  );
}
// ============================================================
// 26. GAME UPDATE
// ============================================================

function updateGame(dt) {
  if (state !== "playing") return;

  gameTime += dt;
  distance += speed * dt * 0.06;

  speed = Math.min(13, 6 + score * 0.025);

  if (boostTimer > 0) {
    boostTimer -= dt;
  }

  if (magnetTimer > 0) {
    magnetTimer -= dt;
  }

  if (shieldTimer > 0) {
    shieldTimer -= dt;
  }

  if (player.invincible > 0) {
    player.invincible -= dt;
  }

  updatePlayer(dt);

  obstacleTimer += dt;
  coinTimer += dt;
  powerTimer += dt;

  if (obstacleTimer > Math.max(650, 1500 - speed * 45)) {
    spawnObstacle();
    obstacleTimer = 0;
  }

  if (coinTimer > 1400 + Math.random() * 700) {
  spawnCoinGroup();
  coinTimer = 0;
  }

  if (powerTimer > 7000) {
    spawnPowerUp();
    powerTimer = 0;
  }

  const movement = speed * (boostTimer > 0 ? 1.65 : 1) * dt * 0.06;

  obstacles.forEach(obstacle => {
    obstacle.x -= movement;
  });

  coinsOnRoad.forEach(coin => {
    coin.x -= movement;
    coin.rotation += dt * 0.008;

    if (magnetTimer > 0) {
      const dx = player.x - coin.x;
      const dy = player.y + 25 - coin.y;

      if (Math.abs(dx) < 260 && Math.abs(dy) < 160) {
        coin.x += dx * 0.025;
        coin.y += dy * 0.025;
      }
    }
  });

  powerUps.forEach(power => {
    power.x -= movement;
    power.rotation += dt * 0.004;
  });

  obstacles = obstacles.filter(o => o.x + o.w > -20);
  coinsOnRoad = coinsOnRoad.filter(c => c.x + c.r > -20);
  powerUps = powerUps.filter(p => p.x + p.r > -20);

  const playerBox = getPlayerBox();

  for (const obstacle of obstacles) {
    if (rectanglesCollide(playerBox, obstacle)) {
      obstacle.x = -200;
      hitPlayer();
      break;
    }
  }

  for (const coin of coinsOnRoad) {
    const dx = player.x + 24 - coin.x;
    const dy = player.y + 30 - coin.y;

    if (Math.sqrt(dx * dx + dy * dy) < 35) {
      coin.x = -200;
      collectCoin();
    }
  }

  for (const power of powerUps) {
    const dx = player.x + 24 - power.x;
    const dy = player.y + 30 - power.y;

    if (Math.sqrt(dx * dx + dy * dy) < 38) {
      power.x = -200;
      collectPowerUp(power.type);
    }
  }

  score += movement * 0.015;

  if (Math.floor(score) % 5 === 0) {
    updateHUD();
  }

  updateParticles(dt);
}

// ============================================================
// 27. PARTICLES
// ============================================================

function createParticles(x, y, color, amount) {
  for (let i = 0; i < amount; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 500 + Math.random() * 400,
      color,
      size: 2 + Math.random() * 5
    });
  }
}

function updateParticles(dt) {
  particles.forEach(p => {
    p.x += p.vx * dt * 0.06;
    p.y += p.vy * dt * 0.06;
    p.life -= dt;
  });

  particles = particles.filter(p => p.life > 0);
}
// ============================================================
// 28. BACKGROUND
// ============================================================

function drawBackground() {
  let sky = "#101d3b";
  let groundColor = "#29394c";

  if (selectedMap === "jungle") {
    sky = "#123d35";
    groundColor = "#315c37";
  }

  if (selectedMap === "desert") {
    sky = "#c97937";
    groundColor = "#b77b3d";
  }

  if (selectedMap === "space") {
    sky = "#090b25";
    groundColor = "#28264e";
  }

  // Sky gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, H);
  gradient.addColorStop(0, sky);
  gradient.addColorStop(1, "#18243c");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, W, H);

  // Sun
  ctx.fillStyle =
    selectedMap === "space" ? "#c9baff" : "#ffd36b";

  ctx.beginPath();
  ctx.arc(760, 105, 42, 0, Math.PI * 2);
  ctx.fill();

  // Stars in space map
  if (selectedMap === "space") {
    ctx.fillStyle = "white";

    for (let i = 0; i < 55; i++) {
      const x = (i * 173 + distance * 0.4) % W;
      const y = (i * 67) % 330;

      ctx.fillRect(x, y, 2, 2);
    }
  }

  // Buildings and scenery
  if (selectedMap === "city") {

    const buildingSpacing = 105;
    const totalWidth = W + 120;

    for (let i = 0; i < 12; i++) {

      let x =
        (i * buildingSpacing - distance * 1.0) % totalWidth;

      x = (x + totalWidth) % totalWidth - 80;

      const h = 100 + (i % 4) * 35;

      // Building
      ctx.fillStyle = "#263750";
      ctx.fillRect(x, ground - h, 80, h);

      // Building windows
      ctx.fillStyle = "#f8d77c";

      for (
        let wy = ground - h + 15;
        wy < ground - 12;
        wy += 25
      ) {
        for (let wx = x + 12; wx < x + 70; wx += 23) {
          ctx.fillRect(wx, wy, 8, 10);
        }
      }
    }

  } else {

    // Other maps scenery
    for (let i = 0; i < 9; i++) {

      const x =
        (i * 130 - distance * 0.35) % (W + 150);

      if (selectedMap === "jungle") {

        // Tree trunk
        ctx.fillStyle = "#164b32";
        ctx.fillRect(x + 25, ground - 150, 14, 150);

        // Tree leaves
        ctx.fillStyle = "#26784b";
        ctx.beginPath();
        ctx.arc(x + 32, ground - 155, 55, 0, Math.PI * 2);
        ctx.fill();

      } else if (selectedMap === "desert") {

        // Desert dunes
        ctx.fillStyle = "#e6a24f";
        ctx.beginPath();
        ctx.arc(x + 40, ground, 65, Math.PI, 0);
        ctx.fill();

      } else if (selectedMap === "space") {

        // Space buildings
        ctx.fillStyle = "#4e4b8c";
        ctx.fillRect(x + 15, ground - 120, 70, 120);

      }
    }
  }

  // Road
  ctx.fillStyle = groundColor;
  ctx.fillRect(0, ground, W, H - ground);

  // Road border
  ctx.fillStyle = "#657487";
  ctx.fillRect(0, ground, W, 5);

  // Moving road markings
  ctx.fillStyle = "#d7dce3";

  for (let i = 0; i < 12; i++) {
    const x =
      (i * 110 - distance * 2) % (W + 100);

    ctx.fillRect(x, ground + 65, 55, 5);
  }
}
// ============================================================
// 29. DRAW PLAYER
// ============================================================

function drawPlayer() {
  if (player.invincible > 0 && Math.floor(gameTime / 90) % 2 === 0) {
    return;
  }

  const color = characterColors[selectedCharacter] || "#20d9ff";
  const x = player.x;
  const y = player.y;

  ctx.save();

  if (boostTimer > 0) {
    ctx.shadowColor = "#ff7a25";
    ctx.shadowBlur = 28;

    ctx.fillStyle = "#ff8a35";
    ctx.beginPath();
    ctx.moveTo(x - 5, y + 30);
    ctx.lineTo(x - 48 - Math.random() * 20, y + 15);
    ctx.lineTo(x - 48 - Math.random() * 20, y + 45);
    ctx.closePath();
    ctx.fill();
  }

  if (shieldTimer > 0) {
    ctx.strokeStyle = "#5be9ff";
    ctx.lineWidth = 4;
    ctx.shadowColor = "#5be9ff";
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.ellipse(x + 24, y + 35, 42, 48, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  const bodyHeight = player.sliding ? 28 : 43;
  const bodyY = player.sliding ? y + 38 : y + 22;

  // Legs
  ctx.fillStyle = "#202b42";

  if (!player.sliding) {
    const legSwing = Math.sin(player.animation) * 10;

    ctx.fillRect(x + 9, y + 48, 12, 20 + legSwing);
    ctx.fillRect(x + 28, y + 48, 12, 20 - legSwing);
  } else {
    ctx.fillRect(x + 5, y + 55, 32, 10);
  }

  // Body
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;

  ctx.beginPath();
  ctx.roundRect(x + 5, bodyY, 39, bodyHeight, 10);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Head
  ctx.fillStyle = "#ffd0a1";
  ctx.beginPath();
  ctx.arc(
    x + 25,
    player.sliding ? y + 37 : y + 13,
    14,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Hair / mask
  if (selectedCharacter === "ninja") {
    ctx.fillStyle = "#33234e";
    ctx.fillRect(x + 11, player.sliding ? y + 30 : y + 7, 29, 12);
  } else {
    ctx.fillStyle = "#26364d";
    ctx.fillRect(x + 12, player.sliding ? y + 30 : y + 4, 25, 7);
  }

  // Eyes
  ctx.fillStyle = "#17243a";
  ctx.fillRect(x + 19, player.sliding ? y + 36 : y + 13, 4, 3);
  ctx.fillRect(x + 29, player.sliding ? y + 36 : y + 13, 4, 3);

  ctx.restore();
}
// ============================================================
// 30. DRAW OBSTACLES
// ============================================================

function drawObstacles() {
  obstacles.forEach(o => {

    if (o.type === "crate") {
      ctx.fillStyle = "#b36b35";
      ctx.fillRect(o.x, o.y, o.w, o.h);

      ctx.strokeStyle = "#704020";
      ctx.lineWidth = 4;
      ctx.strokeRect(o.x + 3, o.y + 3, o.w - 6, o.h - 6);

      ctx.beginPath();
      ctx.moveTo(o.x + 4, o.y + 4);
      ctx.lineTo(o.x + o.w - 4, o.y + o.h - 4);
      ctx.moveTo(o.x + o.w - 4, o.y + 4);
      ctx.lineTo(o.x + 4, o.y + o.h - 4);
      ctx.stroke();
    }

    if (o.type === "cone") {
      ctx.fillStyle = "#ff842d";
      ctx.beginPath();
      ctx.moveTo(o.x + o.w / 2, o.y);
      ctx.lineTo(o.x + o.w, o.y + o.h);
      ctx.lineTo(o.x, o.y + o.h);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "white";
      ctx.fillRect(o.x + 8, o.y + 27, 26, 6);
    }

    if (o.type === "overhead") {
      // Overhead obstacle: slide required
      ctx.fillStyle = "#e64b4b";
      ctx.fillRect(o.x, o.y, o.w, o.h);

      ctx.fillStyle = "white";

      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(o.x + 12 + i * 27, o.y + 2);
        ctx.rotate(-0.45);
        ctx.fillRect(0, 0, 10, 20);
        ctx.restore();
      }
    }
  });
}


// ============================================================
// 31. DRAW COINS
// ============================================================

function drawCoins() {
  coinsOnRoad.forEach(c => {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rotation);

    ctx.fillStyle = "#ffcf32";
    ctx.shadowColor = "#ffbd27";
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.ellipse(0, 0, c.r * 0.65, c.r, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#fff1a1";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "#9a6410";
    ctx.font = "bold 16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("$", 0, 6);

    ctx.restore();
  });
}

// ============================================================
// 32. DRAW POWER-UPS
// ============================================================

function drawPowerUps() {
  powerUps.forEach(p => {
    const colors = {
      magnet: "#ff5c9c",
      shield: "#49dfff",
      boost: "#ff8b36"
    };

    const symbols = {
      magnet: "M",
      shield: "S",
      boost: "B"
    };

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);

    ctx.shadowColor = colors[p.type];
    ctx.shadowBlur = 20;

    ctx.fillStyle = colors[p.type];
    ctx.beginPath();
    ctx.arc(0, 0, p.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = "white";
    ctx.font = "bold 20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(symbols[p.type], 0, 1);

    ctx.restore();
  });
}

// ============================================================
// 33. DRAW PARTICLES
// ============================================================

function drawParticles() {
  particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life / 700);
    ctx.fillStyle = p.color;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1;
}

// ============================================================
// 34. DRAW LIVES & POWER STATUS
// ============================================================

function drawStatus() {
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "left";

  ctx.fillStyle = "#ff5366";
  ctx.fillText("♥ ".repeat(Math.max(0, lives)), 25, 45);

  let y = 80;

  if (magnetTimer > 0) {
    ctx.fillStyle = "#ff5c9c";
    ctx.fillText("MAGNET", 25, y);
    y += 28;
  }

  if (shieldTimer > 0) {
    ctx.fillStyle = "#49dfff";
    ctx.fillText("SHIELD", 25, y);
    y += 28;
  }

  if (boostTimer > 0) {
    ctx.fillStyle = "#ff8b36";
    ctx.fillText("BOOST", 25, y);
  }
}

// ============================================================
// 35. GAME DRAW
// ============================================================

function drawGame() {
  if (!ctx) return;

  ctx.save();

  if (cameraShake > 0) {
    ctx.translate(
      (Math.random() - 0.5) * cameraShake,
      (Math.random() - 0.5) * cameraShake
    );

    cameraShake *= 0.85;
  }

  drawBackground();
  drawCoins();
  drawPowerUps();
  drawObstacles();
  drawPlayer();
  drawParticles();
  drawStatus();

  ctx.restore();

  if (flashTimer > 0) {
    ctx.fillStyle = "rgba(255,40,60,0.2)";
    ctx.fillRect(0, 0, W, H);
    flashTimer -= 16;
  }
}

// ============================================================
// 36. MESSAGE
// ============================================================

function showMessage(message) {
  const element = $("shop-message") ||
                  $("map-message") ||
                  $("achievement-message") ||
                  $("daily-reward-message");

  if (element) element.textContent = message;

  messageTimer = 1800;
}

// ============================================================
// 37. PAUSE
// ============================================================

function pauseGame() {
  if (state !== "playing") return;

  state = "paused";
  stopSlide();

  cancelAnimationFrame(animationId);

  showElement("hud", false);
  showElement("controls", false);
  showScreen("pause-screen");
}

function resumeGame() {
  if (state !== "paused") return;

  state = "playing";

  hideAllScreens();
  showElement("hud", true);
  showElement("controls", true);

  lastTime = 0;
  animationId = requestAnimationFrame(gameLoop);
}

on("pause-btn", "click", pauseGame);
on("resume-btn", "click", resumeGame);

// ============================================================
// 38. HOME
// ============================================================

function goHome() {
  cancelAnimationFrame(animationId);

  state = "menu";
  stopSlide();

  showElement("hud", false);
  showElement("controls", false);

  showScreen("main-menu");
  updateMainUI();
}

on("pause-home-btn", "click", goHome);
on("over-home-btn", "click", goHome);
// ============================================================
// 39. GAME OVER
// ============================================================

function endGame() {
  if (state !== "playing") return;

  state = "over";
  stopSlide();

  cancelAnimationFrame(animationId);

  showElement("hud", false);
  showElement("controls", false);

  const finalScore = Math.floor(score);
  const earnedXP = finalScore + runCoins * 2;

  if (finalScore > bestScore) {
    bestScore = finalScore;
    saveData("runverseBest", bestScore);
  }

  updateXP(earnedXP);

  setText("final-score", finalScore);
  setText("final-coins", runCoins);

  // Game Over screen par XP display
  let xpElement = $("final-xp");

  if (!xpElement) {
    const gameOverScreen = $("game-over");

    if (gameOverScreen) {
      xpElement = document.createElement("div");
      xpElement.id = "final-xp";
      xpElement.style.fontSize = "22px";
      xpElement.style.fontWeight = "bold";
      xpElement.style.margin = "12px";
      gameOverScreen.appendChild(xpElement);
    }
  }

  if (xpElement) {
    xpElement.textContent = "+" + earnedXP + " XP EARNED";
  }

  saveData("runverseCoins", coins);
  saveData("runverseBest", bestScore);

  updateMainUI();
  updateAchievementsUI();

  showScreen("game-over");
}

on("restart-btn", "click", startGame);
// ============================================================
// 40. GAME LOOP
// ============================================================

function gameLoop(timestamp) {
  if (state !== "playing") return;

  if (!lastTime) lastTime = timestamp;

  const dt = Math.min(timestamp - lastTime, 35);
  lastTime = timestamp;

  updateGame(dt);
  drawGame();

  if (state === "playing") {
    animationId = requestAnimationFrame(gameLoop);
  }
}

// ============================================================
// 41. SETTINGS
// ============================================================

function updateSettingsUI() {
  const sound = $("sound-toggle");
  const music = $("music-toggle");
  const vibration = $("vibration-toggle");

  if (sound) sound.checked = soundEnabled;
  if (music) music.checked = musicEnabled;
  if (vibration) vibration.checked = vibrationEnabled;
}

on("sound-toggle", "change", event => {
  soundEnabled = event.target.checked;
  saveData("runverseSound", soundEnabled);
});

on("music-toggle", "change", event => {
  musicEnabled = event.target.checked;
  saveData("runverseMusic", musicEnabled);
});

on("vibration-toggle", "change", event => {
  vibrationEnabled = event.target.checked;
  saveData("runverseVibration", vibrationEnabled);
});

// ============================================================
// 42. SOUND EFFECTS
// ============================================================

let audioContext = null;

function playSound(type) {
  if (!soundEnabled) return;

  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    const sounds = {
      jump: [380, 620],
      coin: [700, 1000],
      hit: [180, 80],
      power: [450, 900]
    };

    const values = sounds[type] || [400, 600];

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      values[0],
      audioContext.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(40, values[1]),
      audioContext.currentTime + 0.12
    );

    gain.gain.setValueAtTime(0.12, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + 0.16
    );

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.17);
  } catch (error) {
    console.warn("Sound unavailable:", error);
  }
}

// ============================================================
// 43. EXTRA UI INITIALIZATION
// ============================================================

function initializeRunverse() {
  if (!canvas || !ctx) {
    console.error("RUNVERSE: Canvas element not found!");
    return;
  }

  updateMainUI();
  updateCharactersUI();
  updateMapsUI();
  updateShopUI();
  updateDailyUI();
  updateAchievementsUI();
  updateSettingsUI();

  showElement("hud", false);
  showElement("controls", false);

  showScreen("main-menu");

  drawBackground();
  drawPlayer();

  console.log("RUNVERSE initialized successfully!");
}

// ============================================================
// 44. START
// ============================================================

initializeRunverse();

// ============================================================
// END OF RUNVERSE JAVASCRIPT
// ============================================================