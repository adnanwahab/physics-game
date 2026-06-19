type Vec3 = { x: number; y: number; z: number };
type Quat = { x: number; y: number; z: number; w: number };

export type PlayerState = {
    pos: Vec3;
    quat: Quat;
    color: string;
};

const COLORS = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8', '#f7dc6f', '#fd79a8', '#a29bfe'];

export class GameRoom {
    readonly id: string;
    private players = new Map<string, PlayerState>();
    private colorIndex = 0;

    constructor(id: string) {
        this.id = id;
    }

    addPlayer(playerId: string): string {
        const color = COLORS[this.colorIndex++ % COLORS.length];
        this.players.set(playerId, {
            pos: { x: 0, y: 0, z: 0 },
            quat: { x: 0, y: 0, z: 0, w: 1 },
            color,
        });
        return color;
    }

    updatePlayer(playerId: string, pos: Vec3, quat: Quat) {
        const player = this.players.get(playerId);
        if (player) { player.pos = pos; player.quat = quat; }
    }

    removePlayer(playerId: string) {
        this.players.delete(playerId);
    }

    getState(): Record<string, PlayerState> {
        return Object.fromEntries(this.players);
    }

    get size(): number {
        return this.players.size;
    }

    isEmpty(): boolean {
        return this.players.size === 0;
    }
}
