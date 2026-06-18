
export default function GameVideoSeekBar() {
    const [value, setValue] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const intervalRef = useRef(null);

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setValue(prev => {
                    if (prev < 100) {
                        return prev + 1;
                    } else {
                        setIsPlaying(false);
                        return 0;
                    }
                });
            }, 50);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isPlaying]);

    const handlePlayClick = () => {
        if (!isPlaying) {
            setIsPlaying(true);
        }
    };

    // Move to top-right: set position absolute, top 15px, right 24px, high z-index
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 14 }}>
            <button onClick={handlePlayClick}>Play</button>
            <input
                type="range"
                min="0"
                max="100"
                value={value}
                onChange={e => setValue(Number(e.target.value))}
            />
        </div>
    )
}