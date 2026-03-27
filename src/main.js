import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js';
import { gameState } from './GameState';
import { Tile } from './Tile';
import { UIManager } from './UIManager';
import { DebugConsole } from './DebugConsole';
import { setDebugConsole } from './Casino';

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
    const world = new Container();
    const groundLayer = new Container();
    const entityLayer = new Container();
    const ui = new Container();

    world.addChild(groundLayer, entityLayer);
    app.stage.addChild(world, ui);

    // 2. ИНТЕРФЕЙС (UI)
    const style = new TextStyle({
        fill: '#ffffff',
        fontSize: 24,
        fontWeight: 'bold',
        dropShadow: { alpha: 0.5, blur: 4, distance: 2 }
    });

    const goldText = new Text({ text: `Золото: 0`, style });
    goldText.x = 20;
    goldText.y = 20;

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

    ui.addChild(goldText, slotText, itemLabel);

    // ИСПРАВЛЕННАЯ КОНСОЛЬ
    const debugConsole = new DebugConsole(400, 500);
    debugConsole.x = window.innerWidth - 410;
    debugConsole.y = window.innerHeight - 510;
    ui.addChild(debugConsole);

    setDebugConsole(debugConsole);

    // 3. ИГРОК
    const player = new Graphics()
        .circle(0, 0, 18)
        .fill(0xffd700)
        .stroke({ color: 0x000, width: 2 });
    player.x = 200;
    player.y = 200;
    entityLayer.addChild(player);

    // 4. ТВОЯ ПОЛНАЯ КАРТА (Восстановлена целиком)
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

    const TILE_SIZE = 50;
    const PLAYER_SPEED = 4;
    const mapWidthTiles = mapLayout[0].length;
    const mapHeightTiles = mapLayout.length;
    const mapWidthPx = mapWidthTiles * TILE_SIZE;
    const mapHeightPx = mapHeightTiles * TILE_SIZE;

    // 5. ТВОЙ ПОЛНЫЙ ИНВЕНТАРЬ (10 слотов)
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
                .stroke({
                    color: i === gameState.selectedSlot ? 0xffd700 : 0xffffff,
                    width: i === gameState.selectedSlot ? 4 : 2
                });

            const item = gameState.inventory[i];
            slot.itemContainer.removeChildren();

            if (item && item.count > 0) {
                const icon = new Graphics().circle(25, 25, 12).fill(item.color);
                slot.itemContainer.addChild(icon);

                const countText = new Text({
                    text: `x${item.count}`,
                    style: { fill: 0xffffff, fontSize: 12, fontWeight: 'bold', stroke: { color: 0x000000, width: 2 } }
                });
                countText.x = 35; countText.y = 35;
                slot.itemContainer.addChild(countText);
            }
        });

        const currentItem = gameState.inventory[gameState.selectedSlot];
        UIManager.updateItemLabel(itemLabel, currentItem && currentItem.count > 0 ? currentItem.name : "Пусто");
    };

    updateInvUI();

    // 6. СОЗДАНИЕ ТАЙЛОВ
    const tiles = [];
    mapLayout.forEach((row, y) => {
        row.forEach((type, x) => {
            const tile = new Tile(
                type, x, y,
                TILE_SIZE,
                player,
                goldText,
                slotText,
                mapLayout,
                entityLayer,
                updateInvUI,
                debugConsole
            );
            groundLayer.addChild(tile);
            tiles.push(tile);
        });
    });

    // 7. УПРАВЛЕНИЕ
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.code] = true;
        if (e.code.startsWith('Digit')) {
            let n = parseInt(e.code.replace('Digit', ''));
            gameState.selectedSlot = n === 0 ? 9 : n - 1;
            updateInvUI();
        }
    });

    window.addEventListener('keyup', (e) => {
        gameState.keys[e.code] = false;
    });

    // 8. ИГРОВОЙ ЦИКЛ
    app.ticker.add((time) => {
        const dt = time.deltaTime;
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

        player.x = Math.max(0, Math.min(player.x, mapWidthPx - 1));
        player.y = Math.max(0, Math.min(player.y, mapHeightPx - 1));

        // ТВОЙ Y-SORTING
        entityLayer.children.sort((a, b) => {
            const aPos = (a === player) ? a.y : a.y + TILE_SIZE;
            const bPos = (b === player) ? b.y : b.y + TILE_SIZE;
            return aPos - bPos;
        });

        tiles.forEach(t => t.update(dt));
    });

    // 9. ОБРАБОТКА РАЗМЕРА ОКНА
    window.addEventListener('resize', () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        invContainer.x = (window.innerWidth - (10 * 55)) / 2;
        invContainer.y = window.innerHeight - 70;
        slotText.x = window.innerWidth / 2;
        itemLabel.x = window.innerWidth / 2;
        itemLabel.y = window.innerHeight - 100;
    });
}

init();