import React, { useState, useRef, useEffect } from 'react';

export default function GameVideoSeekBar({ annotations = [] }) {
    const [value, setValue] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef(null);
    const sliderRef = useRef(null);

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setValue(prev => {
                    if (prev < 100) return prev + 1;
                    setIsPlaying(false);
                    return 0;
                });
            }, 50);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [isPlaying]);

    let markers = [];
    if (annotations.length > 0) {
        const useEven = annotations.some(a => !a.location || typeof a.location.x !== 'number');
        if (!useEven) {
            const xs = annotations.map(a => a.location.x);
            const minX = Math.min(...xs);
            const span = Math.max(...xs) - minX || 1;
            markers = annotations.map((a, idx) => ({ percent: ((a.location.x - minX) / span) * 100, color: a.color || '#ffd700', idx, title: a.title }));
        } else {
            markers = annotations.map((a, idx) => ({ percent: (idx + 1) * (100 / (annotations.length + 1)), color: a.color || '#ffd700', idx, title: a.title }));
        }
    }

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 16, background: 'rgba(44,44,58,0.82)', borderRadius: 7, boxShadow: '0 2px 8px #0002', border: '1px solid #39387c', padding: '7px 14px 6px 14px', minWidth: 175, position: 'relative' }}>
            <button onClick={() => { if (!isPlaying) setIsPlaying(true); }} style={{ background: '#ffd700', color: '#252529', border: 0, borderRadius: 4, padding: '4px 12px', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 4px #0002', outline: 'none' }}>Play</button>
            <div style={{ flex: 1, position: 'relative', margin: '0 8px', minWidth: 35 }}>
                <input ref={sliderRef} type="range" min="0" max="100" value={value} onChange={e => setValue(Number(e.target.value))} style={{ width: '100%', accentColor: '#ffd700', cursor: 'pointer', height: 4, position: 'relative', zIndex: 1 }} />
                {markers.length > 0 && (
                    <div style={{ pointerEvents: 'none', position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, height: 0, zIndex: 3 }}>
                        {markers.map(m => (
                            <div key={m.idx} title={m.title} style={{ position: 'absolute', top: '-9px', left: `calc(${m.percent}% - 7px)`, width: 14, height: 14, borderRadius: 7, border: '2.5px solid #222', background: m.color, boxShadow: `0 2px 7px ${m.color}88, 0 0 2px #0007`, zIndex: 10, pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}>
                                <span role="img" aria-label="annotation" style={{ fontSize: 11, textShadow: '0 0 2px #fff' }}>&#9733;</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
