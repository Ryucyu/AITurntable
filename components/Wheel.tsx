import React, { useEffect, useRef, useState } from 'react';
import { WheelItem, GameState } from '../types';
import { audioManager } from '../utils/audio';

interface WheelProps {
  items: WheelItem[];
  gameState: GameState;
  onSpinComplete: (winner: WheelItem) => void;
  shouldSpin: boolean;
  setShouldSpin: (val: boolean) => void;
}

const Wheel: React.FC<WheelProps> = ({ items, gameState, onSpinComplete, shouldSpin, setShouldSpin }) => {
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  
  // Track previous rotation to prevent "rewinding" visual glitch
  const currentRotationRef = useRef(0);

  const spin = () => {
    if (items.length < 2) return;

    audioManager.resume();

    // Calculate random winner
    const randomIndex = Math.floor(Math.random() * items.length);
    const sliceAngle = 360 / items.length;
    
    // Calculate target rotation
    // We want to land on the chosen index.
    // The pointer is usually at the top (270 degrees or -90 degrees in CSS context, or simple top center).
    // Let's assume pointer is at Top (0deg visual, but usually requires offset).
    // Visual Setup: Item 0 starts at top center? 
    // Let's do a standard calculation: 
    // Target Rotation = (Full Spins) + (Offset to land Item X at Top)
    // To land Item i at top: Rotation must be such that Item i's center aligns with top.
    
    const extraSpins = 5 + Math.floor(Math.random() * 3); // 5 to 8 spins
    const randomOffsetInSlice = Math.random() * (sliceAngle * 0.8) - (sliceAngle * 0.4); // Add a bit of randomness within the slice
    
    // Logic: If rotation is 0, Item 0 is at top.
    // If we rotate -sliceAngle, Item 1 is at top.
    // So target = - (index * sliceAngle)
    // Add positive rotation:
    const targetAngle = currentRotationRef.current + (extraSpins * 360) + (360 - (randomIndex * sliceAngle)) + randomOffsetInSlice;
    
    currentRotationRef.current = targetAngle;
    setRotation(targetAngle);
    
    // Simulate tick sounds during spin
    const duration = 5000; // 5s match css transition
    let startTime = Date.now();
    
    const tickInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;
      
      if (progress >= 1) {
        clearInterval(tickInterval);
        return;
      }

      // Easing function for ticks (start fast, end slow)
      // We play a tick roughly every X degrees passing the pointer
      // Simplified: Just probabilistic ticking based on speed
      const speed = 1 - Math.pow(progress, 3); // starts at 1, drops to 0
      if (Math.random() < speed * 0.4) {
        audioManager.playTick();
      }
    }, 50);

    setTimeout(() => {
      clearInterval(tickInterval);
      onSpinComplete(items[randomIndex]);
    }, duration);
  };

  useEffect(() => {
    if (shouldSpin) {
      spin();
      setShouldSpin(false);
    }
  }, [shouldSpin]);

  // Generate Conic Gradient
  const generateGradient = () => {
    if (items.length === 0) return 'gray';
    if (items.length === 1) return items[0].color;

    const angle = 360 / items.length;
    let gradient = 'conic-gradient(';
    items.forEach((item, index) => {
      gradient += `${item.color} ${index * angle}deg ${(index + 1) * angle}deg,`;
    });
    return gradient.slice(0, -1) + ')';
  };

  const radius = 150; // CSS logical pixels

  return (
    <div className="relative w-[320px] h-[320px] md:w-[500px] md:h-[500px] flex items-center justify-center">
      {/* Pointer */}
      <div className="absolute top-0 z-20 transform -translate-y-1/2 drop-shadow-xl">
         <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-spin-accent"></div>
      </div>

      {/* Outer Rim */}
      <div className="w-full h-full rounded-full bg-spin-light border-[12px] border-spin-highlight shadow-2xl overflow-hidden relative">
        {/* The Wheel */}
        <div 
          ref={wheelRef}
          className="w-full h-full rounded-full transition-transform cubic-bezier(0.2, 0, 0.2, 1)"
          style={{ 
            background: generateGradient(),
            transform: `rotate(${rotation}deg)`,
            transitionDuration: '5s',
          }}
        >
          {items.map((item, index) => {
            const sliceAngle = 360 / items.length;
            const rotationAngle = (sliceAngle * index) + (sliceAngle / 2); // Center of slice
            
            return (
              <div
                key={item.id}
                className="absolute top-1/2 left-1/2 w-full h-[2px] origin-left flex items-center"
                style={{
                  transform: `translateY(-50%) rotate(${rotationAngle - 90}deg)`, // -90 to start from top
                }}
              >
                <div 
                  className="pl-12 md:pl-20 text-white font-bold text-sm md:text-xl whitespace-nowrap overflow-hidden text-ellipsis w-[140px] md:w-[220px] drop-shadow-md flex items-center"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}
                >
                  {item.label}
                  {/* Decorative dot */}
                  <span className="ml-2 inline-block w-2 h-2 rounded-full bg-white/50"></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Center Hub */}
      <div className="absolute w-16 h-16 md:w-24 md:h-24 bg-white rounded-full z-10 shadow-[0_0_15px_rgba(0,0,0,0.3)] flex items-center justify-center border-4 border-spin-accent">
         <i className="fa-solid fa-star text-spin-accent text-2xl md:text-4xl"></i>
      </div>
    </div>
  );
};

export default Wheel;