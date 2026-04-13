import {gameState} from "./GameState";

export class QuestManager {
    constructor(dependencies) {
        this.gameState = dependencies.gameState;
        this.phone = dependencies.phone;
        this.debugConsole = dependencies.debugConsole;
        this.tiles = dependencies.tiles;
        this.goldText = dependencies.goldText;
        this.updateInvUI = dependencies.updateInvUI;
        this.shop = dependencies.shop;
        this.questInfoText = dependencies.questInfoText;

        this.checkTimer = 0;
        this.checkInterval = 30;
    }

    update() {
        if (this.gameState.isGameOver) return;
        this.checkTimer++;
        if (this.checkTimer >= this.checkInterval) {
            this.checkTimer = 0;
            this.processQuests();
        }
        this.refreshVisualUI();
    }

    processQuests() {
        const q = this.gameState.quests;

        // 1. ВСТУПЛЕНИЕ
        if (q.intro.active && this.gameState.introMessageRead) {
            this.completeQuest('intro',
                "Система активна. За подготовку почвы ты получишь 50 золотых. Я выдал тебе Slot-Preparator. Вспахай 3 сектора, чтобы продолжить.",
                { name: 'Bio Slot-Preparator', toolType: 'hoe', count: 5 }, "PIT BOSS"
            );
            this.activateQuest('plowTutorial');
        }

        // 2. ОБУЧЕНИЕ: ВСКАПЫВАНИЕ
        if (q.plowTutorial.active) {
            q.plowTutorial.current = this.tiles.filter(t => t.type === 1).length;
            if (q.plowTutorial.current >= q.plowTutorial.target) {
                this.completeQuest('plowTutorial',
                    "Почва готова! Твои 50 золотых зачислены. За посадку ассетов получишь еще 50. Я выдал семена, посади их в подготовленные клетки.",
                    { name: 'Green Seeds', type: 'green', count: 10, bonus: 3 }, "PIT BOSS"
                );
                this.activateQuest('plantTutorial');
            }
        }

        // 3. ОБУЧЕНИЕ: ПОСАДКА
        if (q.plantTutorial.active) {
            q.plantTutorial.current = this.tiles.filter(t => t.plantedData).length;
            if (q.plantTutorial.current >= q.plantTutorial.target) {
                this.completeQuest('plantTutorial',
                    "Ассеты в системе. Зачислил 50 золота. За полив выдам еще 50. Возьми Liquid Dispenser и полей свои ростки.",
                    { name: 'Liquid Luck Dispenser', toolType: 'can', count: 3 }, "PIT BOSS"
                );
                this.activateQuest('waterTutorial');
            }
        }

        // 4. ОБУЧЕНИЕ: ПОЛИВ
        if (q.waterTutorial.active) {
            q.waterTutorial.current = this.tiles.filter(t => t.type === 1 && t.isWatered).length;
            if (q.waterTutorial.current >= q.waterTutorial.target) {
                this.completeQuest('waterTutorial',
                    "Влажность в норме! +50 золота. Теперь проверь магазин. За первую покупку любого предмета я дам тебе 100 золота. Открой Shop и купи что-нибудь. Кстати, эти Диспенсеры очень часто выъодят из строя. Дам тебе проверенное средство - Shiny Coin Bucket!"
                , { name: 'Shiny Coin Bucket', toolType: 'bucket', count: 5 }, "PIT BOSS"
                );
                this.activateQuest('shopTutorial');
            }
        }

        // 5. ОБУЧЕНИЕ: МАГАЗИН (Проверяем, уменьшилось ли золото или изменился инвентарь)
        // Для простоты: квест завершится, как только игрок что-то купит
        if (q.shopTutorial.active) {
            // Считаем, сколько всего предметов сейчас в инвентаре (не пустых слотов)
            const currentInvCount = this.gameState.inventory.filter(slot => slot !== null).length;

            if (currentInvCount > this.gameState.lastInventoryCount || this.gameState.hasWell) {
                // ФИНАЛЬНОЕ СООБЩЕНИЕ ОБУЧЕНИЯ
                this.completeQuest('shopTutorial',
                    "Базовый софт настроен, Оператор. Послденее напутствие: используй удобрения, чтобы повысить вероятность заноса (RTP) на 50%. И не забывай про комиссию — система списывает 50 кредитов каждые сутки! Теперь работай: вспахай 30 клеток для расширения мощностей.",
                    null, "PIT BOSS"
                );

                // Активируем первый серьезный квест
                this.activateQuest('mainPlow');

                // Можно добавить системное уведомление в консоль для закрепления
                this.debugConsole.addMessage("СИСТЕМА: Включен протокол ежедневной комиссии (50 CR)", "#ff4444", "⚠");
            }
        }

        // 6. ОСНОВНОЙ КВЕСТ: 30 КЛЕТОК
        if (q.mainPlow.active) {
            q.mainPlow.current = this.tiles.filter(t => t.type === 1).length;
            if (q.mainPlow.current >= q.mainPlow.target) {
                this.completeQuest('mainPlow',
                    "Масштабирование завершено! Лови 300 золотых. Теперь нужно обеспечить полив 40 клеток для стабильного профита. За это дам 400.", null, "PIT BOSS"
                );
                this.activateQuest('mainWater');
            }
        }

        // 7. ОСНОВНОЙ КВЕСТ: 40 ПОЛИТЫХ
        if (q.mainWater.active) {
            q.mainWater.current = this.tiles.filter(t => t.type === 1 && t.isWatered).length;
            if (q.mainWater.current >= q.mainWater.target) {
                this.completeQuest('mainWater',
                    "Система охлаждена! Зачислил 400 золотых. Твоя финальная цель — скопить 1000 золота для выхода на новый уровень. Работай!", null, "PIT BOSS"
                );
                this.activateQuest('goldHoarder');
                gameState.houseQuestSent = true;
            }
        }

        if (q.goldHoarder.active) {
            q.goldHoarder.current = this.gameState.gold;
            if (this.gameState.gold >= q.goldHoarder.threshold) {
                this.completeQuest('goldHoarder',
                    "Впечатляющий капитал, Оператор. CORE_ASSOCIATION заметили твой успех. Жди дальнейших указаний.", null, "PIT BOSS"
                );

                // Через небольшую паузу пишет CORE_ASSOCIATION
                setTimeout(() => {
                    this.phone.addIncomingMessage("CORE_ASSOCIATION",
                        "Твои активы слишком заметны. Чтобы получить доступ к [INDIGO PULSE], ты должен очистить баланс. Потрать всё! Баланс должен быть меньше 100 CR."
                    );
                    this.activateQuest('burnMoney');
                }, 5000);
            }
        }

// 8. КВЕСТ: ТРАТА ДЕНЕГ (МЕНЬШЕ 100)
        if (q.burnMoney.active) {
            q.burnMoney.current = this.gameState.gold;
            if (this.gameState.gold < q.burnMoney.target) {
                this.completeQuest('burnMoney',
                    "Очистка завершена. Система обнулена. Теперь ты один из нас. Лови экспериментальные ассеты INDIGO PULSE с множителем x50.",
                    {
                        name: 'INDIGO PULSE [LEGACY]',
                        type: 'blue',
                        bonus: 50,
                        color: 0x00aaff,
                        count: 5
                    },
                    "CORE_ASSOCIATION"
                );

                // Разблокируем синие семена в магазине навсегда
                q.blueSeeds.unlocked = true;
                this.debugConsole.addMessage("СИСТЕМА: Доступ к INDIGO PULSE открыт!", "#00ffff");
            }
        }
    }


