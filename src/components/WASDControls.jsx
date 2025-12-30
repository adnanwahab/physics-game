import React, { useState, useEffect, useRef } from 'react';

/**
 * WASDControls component - displays on-screen WASD buttons that highlight when pressed
 * Works with both keyboard and touch events for mobile devices
 */
export default function WASDControls({ inputState }) {
  const [pressedKeys, setPressedKeys] = useState({
    W: false,
    A: false,
    S: false,
    D: false,
  });

  const touchRefs = useRef({
    W: null,
    A: null,
    S: null,
    D: null,
  });

  // Listen to keyboard events and update pressed state
  useEffect(() => {
    const handleKeyDown = (event) => {
      switch (event.code) {
        case 'KeyW':
          setPressedKeys(prev => ({ ...prev, W: true }));
          break;
        case 'KeyA':
          setPressedKeys(prev => ({ ...prev, A: true }));
          break;
        case 'KeyS':
          setPressedKeys(prev => ({ ...prev, S: true }));
          break;
        case 'KeyD':
          setPressedKeys(prev => ({ ...prev, D: true }));
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event) => {
      switch (event.code) {
        case 'KeyW':
          setPressedKeys(prev => ({ ...prev, W: false }));
          break;
        case 'KeyA':
          setPressedKeys(prev => ({ ...prev, A: false }));
          break;
        case 'KeyS':
          setPressedKeys(prev => ({ ...prev, S: false }));
          break;
        case 'KeyD':
          setPressedKeys(prev => ({ ...prev, D: false }));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Handle touch events for mobile
  const handleTouchStart = (key) => {
    setPressedKeys(prev => ({ ...prev, [key]: true }));
    
    // Update inputState for the corresponding key
    switch (key) {
      case 'W':
        if (inputState) inputState.forwardPressed = true;
        break;
      case 'A':
        if (inputState) inputState.leftPressed = true;
        break;
      case 'S':
        if (inputState) inputState.backwardPressed = true;
        break;
      case 'D':
        if (inputState) inputState.rightPressed = true;
        break;
    }
  };

  const handleTouchEnd = (key) => {
    setPressedKeys(prev => ({ ...prev, [key]: false }));
    
    // Update inputState for the corresponding key
    switch (key) {
      case 'W':
        if (inputState) inputState.forwardPressed = false;
        break;
      case 'A':
        if (inputState) inputState.leftPressed = false;
        break;
      case 'S':
        if (inputState) inputState.backwardPressed = false;
        break;
      case 'D':
        if (inputState) inputState.rightPressed = false;
        break;
    }
  };

  // Handle touch cancel (e.g., when user drags finger away)
  const handleTouchCancel = (key) => {
    handleTouchEnd(key);
  };

  // Poll inputState to sync visual state (for keyboard events handled by handleUserInput)
  useEffect(() => {
    if (!inputState) return;

    const updatePressedKeys = () => {
      setPressedKeys({
        W: inputState.forwardPressed || false,
        A: inputState.leftPressed || false,
        S: inputState.backwardPressed || false,
        D: inputState.rightPressed || false,
      });
    };

    // Poll at ~60fps to stay in sync with keyboard input
    const interval = setInterval(updatePressedKeys, 16);
    
    return () => clearInterval(interval);
  }, [inputState]);

  const buttonStyle = (key) => ({
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    backgroundColor: pressedKeys[key] 
      ? 'rgba(113, 47, 255, 0.8)' 
      : 'rgba(0, 0, 0, 0.5)',
    color: '#fff',
    fontSize: '24px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'all 0.1s ease',
    transform: pressedKeys[key] ? 'scale(0.95)' : 'scale(1)',
    boxShadow: pressedKeys[key] 
      ? '0 0 20px rgba(113, 47, 255, 0.6), inset 0 0 12px rgba(191, 151, 255, 0.3)' 
      : '0 2px 8px rgba(0, 0, 0, 0.3)',
    WebkitTapHighlightColor: 'transparent',
    touchAction: 'manipulation',
  });

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        gap: '8px',
        width: '196px',
        height: '196px',
        pointerEvents: 'auto',
      }}
    >
      {/* Empty space for top-left */}
      <div></div>
      
      {/* W button */}
      <button
        ref={el => touchRefs.current.W = el}
        style={buttonStyle('W')}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTouchStart('W');
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleTouchEnd('W');
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          handleTouchCancel('W');
        }}
        onMouseDown={() => handleTouchStart('W')}
        onMouseUp={() => handleTouchEnd('W')}
        onMouseLeave={() => handleTouchEnd('W')}
      >
        W
      </button>
      
      {/* Empty space for top-right */}
      <div></div>
      
      {/* A button */}
      <button
        ref={el => touchRefs.current.A = el}
        style={buttonStyle('A')}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTouchStart('A');
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleTouchEnd('A');
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          handleTouchCancel('A');
        }}
        onMouseDown={() => handleTouchStart('A')}
        onMouseUp={() => handleTouchEnd('A')}
        onMouseLeave={() => handleTouchEnd('A')}
      >
        A
      </button>
      
      {/* S button */}
      <button
        ref={el => touchRefs.current.S = el}
        style={buttonStyle('S')}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTouchStart('S');
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleTouchEnd('S');
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          handleTouchCancel('S');
        }}
        onMouseDown={() => handleTouchStart('S')}
        onMouseUp={() => handleTouchEnd('S')}
        onMouseLeave={() => handleTouchEnd('S')}
      >
        S
      </button>
      
      {/* D button */}
      <button
        ref={el => touchRefs.current.D = el}
        style={buttonStyle('D')}
        onTouchStart={(e) => {
          e.preventDefault();
          handleTouchStart('D');
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleTouchEnd('D');
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          handleTouchCancel('D');
        }}
        onMouseDown={() => handleTouchStart('D')}
        onMouseUp={() => handleTouchEnd('D')}
        onMouseLeave={() => handleTouchEnd('D')}
      >
        D
      </button>
      
      {/* Empty space for bottom-right */}
      <div></div>
    </div>
  );
}

