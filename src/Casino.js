import { gameState } from './GameState';

let debugConsole = null;

export function setDebugConsole(console) {
    debugConsole = console;
}

export async function spinSlots(targetText) {

    gameState.isSpinning = true;

    let res = [0,0,0];

    for (let i = 0; i < 12; i++) {

        res = [
            Math.floor(Math.random()*3),
            Math.floor(Math.random()*3),
            Math.floor(Math.random()*3)
        ];

        targetText.text = res.join(' - ');
        await new Promise(r => setTimeout(r,50));
    }

    gameState.isSpinning = false;

    const combination = res.join(' - ');

    const isAllSame = res[0] === res[1] && res[1] === res[2];
    const countZeros = res.filter(v => v === 0).length;
    const hasTwo = res.includes(2);
    const hasOne = res.includes(1);
    const hasOnlyOneAndTwo = !res.includes(0) && (hasOne || hasTwo);

    let result = {
        rewardGold:0,
        seedChange:0,
        message:''
    };

    if (isAllSame) {

        if (res[0] === 2) {

            result.rewardGold = 3;
            result.message = '🎰 ДЖЕКПОТ x3';

        } else if (res[0] === 1) {

            result.rewardGold = 2;
            result.message = '🎰 ПОБЕДА x2';

        } else {

            result.seedChange = -1;
            result.message = '💀 ПРОИГРЫШ -1 семя';
        }

    } else {

        if (countZeros === 2) {

            result.message = '😐 НИЧЕГО';

        } else if (countZeros === 1) {

            let goldReward = 0;

            if (hasTwo) goldReward += 2;
            if (hasOne) goldReward += 1;

            result.rewardGold = goldReward;
            result.message = `💰 +${goldReward} множитель`;

        } else if (hasOnlyOneAndTwo) {

            result.rewardGold = 1;
            result.message = '💰 маленькая победа';
        }
    }

    if (debugConsole) {
        debugConsole.logSpin(
            combination,
            result.message,
            result.rewardGold,
            result.seedChange
        );
    }

    return result;
}