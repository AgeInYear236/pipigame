import { gameState } from './GameState';

let debugConsole = null;

export function setDebugConsole(console) {
    debugConsole = console;
}

export async function spinSlots(targetText, plantedData = { bonus: 1, isFertilized: false }) {
    gameState.isSpinning = true;
    let res = [0, 0, 0];

    // Визуализация спина (рандомизация чисел в UI)
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
    const isAllSame = res[0] === res[1] && res[1] === res[2];

    let result = {
        rewardGold: 0,
        message: '',
        calcText: '',
        icon: '🎰'
    };

    // --- ЛОГИКА КАЗИНО-БИОЛОГИИ ---

    if (countZeros === 3) {
        // 0-0-0
        result.message = 'DEAD SPIN / ПОЛНЫЙ ЗЕРО';
        result.calcText = 'Сектор пуст';
        result.icon = '💀';
        result.rewardGold = 0;

    } else if (countZeros === 2) {
        // Два нуля
        result.message = 'MISS / МИМО';
        result.calcText = '0 CR';
        result.icon = '😐';
        result.rewardGold = 0;

    } else if (countZeros === 1) {
        // Один ноль (Фикса)
        const fixedAmount = plantedData.bonus;
        result.message = 'MINIMUM PAYOUT / ФИКСА';
        result.calcText = `${fixedAmount} CR (RTP Booster игнорируется)`;
        result.icon = '🪙';
        result.rewardGold = fixedAmount;

    } else {
        // НУЛЕЙ НЕТ - Успешная комбинация
        result.icon = '💎';

        if (isAllSame) {
            if (res[0] === 1) {
                // 1-1-1
                result.rewardGold = plantedData.bonus * 3;
                result.message = 'JACKPOT [1-1-1]';
                result.calcText = `${plantedData.bonus} CR × 3`;
            } else if (res[0] === 2) {
                // 2-2-2
                result.rewardGold = plantedData.bonus * 5;
                result.message = 'ULTRA COMBO [2-2-2]';
                result.calcText = `${plantedData.bonus} CR × 5`;
                result.icon = '🔥';
            }
        } else {
            // Множитель на основе суммы
            const sumValues = res.reduce((a, b) => a + b, 0);
            const multiplier = sumValues / 2;
            result.rewardGold = Math.floor(plantedData.bonus * multiplier);
            result.message = `MULTIPLIER x${multiplier}`;
            result.calcText = `${plantedData.bonus} CR × ${multiplier}`;
        }

        // Применяем RTP Booster (удобрение)
        if (plantedData.isFertilized) {
            const bonus = Math.floor(result.rewardGold * 0.5);
            result.rewardGold += bonus;
            result.calcText += ' + [RTP+50%]';
        }
    }

    // --- ВЫВОД В ТЕРМИНАЛ (DebugConsole) ---
    if (debugConsole) {
        const color = result.rewardGold > 0 ? '#00ff00' : '#ff4444';
        const logMsg = `[${combination}] >> ${result.message} (${result.rewardGold} CR) ${result.calcText}`;
        debugConsole.addMessage(logMsg, color, result.icon);
    }

    return { rewardGold: result.rewardGold };
}