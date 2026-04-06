import {Container, Graphics, Sprite, Text, TextStyle} from 'pixi.js';
import { gameState } from './GameState';
import { spinSlots } from './Casino';
import { textures } from './main';

export class Tile extends Container {
    constructor(type, gridX, gridY, tileSize, player, goldText, slotText, mapLayout, entityLayer, updateInvUI, debugConsole) {
        super();
        this.type = type; // 0: трава, 1: сектор, 2: забор, 3: сервер, 4: автомат
        this.gridX = gridX;
        this.gridY = gridY;
        this.tileSize = tileSize;
        this.player = player;
        this.goldText = goldText;
        this.slotText = slotText;
        this.updateInvUI = updateInvUI;
        this.debugConsole = debugConsole;

        this.x = gridX * tileSize;
        this.y = gridY * tileSize;

        this.isSolid = (type === 2);
        this.isWatered = false;
        this.isFertilized = false;
        this.isGrowing = false;

        // Данные растения
        this.plantedData = null; // { type: 'green', stage: 0, timer: 0 }
        this.growthThreshold = 100; // Очки для перехода на следующую стадию

        this.popUps = [];

        // 1. СЛОЙ ЗЕМЛИ (Background)
        this.bg = new Sprite(textures.t_empty);
        this.bg.width = tileSize;
        this.bg.height = tileSize;
        this.addChild(this.bg);

        // 2. СЛОЙ ОБЪЕКТА (Plant / Scarecrow / Machine)
        this.objectSprite = new Sprite();
        this.objectSprite.anchor.set(0.5);
        this.objectSprite.position.set(tileSize / 2, tileSize / 2);
        this.objectSprite.visible = false;
        this.addChild(this.objectSprite);

        // 3. СЛОЙ SMART FENCE (Только для типа 2)
        if (this.type === 2) {
            this.fenceGraphics = new Graphics();
            this.addChild(this.fenceGraphics);
            this.drawSmartFence(mapLayout);
        }

        this.updateVisual();

        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.on('pointerdown', () => this.handleClick());
    }

    updateVisual() {
        const isRainy = (gameState.currentWeather === 'rainy');
        const showingAsWatered = this.isWatered || isRainy;

        // Визуал ТАЙЛА (Земля)
        if (this.type === 1) {
            this.bg.texture = showingAsWatered ? textures.t_watered : textures.t_plowed;
            this.bg.tint = 0xffffff;
            if (this.isFertilized) {
                this.bg.tint = 0x00ff00; // Подсветить зеленым, если активен RTP Booster
            }
        } else if (this.type === 2) {
            this.bg.texture = textures.t_empty;
            this.bg.tint = 0x222222; // Забор (если нет спрайта, просто темним фон)
        } else if (this.type === 3 || this.type === 4) {
            this.bg.texture = textures.t_well;
        } else {
            this.bg.texture = textures.t_empty;
            this.bg.tint = 0xffffff;
        }

        // Визуал ОБЪЕКТА (Что сверху)
        if (this.type === 4) {
            this.objectSprite.visible = true;
            this.objectSprite.texture = textures.scarecrow;
            this.objectSprite.width = this.tileSize * 0.8;
            this.objectSprite.height = this.tileSize * 0.8;
        } else if (this.isGrowing && this.plantedData) {
            this.objectSprite.visible = true;
            // Динамическое имя: например 'green_2'
            const texKey = `${this.plantedData.type}_${this.plantedData.stage}`;
            this.objectSprite.texture = textures[texKey] || textures.green_0;

            // Масштабируем в зависимости от стадии
            const scaleMap = [0.4, 0.6, 0.8, 1.0];
            const s = scaleMap[this.plantedData.stage] || 0.5;
            this.objectSprite.width = this.tileSize * s;
            this.objectSprite.height = this.tileSize * s;
        } else {
            this.objectSprite.visible = false;
        }
    }

