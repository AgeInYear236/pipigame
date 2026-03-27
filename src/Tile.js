import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gameState } from './GameState';
import { spinSlots } from './Casino';

export class Tile extends Container {
    constructor(type, gridX, gridY, tileSize, player, goldText, slotText, mapLayout, entityLayer, updateInvUI, debugConsole) {
        super();
        this.type = type;
        this.gridX = gridX;
        this.gridY = gridY;
        this.tileSize = tileSize;
        this.player = player;
        this.goldText = goldText;
        this.slotText = slotText;
        this.updateInvUI = updateInvUI; // СОХРАНЯЕМ ФУНКЦИЮ
        this.isSolid = (type === 2);
        this.debugConsole = debugConsole;

        this.x = gridX * tileSize;
        this.y = gridY * tileSize;

        // 1. Земля
        const bg = new Graphics()
            .rect(0, 0, tileSize, tileSize)
            .fill(type === 1 ? 0x6b4226 : 0x3a7d32);
        this.addChild(bg);

        // 2. Растение
        this.plant = new Graphics().rect(4, 4, 32, 32).fill(0xffffff);
        this.plant.visible = false;
        this.plant.scale.set(0.1);
        this.plant.x = this.tileSize / 2 - 16;
        this.plant.y = this.tileSize / 2 - 16;
        this.addChild(this.plant);
        // 3. Визуал забора
        if (type === 2 && entityLayer) {
            this.fenceVisual = new Graphics();
            this.drawSmartFence(this.fenceVisual, mapLayout);
            this.fenceVisual.x = this.x;
            this.fenceVisual.y = this.y;
            entityLayer.addChild(this.fenceVisual);
        }

        this.isGrowing = false;
        this.plantedType = null;
        this.popUps = [];

        this.eventMode = 'static';
        this.on('pointerdown', () => this.handleClick());
    }

    drawSmartFence(g, map) {
        const mid = this.tileSize / 2;
        g.rect(mid - 6, mid - 6, 12, 12).fill(0x5d3a1a);
        const isF = (x, y) => map[y] && map[y][x] === 2;
        if (isF(this.gridX, this.gridY - 1)) g.rect(mid - 4, 0, 8, mid).fill(0x4a2c16);
        if (isF(this.gridX, this.gridY + 1)) g.rect(mid - 4, mid, 8, mid).fill(0x4a2c16);
        if (isF(this.gridX - 1, this.gridY)) g.rect(0, mid - 4, mid, 8).fill(0x4a2c16);
        if (isF(this.gridX + 1, this.gridY)) g.rect(mid, mid - 4, mid, 8).fill(0x4a2c16);
    }

