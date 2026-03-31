export const gameState = {
    gold: 1000,
    quests: {
        plowCells: {
            active: false,
            target: 25,
            current: 0,
            completed: false,
            reward: 50
        },
        waterCells: {
            active: false,
            target: 10,
            current: 0,
            completed: false,
            reward: 50
        }
    },
    houseBuilt: false,
    houseQuestSent: false,
    hasWell: false,
    selectedSlot: 0,
    isSpinning: false,
    keys: {},
    currentWeather: 'sunny', // 'sunny' или 'rainy'
    nextDayWeather: 'sunny',
    currentTemp: 22,
    nextDayTemp: 24,
    activeTab: 'messages',
    taxPaidToday: false,
    inventory: [
        { name: 'Green seeds', type: 'green', bonus: 10, color: 0x32cd32, count: 3 },
        { name: 'Red seeds', type: 'red', bonus: 3, color: 0xff4500, count: 10 },
        { name: 'Hoe', type: 'tool', toolType: 'hoe', color: 0xaaaaaa, count: 5 },
        { name: 'Лейка', type: 'tool', toolType: 'can', color: 0x00aaff, count: 5 },
        { name: 'Ведро', type: 'tool', toolType: 'bucket', color: 0x708090,  count: 5},
        { name: 'Удобрение', type: 'fertilizer', price: 30, count: 5, color: 0xffffff },
        null, null, null, null
    ]
};