    async handleClick() {
        if (gameState.isGameOver) return; // Запрещаем любые действия
        if (this.isSolid || this.type === 4 || gameState.isSpinning) return;

        // Проверка дистанции до игрока
        const dx = (this.x + this.tileSize / 2) - this.player.x;
        const dy = (this.y + this.tileSize / 2) - this.player.y;
        if (Math.sqrt(dx * dx + dy * dy) > this.tileSize * 2.5) return;

        const item = gameState.inventory[gameState.selectedSlot];

        // 4. СБОР (Спин)
        if (this.isGrowing && this.plantedData?.stage === 3) {
            const res = await spinSlots(this.slotText, {
                bonus: this.plantedData.bonus,
                isFertilized: this.isFertilized
            });

            if (res.rewardGold > 0) {
                gameState.gold += res.rewardGold;
                this.goldText.text = `CREDITS: ${gameState.gold}`;
                this.spawnCoinText(res.rewardGold);
            }

            // Сброс клетки
            this.isGrowing = false;
            this.isWatered = false;
            this.isFertilized = false;
            this.plantedData = null;
            this.updateVisual();
            return;
        }


        if (this.type === 3) {
            if (item && item.toolType === 'bucket') {
                // Устанавливаем заряды ведра в 5
                item.count = 5;

                // Важно: вызываем обновление интерфейса, чтобы x0 сменилось на x5
                if (this.updateInvUI) this.updateInvUI();

                if (this.debugConsole) {
                    this.debugConsole.addMessage("СИНХРОНИЗАЦИЯ: Резервуар заполнен Liquid Luck", "#00ffff", "💧");
                }
            } else {
                if (this.debugConsole) {
                    this.debugConsole.addMessage("СИСТЕМА: Требуется пустой контейнер (Bucket)", "#666666");
                }
            }
            return; // Выходим, чтобы не сработали другие логики клика
        }

        if (this.type === 1 && item.type === 'fertilizer') {
            if (!this.isFertilized) {
                this.isFertilized = true;
                this.consumeItem(item); // Уменьшаем количество
                this.updateVisual();
                if (this.debugConsole) this.debugConsole.addMessage("RTP BOOSTER: ШАНС ЗАНОСА УВЕЛИЧЕН", "#00ff00");
            } else {
                this.debugConsole?.addMessage("СЕКТОР УЖЕ ОПТИМИЗИРОВАН", "#aaaaaa");
            }
            return; // ОБЯЗАТЕЛЬНО выходим, чтобы не сработала посадка ниже!
        }

        // 1. АКТИВАЦИЯ СЕКТОРА (Preparator / Hoe)
        if (this.type === 0 && item?.toolType === 'hoe') {
            this.type = 1;
            this.consumeItem(item);
            this.updateVisual();
            this.debugConsole?.addMessage("СЕКТОР АКТИВИРОВАН", "#00ff00");
            return;
        }

        // 2. ПОЛИВ (Dispenser / Can / Bucket)
        if (this.type === 1 && !this.isWatered && (item?.toolType === 'can' || item?.toolType === 'bucket')) {
            if (item.count > 0) {
                this.isWatered = true;
                this.consumeItem(item);
                this.updateVisual();
                this.debugConsole?.addMessage("ЦИКЛ УСКОРЕН", "#00aaff");
            }
            return;
        }

        // 3. СТАВКА (Посадка семян)
        if (this.type === 1 && !this.isGrowing && item?.type && item.type !== 'tool') {
            this.plantedData = {
                type: item.type, // 'green', 'blue', 'red'
                stage: 0,
                timer: 0,
                bonus: item.bonus || 0,
                name: item.name
            };
            this.isGrowing = true;
            this.consumeItem(item);
            this.updateVisual();
            this.debugConsole?.addMessage(`СТАВКА: ${this.plantedData.name}`, "#ffd700");
            return;
        }


    }

    consumeItem(item) {
        item.count--;

        // Если это ведро, оно остается в инвентаре даже с 0 зарядов
        if (item.count <= 0) {
            if (item.toolType === 'bucket') {
                item.count = 0; // Оставляем пустое ведро
                if (this.debugConsole) this.debugConsole.addMessage("Контейнер пуст. Нужна дозаправка.", "#ff4444");
            } else {
                // Для остальных (семена, одноразовые лейки) — удаляем
                gameState.inventory[gameState.selectedSlot] = null;
            }
        }

        this.updateInvUI();
    }

    drawSmartFence(map) {
        const g = this.fenceGraphics;
        const mid = this.tileSize / 2;
        const thickness = 6; // Толщина перекладин

        g.clear();

        // Центральный столб
        g.rect(mid - 8, mid - 8, 16, 16).fill(0x1a1a1a);
        g.stroke({ color: 0x00ff00, width: 1, alpha: 0.5 }); // Неоновая окантовка столба

        // Проверка соседей (тип 2 — забор)
        const isF = (x, y) => map[y] && map[y][x] === 2;

        // Отрисовка соединений
        if (isF(this.gridX, this.gridY - 1)) { // Сверху
            g.rect(mid - thickness / 2, 0, thickness, mid).fill(0x333333);
        }
        if (isF(this.gridX, this.gridY + 1)) { // Снизу
            g.rect(mid - thickness / 2, mid, thickness, mid).fill(0x333333);
        }
        if (isF(this.gridX - 1, this.gridY)) { // Слева
            g.rect(0, mid - thickness / 2, mid, thickness).fill(0x333333);
        }
        if (isF(this.gridX + 1, this.gridY)) { // Справа
            g.rect(mid, mid - thickness / 2, mid, thickness).fill(0x333333);
        }
    }

    spawnCoinText(amount) {
        const txt = new Text({
            text: `+${amount} CR`,
            style: { fill: '#00ff00', fontSize: 20, fontWeight: 'bold', fontFamily: 'monospace' }
        });
        txt.anchor.set(0.5);
        txt.x = this.tileSize / 2;
        txt.y = 10;
        this.addChild(txt);
        this.popUps.push(txt);
    }

    update(dt) {

        if (this.type === 1) {
            const isRainy = (gameState.currentWeather === 'rainy');
            const shouldShowWatered = this.isWatered || isRainy;

            // Если текущее состояние текстуры не совпадает с погодным — обновляем
            if (this.lastVisualState !== shouldShowWatered) {
                this.lastVisualState = shouldShowWatered;
                this.updateVisual();
            }
        }

        // Логика роста
        if (this.isGrowing && this.plantedData && this.plantedData.stage < 3) {
            const isRainy = (gameState.currentWeather === 'rainy');
            const multiplier = (this.isWatered || isRainy) ? 2.5 : 1.0;

            this.plantedData.timer += dt * multiplier * 0.2; // Скорость роста

            if (this.plantedData.timer >= this.growthThreshold) {
                this.plantedData.stage++;
                this.plantedData.timer = 0;
                this.updateVisual();
                if (this.debugConsole && this.plantedData.stage === 3) {
                    this.debugConsole.addMessage("АССЕТ СФОРМИРОВАН. ЖМИ ДЛЯ СПИНА", "#ffd700");
                }
            }
        }

        // Всплывающие тексты
        for (let i = this.popUps.length - 1; i >= 0; i--) {
            const txt = this.popUps[i];
            txt.y -= 0.5 * dt;
            txt.alpha -= 0.01 * dt;
            if (txt.alpha <= 0) {
                this.removeChild(txt);
                this.popUps.splice(i, 1);
            }
        }
    }
}
