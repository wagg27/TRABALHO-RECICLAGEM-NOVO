import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { HomeIcon, RotateCcwIcon } from 'lucide-react';
import GameEngine from '../game/GameEngine';

const GameScreen = () => {
  const canvasRef = useRef(null);
  const gameEngineRef = useRef(null);
  const navigate = useNavigate();
  const [gameState, setGameState] = useState({
    height: 0,
    maxHeight: 0,
    isCharging: false,
    chargeLevel: 0,
    gameWon: false
  });

  // Initialize game engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameEngineRef.current = new GameEngine(canvas, setGameState);
    gameEngineRef.current.start();

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
    };
  }, []);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.handleResize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const resetGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.reset();
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Game Header */}
      <div className="bg-slate-800 px-4 py-2 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <HomeIcon className="w-4 h-4 mr-1" />
            Menu
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RotateCcwIcon className="w-4 h-4 mr-1" />
            Reset
          </Button>
        </div>
        
        <div className="flex items-center gap-6 text-slate-300">
          <div className="text-sm">
            Height: <span className="text-emerald-400 font-mono">{gameState.height}m</span>
          </div>
          <div className="text-sm">
            Best: <span className="text-amber-400 font-mono">{gameState.maxHeight}m</span>
          </div>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="flex-1 relative bg-slate-900">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ imageRendering: 'pixelated' }}
        />

        {/* Jump Charge Indicator */}
        {gameState.isCharging && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-slate-800/90 rounded-lg px-4 py-2 border border-slate-600">
            <div className="text-slate-300 text-sm mb-1">Jump Power</div>
            <div className="w-48 h-3 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-amber-500 transition-all duration-75"
                style={{ width: `${(gameState.chargeLevel / 100) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Mobile Jump Button */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 md:hidden">
          <div
            className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg border-4 border-emerald-400 active:scale-95 transition-transform"
            onTouchStart={(e) => {
              e.preventDefault();
              if (gameEngineRef.current) {
                gameEngineRef.current.startJump();
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (gameEngineRef.current) {
                gameEngineRef.current.releaseJump();
              }
            }}
          >
            <span className="text-white font-bold text-lg">JUMP</span>
          </div>
          <p className="text-slate-400 text-xs text-center mt-2">Hold to charge</p>
        </div>

        {/* Desktop Instructions */}
        <div className="absolute top-4 left-4 bg-slate-800/90 rounded-lg px-3 py-2 border border-slate-600 hidden md:block">
          <p className="text-slate-300 text-sm">Hold <kbd className="bg-slate-700 px-2 py-1 rounded text-xs">SPACE</kbd> to charge jump</p>
        </div>

        {/* Win Screen */}
        {gameState.gameWon && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
            <div className="bg-slate-800 rounded-xl p-8 border border-emerald-500 text-center">
              <h2 className="text-4xl font-bold text-emerald-400 mb-4">Victory!</h2>
              <p className="text-slate-300 mb-6">
                You've reached the recycling symbol! The plastic bag has found redemption.
              </p>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={resetGame}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  Play Again
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Main Menu
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameScreen;