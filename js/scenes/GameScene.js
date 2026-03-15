import { gameState } from '../state.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    init() {
        // Zombie Counts
        this.zombieCounts = {
            normal: 10,
            pig: 5,
            female: 3,
            boss: 1
        };

        // Create Spawn Queue (Randomized)
        this.spawnQueue = [];
        for (let i = 0; i < this.zombieCounts.normal; i++) this.spawnQueue.push('normal');
        for (let i = 0; i < this.zombieCounts.pig; i++) this.spawnQueue.push('pig');
        for (let i = 0; i < this.zombieCounts.female; i++) this.spawnQueue.push('female');
        for (let i = 0; i < this.zombieCounts.boss; i++) this.spawnQueue.push('boss');

        // Shuffle
        this.spawnQueue.sort(() => Math.random() - 0.5);

        this.zombiesToKill = this.spawnQueue.length;
        this.zombiesKilled = 0;
        this.zombiesSpawned = 0;
        this.nextSpawnTime = 0;
        this.nextFireTime = 0;

        // Calculate spawn rate based on level (decreases as level increases)
        // Base 2000ms, decreases by 10% each level, min 400ms
        this.spawnRate = Math.max(400, 2000 * Math.pow(0.9, gameState.level - 1));

        this.lastDirection = new Phaser.Math.Vector2(0, -1); // Default facing up
        this.isGameOver = false;
        this.scoreText = null;
        this.timerText = null;
    }

    create() {
        this.isGameOver = false;

        // --- Background ---
        this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'road').setOrigin(0, 0);

        // --- Inputs ---
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });

        // --- Player ---
        const playerTexture = gameState.hasMotorcycle ? 'motorcycle' : 'hero';
        this.player = this.physics.add.sprite(this.scale.width / 2, this.scale.height / 2, playerTexture);
        this.player.setCollideWorldBounds(true);
        this.player.setDisplaySize(60, 60);
        this.player.body.setSize(45, 45);

        // --- Groups ---
        this.zombies = this.physics.add.group();
        this.bullets = this.physics.add.group();
        this.enemyBullets = this.physics.add.group();

        // --- Collisions ---
        this.physics.add.overlap(this.bullets, this.zombies, this.handleBulletHitZombie, null, this);
        this.physics.add.overlap(this.player, this.zombies, this.handlePlayerHit, null, this);
        this.physics.add.overlap(this.player, this.enemyBullets, (player, bullet) => {
            bullet.destroy();
            this.handlePlayerHit(player, null);
        }, null, this);

        // --- UI ---
        this.scoreText = this.add.text(10, 10,
            `Score: ${gameState.score}\nMoney: $${gameState.money}\nSpeed: ${gameState.moveSpeed}\nFire Rate: ${gameState.fireInterval}\nBullet Spd: ${gameState.bulletSpeed}`,
            { fontSize: '16px', fill: '#fff' }
        );
        this.levelText = this.add.text(this.scale.width / 2, 10, `Level: ${gameState.level}`, { fontSize: '16px', fill: '#ffff00' }).setOrigin(0.5, 0);

        // Zombie Icons and Counts (Top Right)
        const uiRightX = this.scale.width - 20;
        let uiY = 15;
        const rowHeight = 45;

        const createRow = (type, texture, count, speed, hp) => {
            this.add.image(uiRightX - 60, uiY + 10, texture).setDisplaySize(24, 24);
            const countText = this.add.text(uiRightX, uiY, `: ${count}`, { fontSize: '20px', fill: '#fff' }).setOrigin(1, 0);
            this.add.text(uiRightX, uiY + 24, `SPD:${speed} HP:${hp}`, { fontSize: '12px', fill: '#aaa' }).setOrigin(1, 0);
            return { countText };
        };

        const baseSpeed = 10 + (gameState.level * 10);

        this.uiNormal = createRow('normal', 'zombie', this.zombieCounts.normal, baseSpeed, 2);
        uiY += rowHeight;
        this.uiPig = createRow('pig', 'pig', this.zombieCounts.pig, baseSpeed * 2, 2);
        uiY += rowHeight;
        this.uiFemale = createRow('female', 'female', this.zombieCounts.female, baseSpeed, 2);
        uiY += rowHeight;
        this.uiBoss = createRow('boss', 'boss', this.zombieCounts.boss, baseSpeed, 10);

        // Physics bounds
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);
        this.player.setCollideWorldBounds(true);

        // Health Bars
        this.healthBarGraphics = this.add.graphics();
        this.healthBarGraphics.setDepth(100);

        this.createVirtualJoystick();
    }

    update(time, delta) {
        if (this.isGameOver) return;

        this.handlePlayerMovement();

        if (time > this.nextFireTime) {
            this.fireBullet();
            this.nextFireTime = time + gameState.fireInterval;
        }

        if (time > this.nextSpawnTime && this.zombiesSpawned < this.zombiesToKill) {
            this.spawnZombie();
            this.zombiesSpawned++;
            this.nextSpawnTime = time + this.spawnRate;
        }

        this.zombies.children.iterate((zombie) => {
            if (zombie && zombie.active) {
                const speed = zombie.moveSpeed || 10;
                this.physics.moveToObject(zombie, this.player, speed);
                const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, this.player.x, this.player.y);
                zombie.rotation = angle;

                if (zombie.zombieType === 'female') {
                    if (!zombie.nextShootTime) zombie.nextShootTime = time + 2000;
                    if (time > zombie.nextShootTime) {
                        this.enemyShoot(zombie);
                        zombie.nextShootTime = time + 3000 + Math.random() * 1000;
                    }
                }
            }
        });

        const w = this.scale.width;
        const h = this.scale.height;
        const cleanup = (group) => {
            group.children.iterate((b) => {
                if (b && (b.x < -50 || b.x > w + 50 || b.y < -50 || b.y > h + 50)) {
                    b.destroy();
                }
            });
        };
        cleanup(this.bullets);
        cleanup(this.enemyBullets);

        this.scoreText.setText(
            `Score: ${gameState.score}\nMoney: $${gameState.money}\nSpeed: ${gameState.moveSpeed}\nFire Rate: ${gameState.fireInterval}\nBullet Spd: ${gameState.bulletSpeed}`
        );

        const counts = { normal: 0, pig: 0, female: 0, boss: 0 };
        this.spawnQueue.forEach(type => { if (counts[type] !== undefined) counts[type]++; });
        this.zombies.children.iterate((z) => {
            if (z && z.active && z.zombieType) {
                counts[z.zombieType]++;
            }
        });

        this.uiNormal.countText.setText(`: ${counts.normal}`);
        this.uiPig.countText.setText(`: ${counts.pig}`);
        this.uiFemale.countText.setText(`: ${counts.female}`);
        this.uiBoss.countText.setText(`: ${counts.boss}`);

        this.drawHealthBars();
    }

    drawHealthBars() {
        this.healthBarGraphics.clear();

        if (this.player && this.player.active) {
            const x = this.player.x;
            const y = this.player.y - 45;
            const width = 40;
            const height = 5;

            this.healthBarGraphics.fillStyle(0x000000);
            this.healthBarGraphics.fillRect(x - width / 2, y, width, height);

            const pct = Math.max(0, gameState.currentHealth / gameState.maxHealth);
            this.healthBarGraphics.fillStyle(0x00ff00);
            this.healthBarGraphics.fillRect(x - width / 2, y, width * pct, height);
        }

        this.zombies.children.iterate((zombie) => {
            if (zombie && zombie.active) {
                const x = zombie.x;
                const y = zombie.y - 35;
                const width = 30;
                const height = 4;

                this.healthBarGraphics.fillStyle(0x000000);
                this.healthBarGraphics.fillRect(x - width / 2, y, width, height);

                const hp = zombie.hp !== undefined ? zombie.hp : (zombie.maxHp || 1);
                const max = zombie.maxHp || 1;
                const pct = Math.max(0, hp / max);

                this.healthBarGraphics.fillStyle(0xff0000);
                this.healthBarGraphics.fillRect(x - width / 2, y, width * pct, height);
            }
        });
    }

    createVirtualJoystick() {
        if (this.joyBase) {
            this.joyBase.destroy();
            this.joyThumb.destroy();
            this.joyBase = null;
            this.joyThumb = null;
        }

        this.joyBase = this.add.circle(0, 0, 50, 0x888888).setAlpha(0.5).setDepth(100).setVisible(false);
        this.joyThumb = this.add.circle(0, 0, 25, 0xcccccc).setAlpha(0.8).setDepth(101).setVisible(false);
        this.joyVector = new Phaser.Math.Vector2(0, 0);
        this.isTouching = false;

        this.input.on('pointerdown', (pointer) => {
            this.isTouching = true;
            this.joyBase.setPosition(pointer.x, pointer.y).setVisible(true);
            this.joyThumb.setPosition(pointer.x, pointer.y).setVisible(true);
            this.joyStartPos = new Phaser.Math.Vector2(pointer.x, pointer.y);
            this.joyVector.set(0, 0);
        });

        this.input.on('pointermove', (pointer) => {
            if (this.isTouching) {
                const dist = Phaser.Math.Distance.Between(this.joyStartPos.x, this.joyStartPos.y, pointer.x, pointer.y);
                const angle = Phaser.Math.Angle.Between(this.joyStartPos.x, this.joyStartPos.y, pointer.x, pointer.y);
                const force = Math.min(dist, 50);
                const normalizedForce = force / 50;

                const thumbX = this.joyStartPos.x + Math.cos(angle) * force;
                const thumbY = this.joyStartPos.y + Math.sin(angle) * force;
                this.joyThumb.setPosition(thumbX, thumbY);

                this.joyVector.set(Math.cos(angle), Math.sin(angle)).scale(normalizedForce);
            }
        });

        this.input.on('pointerup', () => {
            this.isTouching = false;
            this.joyBase.setVisible(false);
            this.joyThumb.setVisible(false);
            this.joyVector.set(0, 0);
        });
    }

    handlePlayerMovement() {
        const speed = gameState.moveSpeed;
        const body = this.player.body;

        body.setVelocity(0);

        const left = this.cursors.left.isDown || this.wasd.left.isDown;
        const right = this.cursors.right.isDown || this.wasd.right.isDown;
        const up = this.cursors.up.isDown || this.wasd.up.isDown;
        const down = this.cursors.down.isDown || this.wasd.down.isDown;

        let velocityX = 0;
        let velocityY = 0;

        if (left) velocityX = -1;
        else if (right) velocityX = 1;

        if (up) velocityY = -1;
        else if (down) velocityY = 1;

        if (this.joyVector && (this.joyVector.x !== 0 || this.joyVector.y !== 0)) {
            velocityX = this.joyVector.x;
            velocityY = this.joyVector.y;
        }

        const finalVec = new Phaser.Math.Vector2(velocityX, velocityY);
        if (finalVec.length() > 1) {
            finalVec.normalize();
        }

        body.setVelocity(finalVec.x * speed, finalVec.y * speed);

        if (body.velocity.x !== 0 || body.velocity.y !== 0) {
            this.lastDirection = body.velocity.clone().normalize();
            this.player.setRotation(this.lastDirection.angle() + Math.PI / 2);
        }
    }

    fireBullet() {
        const offset = this.lastDirection.clone().scale(38);
        const x = this.player.x + offset.x;
        const y = this.player.y + offset.y;

        const bulletCount = gameState.bulletCount;
        const spreadAngle = Math.PI / 6;

        for (let i = 0; i < bulletCount; i++) {
            let angleOffset = 0;
            if (bulletCount > 1) {
                angleOffset = ((i / (bulletCount - 1)) - 0.5) * spreadAngle;
            }

            const baseAngle = this.lastDirection.angle();
            const bulletAngle = baseAngle + angleOffset;
            const direction = new Phaser.Math.Vector2(Math.cos(bulletAngle), Math.sin(bulletAngle));

            const bullet = this.add.rectangle(x, y, 20, 2, 0x0088ff);
            this.physics.add.existing(bullet);
            this.bullets.add(bullet);
            bullet.rotation = bulletAngle;

            const vec = direction.clone().scale(gameState.bulletSpeed);
            bullet.body.setVelocity(vec.x, vec.y);
        }
    }

    enemyShoot(zombie) {
        const bullet = this.add.circle(zombie.x, zombie.y, 6, 0x00ff00);
        this.physics.add.existing(bullet);
        this.enemyBullets.add(bullet);

        const angle = Phaser.Math.Angle.Between(zombie.x, zombie.y, this.player.x, this.player.y);
        const vec = new Phaser.Math.Vector2(Math.cos(angle), Math.sin(angle)).scale(300);
        bullet.body.setVelocity(vec.x, vec.y);
    }

    spawnZombie() {
        if (this.spawnQueue.length === 0) return;
        const type = this.spawnQueue.pop();

        let x, y;
        const edge = Phaser.Math.Between(0, 3);
        const padding = 50;

        switch (edge) {
            case 0:
                x = Phaser.Math.Between(0, this.scale.width);
                y = -padding;
                break;
            case 1:
                x = this.scale.width + padding;
                y = Phaser.Math.Between(0, this.scale.height);
                break;
            case 2:
                x = Phaser.Math.Between(0, this.scale.width);
                y = this.scale.height + padding;
                break;
            case 3:
                x = -padding;
                y = Phaser.Math.Between(0, this.scale.height);
                break;
        }

        let texture = 'zombie';
        let hp = 2;
        let speed = 10 + (gameState.level * 10);
        let size = 50;
        let bodySize = 40;

        switch (type) {
            case 'normal':
                break;
            case 'pig':
                texture = 'pig';
                speed *= 2;
                break;
            case 'female':
                texture = 'female';
                break;
            case 'boss':
                texture = 'boss';
                hp *= 5;
                size = 100;
                bodySize = 80;
                break;
        }

        const zombie = this.physics.add.sprite(x, y, texture);
        zombie.setDisplaySize(size, size);
        zombie.body.setSize(bodySize, bodySize);
        zombie.hp = hp;
        zombie.maxHp = hp;
        zombie.moveSpeed = speed;
        zombie.zombieType = type;
        this.zombies.add(zombie);
    }

    handleBulletHitZombie(bullet, zombie) {
        bullet.destroy();

        zombie.hp = (zombie.hp || 0) - gameState.bulletDamage;

        if (zombie.hp <= 0) {
            zombie.destroy();
            gameState.score += 10;
            gameState.money += 10;

            this.zombiesKilled++;
            if (this.zombiesKilled >= this.zombiesToKill) {
                this.levelComplete();
            }
        } else {
            this.tweens.add({
                targets: zombie,
                alpha: 0.5,
                duration: 50,
                yoyo: true
            });
        }
    }

    handlePlayerHit(player, zombie) {
        if (this.isGameOver) return;
        if (this.player.isInvulnerable) return;

        gameState.currentHealth -= 1;
        this.cameras.main.flash(100, 255, 0, 0);

        if (gameState.currentHealth <= 0) {
            this.isGameOver = true;
            this.physics.pause();
            this.player.setTint(0x555555);

            this.time.delayedCall(500, () => {
                this.scene.start('GameOverScene');
            });
        } else {
            this.player.isInvulnerable = true;
            this.tweens.add({
                targets: this.player,
                alpha: 0.5,
                duration: 100,
                yoyo: true,
                repeat: 5,
                onComplete: () => {
                    if (this.player && this.player.active) {
                        this.player.isInvulnerable = false;
                        this.player.alpha = 1;
                    }
                }
            });
        }
    }

    levelComplete() {
        gameState.level++;
        gameState.currentHealth = gameState.maxHealth;
        this.scene.start('MainMenuScene');
    }
}
