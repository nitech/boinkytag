// World dimensions (mutated by loadLevel for custom levels)
export let WORLD_WIDTH = 8000;
export let WORLD_HEIGHT = 4800;

export const TILE_SIZE = 16;

export const VALID_PLATFORM_TILES = [0, 2, 4, 6, 7];

export const playerControls = [
    { left: 'KeyA', right: 'KeyD', up: 'KeyW' },
    { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp' },
    { left: 'KeyJ', right: 'KeyL', up: 'KeyI' },
    { left: 'KeyF', right: 'KeyH', up: 'KeyT' }
];

export const SPLIT_THRESHOLD = 500; // px between player centers to trigger split screen (co-op 2P)

// Allow levels to update world size (for custom levels)
export function setWorldSize(width, height) {
    WORLD_WIDTH = width;
    WORLD_HEIGHT = height;
}

