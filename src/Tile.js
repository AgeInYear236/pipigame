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
        this.updateInvUI = updateInvUI;
        this.isSolid = (type === 2);
        this.debugConsole = debugConsole;

        this.x = gridX * tileSize;
        this.y = gridY * tileSize;

        // СОСТОЯНИЯ
        this.isGrowing = false;
        this.isWatered = false; // Полит ли тайл
        this.plantedType = null;
        this.popUps = [];
        this.baseGrowthSpeed = 0.0005; // СДЕЛАЛИ РОСТ НАМНОГО МЕДЛЕННЕЕ

        this.bg = new Graphics();
        this.drawBackground();
        this.addChild(this.bg);

        this.plant = new Graphics().rect(4, 4, 32, 32).fill(0xffffff);
        this.plant.visible = false;
        this.plant.scale.set(0.1);
        this.plant.x = this.tileSize / 2 - 16;
        this.plant.y = this.tileSize / 2 - 16;
        this.addChild(this.plant);

        if (type === 2 && entityLayer) {
            this.fenceVisual = new Graphics();
            this.drawSmartFence(this.fenceVisual, mapLayout);
            this.fenceVisual.x = this.x;
            this.fenceVisual.y = this.y;
            entityLayer.addChild(this.fenceVisual);
        }

        this.eventMode = 'static';
        this.on('pointerdown', () => this.handleClick());
    }

    drawBackground() {
        this.bg.clear();

        // Цвет земли: если полито, делаем темнее/синее
        let color = this.type === 1 ? 0x6b4226 : 0x3a7d32;
        if (this.type === 1 && this.isWatered) {
            color = 0x3d2b1f; // Темная влажная земля
        }

        this.bg.rect(0, 0, this.tileSize, this.tileSize).fill(color);

        if (this.type === 1) {
            // Рисуем рамку. Если полито — синюю, если нет — коричневую
            const strokeColor = this.isWatered ? 0x00aaff : 0x553311;
            this.bg.stroke({ color: strokeColor, width: this.isWatered ? 2 : 1, alignment: 1 });
        }
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
        if (this.isSolid || gameState.isSpinning) return;

        const dx = (this.x + this.tileSize/2) - this.player.x;
        const dy = (this.y + this.tileSize/2) - this.player.y;
        if (Math.sqrt(dx*dx + dy*dy) > this.tileSize * 1.8) return;

        const item = gameState.inventory[gameState.selectedSlot];

        // 1. ИСПОЛЬЗОВАНИЕ ТЯПКИ
        // 3. ЛОГИКА ТЯПКИ (Работает на ТРАВЕ - type 0)
        if (this.type === 0) {
            if (item && item.toolType === 'hoe' && item.count > 0) {
                this.type = 1; // Превращаем в грядку
                item.count--;

                if (item.count <= 0) {
                    gameState.inventory[gameState.selectedSlot] = null;
                    if (this.debugConsole) this.debugConsole.addMessage("Тяпка сломалась!", "#ff4444", "❌");
                }

                this.drawBackground();
                if (this.updateInvUI) this.updateInvUI();
                if (this.debugConsole) this.debugConsole.addMessage(`Вспахано! Прочность: ${item.count || 0}`, '#8bc34a', '🚜');
            }
            return; // Выходим, чтобы не пытаться посадить семена в этот же клик
        }

        // 2. ИСПОЛЬЗОВАНИЕ ЛЕЙКИ
        if (this.type === 1 && item && item.toolType === 'can' && item.count > 0) {
            if (!this.isWatered) {
                this.isWatered = true;
                item.count--; // Минус прочность

                if (item.count <= 0) {
                    gameState.inventory[gameState.selectedSlot] = null;
                    if (this.debugConsole) this.debugConsole.addMessage("Лейка сломалась!", "#ff4444", "❌");
                }

                this.drawBackground();
                if (this.updateInvUI) this.updateInvUI();
                if (this.debugConsole) this.debugConsole.addMessage(`Полито! Осталось воды: ${item.count || 0}`, '#00aaff', '💧');
            }
            return;
        }

        // 3. ЛОГИКА ПОСАДКИ
        if (this.type === 1 && !this.isGrowing) {
            if (item && item.type && item.count > 0 && item.type !== 'tool') {
                item.count--;
                if (item.count === 0) gameState.inventory[gameState.selectedSlot] = null;
                if (this.updateInvUI) this.updateInvUI();

                this.isGrowing = true;
                this.plantedType = { ...item };
                this.plant.tint = item.color;
                this.plant.visible = true;

                if (this.debugConsole) this.debugConsole.logPlant(item.name);
            }
        }
        // 4. ЛОГИКА СБОРА
        else if (this.isGrowing && this.plant.scale.x >= 1) {
            const spinResult = await spinSlots(this.slotText);

            if (spinResult.message && this.slotText) this.slotText.text = spinResult.message;

            let finalReward = 0;
            if (spinResult.rewardGold > 0) {
                finalReward = this.plantedType.bonus * spinResult.rewardGold;
            }

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
                        currentItem.count += spinResult.seedChange;
                    } else if (!currentItem) {
                        gameState.inventory[currentSlot] = {
                            name: this.plantedType.name,
                            type: this.plantedType.type,
                            bonus: this.plantedType.bonus,
                            color: this.plantedType.color,
                            count: spinResult.seedChange
                        };
                    } else {
                        let found = false;
                        for (let i = 0; i < gameState.inventory.length; i++) {
                            const it = gameState.inventory[i];
                            if (it && it.type === this.plantedType.type) {
                                it.count += spinResult.seedChange;
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
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
                    const seedsToLose = Math.abs(spinResult.seedChange);
                    if (currentItem && currentItem.type === this.plantedType.type) {
                        currentItem.count -= seedsToLose;
                        if (currentItem.count <= 0) gameState.inventory[currentSlot] = null;
                    } else {
                        for (let i = 0; i < gameState.inventory.length; i++) {
                            const it = gameState.inventory[i];
                            if (it && it.type === this.plantedType.type) {
                                it.count -= seedsToLose;
                                if (it.count <= 0) gameState.inventory[i] = null;
                                break;
                            }
                        }
                    }
                }

                if (this.debugConsole) {
                    const seedType = this.plantedType.type === 'green' ? 'зелёных' : 'красных';
                    this.debugConsole.logSeedChange(spinResult.seedChange, seedType);
                }

                if (this.updateInvUI) {
                    this.updateInvUI();
                }
            }

            // Сброс грядки
            this.isGrowing = false;
            this.isWatered = false; // После сбора земля высыхает
            this.plant.visible = false;
            this.plant.scale.set(0.1);
            this.drawBackground();
        }
    }

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
        if (this.isGrowing && this.plant.scale.x < 1) {
            // РОСТ: если полито, скорость в 2 раза выше
            const multiplier = this.isWatered ? 2 : 1;
            this.plant.scale.x += this.baseGrowthSpeed * multiplier * dt;
            this.plant.scale.y += this.baseGrowthSpeed * multiplier * dt;
        }

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