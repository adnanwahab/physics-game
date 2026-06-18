import React from 'react';
import { useNavigate } from 'react-router-dom';

// Mock levels data - replace with your actual data source
const levels = [
    //  { id: '0', name: 'hub', difficulty: 'Easy', description: 'linking all minigames' },

    { id: '1', name: 'creating puzzles for child education', difficulty: 'Easy', description: 'shared links to each other' },
    { id: '2', name: 'knowledge worker', difficulty: 'Medium', description: 'Impoving productivity' },
    { id: '3', name: 'bridge building', difficulty: 'Hard', description: 'Cross the cuboid bridge' },
    // { id: '4', name: 'Level 4', difficulty: 'Expert', description: 'Warsong Gulch' },
    // { id: '5', name: 'Level 5', difficulty: 'Easy', description: 'Another beginner level' },
    // { id: '4', name: 'protecting daedalus', description: 'politics, cooperative, '}
];

export default function LevelList() {
    const navigate = useNavigate();

    const handleRowClick = (gameId) => {
        navigate(`/game/${gameId}`);
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Levels</h1>
            <table style={{ 
                width: '100%', 
                borderCollapse: 'collapse',
                marginTop: '20px'
            }}>
                <thead>
                    <tr
                        style={{ 
                            // Remove distinct background to blend with tbody
                            backgroundColor: 'transparent', // No special header bg
                            borderBottom: '2px solid #e5e7eb'
                        }}
                    >
                        <th style={{ 
                            padding: '12px', 
                            textAlign: 'left',
                            fontWeight: 'bold',
                            color: 'inherit', // inherit table color
                            backgroundColor: 'transparent'
                        }}>ID</th>
                        <th style={{ 
                            padding: '12px', 
                            textAlign: 'left',
                            fontWeight: 'bold',
                            color: 'inherit',
                            backgroundColor: 'transparent'
                        }}>Name</th>
                        <th style={{ 
                            padding: '12px', 
                            textAlign: 'left',
                            fontWeight: 'bold',
                            color: 'inherit',
                            backgroundColor: 'transparent'
                        }}>Description</th>
                        <th style={{ 
                            padding: '12px', 
                            textAlign: 'left',
                            fontWeight: 'bold',
                            color: 'inherit',
                            backgroundColor: 'transparent'
                        }}>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {levels.map((level) => (
                        <tr
                            key={level.id}
                            onClick={() => handleRowClick(level.id)}
                            style={{
                                cursor: 'pointer',
                                borderBottom: '1px solid #e5e7eb',
                                transition: 'background-color 0.2s',
                                backgroundColor: 'transparent'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                        >
                            <td style={{ padding: '12px' }}>{level.id}</td>
                            <td style={{ padding: '12px' }}>{level.name}</td>
                            {/* <td style={{ padding: '12px' }}>{level.difficulty}</td> */}
                            <td style={{ padding: '12px' }}>{level.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        <form
            onSubmit={e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const suggestion = formData.get("suggestion");
                if (suggestion && suggestion.trim()) {
                    // Simulate sending to Helios and Daedalus (replace this with actual submission logic if needed)
                    alert("Forwarding suggestion to Helios + Daedalus: " + suggestion);
                    e.target.reset();
                }
            }}
            style={{
                marginTop: "30px",
                padding: "18px 24px",
                background: "#f4f4fa",
                borderRadius: "10px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start"
            }}
        >
            <label
                htmlFor="suggestion-input"
                style={{ fontWeight: 600, marginBottom: 8, color: "#28194a" }}
            >
                Forward suggestion to Helios + Daedalus
            </label>
            <textarea
                id="suggestion-input"
                name="suggestion"
                rows={3}
                required
                placeholder="Your suggestion..."
                style={{
                    width: "100%",
                    minWidth: "340px",
                    maxWidth: "100%",
                    resize: "vertical",
                    padding: "10px",
                    fontSize: "1rem",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    marginBottom: "12px",
                    background: "#fff",
                    color: "#20232a",
                }}
            />
            <button
                type="submit"
                style={{
                    padding: "8px 18px",
                    background: "#6d28d9",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: 600,
                    cursor: "pointer",
                    boxShadow: "0 1px 4px rgba(85,37,130,0.08)"
                }}
            >
                Forward Suggestion
            </button>
        </form>
        </div>
    );
}