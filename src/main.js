import '@pixi/unsafe-eval'; // Просто добавьте этот импорт

import {Application, Graphics, Container, Text, TextStyle, Assets, Sprite} from 'pixi.js';
import { gameState } from './GameState';
import { Tile } from './Tile';
import { UIManager } from './UIManager';
import { DebugConsole } from './DebugConsole';
import { setDebugConsole } from './Casino';
import { Shop } from './Shop';
import { TimeSystem } from './TimeSystem';
import { SaveSystem } from "./SaveSystem.js";
import { Phone } from "./Phone.js";
import { Environment } from "./Environment.js";
import { MainMenu } from "./MainMenu.js";
import { HintSystem } from "./HintSystem.js";
import { sound } from '@pixi/sound'; // Импортируем модуль звука


const assetsToLoad = [
    { alias: 'player', src: 'arts/operator.png' },
    { alias: 'house', src: 'arts/house.png' },
    { alias: 'house2', src: 'arts/house2.png' },
    { alias: 'scarecrow', src: 'arts/scarecrow_slot.png' },
    { alias: 't_empty', src: 'arts/tile_empty.png' },
    { alias: 't_plowed', src: 'arts/tile_plowed.png' },
    { alias: 't_watered', src: 'arts/tile_watered.png' },
    { alias: 't_well', src: 'arts/tile_well.png' },
    { alias: 'p_rain', src: 'arts/particle_rain.png' },
    { alias: 'p_sparkle', src: 'arts/particle_sparkle.png' },
    // Предметы
    { alias: 'item_green', src: 'arts/item_seed_green.png' },
    { alias: 'item_blue', src: 'arts/item_seed_blue.png' },
    { alias: 'item_red', src: 'arts/item_seed_red.png' },
    { alias: 'item_preparator', src: 'arts/item_preparator.png' },
    { alias: 'item_dispenser', src: 'arts/item_dispenser.png' },
    { alias: 'item_fertilizer', src: 'arts/item_fertilizer.png' },
    { alias: 'item_bucket', src: 'arts/item_bucket.png' },
    { alias: 'item_credits', src: 'arts/item_credits.png' },

    { alias: 'bg_music', src: '/music/g.mp3' },
    { alias: 'click_sfx', src: '/music/click.wav' },
    { alias: 'select_sfx', src: '/music/select.wav' },
    { alias: 'prop_sfx', src: '/music/prop.wav' },
    { alias: 'prop2_sfx', src: '/music/goodRoll.wav' },
    { alias: 'message_sfx', src: '/music/message.wav' }
];

// Цикл для автоматической сборки стадий роста
['green', 'blue', 'red'].forEach(color => {
    for (let i = 0; i <= 3; i++) {
        assetsToLoad.push({ alias: `${color}_${i}`, src: `arts/${color}_stage_${i}.png` });
    }
});

export const textures = await Assets.load(assetsToLoad);
if (sound.exists('bg_music')) {
    sound.play('bg_music', {
        loop: true,
        volume: 0.02 // 30% громкости
    });
}
const app = new Application();
await app.init({
    resizeTo: window,
    backgroundColor: '#0a1a0a'
});

const timeSpanMult = 8;

