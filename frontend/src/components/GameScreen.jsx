import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { HomeIcon, RotateCcwIcon, TrophyIcon } from 'lucide-react';
import GameEngine from '../game/GameEngine';
import GameAPI from '../services/api';
import { useToast } from '../hooks/use-toast';

const GameScreen = () => {
  const canvasRef = useRef(null);
  const gameEngineRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [gameState, setGameState] = useState({
    height: 0,
    maxHeight: 0,
    isCharging: false,
    chargeLevel: 0,
    gameWon: false
  });
  const [sessionId, setSessionId] = useState(null);
  const [playerName, setPlayerName] = useState('Jogador Anônimo');
  const [gameStartTime, setGameStartTime] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // Initialize game engine and session
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Start game session
    const initSession = async () => {
      try {
        const session = await GameAPI.startSession(playerName);
        setSessionId(session.session_id);
        setGameStartTime(Date.now());
      } catch (error) {
        console.error('Failed to start session:', error);
      }
    };

    initSession();
    gameEngineRef.current = new GameEngine(canvas, setGameState, handleGameEnd);
    gameEngineRef.current.start();

    return () => {
      if (gameEngineRef.current) {
        gameEngineRef.current.destroy();
      }
    };
  }, []);

  // Handle game completion
  const handleGameEnd = async (height, completed) => {
    if (!sessionId || !gameStartTime) return;

    try {
      const playTime = Math.floor((Date.now() - gameStartTime) / 1000);
      
      // Save score
      const scoreResult = await GameAPI.saveScore(
        playerName, 
        height, 
        completed, 
        completed ? playTime : null
      );

      // Update session
      await GameAPI.updateSession(sessionId, height, completed, playTime);

      // Show achievement toast if new record
      if (scoreResult.new_record) {
        toast({
          title: "🏆 Novo Recorde!",
          description: `Você alcançou ${height}m - sua melhor marca!`
        });
      }

      // Load leaderboard
      const leaderboardData = await GameAPI.getLeaderboard();
      setLeaderboard(leaderboardData);

      if (completed) {
        setShowLeaderboard(true);
      }

    } catch (error) {
      console.error('Error saving game results:', error);
    }
  };

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

  const resetGame = useCallback(async () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.reset();
    }
    
    // Start new session
    try {
      const session = await GameAPI.startSession(playerName);
      setSessionId(session.session_id);
      setGameStartTime(Date.now());
      setShowLeaderboard(false);
    } catch (error) {
      console.error('Failed to start new session:', error);
    }
  }, [playerName]);

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

        {/* Mobile Controls */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-between px-4 md:hidden">
          {/* Left Movement Button */}
          <div
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-400 active:scale-95 transition-transform"
            onTouchStart={(e) => {
              e.preventDefault();
              if (gameEngineRef.current) {
                gameEngineRef.current.startMoveLeft();
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (gameEngineRef.current) {
                gameEngineRef.current.stopMoveLeft();
              }
            }}
          >
            <span className="text-white font-bold text-lg">←</span>
          </div>

          {/* Jump Button */}
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

          {/* Right Movement Button */}
          <div
            className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-400 active:scale-95 transition-transform"
            onTouchStart={(e) => {
              e.preventDefault();
              if (gameEngineRef.current) {
                gameEngineRef.current.startMoveRight();
              }
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (gameEngineRef.current) {
                gameEngineRef.current.stopMoveRight();
              }
            }}
          >
            <span className="text-white font-bold text-lg">→</span>
          </div>
        </div>

        {/* Mobile Instructions */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 md:hidden">
          <p className="text-slate-400 text-xs text-center">Hold buttons to move and charge jump</p>
        </div>

        {/* Desktop Instructions */}
        <div className="absolute top-4 left-4 bg-slate-800/90 rounded-lg px-3 py-2 border border-slate-600 hidden md:block">
          <div className="text-slate-300 text-sm space-y-1">
            <p>Movement: <kbd className="bg-slate-700 px-2 py-1 rounded text-xs">A</kbd> <kbd className="bg-slate-700 px-2 py-1 rounded text-xs">D</kbd> or Arrow Keys</p>
            <p>Jump: Hold <kbd className="bg-slate-700 px-2 py-1 rounded text-xs">SPACE</kbd> to charge</p>
          </div>
        </div>

        {/* Win Screen */}
        {gameState.gameWon && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-emerald-500 text-center max-w-md w-full">
              <h2 className="text-4xl font-bold text-emerald-400 mb-4">Vitória!</h2>
              <p className="text-slate-300 mb-4">
                Você alcançou o símbolo da reciclagem! A sacola plástica encontrou sua redenção.
              </p>
              
              <div className="bg-slate-700 rounded-lg p-4 mb-6">
                <h3 className="text-xl font-bold text-slate-200 mb-2">Seus Resultados</h3>
                <p className="text-emerald-400">Altura: {gameState.height}m</p>
                {gameStartTime && (
                  <p className="text-blue-400">
                    Tempo: {Math.floor((Date.now() - gameStartTime) / 1000)}s
                  </p>
                )}
              </div>

              {showLeaderboard && leaderboard.length > 0 && (
                <div className="bg-slate-700 rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-bold text-slate-200 mb-3 flex items-center gap-2">
                    <TrophyIcon className="w-5 h-5 text-yellow-500" />
                    Ranking
                  </h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {leaderboard.slice(0, 5).map((entry, index) => (
                      <div key={entry.id} className="flex justify-between text-sm">
                        <span className={`${entry.name === playerName ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
                          {index + 1}. {entry.name}
                        </span>
                        <span className="text-slate-400">{entry.height}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={resetGame}
                  className="bg-emerald-600 hover:bg-emerald-500"
                >
                  Jogar Novamente
                </Button>
                <Button
                  onClick={() => navigate('/')}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Menu Principal
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