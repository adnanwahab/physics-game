// Multiplayer game logic for GameRoom: manages multiple players

export type Vec3 = { x: number; y: number; z: number };
export type Quat = { x: number; y: number; z: number; w: number };

export type PlayerState = {
    pos: Vec3;
    quat: Quat;
    color: string;
};

const COLORS = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
    '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f',
    '#fd79a8', '#a29bfe'
];

// Represents a multiplayer game room, tracks all player states
export class GameRoom {
    readonly id: string;
    private players = new Map<string, PlayerState>();
    private colorIndex = 0;

    constructor(id: string) {
        this.id = id;
    }

    // Adds a new player with a unique color
    addPlayer(playerId: string): string {
        if (this.players.has(playerId)) {
            return this.players.get(playerId)!.color;
        }
        const color = COLORS[this.colorIndex++ % COLORS.length];
        this.players.set(playerId, {
            pos: { x: 0, y: 0, z: 0 },
            quat: { x: 0, y: 0, z: 0, w: 1 },
            color,
        });
        return color;
    }

    // Updates a player's state (e.g., from network input)
    updatePlayer(playerId: string, pos: Vec3, quat: Quat) {
        const player = this.players.get(playerId);
        if (player) {
            player.pos = pos;
            player.quat = quat;
        }
    }

    // Removes player from room
    removePlayer(playerId: string) {
        this.players.delete(playerId);
    }

    // State snapshot for all players (for network sync)
    getState(): Record<string, PlayerState> {
        return Object.fromEntries(this.players.entries());
    }

    get size(): number {
        return this.players.size;
    }

    isEmpty(): boolean {
        return this.players.size === 0;
    }
}
