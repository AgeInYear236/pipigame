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

        // Иконка корзины (терминала покупок)
        this.icon = new Graphics()
            .roundRect(0, 0, 60, 60, 10)
            .fill(0xffbb00)
            .stroke({ color: 0xffffff, width: 2 });

        const label = new Text({ text: "💰", style: { fontSize: 32 } }); // Сменил на мешок с деньгами/чип
        label.anchor.set(0.5);
        label.x = 30; label.y = 30;
        this.addChild(this.icon, label);

        this.shopWindow = new Container();
        this.shopWindow.visible = false;
        this.shopWindow.eventMode = 'none';
        this.addChild(this.shopWindow);

        this.shopHeight = 400;

        this.iconCont = new Container();
        this.iconCont.addChild(this.icon, label);
        this.addChild(this.iconCont);

        this.iconCont.eventMode = 'static';
        this.iconCont.cursor = 'pointer';
        this.iconCont.on('pointerdown', (e) => {
            e.stopPropagation();
            this.toggleShop();
        });

        this.eventMode = 'static';
        this.on('wheel', (e) => {
            if (!this.shopWindow.visible) return;
            const scrollSpeed = 20;
            this.catalogList.y -= e.deltaY > 0 ? scrollSpeed : -scrollSpeed;

            const minBtn = 0;
            const maxScroll = Math.min(0, this.shopHeight - this.catalogList.height - 20);
            if (this.catalogList.y > minBtn) this.catalogList.y = minBtn;
            if (this.catalogList.y < maxScroll) this.catalogList.y = maxScroll;
        });

        this.createShopWindow();

        this.on('wheel', (e) => {
            if (!this.shopWindow.visible) return;

            const scrollSpeed = 30;
            // Двигаем catalogList относительно scrollArea
            this.catalogList.y -= e.deltaY > 0 ? scrollSpeed : -scrollSpeed;

            // Ограничения прокрутки
            const minScroll = 0; // Верхняя граница
            const maxScroll = Math.min(0, (this.shopHeight - 20) - this.catalogList.height);

            if (this.catalogList.y > minScroll) this.catalogList.y = minScroll;
            if (this.catalogList.y < maxScroll) this.catalogList.y = maxScroll;
        });

    }

    createShopWindow() {
        this.shopWindow.removeChildren();

        const windowWidth = 280;
        const windowHeight = 450;
        const offsetTop = -470; // На сколько окно поднято над кнопкой

        // 1. ФОН ОКНА
        const bg = new Graphics()
            .roundRect(0, offsetTop, windowWidth, windowHeight, 15)
            .fill({ color: 0x000000, alpha: 0.9 })
            .stroke({ color: 0x00aaff, width: 2 });
        this.shopWindow.addChild(bg);

        // 2. МАСКА (теперь она точно там же, где контент)
        const mask = new Graphics()
            .roundRect(5, offsetTop + 10, windowWidth - 10, windowHeight - 20, 10)
            .fill(0xffffff);
        this.shopWindow.addChild(mask);

        // 3. КОНТЕЙНЕР ПРОКРУТКИ
        this.scrollArea = new Container();
        this.scrollArea.x = 10;
        this.scrollArea.y = offsetTop + 15;
        this.scrollArea.mask = mask; // Включаем обратно
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
            { name: 'Slot-Lime [LV]', type: 'green', bonus: 3, price: 20, count: 5, color: 0x32cd32 },
            { name: 'Roulette-Cherry [HS]', type: 'red', bonus: 13, price: 35, count: 3, color: 0xff4500 },
            { name: 'RTP Booster (+50%)', type: 'fertilizer', price: 30, count: 5, color: 0xeeeeee }
        ];

        if (gameState.quests.blueSeeds && gameState.quests.blueSeeds.unlocked) {
            catalog.push({ name: 'JACKPOT NEON', type: 'blue', bonus: 50, price: 150, count: 5, color: 0x00aaff });
        }

        catalog.forEach((item, i) => {
            const row = new Container();
            row.y = i * 70;

            const btn = new Graphics().roundRect(0, 0, 240, 60, 5).fill(0x1a1a1a).stroke({color: 0x333333, width: 1});
            btn.eventMode = 'static';
            btn.cursor = 'pointer';

            const txt = new Text({
                text: `${item.name}\nCOST: ${item.price} CR`, // Изменил 💰 на CR (Credits)
                style: { fill: '#00aaff', fontSize: 13, fontWeight: 'bold' }
            });
            txt.x = 10; txt.y = 12;

            btn.on('pointerdown', () => this.buyItem(item));
            row.addChild(btn, txt);
            this.catalogList.addChild(row);
        });
    }

    buyItem(conf) {
        console.log("Мой менеджер квестов:", this.questManager);
        // 1. Проверка золота
        if (gameState.gold < conf.price) {
            this.debugConsole?.addMessage("[ОШИБКА]: Баланс ниже минимальной ставки!", "#ff4444");
            return;
        }

        // 2. Логика для постройки колодца (Deep-Fluid Server)
        if (conf.toolType === 'well') {
            if (gameState.hasWell) {
                this.debugConsole?.addMessage("[ОТКАЗ]: Сервер уже активен!", "#ffaa00");
                return;
            }
            const grassTiles = this.allTiles.filter(t => t.type === 0);
            if (grassTiles.length > 0) {
                this.executePurchase(conf); // Выносим общую логику списания денег
                gameState.hasWell = true;
                const randomTile = grassTiles[Math.floor(Math.random() * grassTiles.length)];
                randomTile.type = 3;
                randomTile.updateVisual();
                this.debugConsole?.addMessage("Deep-Fluid Server онлайн!", "#00ffff", "📡");

            } else {
                this.debugConsole?.addMessage("[ОШИБКА]: Нет свободного сектора!", "#ff4444");
            }
            return;
        }

        // 3. Логика для предметов и инструментов
        // Сначала ищем, есть ли уже такой предмет (чтобы стакать семена или не покупать вторую тяпку)
        let slot = gameState.inventory.findIndex(s => s && s.name === conf.name);

        // Если это не инструмент и предмет найден — стакаем
        if (slot !== -1 && conf.type !== 'tool') {
            this.executePurchase(conf);
            gameState.inventory[slot].count += conf.count;
            this.afterPurchase();
            return;
        }

        // Если предмета нет, ищем пустой слот
        let emptySlot = gameState.inventory.findIndex(s => s === null);
        if (emptySlot !== -1) {
            this.executePurchase(conf);
            gameState.inventory[emptySlot] = { ...conf };
            this.afterPurchase();
        } else {
            this.debugConsole?.addMessage("[ОТКАЗ]: Слот-хранилище перегружено.", "#ff4444");
        }
    }

// Вспомогательные методы для чистоты кода
    executePurchase(conf) {
        gameState.gold -= conf.price;
        this.goldText.text = `CREDITS: ${gameState.gold}`;
    }

    afterPurchase() {
        this.updateInvUI();
        this.debugConsole?.addMessage("ТРАНЗАКЦИЯ ПОДТВЕРЖДЕНА", "#4caf50");
        // Обязательно уведомляем менеджер квестов!

    }

    toggleShop() {
        this.shopWindow.visible = !this.shopWindow.visible;
        this.shopWindow.eventMode = this.shopWindow.visible ? 'static' : 'none';

        if (this.shopWindow.visible) {
            this.renderCatalog();
        }
    }

    resize() {
    }
}