    async handleClick() {
        if (this.type !== 1 || gameState.isSpinning) return;

        const dx = (this.x + this.tileSize/2) - this.player.x;
        const dy = (this.y + this.tileSize/2) - this.player.y;
        if (Math.sqrt(dx*dx + dy*dy) > this.tileSize * 1.8) return;

        if (!this.isGrowing) {
            const item = gameState.inventory[gameState.selectedSlot];

            // Проверяем, есть ли предмет и есть ли у него семена
            if (item && item.type && item.count > 0) {
                // Уменьшаем количество семян
                item.count--;

                // Если семена закончились, удаляем предмет из слота
                if (item.count === 0) {
                    gameState.inventory[gameState.selectedSlot] = null;
                }

                // Обновляем UI инвентаря
                if (this.updateInvUI) {
                    this.updateInvUI();
                }

                // Сажаем растение
                this.isGrowing = true;
                this.plantedType = item;
                this.plant.tint = item.color;
                this.plant.visible = true;

                if (this.debugConsole) {
                    this.debugConsole.logPlant(item.type === 'green' ? 'зелёных' : 'красных');
                }
            }
        } else if (this.plant.scale.x >= 1) {
            // ЛОГИКА СБОРА
            const spinResult = await spinSlots(this.slotText);

            // Показываем сообщение от казино
            if (spinResult.message && this.slotText) {
                this.slotText.text = spinResult.message;
            }

            // Рассчитываем награду
            let finalReward = 0;
            if (spinResult.rewardGold > 0) {
                finalReward = this.plantedType.bonus * spinResult.rewardGold;
            }

            // Начисляем золото
            if (finalReward > 0) {
                gameState.gold += finalReward;
                this.goldText.text = `Золото: ${gameState.gold}`;
                this.spawnCoinText(finalReward);
            }

            // Обрабатываем изменение семян
            if (spinResult.seedChange !== 0) {
                const currentSlot = gameState.selectedSlot;
                const currentItem = gameState.inventory[currentSlot];

                if (spinResult.seedChange > 0) {
                    // Даём семечко
                    if (currentItem && currentItem.type === this.plantedType.type) {
                        // Если в выбранном слоте уже есть такие же семена
                        currentItem.count += spinResult.seedChange;
                    } else if (!currentItem) {
                        // Если слот пустой, создаём новый предмет
                        gameState.inventory[currentSlot] = {
                            name: this.plantedType.name,
                            type: this.plantedType.type,
                            bonus: this.plantedType.bonus,
                            color: this.plantedType.color,
                            count: spinResult.seedChange
                        };
                    } else {
                        // Если в слоте другие семена, ищем пустой слот или слот с такими же семенами
                        let found = false;
                        for (let i = 0; i < gameState.inventory.length; i++) {
                            const item = gameState.inventory[i];
                            if (item && item.type === this.plantedType.type) {
                                item.count += spinResult.seedChange;
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            // Ищем пустой слот
                            for (let i = 0; i < gameState.inventory.length; i++) {
                                if (!gameState.inventory[i]) {
                                    gameState.inventory[i] = {
                                        name: this.plantedType.name,
                                        type: this.plantedType.type,
                                        bonus: this.plantedType.bonus,
                                        color: this.plantedType.color,
                                        count: spinResult.seedChange
                                    };
                                    break;
                                }
                            }
                        }
                    }
                } else if (spinResult.seedChange < 0) {
                    // Тратим семечки (отрицательное значение)
                    const seedsToLose = Math.abs(spinResult.seedChange);

                    if (currentItem && currentItem.type === this.plantedType.type) {
                        // Уменьшаем количество в текущем слоте
                        currentItem.count -= seedsToLose;

                        // Если семена закончились, удаляем слот
                        if (currentItem.count <= 0) {
                            gameState.inventory[currentSlot] = null;
                        }
                    } else {
                        // Ищем слот с такими семенами
                        for (let i = 0; i < gameState.inventory.length; i++) {
                            const item = gameState.inventory[i];
                            if (item && item.type === this.plantedType.type) {
                                item.count -= seedsToLose;
                                if (item.count <= 0) {
                                    gameState.inventory[i] = null;
                                }
                                break;
                            }
                        }
                    }

                    // Логируем сбор
                    if (finalReward > 0 && this.debugConsole) {
                        this.debugConsole.logHarvest(finalReward, spinResult.rewardGold);
                    }

                    // Логируем изменение семян
                    if (spinResult.seedChange !== 0 && this.debugConsole) {
                        const seedType = this.plantedType.type === 'green' ? 'зелёных' : 'красных';
                        this.debugConsole.logSeedChange(spinResult.seedChange, seedType);
                    }
                }

                // Обновляем UI инвентаря
                if (this.updateInvUI) {
                    this.updateInvUI();
                }
            }

            // Сброс грядки
            this.isGrowing = false;
            this.plant.visible = false;
            this.plant.scale.set(0.1);
        }
    }

    // Внутренний метод для всплывающего текста
    spawnCoinText(amount) {
        const style = new TextStyle({
            fill: '#ffd700',
            fontSize: 24,
            fontWeight: 'bold',
            stroke: { color: '#000000', width: 3 }
        });
        const txt = new Text({ text: `+${amount} 🪙`, style });
        txt.anchor.set(0.5);
        txt.x = this.tileSize / 2;
        txt.y = 0;
        this.addChild(txt);
        this.popUps.push(txt);
    }

    update(dt) {
        // Логика роста
        if (this.isGrowing && this.plant.scale.x < 1) {
            this.plant.scale.x += 0.005 * dt;
            this.plant.scale.y += 0.005 * dt;
        }

        // Анимация всплывающих текстов
        for (let i = this.popUps.length - 1; i >= 0; i--) {
            const txt = this.popUps[i];
            txt.y -= 1 * dt;
            txt.alpha -= 0.02 * dt;
            if (txt.alpha <= 0) {
                this.removeChild(txt);
                txt.destroy();
                this.popUps.splice(i, 1);
            }
        }
    }
}