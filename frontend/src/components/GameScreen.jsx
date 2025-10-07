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
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 px-4 py-3 flex justify-between items-center border-b-2 border-emerald-500/30 shadow-lg">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="border-emerald-600/50 text-emerald-300 hover:bg-emerald-700/30 hover:border-emerald-500 transition-all"
          >
            <HomeIcon className="w-4 h-4 mr-1" />
            Menu Principal
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            className="border-amber-600/50 text-amber-300 hover:bg-amber-700/30 hover:border-amber-500 transition-all"
          >
            <RotateCcwIcon className="w-4 h-4 mr-1" />
            Reiniciar
          </Button>
        </div>
        
        <div className="flex items-center gap-6 text-slate-300">
          <div className="bg-slate-900/50 px-3 py-1 rounded-lg border border-emerald-600/30">
            <span className="text-xs text-slate-400">Altura:</span>
            <span className="text-emerald-400 font-bold text-lg ml-1">{gameState.height}m</span>
          </div>
          <div className="bg-slate-900/50 px-3 py-1 rounded-lg border border-amber-600/30">
            <span className="text-xs text-slate-400">Recorde:</span>
            <span className="text-amber-400 font-bold text-lg ml-1">{gameState.maxHeight}m</span>
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
          <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-xl px-6 py-3 border-2 border-emerald-500/50 shadow-2xl backdrop-blur-sm">
            <div className="text-emerald-300 text-sm font-semibold mb-2 text-center">💪 Força do Pulo</div>
            <div className="w-56 h-4 bg-slate-700/80 rounded-full overflow-hidden border border-slate-600/50 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-red-500 transition-all duration-75 shadow-lg"
                style={{ width: `${(gameState.chargeLevel / 100) * 100}%` }}
              />
            </div>
            <div className="text-xs text-slate-400 text-center mt-1">
              {Math.round((gameState.chargeLevel / 100) * 100)}% carregado
            </div>
          </div>
        )}

        {/* Mobile Controls */}
        <div className="absolute bottom-4 left-0 right-0 md:hidden">
          {/* Left Side - Movement Controls */}
          <div className="absolute bottom-0 left-4 flex flex-col gap-2">
            {/* Left Movement Button */}
            <div
              className="w-16 h-16 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-400 active:scale-95 active:bg-blue-700 transition-all select-none touch-manipulation"
              style={{ touchAction: 'manipulation' }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (gameEngineRef.current) {
                  gameEngineRef.current.startMoveLeft();
                }
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (gameEngineRef.current) {
                  gameEngineRef.current.stopMoveLeft();
                }
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                if (gameEngineRef.current) {
                  gameEngineRef.current.stopMoveLeft();
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                if (gameEngineRef.current) {
                  gameEngineRef.current.startMoveLeft();
                }
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                if (gameEngineRef.current) {
                  gameEngineRef.current.stopMoveLeft();
                }
              }}
              onMouseLeave={(e) => {
                if (gameEngineRef.current) {
                  gameEngineRef.current.stopMoveLeft();
                }
              }}
            >
              <span className="text-white font-bold text-xl">←</span>
            </div>
            
            {/* Right Movement Button */}
            <div
              className="w-16 h-16 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg border-4 border-blue-400 active:scale-95 active:bg-blue-700 transition-all select-none ml-20 touch-manipulation"
              style={{ touchAction: 'manipulation' }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (gameEngineRef.current) {
                  gameEngineRef.current.startMoveRight();
                }
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (gameEngineRef.current) {
                  gameEngineRef.current.stopMoveRight();
                }
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                if (gameEngineRef.current) {
                  gameEngineRef.current.stopMoveRight();
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                if (gameEngineRef.current) {
                  gameEngineRef.current.startMoveRight();
                }
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                if (gameEngineRef.current) {
                  gameEngineRef.current.stopMoveRight();
                }
              }}
              onMouseLeave={(e) => {
                if (gameEngineRef.current) {
                  gameEngineRef.current.stopMoveRight();
                }
              }}
            >
              <span className="text-white font-bold text-xl">→</span>
            </div>
          </div>

          {/* Right Side - Jump Button */}
          <div className="absolute bottom-0 right-4">
            <div
              className="w-20 h-20 bg-emerald-600 hover:bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-4 border-emerald-400 active:scale-95 active:bg-emerald-700 transition-all select-none touch-manipulation"
              style={{ touchAction: 'manipulation' }}
              onTouchStart={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (gameEngineRef.current) {
                  gameEngineRef.current.startJump();
                }
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (gameEngineRef.current) {
                  gameEngineRef.current.releaseJump();
                }
              }}
              onTouchCancel={(e) => {
                e.preventDefault();
                if (gameEngineRef.current) {
                  gameEngineRef.current.releaseJump();
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                if (gameEngineRef.current) {
                  gameEngineRef.current.startJump();
                }
              }}
              onMouseUp={(e) => {
                e.preventDefault();
                console.log('Mouse up jump');
                if (gameEngineRef.current) {
                  gameEngineRef.current.releaseJump();
                }
              }}
              onMouseLeave={(e) => {
                if (gameEngineRef.current) {
                  gameEngineRef.current.releaseJump();
                }
              }}
            >
              <span className="text-white font-bold text-sm">PULO</span>
            </div>
          </div>
        </div>

        {/* Mobile Instructions */}
        <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 md:hidden bg-slate-800/90 rounded-lg px-3 py-2 border border-emerald-500/30">
          <p className="text-emerald-300 text-xs text-center font-medium">
            📱 Segure os botões para mover e carregar o pulo
          </p>
        </div>

        {/* Desktop Instructions */}
        <div className="absolute top-4 left-4 bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-xl px-4 py-3 border border-emerald-500/30 shadow-xl backdrop-blur-sm hidden md:block">
          <h3 className="text-emerald-300 font-semibold text-sm mb-2 flex items-center gap-1">
            🎮 Controles
          </h3>
          <div className="text-slate-300 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400">🏃‍♂️</span>
              <span>Movimento:</span>
              <kbd className="bg-emerald-700/50 px-2 py-1 rounded border border-emerald-600/50 text-xs">A</kbd>
              <kbd className="bg-emerald-700/50 px-2 py-1 rounded border border-emerald-600/50 text-xs">D</kbd>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">🚀</span>
              <span>Pulo:</span>
              <kbd className="bg-amber-700/50 px-2 py-1 rounded border border-amber-600/50 text-xs">ESPAÇO</kbd>
              <kbd className="bg-amber-700/50 px-2 py-1 rounded border border-amber-600/50 text-xs">W</kbd>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-400">⬇️</span>
              <span>Descer:</span>
              <kbd className="bg-red-700/50 px-2 py-1 rounded border border-red-600/50 text-xs">S</kbd>
            </div>
          </div>
        </div>

        {/* Win Screen */}
        {gameState.gameWon && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-xl p-6 border border-emerald-500 text-center max-w-md w-full">
              <div className="text-center mb-6">
                <div className="text-6xl mb-3">🎉</div>
                <h2 className="text-4xl font-black text-emerald-400 mb-2">VITÓRIA!</h2>
                <p className="text-slate-200 mb-4 leading-relaxed">
                  🌿 Parabéns! Você alcançou o símbolo da reciclagem! 
                  A sacola plástica encontrou sua redenção ambiental! ♻️
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-emerald-900/50 to-teal-900/50 rounded-xl p-5 mb-6 border border-emerald-500/30">
                <h3 className="text-xl font-bold text-emerald-300 mb-3 flex items-center gap-2">
                  📊 Seus Resultados
                </h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-emerald-600/30">
                    <div className="text-emerald-400 font-bold text-2xl">{gameState.height}m</div>
                    <div className="text-slate-300 text-sm">Altura Final</div>
                  </div>
                  {gameStartTime && (
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-blue-600/30">
                      <div className="text-blue-400 font-bold text-2xl">
                        {Math.floor((Date.now() - gameStartTime) / 1000)}s
                      </div>
                      <div className="text-slate-300 text-sm">Tempo Total</div>
                    </div>
                  )}
                </div>
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