import { useEffect } from 'react';

export function usePlayerSync(setPlayerCount) {
    useEffect(() => {
        async function init() {
            try {
                const resp = await fetch('http://localhost:5173/newPlayer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: 0, y: 0, z: 0 }) });
                setPlayerCount(resp.ok ? (await resp.json()).id : 1);
            } catch { setPlayerCount(1); }
            try {
                const resp = await fetch('/newPlayer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: 0, y: 0, z: 0 }) });
                if (resp.ok) console.log('is ok');
            } catch (e) { console.log('exception', e); }
        }
        init();
    }, []);

    useEffect(() => {
        function handleWDown() {
            fetch('/newPlayer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ x: 0, y: 0, z: 0 }) })
                .then(r => r.json()).catch(() => {});
            fetch('/playerMove', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'moveForward' }) })
                .then(r => r.json()).then(data => console.log('playermove', data)).catch(() => {});
        }
        window.addEventListener('keydown', handleWDown);
        return () => window.removeEventListener('keydown', handleWDown);
    }, []);
}
