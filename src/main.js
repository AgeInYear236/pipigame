import { Application, Graphics, Container, Text, TextStyle } from 'pixi.js';
import { gameState } from './GameState';
import { Tile } from './Tile';
import { UIManager } from './UIManager';

const TILE_SIZE = 64;
const PLAYER_SPEED = 4;

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
    goldText.x = 20; goldText.y = 20;

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

    // 3. ИГРОК
    const player = new Graphics()
        .circle(0, 0, 18)
        .fill(0xffd700)
        .stroke({ color: 0x000, width: 2 });
    player.x = 200;
    player.y = 200;
    entityLayer.addChild(player);

    // 4. КАРТА
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

    // Границы мира для движения (в пикселях)
    const worldLimitX = mapLayout[0].length * TILE_SIZE * 10;
    const worldLimitY = mapLayout.length * TILE_SIZE * 10;

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
                entityLayer
            );
            groundLayer.addChild(tile);
            tiles.push(tile);
        });
    });

    // 5. ИНВЕНТАРЬ (10 слотов)
    const invContainer = new Container();
    const slotContainers = []; // Храним контейнеры слотов для обновления

    for (let i = 0; i < 10; i++) {
        const slot = new Container();

        // Фон слота
        const bg = new Graphics()
            .roundRect(0, 0, 50, 50, 8)
            .fill(i === gameState.selectedSlot ? 0x555555 : 0x333333)
            .stroke({ color: i === gameState.selectedSlot ? 0xffd700 : 0xffffff, width: i === gameState.selectedSlot ? 4 : 2 });
        slot.addChild(bg);

        // Иконка предмета (если есть)
        const item = gameState.inventory[i];
        if (item) {
            const icon = new Graphics()
                .circle(25, 25, 12)
                .fill(item.color);
            slot.addChild(icon);

            // Добавляем текстовую метку для количества (на будущее)
            const countText = new Text({
                text: item.count ? `x${item.count}` : '',
                style: { fill: 0xffffff, fontSize: 12, fontWeight: 'bold' }
            });
            countText.x = 35;
            countText.y = 35;
            slot.addChild(countText);
        }

        slot.x = i * 55;
        invContainer.addChild(slot);
        slotContainers.push({ container: slot, bg, itemIcon: item ? slot.children[1] : null });
    }

    invContainer.x = (window.innerWidth - (10 * 55)) / 2; // Центрируем 10 слотов
    invContainer.y = window.innerHeight - 70;
    ui.addChild(invContainer);

// Функция обновления UI инвентаря
    const updateInvUI = () => {
        slotContainers.forEach((slot, i) => {
            // Обновляем фон
            slot.bg.clear()
                .roundRect(0, 0, 50, 50, 8)
                .fill(i === gameState.selectedSlot ? 0x555555 : 0x333333)
                .stroke({
                    color: i === gameState.selectedSlot ? 0xffd700 : 0xffffff,
                    width: i === gameState.selectedSlot ? 4 : 2
                });

            // Обновляем иконку предмета
            const item = gameState.inventory[i];
            if (item && !slot.itemIcon) {
                // Создаём иконку, если предмет появился
                const icon = new Graphics()
                    .circle(25, 25, 12)
                    .fill(item.color);
                slot.container.addChild(icon);
                slot.itemIcon = icon;
            } else if (!item && slot.itemIcon) {
                // Удаляем иконку, если предмет исчез
                slot.container.removeChild(slot.itemIcon);
                slot.itemIcon.destroy();
                slot.itemIcon = null;
            } else if (item && slot.itemIcon) {
                // Обновляем цвет иконки, если изменился
                slot.itemIcon.clear()
                    .circle(25, 25, 12)
                    .fill(item.color);
            }
        });

        // Обновляем текст под инвентарём
        const currentItem = gameState.inventory[gameState.selectedSlot];
        UIManager.updateItemLabel(itemLabel, currentItem ? currentItem.name : "Empty");
    };

    updateInvUI();

    // 6. УПРАВЛЕНИЕ
    window.addEventListener('keydown', (e) => {
        gameState.keys[e.code] = true;
        if (e.code.startsWith('Digit')) {
            let n = parseInt(e.code.replace('Digit', ''));
            gameState.selectedSlot = n === 0 ? 9 : n - 1;
            updateInvUI();
        }
    });
    window.addEventListener('keyup', (e) => gameState.keys[e.code] = false);

    // 7. ИГРОВОЙ ЦИКЛ
    app.ticker.add((time) => {
        const dt = time.deltaTime;
        let nextX = player.x;
        let nextY = player.y;

        if (gameState.keys['KeyW']) nextY -= PLAYER_SPEED * dt;
        if (gameState.keys['KeyS']) nextY += PLAYER_SPEED * dt;
        if (gameState.keys['KeyA']) nextX -= PLAYER_SPEED * dt;
        if (gameState.keys['KeyD']) nextX += PLAYER_SPEED * dt;

        const checkWall = (tx, ty) => {
            // Базовая проверка границ массива
            if (tx < 0 || tx > worldLimitX || ty < 0 || ty > worldLimitY) return true;

            const gx = Math.floor(tx / TILE_SIZE);
            const gy = Math.floor(ty / TILE_SIZE);
            const target = tiles.find(t => t.gridX === gx && t.gridY === gy);
            return target && target.isSolid;
        };

        // Двигаемся только если впереди нет стены и мы не выходим за границы экрана
        if (!checkWall(nextX, player.y)) player.x = nextX;
        if (!checkWall(player.x, nextY)) player.y = nextY;

        // Y-SORTING
        entityLayer.children.sort((a, b) => {
            const aPos = (a === player) ? a.y : a.y + TILE_SIZE;
            const bPos = (b === player) ? b.y : b.y + TILE_SIZE;
            return aPos - bPos;
        });

        tiles.forEach(t => t.update(dt));
    });

    window.addEventListener('resize', () => {
        app.renderer.resize(window.innerWidth, window.innerHeight);
        invContainer.x = (window.innerWidth - invContainer.width) / 2;
        invContainer.y = window.innerHeight - 70;
        slotText.x = window.innerWidth / 2;
        itemLabel.x = window.innerWidth / 2;
        itemLabel.y = window.innerHeight - 100;
    });
}

init();