async function init() {
    // 1. ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ
    await app.init({
        background: '#0a1a0a',
        resizeTo: window,
        antialias: true
    });
    document.body.appendChild(app.canvas);

    // СЛОИ (Z-index Management)
    const world = new Container();       // Слой био-секторов
    const groundLayer = new Container();
    const entityLayer = new Container();

    // СЛОЙ ЗАТЕМНЕНИЯ (Цикл Перезагрузки)
    const nightOverlay = new Graphics()
        .rect(0, 0, window.innerWidth, window.innerHeight)
        .fill(0x050515);
    nightOverlay.alpha = 0;
    nightOverlay.eventMode = 'none'; // Пропускает импульсы сквозь себя

    const ui = new Container();          // Интерфейс (High Priority Layer)

    world.addChild(groundLayer, entityLayer);

    // ПОРЯДОК РЕНДЕРА:
    app.stage.addChild(world);        // 1. Секторы и объекты
    app.stage.addChild(nightOverlay); // 2. Визуальный фильтр цикла
    app.stage.addChild(ui);           // 3. Терминал управления

    // 2. ВИЗУАЛЬНЫЕ ПРОТОКОЛЫ (UI)
    const style = new TextStyle({
        fill: '#00ff00',
        fontSize: 24,
        fontFamily: 'monospace',
        fontWeight: 'bold',
        dropShadow: { alpha: 0.5, blur: 4, distance: 2 }
    });

    const goldText = new Text({
        text: `CREDITS: ${gameState.gold}`,
        style: { fill: '#00aaff', fontSize: 24, fontWeight: 'bold', fontFamily: 'monospace' }
    });
    goldText.x = 20; goldText.y = 20;

    // СИСТЕМНОЕ ВРЕМЯ (в слое UI)
    const timeSystem = new TimeSystem();
    const timeText = new Text({
        text: "🕒 SYNCING...",
        style: { ...style, fontSize: 28 }
    });
    timeText.x = 20; timeText.y = 60;

    const slotText = new Text({
        text: '',
        style: { ...style, fontSize: 42, fill: '#ffd700' }
    });
    slotText.anchor.set(0.5);
    slotText.x = window.innerWidth / 2;
    slotText.y = 80;

    const itemLabel = new Text({
        text: '',
        style: { fill: '#ffffff', fontSize: 20, fontWeight: 'normal', fontFamily: 'monospace' }
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
    app.stage.addChild(rainContainer); // Контейнер для протокола Liquid Luck

    const rainDrops = [];
    const RAIN_COUNT = 100;
    for (let i = 0; i < RAIN_COUNT; i++) {
        const drop = new Sprite(textures.p_rain);
        drop.width = 8; drop.height = 16;

        drop.x = Math.random() * window.innerWidth;
        drop.y = Math.random() * window.innerHeight;
        drop.speed = 10 + Math.random() * 5;
        rainContainer.addChild(drop);
        rainDrops.push(drop);
    }

    // 3. ОПЕРАТОР (Игрок)
    const player = new Sprite(textures.player);
    player.anchor.set(0.5);
    player.width = 40; player.height = 40;
    player.x = 200; player.y = 200;
    entityLayer.addChild(player);

    // 4. КАРТА СЕКТОРОВ (ПОЛНАЯ МАТРИЦА)
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

    // 5. ИНВЕНТАРЬ (Data Storage Slots)
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

        if (sound.exists('select_sfx')) {
            sound.play('select_sfx', { volume: 0.4 });
        }

        slotContainers.forEach((slot, i) => {
            slot.bg.clear()
                .roundRect(0, 0, 50, 50, 8)
                .fill(i === gameState.selectedSlot ? 0x00aaff : 0x111111)
                .stroke({
                    color: i === gameState.selectedSlot ? 0x00ff00 : 0x444444,
                    width: i === gameState.selectedSlot ? 4 : 2
                });

            const item = gameState.inventory[i];
            slot.itemContainer.removeChildren();
            if (item) {

                let textureAlias;

                // 1. СЛОВАРЬ СОПОСТАВЛЕНИЯ (toolType -> fileName)
                const toolMap = {
                    'hoe': 'item_preparator',    // Твоя тяпка -> arts/item_preparator.png
                    'can': 'item_dispenser',     // Лейка -> arts/item_dispenser.png
                    'bucket': 'item_bucket',  // Если ведро выполняет ту же роль
                    'fertilizer': 'item_fertilizer' // Например, если удобрение выглядит как красное зерно
                };

                // 2. ОПРЕДЕЛЯЕМ ТЕКСТУРУ
                if (toolMap[item.toolType]) {
                    // Если это инструмент из словаря
                    textureAlias = toolMap[item.toolType];
                } else if (item.type) {
                    // Если это семена (green, blue, red)
                    textureAlias = `item_${item.type}`;
                }

                // 3. ОТРИСОВКА СПРАЙТА
                if (textures[textureAlias]) {
                    const icon = new Sprite(textures[textureAlias]);
                    icon.anchor.set(0.5);
                    icon.x = 25;
                    icon.y = 25;

                    // Масштабируем, чтобы иконка аккуратно вписалась в слот 50х50
                    const scale = 34 / Math.max(icon.texture.width, icon.texture.height);
                    icon.scale.set(scale);

                    slot.itemContainer.addChild(icon);
                }

                if (item.count > 1) {
                    const countText = new Text({
                        text: `x${item.count}`,
                        style: { fill: 0xffffff, fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' }
                    });
                    countText.x = 30; countText.y = 32;
                    slot.itemContainer.addChild(countText);
                }
            }
        });
        const currentItem = gameState.inventory[gameState.selectedSlot];
        UIManager.updateItemLabel(itemLabel, currentItem ? `[ ${currentItem.name.toUpperCase()} ]` : "[ EMPTY_SLOT ]");
    };

    updateInvUI();

    const phone = new Phone(app, debugConsole, timeSystem);
    ui.addChild(phone);

    const originalAddMessage = phone.addIncomingMessage.bind(phone);
    phone.addIncomingMessage = (sender, text) => {
        originalAddMessage(sender, text);
        if (sound.exists('message_sfx')) {
            sound.play('message_sfx', { volume: 0.2 });
        }
    };

    // COMMAND CENTER (Бывшие Руины)
    const housePrice = 1999;
    const houseContainer = new Container();
    const gridX = 2;
    const gridY = 12;
    houseContainer.x = gridX * 50;
    houseContainer.y = gridY * 50;

    const houseBg = new Sprite(textures.house); // Стартуем с первой стадии
    houseBg.width = 150;
    houseBg.height = 150;

    const drawHouseState = (isBuilt) => {
        if (!isBuilt) {
            houseBg.texture = textures.house; // Просто меняем текстуру
        } else {
            houseBg.texture = textures.house2; // На текстуру готового дома
        }

        houseBg.width = 150;
        houseBg.height = 150;
    };

    drawHouseState(gameState.houseBuilt);

    const houseLabel = new Text({
        text: "DECOMMISSIONED UNIT",
        style: { fill: '#fafafa', fontSize: 12, fontWeight: 'bold', fontFamily: 'monospace' }
    });
    houseLabel.anchor.set(0.5);
    houseLabel.x = 75;
    houseLabel.y = 75;

    houseContainer.addChild(houseBg, houseLabel);
    houseContainer.eventMode = 'static';
    houseContainer.cursor = 'pointer';

    houseContainer.on('pointerdown', () => {
        if (gameState.houseBuilt) {
            debugConsole.addMessage("COMMAND CENTER ONLINE. SYSTEM NOMINAL.", "#00ff00");
            return;
        }

        if (gameState.gold >= housePrice) {
            gameState.gold -= housePrice;
            gameState.houseBuilt = true;
            goldText.text = `CREDITS: ${gameState.gold}`;

            drawHouseState(true);
            houseLabel.text = "COMMAND CENTER";

            phone.addIncomingMessage("PIT BOSS", "Ничего себе терминал! Поздравляю с расширением инфраструктуры.");
            debugConsole.addMessage("СИСТЕМА: Центр управления развернут!", "#00ff00");

            triggerGameOver();
        } else {
            debugConsole.addMessage(`ОШИБКА: Недостаточно кредитов! Нужно ${housePrice} CR.`, "#ff4444");
        }
    });

    world.addChild(houseContainer);

    // 6. ФОРМИРОВАНИЕ МАТРИЦЫ ТАЙЛОВ
    const tiles = [];
    mapLayout.forEach((row, y) => {
        row.forEach((type, x) => {
            const isUnderHouse = (
                x >= gridX && x < gridX + 3 &&
                y >= gridY && y < gridY + 3
            );

            const finalType = isUnderHouse ? 2 : type;
            const tile = new Tile(finalType, x, y, TILE_SIZE, player, goldText, slotText, mapLayout, entityLayer, updateInvUI, debugConsole);

            if (isUnderHouse) {
                tile.isStatic = true;
                tile.eventMode = 'none';
            }

            groundLayer.addChild(tile);
            tiles.push(tile);
        });
    });

    const shop = new Shop(app, updateInvUI, debugConsole, goldText, tiles);
    ui.addChild(shop);

    // КНОПКА ТЕРМИНАЛА (📟)
    const phoneBtn = new Graphics()
        .roundRect(0, 0, 50, 50, 10)
        .fill(0x111111)
        .stroke({ color: 0x00ff00, width: 2 });
    phoneBtn.x = window.innerWidth - 140;
    phoneBtn.y = 20;
    phoneBtn.eventMode = 'static';
    phoneBtn.cursor = 'pointer';

    const phoneIcon = new Text({ text: "📟", style: { fontSize: 30 } });
    phoneIcon.anchor.set(0.5);
    phoneIcon.x = 25; phoneIcon.y = 25;
    phoneBtn.addChild(phoneIcon);

    phoneBtn.on('pointerdown', () => phone.toggle());
    ui.addChild(phoneBtn);

    const environment = new Environment(app, timeSystem);
    app.stage.addChild(environment);
    environment.zIndex = 1000;

    // ВХОДЯЩИЕ СООБЩЕНИЯ (Lore-Friendly)
    setTimeout(() => {
        phone.addIncomingMessage("CORE_SYS", "Авторизация прошла успешно. Терминал готов к работе. Для помощи используйте I, для сохранения - [, ]");
    }, 2000);

    // 1. Приветственный протокол
    setTimeout(() => {
        phone.addIncomingMessage(
            "PIT BOSS",
            "Привет, оператор! Вижу, ты в сети. Чтобы начать игру, нужно подготовить 60 секторов (активируй их Slot-Preparator-ом). Сделаешь это — зачислю 100 CR на баланс!"
        );
        gameState.quests.plowCells.active = true;
    }, 12000);

    // 2. ФУНКЦИЯ МОНИТОРИНГА КВЕСТОВ
    const checkQuests = () => {
        const q = gameState.quests.plowCells;

        if (q.active && !q.completed) {
            const plowedCount = tiles.filter(t => t.type === 1).length;
            q.current = plowedCount;

            if (q.current >= q.target) {
                q.completed = true;
                q.active = false;
                gameState.gold += q.reward;
                goldText.text = `CREDITS: ${gameState.gold}`;

                phone.addIncomingMessage("PIT BOSS", "Секторы активны. Почва готова к загрузке ассетов. Вот твои 100 кредитов.");
                debugConsole.addMessage("КВЕСТ: Секторы подготовлены! +100 CR", "#00ff00", "🏆");

                setTimeout(() => {
                    startWaterQuest();
                }, 10000);
            }
        }

        // --- КВЕСТ 2: ОПТИМИЗАЦИЯ RTP (Полив) ---
        const q2 = gameState.quests.waterCells;
        if (q2.active && !q2.completed) {
            const wateredCount = tiles.filter(t => t.type === 1 && t.isWatered).length;
            q2.current = wateredCount;

            if (q2.current >= q2.target) {
                q2.completed = true;
                q2.active = false;
                gameState.gold += q2.reward;
                goldText.text = `CREDITS: ${gameState.gold}`;

                phone.addIncomingMessage("PIT BOSS", "Вижу, влажность в норме! Это повышает шансы на удачный спин. Держи еще 50 CR.");
                debugConsole.addMessage("КВЕСТ: Гидратация завершена! +50 CR", "#00ff00", "🏆");
                setTimeout(() => {
                    startq3();
                }, 5000);
            }
        }

        const q3 = gameState.quests.blueSeeds;
        if (q3.active && !q3.completed) {
            phone.addIncomingMessage(
                "CORE_ASSOCIATION",
                "Впечатляющие результаты! 💹 Мы видим потенциал. Заработай 500 кредитов чистой прибыли, и мы откроем доступ к Indigo Pulse."
            );
        }

        // 3. УСЛОВИЕ РАЗБЛОКИРОВКИ INDIGO PULSE
        if (gameState.quests.blueSeeds && gameState.quests.blueSeeds.active && !gameState.quests.blueSeeds.unlocked) {
            if (gameState.gold >= gameState.quests.blueSeeds.threshold) {
                gameState.quests.blueSeeds.unlocked = true;
                gameState.quests.blueSeeds.active = false;

                const slot = gameState.inventory.findIndex(s => s === null);
                if (slot !== -1) {
                    gameState.inventory[slot] = {
                        name: 'INDIGO PULSE [LEGACY]',
                        type: 'blue',
                        bonus: 50,
                        color: 0x00aaff,
                        count: 2
                    };
                }

                phone.addIncomingMessage(
                    "CORE_ASSOCIATION",
                    "Грандиозно! 🎰 Лимит в 500 CR пройден. Indigo Pulse теперь в твоем распоряжении. Они уже в слотах терминала."
                );

                updateInvUI();
                if (shop) shop.createShopWindow();
                if (debugConsole) debugConsole.addMessage("СИСТЕМА: Доступ к Indigo Pulse открыт!", "#ffd700");
            }
        }
    };

    const startWaterQuest = () => {
        phone.addIncomingMessage(
            "PIT BOSS",
            "Слушай, ассеты перегреваются! Используй LL-Dispenser или жди протокола 'Liquid Luck', чтобы охладить 50 секторов. Сделаешь — получишь кэшбек."
        );
        gameState.quests.waterCells.active = true;
    };

    const startq3 = () => {
        gameState.quests.blueSeeds.active = true;
    };

    function payTaxes() {
        const taxAmount = 50;
        gameState.gold -= taxAmount;
        goldText.text = `CREDITS: ${gameState.gold}`;

        phone.addIncomingMessage(
            "HOUSE_EDGE",
            `Внимание! Списана комиссия заведения в размере ${taxAmount} CR за аренду био-терминалов.`
        );

        if (debugConsole) {
            debugConsole.addMessage(`КОМИССИЯ: Списание средств. Удачи в следующем раунде: -${taxAmount} CR`, "#ff4444", "💸");
        }

        if (gameState.gold < 0) {
            phone.addIncomingMessage("BANK_UNIT", "Внимание! Отрицательный баланс. Срочно реализуй ассеты, иначе доступ будет заблокирован!");
        }
        // Внутри апдейта, после списания налогов или покупки:
        if (gameState.gold < -24 && !gameState.isGameOver) {
            triggerGameOver(true); // Передаем true, что это проигрыш
        }
    }

    let gameStarted = false;

    const startLevel = () => {
        gameStarted = true;
        // phone.addIncomingMessage("PIT BOSS", "Рад, что ты принял контракт. Начни с подготовки секторов, комиссия не ждет!");
    };

    // Переменные для контроля финала
    let glitchTimer = 0;
    let isGlitching = false;
    let finalStep = 0; // 0: глитч, 1: исчезновение, 2: затухание

    // Обнови функцию, чтобы она принимала флаг проигрыша
    function triggerGameOver(isLoss = false) {
        gameState.isGameOver = true;
        isGlitching = true;

        player.vx = 0; player.vy = 0;

        const errorCode = isLoss ? "DEBT_LIMIT_EXCEEDED" : "SYSTEM_CORRUPTION";
        if (debugConsole) debugConsole.addMessage(`CRITICAL_ERROR: ${errorCode}`, "#ff0000");

        setTimeout(() => {
            player.visible = false;
            finalStep = 1;

            const statusMsg = isLoss ? "USER_LIQUIDATED" : "USER_SESSION: TERMINATED";
            if (debugConsole) debugConsole.addMessage(statusMsg, "#ff0000");

            setTimeout(() => {
                isGlitching = false;
                finalStep = 2;
                startFinalFade(isLoss); // Передаем флаг дальше
            }, 1500);
        }, 3000);
    }

// В startFinalFade тоже прокидываем флаг
    function startFinalFade(isLoss) {
        const overlay = new Graphics()
            .rect(0, 0, app.screen.width, app.screen.height)
            .fill({ color: 0x000000 });
        overlay.alpha = 0;
        ui.addChild(overlay);

        const fadeTicker = (time) => {
            overlay.alpha += 0.005 * time.deltaTime;
            if (overlay.alpha >= 1) {
                app.ticker.remove(fadeTicker);
                showCasinoText(isLoss); // Вызываем финал с нужным текстом
            }
        };
        app.ticker.add(fadeTicker);
    }

    function showCasinoText(isLoss = false) {
        setTimeout(() => {
            const casinoStyle = new TextStyle({
                fontFamily: '"Verdana", "Geneva", sans-serif',
                fontSize: 50,
                fill: '#ff0000',
                fontWeight: '900',
                align: 'center',
                stroke: {color: '#000000', width: 10, join: 'round'},
                dropShadow: {alpha: 0.5, blur: 15, color: '#ff0000', distance: 0},
                lineHeight: 70
            });

            const finalMsg = new Text({
                text: isLoss ? 'ОБЪЕКТ УТИЛИЗИРОВАН\nВАШ ДОЛГ ПРИНАДЛЕЖИТ НАМ' : 'НИКТО НЕ МОЖЕТ\nОБЫГРАТЬ КАЗИНО',
                style: casinoStyle
            });

            finalMsg.anchor.set(0.5);
            finalMsg.x = app.screen.width / 2;
            finalMsg.y = app.screen.height / 2;

            // ПРАВКА: Добавляем ПРЯМО в app.stage, чтобы он был поверх UI и World
            app.stage.addChild(finalMsg);

            // ПРАВКА: Используем выделенный тикер, который НЕ блокируется флагом isGameOver
            const textTicker = (time) => {
                if (finalMsg.destroyed) return;

                // Простая анимация "дыхания"
                const elapsed = performance.now() * 0.002;
                finalMsg.scale.set(1 + Math.sin(elapsed) * 0.03);

                // Редкий глитч
                if (Math.random() > 0.98) {
                    finalMsg.x = (app.screen.width / 2) + (Math.random() - 0.5) * 20;
                    finalMsg.alpha = 0.5;
                } else {
                    finalMsg.x = app.screen.width / 2;
                    finalMsg.alpha = 1;
                }
            };

            // Добавляем этот специфичный тикер в приложение
            app.ticker.add(textTicker);

            console.log("FINAL TEXT RENDERED:", finalMsg.text);
        }, 800);
    }

    const mainMenu = new MainMenu(app, startLevel);
    app.stage.addChild(mainMenu);

    // 7. КОНТРОЛЛЕР ВВОДА
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
                if (debugConsole) debugConsole.addMessage("СЛОТ ПУСТ", "#ff4444");
            }
        }
    });
    window.addEventListener('keyup', (e) => gameState.keys[e.code] = false);

    // 8. ГЛАВНЫЙ ИГРОВОЙ ЦИКЛ (TICKER)
    app.ticker.add((time) => {
        const dt = time.deltaTime; // Учитываем дельту времени для плавности при любом FPS

        if (isGlitching) {
            glitchTimer += time.deltaTime;

            // Каждые несколько кадров дергаем мир
            if (Math.random() > 0.8) {
                app.stage.x = (Math.random() - 0.5) * 15; // Тряска по X
                app.stage.y = (Math.random() - 0.5) * 15; // Тряска по Y

                // Глитч цвета (инверсия или тинт)
                app.stage.tint = Math.random() > 0.5 ? 0xff0000 : 0x00ffff;
            }

            // Эффект "разреза" (масштабирование)
            if (Math.random() > 0.95) {
                app.stage.scale.set(1.02, 0.98);
            } else {
                app.stage.scale.set(1);
            }
        } else if (gameState.isGameOver && finalStep < 2) {
            // Если глитч кончился, но экран еще не погас — возвращаем мир в покой
            app.stage.x = 0;
            app.stage.y = 0;
            app.stage.tint = 0xffffff;
        }

        if (gameState.isGameOver) return;
        if (!gameStarted) {
            if (mainMenu && !mainMenu.destroyed) {
                mainMenu.update(dt);
            }
            return;
        }


        checkQuests();
        environment.update(dt);

        // Время и Ночной Протокол
        timeSystem.update(dt * timeSpanMult, debugConsole);
        timeText.text = `CYCLE ${timeSystem.day} | SYNC: ${timeSystem.getTimeString()}`;

        // Списания (House Edge)
        if (timeSystem.hour === 0 && timeSystem.minute === 0 && Math.floor(timeSystem.timer) === 0) {
            if (timeSystem.day >= 3 && !gameState.taxPaidToday) {
                payTaxes();
                gameState.taxPaidToday = true;
            }
        }

        if (timeSystem.hour === 1) {
            gameState.taxPaidToday = false;
        }

        const night = timeSystem.getNightIntensity();
        nightOverlay.alpha = night.alpha;

        // Логика протокола "Liquid Luck" (Дождь)
        rainContainer.visible = timeSystem.isRaining;
        if (timeSystem.isRaining) {
            rainDrops.forEach(drop => {
                drop.y += drop.speed * dt;
                drop.x += (drop.speed * 0.2) * dt;

                if (drop.y > window.innerHeight) {
                    drop.y = -20;
                    drop.x = Math.random() * window.innerWidth;
                }
            });

            tiles.forEach(tile => {
                if (tile.type === 1) {
                    tile.isWatered = true;
                }
            });
        }

        // Навигация оператора
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

        // Y-Sorting (Сортировка глубины)
        entityLayer.children.sort((a, b) => {
            const aPos = (a === player) ? a.y : a.y + TILE_SIZE;
            const bPos = (b === player) ? b.y : b.y + TILE_SIZE;
            return aPos - bPos;
        });

        tiles.forEach(t => t.update(dt));

        // Сюжетный триггер для Command Center
        if (timeSystem.day === 2 && !gameState.houseQuestSent) {
            gameState.houseQuestSent = true;
            setTimeout(() => {
                phone.addIncomingMessage(
                    "PIT BOSS",
                    "Доброе утро! Слушай, я видел те руины... Сердце кровью обливается. Давай восстановим Command Center. Материалы обойдутся в 1999 CR, но хакер без базы — это просто любитель!"
                );
            }, 5000);
        }
    });

    // ОБРАБОТЧИК ИЗМЕНЕНИЯ РАЗМЕРА ЭКРАНА
    window.addEventListener('resize', () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        nightOverlay.clear().rect(0, 0, window.innerWidth, window.innerHeight).fill(0x050515);
        invContainer.x = (window.innerWidth - (10 * 55)) / 2;
        invContainer.y = window.innerHeight - 70;
        slotText.x = window.innerWidth / 2;
        itemLabel.x = window.innerWidth / 2;
        shop.resize();
        phoneBtn.x = window.innerWidth - 140;
        phone.resize();
    });

    // СИСТЕМА ДАМПОВ (Сохранения)
    const saveSystem = new SaveSystem(gameState, timeSystem, tiles);

    window.addEventListener('keydown', (e) => {
        // [ - Snapshot
        if (e.code === 'BracketLeft') {
            saveSystem.save();
            debugConsole.addMessage("СИСТЕМА: Snapshot сохранен!", "#ffff00");
        }

        // ] - Restore
        if (e.code === 'BracketRight') {
            if (saveSystem.load()) {
                updateInvUI();
                if (debugConsole) {
                    debugConsole.addMessage("СИСТЕМА: Snapshot загружен успешно.", "#00ff00", "📂");
                }
            } else {
                if (debugConsole) {
                    debugConsole.addMessage("ОШИБКА: Snapshot не найден.", "#ff4444", "❌");
                }
            }
        }
    });
}

init();