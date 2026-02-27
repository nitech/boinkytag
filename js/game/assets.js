export let worldTileset = null;
export let piggyCharacter = null;
export let piggySprites = [];
export let goldenPiggyCharacter = null;
export let goldenPiggySprites = [];

export async function removeWhiteBackground(img) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tempCtx = tempCanvas.getContext('2d', { alpha: true });
    tempCtx.drawImage(img, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        if (r > 240 && g > 240 && b > 240) data[i + 3] = 0;
    }
    tempCtx.putImageData(imageData, 0, 0);
    const newImg = new Image();
    newImg.src = tempCanvas.toDataURL();
    return new Promise((resolve) => {
        newImg.onload = () => resolve(newImg);
        newImg.onerror = () => resolve(img);
    });
}

export async function loadPiggyCharacter() {
    try {
        const response = await fetch('piggy.json');
        piggyCharacter = await response.json();
        piggySprites = [];
        if (piggyCharacter.layers?.[0]?.sprites) {
            for (const sprite of piggyCharacter.layers[0].sprites) {
                const img = new Image();
                img.src = sprite.base64;
                await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
                const processedImg = await removeWhiteBackground(img);
                piggySprites.push({
                    image: processedImg,
                    x: sprite.x,
                    y: sprite.y,
                    width: sprite.width,
                    height: sprite.height
                });
            }
        }
        console.log('Piggy character loaded:', piggySprites.length, 'sprites');
    } catch (error) {
        console.error('Failed to load piggy character:', error);
    }
}

export async function loadGoldenPiggyCharacter() {
    try {
        const response = await fetch('golden_piggy.json');
        goldenPiggyCharacter = await response.json();
        goldenPiggySprites = [];
        if (goldenPiggyCharacter.layers?.[0]?.sprites) {
            for (const sprite of goldenPiggyCharacter.layers[0].sprites) {
                const img = new Image();
                img.src = sprite.base64;
                await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
                const processedImg = await removeWhiteBackground(img);
                goldenPiggySprites.push({
                    image: processedImg,
                    x: sprite.x,
                    y: sprite.y,
                    width: sprite.width,
                    height: sprite.height
                });
            }
        }
        console.log('Golden piggy character loaded:', goldenPiggySprites.length, 'sprites');
    } catch (error) {
        console.error('Failed to load golden piggy character:', error);
    }
}

export function loadWorldTileset() {
    worldTileset = new Image();
    worldTileset.src = 'world_tileset.png';
    return new Promise((resolve, reject) => {
        worldTileset.onload = resolve;
        worldTileset.onerror = reject;
    });
}
