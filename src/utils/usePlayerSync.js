import { useEffect } from 'react';

/**
 * usePlayerSync hook: handles player registration and sets player count from server response.
 * Fixes issues related to fetch errors and response parsing.
 * Does not POST /newPlayer on every keypress or on each mount — that's handled in Game.jsx instead.
 */
export function usePlayerSync(setPlayerCount) {
    useEffect(() => {
        let cancelled = false;
        // Fetch the player count from the server using GET /getPlayers.
        async function fetchPlayerCount() {
            try {
                const resp = await fetch('http://localhost:5173/getPlayers');
                if (!resp.ok) throw new Error('Failed to fetch players');
                const arr = await resp.json();
                // We assume playerCount refers to current online players (array length)
                if (!cancelled) setPlayerCount(Array.isArray(arr) ? arr.length : 1);
            } catch (e) {
                // Could not fetch, fallback to 1
                if (!cancelled) setPlayerCount(1);
            }
        }
        fetchPlayerCount();
        const interval = setInterval(fetchPlayerCount, 5000); // Poll every 5s

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [setPlayerCount]);

    // Remove errant /newPlayer POSTs and incorrect keydown handling
}
