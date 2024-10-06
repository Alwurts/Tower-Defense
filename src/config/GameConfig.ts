export const GameConfig = {
    // Map and visual settings
    MAP_SIZE_RATIO: 0.95,
    TOWER_SIZE_RATIO: 0.08,
    MIN_DISTANCE_RATIO: 1 / 3,
    NAVBAR_HEIGHT: 40,
    BORDER_THICKNESS: 2,

    // Game mechanics
    NUM_PLAYERS: 2,
    MIN_TOWERS: 4,
    MAX_TOWERS: 8,
    MIN_OBSTACLES: 2,
    MAX_OBSTACLES: 5,
    UNIT_GENERATION_DELAY: 1000, // in milliseconds
    LIFE_GROWTH_DELAY: 5000, // in milliseconds
    UNIT_SPEED: 50, // pixels per second
    INITIAL_TOWER_LIFE: 5,
    MAX_TOWER_LIFE: 50,

    // Road mechanics
    ROAD_WIDTH_RATIO: 0.5, // Relative to tower size
    ROADS_PER_LIFE_THRESHOLD: [
        { life: 10, roads: 1 },
        { life: 30, roads: 2 },
        { life: Infinity, roads: 3 }
    ],

    // Colors
    COLORS: {
        BACKGROUND: 0xFFFFFF,
        BORDER: 0x000000,
        TEXT: '#000000',
        BUTTON_HOVER_BG: 0x000000,
        BUTTON_HOVER_TEXT: '#FFFFFF',
        PLAYER_1: '#FF0000', // Red
        PLAYER_2: '#0000FF', // Blue
        EMPTY_TOWER: '#CCCCCC', // Light gray
        OBSTACLE: 0x808080, // Gray
    },
};