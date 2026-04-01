import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js';
import { gameState } from './GameState';
import { Tile } from './Tile';
import { UIManager } from './UIManager';
import { DebugConsole } from './DebugConsole';
import { setDebugConsole } from './Casino';
import { Shop } from './Shop';
import { TimeSystem } from './TimeSystem';
import {SaveSystem} from "./SaveSystem.js";
import {Phone} from "./Phone.js";
import {Environment} from "./Environment.js";
import {MainMenu} from "./MainMenu.js";
import {HintSystem} from "./HintSystem.js";

const app = new Application();

async function init() {
    // 1. ИНИЦИАЛИЗАЦИЯ
    await app.init({
        background: '#2d5a27',
        resizeTo: window,
        antialias: true
    });
    document.body.appendChild(app.canvas);

    // СЛОИ (Z-index)
    const world = new Container();       // Земля и объекты
    const groundLayer = new Container();
    const entityLayer = new Container();

    // СЛОЙ ТЕМНОТЫ (Overlay)
    const nightOverlay = new Graphics()
        .rect(0, 0, window.innerWidth, window.innerHeight)
        .fill(0x1a1a40);
    nightOverlay.alpha = 0;
    nightOverlay.eventMode = 'none'; // Пропускает клики сквозь себя

    const ui = new Container();          // Интерфейс (всегда сверху и яркий)

    world.addChild(groundLayer, entityLayer);

    // ПОРЯДОК ДОБАВЛЕНИЯ ВАЖЕН:
    app.stage.addChild(world);        // 1. Мир
    app.stage.addChild(nightOverlay); // 2. Темнота поверх мира
    app.stage.addChild(ui);           // 3. UI поверх темноты

    // 2. ИНТЕРФЕЙС (UI)
    const style = new TextStyle({
        fill: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
        dropShadow: { alpha: 0.5, blur: 4, distance: 2 }
    });

    const goldText = new Text({
        text: `Кредиты: ${gameState.gold}`,
        style: { fill: '#0560F5', fontSize: 24, fontWeight: 'bold' }
    });
    goldText.x = 20; goldText.y = 20;

    // ЧАСЫ (в слое UI)
    const timeSystem = new TimeSystem();
    const timeText = new Text({
        text: "🕒 12:00",
        style: { ...style, fontSize: 28 }
    });
    timeText.x = 20; timeText.y = 60;

    const slotText = new Text({ text: '', style: { ...style, fontSize: 42, fill: '#ffcc00' } });
    slotText.anchor.set(0.5);
    slotText.x = window.innerWidth / 2;
    slotText.y = 80;

    const itemLabel = new Text({
        text: '',
        style: { fill: '#ffffff', fontSize: 20, fontWeight: 'italic' }
    });
    itemLabel.anchor.set(0.5);
    itemLabel.x = window.innerWidth / 2;
    itemLabel.y = window.innerHeight - 100;

    ui.addChild(goldText, timeText, slotText, itemLabel);

    const debugConsole = new DebugConsole(400, 500);
    debugConsole.x = window.innerWidth - 410;
    debugConsole.y = window.innerHeight - 510;
    ui.addChild(debugConsole);
    setDebugConsole(debugConsole);

    const hintSystem = new HintSystem();
    app.stage.addChild(hintSystem);

    const rainContainer = new Container();
    app.stage.addChild(rainContainer); // Дождь будет под UI, но над миром

    const rainDrops = [];
    const RAIN_COUNT = 100;
    for (let i = 0; i < RAIN_COUNT; i++) {
        const drop = new Graphics()
            .moveTo(0, 0)
            .lineTo(-2, 10)
            .stroke({ color: 0x00aaff, width: 1, alpha: 0.6 });

        drop.x = Math.random() * window.innerWidth;
        drop.y = Math.random() * window.innerHeight;
        drop.speed = 10 + Math.random() * 5;
        rainContainer.addChild(drop);
        rainDrops.push(drop);
    }

    // 3. ИГРОК
    const player = new Graphics().circle(0, 0, 18).fill(0xffd700).stroke({ color: 0x000, width: 2 });
    player.x = 200; player.y = 200;
    entityLayer.addChild(player);

    // 4. КАРТА (Упрощенный вызов для краткости)
    const TILE_SIZE = 50;
    const PLAYER_SPEED = 4;
    const mapLayout = [
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
    ];
    const mapWidthTiles = mapLayout[0].length;
    const mapHeightTiles = mapLayout.length;

    // 5. ИНВЕНТАРЬ
    const invContainer = new Container();
    const slotContainers = [];
    for (let i = 0; i < 10; i++) {
        const slot = new Container();
        const bg = new Graphics();
        slot.addChild(bg);
        const itemContainer = new Container();
        slot.addChild(itemContainer);
        slot.x = i * 55;
        invContainer.addChild(slot);
        slotContainers.push({ container: slot, bg, itemContainer });
    }
    invContainer.x = (window.innerWidth - (10 * 55)) / 2;
    invContainer.y = window.innerHeight - 70;
    ui.addChild(invContainer);

    const updateInvUI = () => {
        slotContainers.forEach((slot, i) => {
            slot.bg.clear()
                .roundRect(0, 0, 50, 50, 8)
                .fill(i === gameState.selectedSlot ? 0x555555 : 0x333333)
                .stroke({ color: i === gameState.selectedSlot ? 0xffd700 : 0xffffff, width: i === gameState.selectedSlot ? 4 : 2 });

            const item = gameState.inventory[i];
            slot.itemContainer.removeChildren();
            if (item) {
                const icon = new Graphics().circle(25, 25, 12).fill(item.color);
                slot.itemContainer.addChild(icon);
                const countText = new Text({ text: `x${item.count}`, style: { fill: 0xffffff, fontSize: 12 } });
                countText.x = 35; countText.y = 35;
                slot.itemContainer.addChild(countText);
            }
        });
        const currentItem = gameState.inventory[gameState.selectedSlot];
        UIManager.updateItemLabel(itemLabel, currentItem ? currentItem.name : "Пусто");
    };

    updateInvUI();


    const phone = new Phone(app, debugConsole, timeSystem);
    ui.addChild(phone);

    const housePrice = 2500;
    const houseContainer = new Container();

// Позиционируем строго по сетке (например, отступаем 2 тайла сверху и слева)
    const gridX = 2;
    const gridY = 12;
    houseContainer.x = gridX * 50;
    houseContainer.y = gridY * 50;

// Графика руин (Серый блок 3x3 тайла)
    const houseBg = new Graphics();

// Функция отрисовки состояния дома
    const drawHouseState = (isBuilt) => {
        houseBg.clear();
        if (!isBuilt) {
            // РУИНЫ: Рисуем "кучу камней" в пределах 150x150
            houseBg.rect(0, 0, 150, 150).fill({ color: 0x777777, alpha: 1 });
            // Добавим текстуру камней (просто прямоугольники поменьше)
            for(let i=0; i<5; i++) {
                houseBg.rect(Math.random()*100, Math.random()*100, 40, 30).fill(0x555555);
            }
            houseBg.stroke({ color: 0x333333, width: 4 });
        } else {
            // ПОСТРОЕННЫЙ ДОМ: Яркий блок 3x3
            houseBg.rect(0, 0, 150, 150).fill(0x8d6e63); // Стены
            houseBg.poly([0, 50, 75, 0, 150, 50]).fill(0xd32f2f); // Простая крыша сверху
            houseBg.rect(60, 100, 30, 50).fill(0x3e2723); // Дверь
            houseBg.stroke({ color: 0x221100, width: 5 });
        }
    };

    drawHouseState(gameState.houseBuilt);

    const houseLabel = new Text({
        text: "СТАРЫЕ РУИНЫ",
        style: { fill: '#ffffff', fontSize: 16, fontWeight: 'bold', stroke: '#000000', strokeThickness: 4 }
    });
    houseLabel.anchor.set(0.5);
    houseLabel.x = 75; // Центр блока 150/2
    houseLabel.y = 75;

    houseContainer.addChild(houseBg, houseLabel);
    houseContainer.eventMode = 'static';
    houseContainer.cursor = 'pointer';

// Логика клика
    houseContainer.on('pointerdown', () => {
        if (gameState.houseBuilt) {
            debugConsole.addMessage("Твой уютный уголок.", "#00ff00");
            return;
        }

        if (gameState.gold >= housePrice) {
            gameState.gold -= housePrice;
            gameState.houseBuilt = true;
            goldText.text = `Кредиты: ${gameState.gold}`;

            drawHouseState(true);
            houseLabel.text = "МОЙ ДОМ";

            phone.addIncomingMessage("Старый Фермер", "Ничего себе хоромы! Поздравляю с новосельем, сосед.");
            debugConsole.addMessage("Дом построен!", "#ffd700");
        } else {
            debugConsole.addMessage(`Не хватает золота! Нужно ${housePrice}.`, "#ff4444");
        }
    });

    world.addChild(houseContainer);


// 6. СОЗДАНИЕ ТАЙЛОВ
    const tiles = [];
    mapLayout.forEach((row, y) => {
        row.forEach((type, x) => {
            // Проверяем, находится ли текущий тайл под будущим домом
            const isUnderHouse = (
                x >= gridX && x < gridX + 3 &&
                y >= gridY && y < gridY + 3
            );

            // Если под домом — принудительно ставим тип, который нельзя вскопать (например, 2 или 10)
            // Либо передаем доп. параметр в конструктор Tile
            const finalType = isUnderHouse ? 2 : type;

            const tile = new Tile(finalType, x, y, TILE_SIZE, player, goldText, slotText, mapLayout, entityLayer, updateInvUI, debugConsole);

            // Добавим свойство объекту тайла, чтобы он знал, что он "фундамент"
            if (isUnderHouse) {
                tile.isStatic = true;
                tile.eventMode = 'none'; // Отключаем клики по этим тайлам вообще
            }

            groundLayer.addChild(tile);
            tiles.push(tile);
        });
    });


    const shop = new Shop(app, updateInvUI, debugConsole, goldText, tiles);
    ui.addChild(shop);

    // Иконка телефона (Кнопка)
    const phoneBtn = new Graphics()
        .roundRect(0, 0, 50, 50, 10)
        .fill(0x333333)
        .stroke({ color: 0x00aaff, width: 2 });
    phoneBtn.x = window.innerWidth - 140;
    phoneBtn.y = 20;
    phoneBtn.eventMode = 'static';
    phoneBtn.cursor = 'pointer';

    const phoneIcon = new Text({ text: "📱", style: { fontSize: 30 } });
    phoneIcon.anchor.set(0.5);
    phoneIcon.x = 25; phoneIcon.y = 25;
    phoneBtn.addChild(phoneIcon);

    phoneBtn.on('pointerdown', () => phone.toggle());
    ui.addChild(phoneBtn);

    const environment = new Environment(app, timeSystem);
    app.stage.addChild(environment);
    environment.zIndex = 1000; // Поднимаем в самый верх

// ТЕСТОВЫЙ ВЫЗОВ (можно удалить потом)
    setTimeout(() => {
        phone.addIncomingMessage("Неизвестный", "Привет! Это твой новый телефон. Здесь будет вся необходимая информация!");
    }, 3000);

    // 1. Приветственное сообщение через 5 секунд после старта
    setTimeout(() => {
        phone.addIncomingMessage(
            "Старый Фермер",
            "Привет, новичок! Вижу, ты взялся за дело. Чтобы ферма процветала, нужно подготовить землю. Вспахай 67 клеток (сделай из них грядки), и я подкину тебе 50 золотых на развитие!"
        );
        gameState.quests.plowCells.active = true;
    }, 5000);

// 2. Функция проверки квеста (создадим её внутри init или рядом)
    const checkQuests = () => {
        const q = gameState.quests.plowCells;

        // Если квест активен и еще не выполнен
        if (q.active && !q.completed) {
            // Считаем сколько сейчас грядок (тип 1) на карте
            const plowedCount = tiles.filter(t => t.type === 1).length;
            q.current = plowedCount;

            if (q.current >= q.target) {
                q.completed = true;
                q.active = false;

                // Выдаем награду
                gameState.gold += q.reward;
                goldText.text = `Кредиты: ${gameState.gold}`; // Обновляем UI золота

                // Пишем в телефон и консоль
                phone.addIncomingMessage("Старый Фермер", "Отличная работа! Земля готова к посадкам. Вот твоя награда — 50 золотых. Трать с умом!");
                debugConsole.addMessage("Квест выполнен: Вспахано 67 клеток! +50 золота", "#00ff00", "🏆");

                // ЧЕРЕЗ 10 СЕКУНД ПОСЛЕ ПЕРВОГО КВЕСТА ДАЕМ ВТОРОЙ
                setTimeout(() => {
                    startWaterQuest();
                }, 10000);
            }
        }

        // --- ВТОРОЙ КВЕСТ (Полив) ---
        const q2 = gameState.quests.waterCells;
        if (q2.active && !q2.completed) {
            // Считаем сколько грядок сейчас полито (isWatered === true)
            const wateredCount = tiles.filter(t => t.type === 1 && t.isWatered).length;
            q2.current = wateredCount;

            if (q2.current >= q2.target) {
                q2.completed = true;
                q2.active = false;

                gameState.gold += q2.reward;
                goldText.text = `Кредиты: ${gameState.gold}`;

                phone.addIncomingMessage("Старый Фермер", "Вижу, земля намокла! Растения любят воду. Держи еще 50 золотых. Теперь ты готов к настоящим посадкам!");
                debugConsole.addMessage("Квест выполнен: Полито 10 грядок! +50 золота", "#00ff00", "🏆");
                setTimeout(() => {
                    startq3();
                }, 5000);
            }
        }

        const q3 = gameState.quests.blueSeeds;

        if (q3.active && !q3.completed) {

            // Отправляем вводное сообщение от Ассоциации
            phone.addIncomingMessage(
                "Ассоциация",
                "Впечатляющие результаты! 💧 Мы видим в тебе потенциал. \n\nНовое задание: заработай 500 монет чистой прибыли, и мы откроем тебе доступ к секретной разработке — семенам Indigo Pulse. \n\nУдачи, фермер!"
            );

        }

        // 2. ПРОВЕРКА: Условие победы (500 монет)
        if (gameState.quests.blueSeeds && gameState.quests.blueSeeds.active && !gameState.quests.blueSeeds.unlocked) {
            if (gameState.gold >= gameState.quests.blueSeeds.threshold) {

                gameState.quests.blueSeeds.unlocked = true;
                gameState.quests.blueSeeds.active = false; // Квест выполнен

                // Выдаем 2 синих семени в первый свободный слот (null)
                const slot = gameState.inventory.findIndex(s => s === null);
                if (slot !== -1) {
                    gameState.inventory[slot] = {
                        name: 'Indigo Pulse',
                        type: 'blue',
                        bonus: 50,
                        color: 0x00aaff,
                        count: 2
                    };
                }

                // Финальное СМС с поздравлением
                phone.addIncomingMessage(
                    "Ассоциация",
                    "Грандиозно! 🎰 500 монет в кармане. \n\nКак и обещали, Indigo Pulse теперь в твоем распоряжении. Они уже в инвентаре, а дополнительные партии ищи в магазине. \n\nБереги их, они светятся в темноте!"
                );

                // Обновляем UI и Магазин
                updateInvUI();
                if (shop) shop.createShopWindow(); // Чтобы семена появились в списке

                if (debugConsole) debugConsole.addMessage("Квест выполнен: Доступ к Indigo Pulse!", "#ffd700");
            }
        }
    };

    // Функция запуска второго квеста
    const startWaterQuest = () => {
        phone.addIncomingMessage(
            "Старый Фермер",
            "Слушай, земля-то сухая! Возьми лейку (или дождись дождя) и полей хотя бы 10 грядок. Без воды ничего не вырастет. Сделаешь — отсыпаю еще 50 золотых!"
        );
        gameState.quests.waterCells.active = true;
    };
    const startq3 = () => {

        gameState.quests.blueSeeds.active = true;
    };

    function payTaxes() {
        const taxAmount = 50;
        gameState.gold -= taxAmount;

        // Обновляем UI золота
        goldText.text = `Кредиты: ${gameState.gold}`;

        // Отправляем сообщение в телефон
        phone.addIncomingMessage(
            "Налоговая служба",
            `Уважаемый фермер! С вашего счета списано ${taxAmount} золотых в качестве ежедневного земельного налога. Благодарим за вклад в развитие округа!`
        );

        if (debugConsole) {
            debugConsole.addMessage(`Комиссия Заведения списана. Удачи в следующем раунде.: -${taxAmount} кредитов`, "#ff4444", "💸");
        }

        // Проверка на банкротство (если ушел в минус)
        if (gameState.gold < 0) {
            phone.addIncomingMessage("Банк", "Внимание! Ваш баланс отрицательный. Срочно продайте урожай, иначе ферма будет арестована!");
        }
    }

    let gameStarted = false;

    const startLevel = () => {
        gameStarted = true;
        // Можно здесь отправить первое приветственное сообщение
        phone.addIncomingMessage("Дедушка", "Привет! Рад, что ты приехал. Начни с грядок, налоги сами себя не заплатят!");
    };

    const mainMenu = new MainMenu(app, startLevel);
    app.stage.addChild(mainMenu);

    // 7. УПРАВЛЕНИЕ
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.code] = true;
        if (e.code.startsWith('Digit')) {
            let n = parseInt(e.code.replace('Digit', ''));
            gameState.selectedSlot = n === 0 ? 9 : n - 1;
            updateInvUI();
        }

        if (e.code === 'KeyI') {
            const currentItem = gameState.inventory[gameState.selectedSlot];

            if (currentItem) {
                hintSystem.show(currentItem);
            } else {
                if (debugConsole) debugConsole.addMessage("Руки пусты", "#ff4444");
            }
        }
    });
    window.addEventListener('keyup', (e) => gameState.keys[e.code] = false);

    // 8. ИГРОВОЙ ЦИКЛ
    app.ticker.add((ticker) => {
        const dt = ticker.deltaTime;


        if (!gameStarted) {
            if (mainMenu && !mainMenu.destroyed) {
                mainMenu.update(dt);
            }
            return;
        }

        checkQuests();
        const wasNewDay = timeSystem.hour === 0 && timeSystem.minute === 0 && timeSystem.timer === 0;

        environment.update(dt);
        // Время и Ночь
        timeSystem.update(dt * 10);
        timeText.text = `🕒 ${timeSystem.getTimeString()}`;

        if (timeSystem.hour === 0 && timeSystem.minute === 0 && Math.floor(timeSystem.timer) === 0) {
            if (timeSystem.day >= 3 && !gameState.taxPaidToday) {
                payTaxes();
                gameState.taxPaidToday = true; // Флаг, чтобы не списывать весь час 00:00
            }
        }

        // Сбрасываем флаг налогов в 01:00, чтобы быть готовыми к следующему дню
        if (timeSystem.hour === 1) {
            gameState.taxPaidToday = false;
        }

        const night = timeSystem.getNightIntensity();
        nightOverlay.alpha = night.alpha;

        // Обновление времени
        timeSystem.update(dt, debugConsole); // Передаем консоль для логов дней
        timeText.text = `📅 День ${timeSystem.day} | 🕒 ${timeSystem.getTimeString()}`;

        // Логика дождя
        rainContainer.visible = timeSystem.isRaining;
        if (timeSystem.isRaining) {
            rainDrops.forEach(drop => {
                drop.y += drop.speed * dt;
                drop.x += (drop.speed * 0.2) * dt; // Небольшой наклон от ветра

                // Если капля упала за экран — возвращаем наверх
                if (drop.y > window.innerHeight) {
                    drop.y = -20;
                    drop.x = Math.random() * window.innerWidth;
                }
            });

            // Авто-полив: проходим по всем тайлам и поливаем их
            tiles.forEach(tile => {
                if (tile.type === 1) { // Если это грядка
                    tile.isWatered = true;
                    // Не забудь добавить метод updateVisuals в Tile.js,
                    // если хочешь, чтобы грядка темнела мгновенно
                }
            });
        }

        // Движение игрока
        let nextX = player.x;
        let nextY = player.y;
        if (gameState.keys['KeyW']) nextY -= PLAYER_SPEED * dt;
        if (gameState.keys['KeyS']) nextY += PLAYER_SPEED * dt;
        if (gameState.keys['KeyA']) nextX -= PLAYER_SPEED * dt;
        if (gameState.keys['KeyD']) nextX += PLAYER_SPEED * dt;

        const checkWall = (tx, ty) => {
            const gx = Math.floor(tx / TILE_SIZE);
            const gy = Math.floor(ty / TILE_SIZE);
            if (gx < 0 || gx >= mapWidthTiles || gy < 0 || gy >= mapHeightTiles) return true;
            return tiles[gy * mapWidthTiles + gx].isSolid;
        };

        if (!checkWall(nextX, player.y)) player.x = nextX;
        if (!checkWall(player.x, nextY)) player.y = nextY;

        // Y-Sorting
        entityLayer.children.sort((a, b) => {
            const aPos = (a === player) ? a.y : a.y + TILE_SIZE;
            const bPos = (b === player) ? b.y : b.y + TILE_SIZE;
            return aPos - bPos;
        });

        tiles.forEach(t => t.update(dt));

        if (timeSystem.day === 2 && !gameState.houseQuestSent) {
            gameState.houseQuestSent = true;

            // Задержка, чтобы письмо не пришло ровно в 00:00
            setTimeout(() => {
                phone.addIncomingMessage(
                    "Старый Фермер",
                    "Доброе утро! Слушай, я тут проходил мимо твоих руин... Сердце кровью обливается. Было бы неплохо построить там приличный домик. На материалы уйдет где-то 2500 золотых, но оно того стоит — фермер без дома как сапожник без сапог!"
                );
            }, 5000);
        }
    });

    window.addEventListener('resize', () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        nightOverlay.clear().rect(0, 0, window.innerWidth, window.innerHeight).fill(0x1a1a40);
        invContainer.x = (window.innerWidth - (10 * 55)) / 2;
        invContainer.y = window.innerHeight - 70;
        slotText.x = window.innerWidth / 2;
        itemLabel.x = window.innerWidth / 2;
        shop.resize();
        phoneBtn.x = window.innerWidth - 70;
        phone.resize();
    });



    const saveSystem = new SaveSystem(gameState, timeSystem, tiles);

// Нажми 'S' (английскую) чтобы сохранить
    window.addEventListener('keydown', (e) => {
        if (e.code === 'BracketLeft') {
            saveSystem.save();
            debugConsole.addMessage("ИГРА СОХРАНЕНА!", "#ffff00");
        }

        // Нажми 'L' чтобы загрузить
        if (e.code === 'BracketRight') {
            if (saveSystem.load()) {
                updateInvUI(); // Обновляем иконки внизу
                if (debugConsole) {
                    debugConsole.addMessage("ЗАГРУЗКА ВЫПОЛНЕНА ]", "#00ff00", "📂");
                }
            } else {
                if (debugConsole) {
                    debugConsole.addMessage("НЕТ ФАЙЛА СОХРАНЕНИЯ", "#ff4444", "❌");
                }
            }
        }
    });

}

init();

