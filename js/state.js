const startStats = {
    moveSpeed: 200,
    fireInterval: 400,
    bulletSpeed: 500,
    bulletDamage: 1,
    bulletCount: 1,
    money: 0,
    score: 0,
    level: 1,
    maxHealth: 3,
    currentHealth: 3,
    hasMotorcycle: false
};

// Mutable game state
let gameState = JSON.parse(JSON.stringify(startStats));

function resetGameState() {
    gameState = JSON.parse(JSON.stringify(startStats));
}

export { gameState, resetGameState };
