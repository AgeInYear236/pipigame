import { gameState } from './GameState';

export async function spinSlots(targetText) {
    gameState.isSpinning = true;
    let res = [0, 0, 0];
    for (let i = 0; i < 12; i++) {
        res = [Math.floor(Math.random()*3), Math.floor(Math.random()*3), Math.floor(Math.random()*3)];
        targetText.text = res.join(' - ');
        await new Promise(r => setTimeout(r, 60));
    }
    gameState.isSpinning = false;

    const sum = res[0] + res[1] + res[2];
    if (sum === 0) return 0;
    if (res[0] === res[1] && res[1] === res[2]) return 5;
    return sum;
}