import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { gameState } from './GameState';

export class Shop extends Container {
    // Добавь goldText в конструктор
    constructor(app, updateInvUI, debugConsole, goldText) {
        super();
        this.app = app;
        this.updateInvUI = updateInvUI;
        this.debugConsole = debugConsole;
        this.goldText = goldText; // Сохраняем ссылку на текст
        // Позиция магазина (справа вверху)
        this.x = window.innerWidth - 80;
        this.y = 20;

        // Иконка магазина
        this.icon = new Graphics()
            .roundRect(0, 0, 60, 60, 10)
            .fill(0xffcc00)
            .stroke({ color: 0xffffff, width: 2 });

        const shopLabel = new Text({
            text: "🛒",
            style: { fontSize: 30 }
        });
        shopLabel.anchor.set(0.5);
        shopLabel.x = 30;
        shopLabel.y = 30;

        this.addChild(this.icon, shopLabel);

        // Окно магазина (скрыто по умолчанию)
        this.shopWindow = new Container();
        this.shopWindow.visible = false;
        this.createShopWindow();

        // Делаем иконку интерактивной
        this.icon.eventMode = 'static';
        this.icon.cursor = 'pointer';
        this.icon.on('pointerdown', () => {
            this.shopWindow.visible = !this.shopWindow.visible;
        });
    }

    createShopWindow() {
        const bg = new Graphics()
            .roundRect(-250, 70, 300, 400, 15)
            .fill({ color: 0x000000, alpha: 0.85 })
            .stroke({ color: 0xffcc00, width: 3 });

        this.shopWindow.addChild(bg);

        const items = [
            { name: 'Тяпка', type: 'tool', toolType: 'hoe', price: 50, count: 5, color: 0xaaaaaa },
            { name: 'Лейка', type: 'tool', toolType: 'can', price: 40, count: 5, color: 0x00aaff },
            { name: 'Зелёные семена', type: 'green', bonus: 10, price: 20, count: 5, color: 0x32cd32 },
            { name: 'Красные семена', type: 'red', bonus: 15, price: 30, count: 5, color: 0xff4500 }
        ];

        items.forEach((item, i) => {
            const itemRow = new Container();
            itemRow.y = 90 + (i * 90);
            itemRow.x = -230;

            const btn = new Graphics()
                .roundRect(0, 0, 260, 80, 8)
                .fill(0x333333);
            btn.eventMode = 'static';
            btn.cursor = 'pointer';

            const txt = new Text({
                text: `${item.name}\nЦена: ${item.price} 💰`,
                style: { fill: 0xffffff, fontSize: 16 }
            });
            txt.x = 10;
            txt.y = 10;

            btn.on('pointerdown', () => this.buyItem(item));

            itemRow.addChild(btn, txt);
            this.shopWindow.addChild(itemRow);
        });

        this.addChild(this.shopWindow);
    }

    buyItem(itemConfig) {
        if (gameState.gold >= itemConfig.price) {
            let targetSlot = -1;

            // Логика поиска слота...
            if (itemConfig.type !== 'tool') {
                targetSlot = gameState.inventory.findIndex(slot =>
                    slot && slot.type === itemConfig.type
                );
            }
            if (targetSlot === -1) {
                targetSlot = gameState.inventory.findIndex(slot => slot === null);
            }

            if (targetSlot !== -1) {
                // 1. Списываем деньги в логике
                gameState.gold -= itemConfig.price;

                // 2. КРИТИЧЕСКИЙ МОМЕНТ: Обновляем текст на экране сразу!
                if (this.goldText) {
                    this.goldText.text = `Золото: ${gameState.gold}`;
                }

                // 3. Добавляем предмет
                if (gameState.inventory[targetSlot]) {
                    gameState.inventory[targetSlot].count += itemConfig.count;
                } else {
                    gameState.inventory[targetSlot] = { ...itemConfig };
                    delete gameState.inventory[targetSlot].price;
                }

                if (this.updateInvUI) this.updateInvUI();
                if (this.debugConsole) this.debugConsole.addMessage(`Куплено: ${itemConfig.name}`, '#4caf50', '🛍️');
            }
        } else {
            if (this.debugConsole) this.debugConsole.addMessage("Недостаточно золота!", "#ff4444");
        }
    }

    // Метод для обновления позиции при ресайзе окна
    resize() {
        this.x = window.innerWidth - 80;
    }
}