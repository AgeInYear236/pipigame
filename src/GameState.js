export const gameState = {
    gold: 3000,
    isGameOver: false,
    introSequence: true,
    timeMultiplier: 0.1,
    lastInventoryCount: 0,
    introMessageRead: false,
    quests: {
        intro: { active: true, completed: false, title: "АВТОРИЗАЦИЯ", target: 1, current: 0 },
        plowTutorial: { active: false, completed: false, title: "ПОДГОТОВКА ПОЧВЫ", target: 3, current: 0, reward: 50 },
        plantTutorial: { active: false, completed: false, title: "ПЕРВАЯ ВЫСАДКА", target: 3, current: 0, reward: 50 },
        waterTutorial: { active: false, completed: false, title: "ГИДРАТАЦИЯ", target: 3, current: 0, reward: 50 },
        shopTutorial: { active: false, completed: false, title: "ЗАКУПКА", target: 1, current: 0, reward: 100 },
        // Основные квесты
        mainPlow: { active: false, completed: false, title: "МАСШТАБИРОВАНИЕ", target: 30, current: 0, reward: 300 },
        mainWater: { active: false, completed: false, title: "ПОЛНЫЙ ЦИКЛ", target: 40, current: 0, reward: 400 },
        goldHoarder: { active: false, completed: false, title: "ПЕРВЫЙ ТЫСЯЧНИК", threshold: 1000 },
        burnMoney: { active: false, completed: false, title: "ОБНУЛЕНИЕ АКТИВОВ", target: 100 },
        blueSeeds: { active: false, unlocked: false, title: "ПРОТОКОЛ: INDIGO" }
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
    inventory: Array(10).fill(null), // Все слоты пусты

};