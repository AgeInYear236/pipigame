export const gameState = {
    gold: 175,
    isGameOver: false,
    quests: {
        plowCells: {
            active: false,
            target: 60,
            current: 0,
            completed: false,
            reward: 100
        },
        waterCells: {
            active: false,
            target: 25,
            current: 0,
            completed: false,
            reward: 50
        },
        blueSeeds: {
            active :false,
            completed: false,
            unlocked: false,
            threshold: 500,
            rewardSent: false
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
        { name: 'Slot-Lime [Low Volatility]', type: 'green', bonus: 3, color: 0x32cd32, count: 10 },
        { name: 'Roulette-Cherry [High Stakes]', type: 'red', bonus: 10, color: 0xff4500, count: 3 },
        { name: 'Bio-Slot Preparator', type: 'tool', toolType: 'hoe', color: 0xaaaaaa, count: 2 },
        { name: 'Bucket Luck', type: 'tool', toolType: 'bucket', color: 0x708090,  count: 2},
        { name: 'RTP Booster (+50%)', type: 'fertilizer', price: 30, count: 2, color: 0xffffff },
        null,
        null, null, null, null
    ]
};