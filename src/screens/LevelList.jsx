import React from 'react';
import { useNavigate } from 'react-router-dom';

// Mock levels data - replace with your actual data source
const levels = [
    { id: '1', name: 'Level 1', difficulty: 'Easy', description: 'Introduction level' },
    { id: '2', name: 'Level 2', difficulty: 'Medium', description: 'Intermediate challenge' },
    { id: '3', name: 'Level 3', difficulty: 'Hard', description: 'Cross the cuboid bridge' },
    { id: '4', name: 'Level 4', difficulty: 'Expert', description: 'Warsong Gulch' },
    { id: '5', name: 'Level 5', difficulty: 'Easy', description: 'Another beginner level' },
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
                        }}>Difficulty</th>
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
                            <td style={{ padding: '12px' }}>{level.difficulty}</td>
                            <td style={{ padding: '12px' }}>{level.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}