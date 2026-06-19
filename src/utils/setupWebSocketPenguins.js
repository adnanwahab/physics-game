import { WebSocketClient } from './websocket.js';
import { colorFromId } from './colorFromId.js';
import createRemotePenguinMesh from './createRemotePenguinMesh.js';

export function setupWebSocketPenguins({ game_id, scene, penguinsRef, myPlayerIdRef, setRemotePenguinsTick, setPlayerCount, cleanupFunctions }) {
    const wsUrl = `ws://localhost:3000/?room=${encodeURIComponent(game_id)}`;
    const wsClient = new WebSocketClient(wsUrl);
    try {
        wsClient.connect();
        penguinsRef.current = {};

        wsClient.on('assign_id', (msg) => { myPlayerIdRef.current = msg.id; });

        wsClient.on('player_state', (stateMsg) => {
            if (!stateMsg.players) return;
            Object.entries(stateMsg.players).forEach(([id, pdata]) => {
                if (!penguinsRef.current[id]) {
                    const mesh = createRemotePenguinMesh(pdata.color !== undefined ? pdata.color : colorFromId(id));
                    scene.add(mesh);
                    penguinsRef.current[id] = { mesh };
                }
                penguinsRef.current[id].mesh.position.set(pdata.pos.x, pdata.pos.y, pdata.pos.z);
                if (pdata.quat) penguinsRef.current[id].mesh.quaternion.set(pdata.quat.x, pdata.quat.y, pdata.quat.z, pdata.quat.w);
            });
            const currentIds = Object.keys(stateMsg.players);
            for (const id of Object.keys(penguinsRef.current)) {
                if (!currentIds.includes(id)) { scene.remove(penguinsRef.current[id].mesh); delete penguinsRef.current[id]; }
            }
            setRemotePenguinsTick(t => t + 1);
            setPlayerCount(Object.keys(stateMsg.players).length);
        });

        cleanupFunctions.push(() => {
            Object.values(penguinsRef.current).forEach(({ mesh }) => scene.remove(mesh));
            penguinsRef.current = {};
        });
    } catch (e) {
        console.error('Websocket setup failed:', e);
    }
    return wsClient;
}
