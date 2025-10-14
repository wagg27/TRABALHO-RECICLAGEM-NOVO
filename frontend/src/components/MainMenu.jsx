import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { RecycleIcon, PlayIcon, LeafIcon } from 'lucide-react';

const MainMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-800 to-indigo-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>
      
      <div className="text-center space-y-8 max-w-lg relative z-10">
        {/* Title */}
        <div className="space-y-6">
          <div className="flex items-center justify-center gap-4">
            <div className="relative">
              <RecycleIcon className="w-20 h-20 text-emerald-400" />
              <LeafIcon className="w-6 h-8 text-green-400 absolute -top-2 -right-2" />
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-2xl">
                Rei da Sacola
              </h1>
              <h2 className="text-2xl md:text-3xl font-bold text-emerald-200/80">
                Plástica
                Turma: 309
              </h2>
            </div>
          </div>
          <p className="text-xl text-emerald-100 font-medium drop-shadow-lg">
            Salte em direção à redenção ambiental
          </p>
        </div>

        {/* Game Description */}
        <Card className="bg-slate-800/30 border border-emerald-500/30 p-6 backdrop-blur-xl shadow-2xl">
          <div className="space-y-5">
            <h2 className="text-2xl font-bold text-emerald-200 flex items-center gap-2">
              <LeafIcon className="w-6 h-6 text-green-400" />
              A Jornada Ecológica
            </h2>
            <p className="text-slate-300 leading-relaxed text-left">
              Você é uma sacola plástica flutuando através de um mundo de lixo e poluição. 
              Sua única chance de redenção está no topo da torre de lixo, 
              onde o símbolo sagrado da reciclagem aguarda por você.
            </p>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-emerald-300">Controles:</h3>
              <div className="grid gap-2 text-sm">
                <p className="text-slate-300">
                  <strong className="text-emerald-400">Desktop:</strong> WASD ou setas para mover, ESPAÇO/W para pular
                </p>
                <p className="text-slate-300">
                  <strong className="text-emerald-400">Mobile:</strong> Botões virtuais - segure para carregar o pulo
                </p>
              </div>
            </div>
            <div className="bg-gradient-to-r from-amber-900/40 to-red-900/40 border border-amber-500/50 rounded-lg p-4">
              <p className="text-amber-200 text-sm flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <span><strong>Atenção:</strong> Não há pontos de salvamento! Um pulo errado pode te enviar de volta ao início!</span>
              </p>
            </div>
          </div>
        </Card>

        {/* Start Button */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate('/game')}
            className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:via-teal-400 hover:to-cyan-400 text-white px-10 py-5 text-xl font-black rounded-2xl transition-all duration-300 transform hover:scale-110 shadow-2xl hover:shadow-emerald-500/25 border-2 border-emerald-400/20"
          >
            <PlayIcon className="w-7 h-7 mr-3" />
            Iniciar Jornada
          </Button>
          
          <div className="flex justify-center gap-4 text-xs">
            <span className="px-3 py-1 bg-emerald-900/50 rounded-full text-emerald-300 border border-emerald-600/30">
              🌱 Ecológico
            </span>
            <span className="px-3 py-1 bg-blue-900/50 rounded-full text-blue-300 border border-blue-600/30">
              📱 Mobile Ready
            </span>
            <span className="px-3 py-1 bg-purple-900/50 rounded-full text-purple-300 border border-purple-600/30">
              🏆 Desafio Extremo
            </span>
          </div>
        </div>

        {/* Footer */}
        <p className="text-emerald-300/60 text-sm font-medium">
          Uma aventura ambiental feita pela Turma 309
        </p>
      </div>
    </div>
  );
};

export default MainMenu;
