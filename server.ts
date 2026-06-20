import { GameRoom } from './Game.ts'

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

const rooms = new Map<string, GameRoom>();

// Clean up empty rooms periodically
setInterval(() => {
    for (const [id, room] of rooms) {
        if (room.isEmpty()) rooms.delete(id);
    }
}, 10_000);

const server = Bun.serve({
    port: 3000,
    hostname: '0.0.0.0',

    async fetch(req) {
        const url = new URL(req.url);

        if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

        // Add a player to a room (creates the room if it doesn't exist)
        if (url.pathname === '/addPlayerToRoom' && req.method === 'POST') {
            const body = await req.json().catch(() => ({})) as any;
            const { roomId, playerId } = body;
            if (!roomId || !playerId) return json({ error: 'missing roomId or playerId' }, 400);
            let room = rooms.get(roomId);
            if (!room) {
                room = new GameRoom(roomId);
                rooms.set(roomId, room);
            }
            const color = room.addPlayer(playerId);
            return json({ color });
        }

        // Get all players in a room
        if (url.pathname === '/getPlayersInRoom' && req.method === 'GET') {
            const roomId = url.searchParams.get('roomId');
            if (!roomId) return json({ error: 'missing roomId' }, 400);
            const room = rooms.get(roomId);
            if (!room) return json({ error: 'room not found' }, 404);
            return json(room.getState());
        }

        // Move a player in a room (update position/quat)
        if (url.pathname === '/playerMoveInRoom' && req.method === 'POST') {
            const body = await req.json().catch(() => ({})) as any;
            const { roomId, playerId, pos, quat } = body;
            if (!roomId || !playerId || !pos || !quat)
                return json({ error: 'missing parameters' }, 400);
            const room = rooms.get(roomId);
            if (!room) return json({ error: 'room not found' }, 404);
            room.updatePlayer(playerId, pos, quat);
            return json({ ok: true });
        }

        // Remove a player from a room
        if (url.pathname === '/removePlayerFromRoom' && req.method === 'POST') {
            const body = await req.json().catch(() => ({})) as any;
            const { roomId, playerId } = body;
            if (!roomId || !playerId)
                return json({ error: 'missing parameters' }, 400);
            const room = rooms.get(roomId);
            if (!room) return json({ error: 'room not found' }, 404);
            room.removePlayer(playerId);
            return json({ ok: true });
        }

        return new Response('Not Found', { status: 404, headers: CORS });
    },
});

console.log(`Game server running at ${server.url}`);
