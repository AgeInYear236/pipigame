import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js';
import { gameState } from './GameState';
import { Tile } from './Tile';
import { UIManager } from './UIManager';
import { DebugConsole } from './DebugConsole';
import { setDebugConsole } from './Casino';
import { Shop } from './Shop';
import { TimeSystem } from './TimeSystem';
import {SaveSystem} from "./SaveSystem.js";

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
        text: `Золото: ${gameState.gold}`,
        style: { fill: '#ffd700', fontSize: 24, fontWeight: 'bold' }
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
        [2, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
        [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
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

    // 6. СОЗДАНИЕ ТАЙЛОВ
    const tiles = [];
    mapLayout.forEach((row, y) => {
        row.forEach((type, x) => {
            const tile = new Tile(type, x, y, TILE_SIZE, player, goldText, slotText, mapLayout, entityLayer, updateInvUI, debugConsole);
            groundLayer.addChild(tile);
            tiles.push(tile);
        });
    });

    const shop = new Shop(app, updateInvUI, debugConsole, goldText, tiles);
    ui.addChild(shop);

    // 7. УПРАВЛЕНИЕ
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.code] = true;
        if (e.code.startsWith('Digit')) {
            let n = parseInt(e.code.replace('Digit', ''));
            gameState.selectedSlot = n === 0 ? 9 : n - 1;
            updateInvUI();
        }
    });
    window.addEventListener('keyup', (e) => gameState.keys[e.code] = false);

    // 8. ИГРОВОЙ ЦИКЛ
    app.ticker.add((ticker) => {
        const dt = ticker.deltaTime;

        // Время и Ночь
        timeSystem.update(dt);
        timeText.text = `🕒 ${timeSystem.getTimeString()}`;

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
    });

    window.addEventListener('resize', () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        nightOverlay.clear().rect(0, 0, window.innerWidth, window.innerHeight).fill(0x1a1a40);
        invContainer.x = (window.innerWidth - (10 * 55)) / 2;
        invContainer.y = window.innerHeight - 70;
        slotText.x = window.innerWidth / 2;
        itemLabel.x = window.innerWidth / 2;
        shop.resize();
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

