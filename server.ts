type Player = { id: number; game_id: string; x: number; y: number; z: number; lastSeen: number };

let players: Player[] = [];
let nextId = 1;

// Remove players not seen in the last 10 seconds
setInterval(() => {
    const cutoff = Date.now() - 10_000;
    players = players.filter(p => p.lastSeen > cutoff);
}, 5_000);

const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
    });
}

const server = Bun.serve({
    port: 3000,

    async fetch(req) {
        const url = new URL(req.url);

        if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

        // POST /addPlayerToRoom — register a new player, return their id
        if (url.pathname === '/addPlayerToRoom' && req.method === 'POST') {
            const body = await req.json().catch(() => ({})) as any;
            const id = nextId++;
            players.push({ id, game_id: body.game_id ?? 'default', x: body.x ?? 0, y: body.y ?? 0, z: body.z ?? 0, lastSeen: Date.now() });
            return json({ id });
        }

        // GET /getPlayersInRoom?game_id=X — return all players in a room
        if (url.pathname === '/getPlayersInRoom' && req.method === 'GET') {
            const game_id = url.searchParams.get('game_id') ?? 'default';
            return json(players.filter(p => p.game_id === game_id).map(({ id, x, y, z }) => ({ id, x, y, z })));
        }

        // POST /playerMoveInRoom — update a player's absolute position
        if (url.pathname === '/playerMoveInRoom' && req.method === 'POST') {
            const { id, x = 0, y = 0, z = 0 } = await req.json().catch(() => ({})) as any;
            const player = players.find(p => p.id === id);
            if (!player) return json({ error: 'Player not found' }, 404);
            player.x = x; player.y = y; player.z = z; player.lastSeen = Date.now();
            return json({ id, x, y, z });
        }

        // POST /removePlayerFromRoom — cleanly remove a player on tab close
        if (url.pathname === '/removePlayerFromRoom' && req.method === 'POST') {
            const { id } = await req.json().catch(() => ({})) as any;
            players = players.filter(p => p.id !== id);
            return json({ ok: true });
        }

        return new Response('Not Found', { status: 404, headers: CORS });
    },
});

console.log(`Game server running at ${server.url}`);
