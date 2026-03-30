import { gameState } from './GameState';

let debugConsole = null;

export function setDebugConsole(console) {
    debugConsole = console;
}

export async function spinSlots(targetText, plantedData = { bonus: 1, isFertilized: false }) {
    gameState.isSpinning = true;
    let res = [0, 0, 0];

    for (let i = 0; i < 12; i++) {
        res = [
            Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 3),
            Math.floor(Math.random() * 3)
        ];
        targetText.text = res.join(' - ');
        await new Promise(r => setTimeout(r, 50));
    }

    gameState.isSpinning = false;
    const combination = res.join(' - ');
    const countZeros = res.filter(v => v === 0).length;
    const sumValues = res.reduce((a, b) => a + b, 0);
    const isAllSame = res[0] === res[1] && res[1] === res[2];

    let result = {
        rewardGold: 0,
        message: '',
        calcText: '',
        icon: '🎰'
    };

    // --- ЛОГИКА МАТЕМАТИКИ ---

    if (countZeros === 3) {
        // 3 нуля - забирают семечко (но семя уже потрачено при посадке, так что просто 0)
        result.message = 'ПОЛНЫЙ НОЛЬ';
        result.calcText = 'Семя потеряно';
        result.icon = '💀';
        result.rewardGold = 0;

    } else if (countZeros === 2) {
        // 2 нуля - ничего не дают
        result.message = 'НИЧЕГО';
        result.calcText = '0💰';
        result.icon = '😐';
        result.rewardGold = 0;

    } else if (countZeros === 1) {
        // 1 ноль - фиксированное количество монет (без учета удобрений)
        // Допустим, фикса = бонус семени (или можно поставить просто 5-10)
        const fixedAmount = plantedData.bonus;
        result.message = 'ФИКСА (1 ноль)';
        result.calcText = `${fixedAmount}💰 (удобрение не действует)`;
        result.icon = '🪙';
        result.rewardGold = fixedAmount;

    } else {
        // НУЛЕЙ НЕТ - Самая прибыльная часть
        result.icon = '💰';

        if (isAllSame) {
            if (res[0] === 1) {
                // 1-1-1 -> x3 прибыль
                result.rewardGold = plantedData.bonus * 3;
                result.message = 'ДЖЕКПОТ 111';
                result.calcText = `${plantedData.bonus}💰 × 3`;
            } else if (res[0] === 2) {
                // 2-2-2 -> x5 прибыль
                result.rewardGold = plantedData.bonus * 5;
                result.message = 'СУПЕР ДЖЕКПОТ 222';
                result.calcText = `${plantedData.bonus}💰 × 5`;
                result.icon = '🔥';
            }
        } else {
            // Множитель (сумма / 2)
            const multiplier = sumValues / 2;
            result.rewardGold = Math.floor(plantedData.bonus * multiplier);
            result.message = `МНОЖИТЕЛЬ x${multiplier}`;
            result.calcText = `${plantedData.bonus}💰 × ${multiplier}`;
        }

        // Применяем удобрение ТОЛЬКО если нет нулей
        if (plantedData.isFertilized) {
            const bonus = Math.floor(result.rewardGold * 0.5);
            result.rewardGold += bonus;
            result.calcText += ' + ✨50%';
        }
    }

    // --- ВЫВОД В ЛОГ ---
    if (debugConsole) {
        const color = result.rewardGold > 0 ? '#ffcc00' : '#888888';
        const logMsg = `${combination} → ${result.message} (${result.calcText} = ${result.rewardGold}💰)`;
        debugConsole.addMessage(logMsg, color, result.icon);
    }

    return { rewardGold: result.rewardGold };
}