    activateQuest(key) {
        const q = this.gameState.quests[key];
        if (q && !q.completed) {
            q.active = true;

            // Если это квест на магазин, запоминаем текущее кол-во штук в сумке
            if (key === 'shopTutorial') {
                this.gameState.lastInventoryCount = this.gameState.inventory.filter(slot => slot !== null).length;
            }

            this.debugConsole.addMessage(`ЦЕЛЬ: ${q.title}`, "#ffffff", "📡");
        }
    }

    completeQuest(key, message, rewardItem = null, sender) {
        const q = this.gameState.quests[key];
        if (!q || q.completed) return;

        q.completed = true;
        q.active = false;

        if (q.reward) {
            this.gameState.gold += q.reward;
            this.goldText.text = `CREDITS: ${this.gameState.gold}`;
        }

        if (rewardItem) this.giveItem(rewardItem);

        this.phone.addIncomingMessage(sender, message);
        this.debugConsole.addMessage(`ВЫПОЛНЕНО: ${q.title} (+${q.reward || 0} CR)`, "#00ff00", "🏆");
        this.updateInvUI();
    }

    giveItem(itemData) {
        const inv = this.gameState.inventory;
        if (itemData.count) {
            const existing = inv.find(slot => slot && slot.name === itemData.name);
            if (existing) {
                existing.count += itemData.count;
                return;
            }
        }
        const emptySlot = inv.findIndex(slot => slot === null);
        if (emptySlot !== -1) inv[emptySlot] = itemData;
    }

    refreshVisualUI() {
        if (!this.questInfoText) return;
        const activeKey = Object.keys(this.gameState.quests).find(k => this.gameState.quests[k].active);

        if (!activeKey) {
            this.questInfoText.text = "СИСТЕМА: СКАНИРОВАНИЕ...";
            return;
        }

        const q = this.gameState.quests[activeKey];
        this.questInfoText.style.fill = "#ffd700";

        if (activeKey === 'burnMoney') {
            // Показываем текущий баланс и цель (чтобы стало меньше 100)
            this.questInfoText.text = `${q.title}: ${this.gameState.gold} < 100 CR`;
            this.questInfoText.style.fill = "#ff4444"; // Красный цвет для стресса
        } else if (activeKey === 'goldHoarder') {
            this.questInfoText.text = `${q.title}: ${this.gameState.gold}/1000`;
        } else {
            this.questInfoText.text = `${q.title}: ${q.current}/${q.target}`;
        }
    }
}