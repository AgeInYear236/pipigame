import { Container, Graphics, Text } from 'pixi.js';
import { gameState } from './GameState';

export class Shop extends Container {
    constructor(app, updateInvUI, debugConsole, goldText, allTiles) {
        super();
        this.app = app;
        this.updateInvUI = updateInvUI;
        this.debugConsole = debugConsole;
        this.goldText = goldText;
        this.allTiles = allTiles;

        this.x = window.innerWidth - 80;
        this.y = 20;

        // Иконка корзины
        this.icon = new Graphics()
            .roundRect(0, 0, 60, 60, 10)
            .fill(0xffcc00)
            .stroke({ color: 0xffffff, width: 2 });

        const label = new Text({ text: "🛒", style: { fontSize: 32 } });
        label.anchor.set(0.5);
        label.x = 30; label.y = 30;
        this.addChild(this.icon, label);

        this.shopWindow = new Container();
        this.shopWindow.visible = false;
        this.shopWindow.eventMode = 'none'; // БЛОКИРУЕМ клики сквозь закрытое окно
        this.addChild(this.shopWindow); // Добавляем окно ПЕРЕД иконкой

        // --- НОВЫЕ ПАРАМЕТРЫ СКРОЛЛА ---
        this.shopHeight = 400; // Высота видимой области
        this.createShopWindow();

        this.iconCont = new Container(); // Создаем отдельный контейнер для иконки
        this.iconCont.addChild(this.icon, label);
        this.addChild(this.iconCont); // Иконка теперь ВСЕГДА сверху

        this.iconCont.eventMode = 'static';
        this.iconCont.cursor = 'pointer';
        this.iconCont.on('pointerdown', (e) => {
            e.stopPropagation(); // Останавливаем всплытие события
            this.toggleShop();
        });

        // ОБРАБОТКА СКРОЛЛА МЫШЬЮ
        this.eventMode = 'static';
        this.on('wheel', (e) => {
            if (!this.shopWindow.visible) return;
            const scrollSpeed = 20;
            this.catalogList.y -= e.deltaY > 0 ? scrollSpeed : -scrollSpeed;

            // Ограничения скролла
            const minBtn = 0;
            const maxScroll = Math.min(0, this.shopHeight - this.catalogList.height - 20);
            if (this.catalogList.y > minBtn) this.catalogList.y = minBtn;
            if (this.catalogList.y < maxScroll) this.catalogList.y = maxScroll;
        });

        this.createShopWindow();
    }

    createShopWindow() {
        this.shopWindow.removeChildren();

        // Фон окна
        const bg = new Graphics()
            .roundRect(-220, 70, 280, 450, 15)
            .fill({ color: 0x000000, alpha: 0.9 })
            .stroke({ color: 0xffcc00, width: 2 });
        this.shopWindow.addChild(bg);

        // Контейнер-маска (как в телефоне)
        const mask = new Graphics()
            .roundRect(-215, 80, 270, this.shopHeight, 10)
            .fill(0xffffff);
        this.shopWindow.addChild(mask);

        // Контейнер для списка товаров
        this.scrollArea = new Container();
        this.scrollArea.x = -210;
        this.scrollArea.y = 85;
        this.scrollArea.mask = mask;
        this.shopWindow.addChild(this.scrollArea);

        this.catalogList = new Container();
        this.scrollArea.addChild(this.catalogList);

        this.renderCatalog();
        this.addChild(this.shopWindow);
    }

    renderCatalog() {
        this.catalogList.removeChildren();

        const catalog = [
            { name: 'Bio-Slot Preparator', toolType: 'hoe', price: 50, count: 5, color: 0xaaaaaa, type: 'tool' },
            { name: 'Liquid Luck Dispenser', toolType: 'can', price: 40, count: 5, color: 0x00aaff, type: 'tool' },
            { name: 'Deep-Fluid Server', toolType: 'well', price: 500, count: 1, color: 0x555555, type: 'building' },
            { name: 'Slot-Lime', type: 'green', bonus: 10, price: 20, count: 5, color: 0x32cd32 },
            { name: 'Roulette-Cherry', type: 'red', bonus: 25, price: 50, count: 5, color: 0xff4500 },
            { name: 'RTP Booster', type: 'fertilizer', price: 30, count: 5, color: 0xeeeeee }
        ];

        // Добавляем Синие Семена, если разблокированы
        if (gameState.quests.blueSeeds && gameState.quests.blueSeeds.unlocked) {
            catalog.push({ name: 'Indigo Pulse', type: 'blue', bonus: 50, price: 150, count: 5, color: 0x00aaff });
        }

        catalog.forEach((item, i) => {
            const row = new Container();
            row.y = i * 70;

            const btn = new Graphics().roundRect(0, 0, 240, 60, 5).fill(0x333333);
            btn.eventMode = 'static';
            btn.cursor = 'pointer';

            const txt = new Text({
                text: `${item.name} - ${item.price}💰`,
                style: { fill: 0xffffff, fontSize: 14 }
            });
            txt.x = 10; txt.y = 20;

            btn.on('pointerdown', () => this.buyItem(item));
            row.addChild(btn, txt);
            this.catalogList.addChild(row);
        });
    }

    // Метод buyItem остается БЕЗ ИЗМЕНЕНИЙ (твой функционал колодца и инвентаря сохранен)
    buyItem(conf) {
        if (gameState.gold < conf.price) {
            this.debugConsole?.addMessage("[ОШИБКА]: Баланс ниже минимальной ставки!", "#ff4444");
            return;
        }
        if (conf.toolType === 'well') {
            if (gameState.hasWell) {
                this.debugConsole?.addMessage("Колодец уже построен!", "#ffaa00");
                return;
            }
            const grassTiles = this.allTiles.filter(t => t.type === 0);
            if (grassTiles.length > 0) {
                gameState.gold -= conf.price;
                this.goldText.text = `Кредиты: ${gameState.gold}`;
                gameState.hasWell = true;
                const randomTile = grassTiles[Math.floor(Math.random() * grassTiles.length)];
                randomTile.type = 3;
                randomTile.drawBackground();
                this.debugConsole?.addMessage("Колодец построен!", "#00ffff", "🏗️");
                this.updateInvUI();
            } else {
                this.debugConsole?.addMessage("Нет места для колодца!", "#ff4444");
            }
            return;
        }

        let slot = gameState.inventory.findIndex(s => s && s.type === conf.type && conf.type !== 'tool');
        if (slot === -1) slot = gameState.inventory.findIndex(s => s === null);

        if (slot !== -1) {
            gameState.gold -= conf.price;
            this.goldText.text = `Кредиты: ${gameState.gold}`;
            if (gameState.inventory[slot]) {
                gameState.inventory[slot].count += conf.count;
            } else {
                gameState.inventory[slot] = { ...conf };
            }
            this.updateInvUI();
            this.debugConsole?.addMessage(`Куплено: ${conf.name}`, "#4caf50");
        } else {
            this.debugConsole?.addMessage("[ОТКАЗ]: Слот-хранилище перегружено.", "#ff4444");
        }
    }

    toggleShop() {
        this.shopWindow.visible = !this.shopWindow.visible;
        // Если окно открыто — оно должно принимать клики (для покупки), если закрыто — нет
        this.shopWindow.eventMode = this.shopWindow.visible ? 'static' : 'none';

        if (this.shopWindow.visible) {
            this.renderCatalog();
        }
    }

    resize() {
        this.x = window.innerWidth - 80;
    }
}