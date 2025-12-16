import React, { useState, useEffect } from 'react';
import Wheel from './components/Wheel';
import Confetti from './components/Confetti';
import { WheelItem, GameState, SpinResult } from './types';
import { audioManager } from './utils/audio';
import { generateCreativeOptions, generateCongratulation } from './services/geminiService';

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
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
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
    
    // Show modal immediately with loading state implicitly (aiMessage undefined)
    setResult({ winner });
    setGameState(GameState.CELEBRATING);
    
    // Fetch AI congratulation in background
    generateCongratulation(winner.label).then(message => {
      setResult(prev => {
        // Only update if we are still showing the result for this winner
        if (prev && prev.winner.id === winner.id) {
          return { ...prev, aiMessage: message };
        }
        return prev;
      });
    });
  };

  const closeModal = () => {
    setGameState(GameState.IDLE);
    setResult(null);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    const options = await generateCreativeOptions(aiPrompt);
    
    // Take at most MAX_ITEMS
    const limitedOptions = options.slice(0, MAX_ITEMS);
    
    const newItems = limitedOptions.map((opt, idx) => ({
      id: `ai-${Date.now()}-${idx}`,
      label: opt,
      color: COLORS[idx % COLORS.length]
    }));
    
    setItems(newItems);
    setIsGenerating(false);
    setAiPrompt('');
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
          幸运转盘 AI
        </h1>
        <p className="text-gray-400">做不了决定？让转盘来帮你。</p>
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
                px-8 py-4 rounded-full text-2xl font-bold shadow-lg transform transition-all
                ${items.length < 2 
                  ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                  : 'bg-spin-accent hover:bg-red-600 hover:scale-105 active:scale-95'
                }
              `}
            >
              {gameState === GameState.SPINNING ? '旋转中...' : '开始！'}
            </button>

            <button
              onClick={toggleSound}
              className="w-16 h-16 rounded-full bg-spin-light border border-gray-700 flex items-center justify-center hover:bg-gray-700 transition"
              aria-label="Toggle Sound"
            >
              <i className={`fas ${muted ? 'fa-volume-mute' : 'fa-volume-up'} text-xl`}></i>
            </button>
          </div>
        </div>

        {/* Right Column: Controls */}
        <div className="w-full lg:w-[400px] bg-spin-light p-6 rounded-2xl shadow-xl border border-gray-800">
          
          {/* AI Generator Section */}
          <div className="mb-8 p-4 bg-spin-highlight/30 rounded-xl border border-purple-500/30">
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-magic text-purple-400"></i>
              <h2 className="font-bold text-lg text-purple-200">AI 灵感生成</h2>
            </div>
            <div className="flex gap-2">
              <input 
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="主题 (如: '晚餐', '周末活动')"
                className="flex-1 bg-spin-dark border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-500 transition"
              />
              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiPrompt.trim()}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 whitespace-nowrap"
              >
                {isGenerating ? <i className="fas fa-spinner fa-spin"></i> : '生成'}
              </button>
            </div>
          </div>

          <div className="h-[1px] bg-gray-700 w-full mb-6"></div>

          {/* Manual Input Section */}
          <div className="flex gap-2 mb-4">
            <input 
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addItem()}
              placeholder={isFull ? "选项已满 (最多10个)" : "手动添加选项..."}
              disabled={isFull}
              className={`flex-1 bg-spin-dark border border-gray-600 rounded-lg px-4 py-3 focus:outline-none focus:border-spin-accent transition ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
            />
            <button 
              onClick={addItem}
              disabled={isFull}
              className={`bg-gray-700 hover:bg-gray-600 px-4 rounded-lg transition ${isFull ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>

          {/* List of Items */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
            {items.length === 0 && (
              <p className="text-center text-gray-500 py-4">添加选项或使用 AI 开始！</p>
            )}
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-spin-dark p-3 rounded-lg border-l-4" style={{ borderLeftColor: item.color }}>
                <span className="font-medium truncate pr-4">{item.label}</span>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="text-gray-500 hover:text-red-400 transition"
                >
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-4 text-right text-xs text-gray-500 flex justify-between items-center">
            <span className="text-gray-600">最少2个，最多10个</span>
            <span className={`${isFull ? 'text-red-400 font-bold' : ''}`}>
              {items.length} / {MAX_ITEMS} 个选项
            </span>
          </div>
        </div>
      </main>

      {/* Winner Modal */}
      {result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="bg-spin-light p-8 rounded-3xl border-2 border-spin-accent shadow-[0_0_50px_rgba(233,69,96,0.5)] z-10 max-w-md w-full text-center relative animate-bounce-slow">
            <button 
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <i className="fas fa-times text-xl"></i>
            </button>
            
            <h2 className="text-2xl text-gray-300 font-bold mb-2 uppercase tracking-widest">中奖啦</h2>
            <div 
              className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 mb-6 py-2"
              style={{ textShadow: `0 0 30px ${result.winner.color}`}}
            >
              {result.winner.label}
            </div>
            
            {/* AI Message Area */}
            {result.aiMessage ? (
               <div className="bg-white/10 p-4 rounded-xl mb-6 animate-fade-in">
                 <p className="text-purple-200 italic">
                   <i className="fas fa-robot mr-2"></i>
                   "{result.aiMessage}"
                 </p>
               </div>
            ) : (
                <div className="mb-6 h-8">
                     <p className="text-gray-500 text-xs italic animate-pulse">AI 正在思考有趣的祝福...</p>
                </div>
            )}
            
            <button 
              onClick={closeModal}
              className="bg-spin-accent hover:bg-red-600 text-white px-8 py-3 rounded-full font-bold shadow-lg transition w-full"
            >
              太棒了！
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;