export default function AnnotationsPanel({ annotations, visible, onClose }) {
    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                right: visible ? 0 : '-360px',
                height: '100vh',
                width: '340px',
                background: 'rgba(24,24,27,0.95)',
                color: '#fff',
                boxShadow: '0 0 14px rgba(0,0,0,0.17)',
                borderLeft: '2px solid #ffd700',
                zIndex: 10020,
                padding: '26px 28px 20px 26px',
                transition: 'right 0.33s cubic-bezier(0.44, 1.1, 0.78, 1)',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{
                    margin: 0,
                    color: '#ffd700',
                    fontSize: '1.45rem',
                    fontWeight: '700',
                    flexGrow: 1,
                    letterSpacing: '1px'
                }}>Annotations</h3>
                <button
                    aria-label="Hide Annotations"
                    style={{
                        border: 0,
                        background: 'transparent',
                        color: '#ffd700',
                        fontWeight: 'bold',
                        fontSize: '1.25rem',
                        marginLeft: '8px',
                        cursor: 'pointer',
                        outline: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        transition: 'background 0.13s'
                    }}
                    onClick={onClose}
                    onMouseOver={e => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)')}
                    onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
                >×</button>
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: '1rem' }}>
                {annotations.length === 0 && (
                    <li style={{ color: '#bbb', marginTop: 12 }}>No annotations for this level yet.</li>
                )}
                {annotations.map((note, idx) => (
                    <li key={idx} style={{
                        marginBottom: '18px',
                        padding: '14px 12px 10px 16px',
                        background: 'rgba(33, 33, 36, 0.78)',
                        borderLeft: `4px solid ${note.color || '#ffd700'}`,
                        borderRadius: '7px'
                    }}>
                        <div style={{ fontSize: '1.02rem', fontWeight: '600', color: note.color || '#ffd700' }}>
                            {note.title}
                        </div>
                        {note.location &&
                            <div style={{ fontSize: '0.95rem', color: '#ccc', marginBottom: 3 }}>
                                ({note.location.x}, {note.location.y}, {note.location.z})
                            </div>
                        }
                        <div style={{ color: '#fff', margin: 0, fontSize: '0.96rem' }}>
                            {note.text}
                        </div>
                    </li>
                ))}
            </ul>
            {/* <button>sbit</button> */}
        </div>
    );
}
