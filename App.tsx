import React, { useState } from 'react';
import Wheel from './components/Wheel.tsx';
import Confetti from './components/Confetti.tsx';
import { WheelItem, GameState, SpinResult } from './types.ts';
import { audioManager } from './utils/audio.ts';

// Predefined palette for nice visuals
const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
  '#FFEEAD', '#FF9F43', '#54A0FF', '#5F27CD', 
  '#FF5252', '#341F97'
];

const MAX_ITEMS = 10;

const DEFAULT_ITEMS: WheelItem[] = [
  { id: '1', label: '火锅', color: COLORS[0] },
  { id: '2', label: '烧烤', color: COLORS[1] },
  { id: '3', label: '奶茶', color: COLORS[2] },
  { id: '4', label: '健身', color: COLORS[3] },
  { id: '5', label: '睡觉', color: COLORS[4] },
  { id: '6', label: '学习', color: COLORS[5] },
  { id: '7', label: '看电影', color: COLORS[6] },
  { id: '8', label: '玩游戏', color: COLORS[7] },
];

const App: React.FC = () => {
  const [items, setItems] = useState<WheelItem[]>(DEFAULT_ITEMS);
  const [inputText, setInputText] = useState('');
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [shouldSpin, setShouldSpin] = useState(false);
  const [muted, setMuted] = useState(false);

  const addItem = () => {
    if (!inputText.trim() || items.length >= MAX_ITEMS) return;
    const newItem: WheelItem = {
      id: Date.now().toString(),
      label: inputText.trim(),
      color: COLORS[items.length % COLORS.length]
    };
    setItems([...items, newItem]);
    setInputText('');
  };

  const removeItem = (id: string) => {
    if (items.length <= 1) return; 
    setItems(items.filter(i => i.id !== id));
  };

  const handleSpinClick = () => {
    if (gameState === GameState.SPINNING || items.length < 2) return;
    setGameState(GameState.SPINNING);
    setResult(null);
    setShouldSpin(true);
  };

  const onSpinComplete = (winner: WheelItem) => {
    audioManager.playWin();
    setResult({ winner });
    setGameState(GameState.CELEBRATING);
  };

  const closeModal = () => {
    setGameState(GameState.IDLE);
    setResult(null);
  };

  const toggleSound = () => {
    setMuted(!muted);
    audioManager.setMuted(!muted);
  };

  const isFull = items.length >= MAX_ITEMS;

  return (
    <div className="min-h-screen flex flex-col items-center py-8 px-4 bg-gradient-to-b from-spin-dark to-black text-white relative">
      {gameState === GameState.CELEBRATING && <Confetti />}

      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-spin-accent to-purple-500 mb-2">
          幸运大转盘
        </h1>
        <p className="text-gray-400">纠结星人的救星，快来试试运气吧！</p>
      </header>

      <main className="flex flex-col lg:flex-row gap-12 w-full max-w-6xl items-start justify-center">
        
        {/* Left Column: The Wheel */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <div className="relative p-4 md:p-8">
            <Wheel 
              items={items} 
              gameState={gameState} 
              onSpinComplete={onSpinComplete}
              shouldSpin={shouldSpin}
              setShouldSpin={setShouldSpin}
            />
          </div>
          
          <div className="mt-8 flex gap-4">
             <button
              onClick={handleSpinClick}
              disabled={gameState === GameState.SPINNING || items.length < 2}
              className={`
                px-10 py-4 rounded-full text-2xl font-bold shadow-lg transform transition-all
                ${items.length < 2 
                  ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                  : 'bg-spin-accent hover:bg-red-600 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(233,69,96,0.4)]'
                }
              `}
            >
              {gameState === GameState.SPINNING ? '正在旋转...' : '立即开奖！'}
            </button>

            <button
              onClick={toggleSound}
              className="w-16 h-16 rounded-full bg-spin-light border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition"
              aria-label="Toggle Sound"
            >
              <i className={`fas ${muted ? 'fa-volume-mute' : 'fa-volume-up'} text-xl text-gray-300`}></i>
            </button>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="w-full lg:w-[400px] bg-spin-light p-6 rounded-2xl shadow-xl border border-gray-800">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <i className="fas fa-list-ul text-spin-accent"></i>
            选项设置
          </h2>

          <div className="flex gap-2 mb-6">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder={isFull ? "选项已达上限" : "输入新选项..."}
              disabled={isFull}
              className={`flex-1 bg-spin-dark border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-spin-accent transition ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <button 
              onClick={addItem}
              disabled={isFull || !inputText.trim()}
              className={`bg-spin-accent hover:bg-red-600 text-white px-5 rounded-lg transition disabled:bg-gray-700 disabled:opacity-50`}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>

          <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
            {items.length === 0 && (
              <p className="text-center text-gray-500 py-10 italic">快去添加你的第一个选项吧！</p>
            )}
            {items.map((item) => (
              <div key={item.id} className="group flex items-center justify-between bg-spin-dark p-3 rounded-lg border-l-4 transition-all hover:bg-gray-800" style={{ borderLeftColor: item.color }}>
                <span className="font-medium truncate pr-4 text-gray-200">{item.label}</span>
                <button 
                  onClick={() => removeItem(item.id)}
                  disabled={items.length <= 2}
                  className="text-gray-600 hover:text-red-400 transition opacity-0 group-hover:opacity-100 disabled:hidden"
                  title="删除"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-700 text-xs text-gray-500 flex justify-between items-center">
            <span>最少 2 个，最多 10 个</span>
            <span className={`${isFull ? 'text-spin-accent font-bold' : ''}`}>
              已添加：{items.length} / {MAX_ITEMS}
            </span>
          </div>
        </div>
      </main>

      {/* Winner Modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeModal}></div>
          <div className="bg-spin-light p-10 rounded-3xl border-2 border-spin-accent shadow-[0_0_60px_rgba(233,69,96,0.6)] z-10 max-w-sm w-full text-center relative animate-bounce-slow">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            
            <div className="mb-4">
               <i className="fas fa-crown text-yellow-500 text-5xl mb-4"></i>
               <h2 className="text-xl text-gray-400 font-bold uppercase tracking-[0.2em]">恭喜你获得</h2>
            </div>

            <div 
              className="text-5xl font-black text-white mb-10 py-4"
              style={{ textShadow: `0 0 20px ${result.winner.color}`}}
            >
              {result.winner.label}
            </div>
            
            <button 
              onClick={closeModal}
              className="bg-spin-accent hover:bg-red-600 text-white px-10 py-4 rounded-full font-bold shadow-lg transition-all w-full text-lg"
            >
              好哒！
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;