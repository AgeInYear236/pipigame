export class SaveSystem {
    // Передаем всё, что хотим сохранить
    constructor(gameState, timeSystem, tiles) {
        this.gameState = gameState;
        this.timeSystem = timeSystem;
        this.tiles = tiles;
    }

    save() {
        const data = {
            gold: this.gameState.gold,
            inventory: this.gameState.inventory,
            // Сохраняем время
            time: {
                day: this.timeSystem.day,
                hour: this.timeSystem.hour,
                minute: this.timeSystem.minute
            },
            // Для каждой плитки сохраняем только важное
            tiles: this.tiles.map(t => ({
                type: t.type,
                isWatered: t.isWatered,
                isFertilized: t.isFertilized,
                isGrowing: t.isGrowing,
                // Сохраняем данные о растении, если оно есть
                plantedType: t.plantedType,
                plantScale: t.plant ? t.plant.scale.x : 0.1
            }))
        };

        // Превращаем всё это в одну длинную строку
        localStorage.setItem('myFarmSave', JSON.stringify(data));
        console.log("Данные записаны в localStorage!");
    }

    load() {
        const raw = localStorage.getItem('myFarmSave');
        if (!raw) return false;

        const data = JSON.parse(raw);

        // 1. Возвращаем золото и вещи
        this.gameState.gold = data.gold;
        this.gameState.inventory = data.inventory;

        // 2. Возвращаем время
        this.timeSystem.day = data.day || 1;
        this.timeSystem.hour = data.time.hour;
        this.timeSystem.minute = data.time.minute;

        // 3. Самое важное: восстанавливаем грядки
        data.tiles.forEach((tData, i) => {
            const tile = this.tiles[i];
            if (!tile) return;

            tile.type = tData.type;
            tile.isWatered = tData.isWatered;
            tile.isFertilized = tData.isFertilized;
            tile.isGrowing = tData.isGrowing;
            tile.plantedType = tData.plantedType;

            // Если там что-то росло — показываем это
            if (tile.isGrowing) {
                tile.plant.visible = true;
                tile.plant.scale.set(tData.plantScale || 0.1);
                tile.plant.tint = tile.plantedType.color;
            } else {
                tile.plant.visible = false;
            }

            tile.drawBackground(); // Перерисовываем цвет земли
        });

        return true;
    }
}