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
              <RecycleIcon className="w-20 h-20 text-emerald-400 animate-spin-slow" />
              <LeafIcon className="w-8 h-8 text-green-400 absolute -top-2 -right-2 animate-bounce" />
            </div>
            <div>
              <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-2xl">
                Rei da Sacola
              </h1>
              <h2 className="text-2xl md:text-3xl font-bold text-emerald-200/80">
                Plástica
              </h2>
            </div>
          </div>
          <p className="text-xl text-emerald-100 font-medium drop-shadow-lg">
            Salte em direção à redenção ambiental
          </p>
        </div>

        {/* Game Description */}
        <Card className="bg-slate-800/50 border-slate-600 p-6 backdrop-blur-sm">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-200">The Journey</h2>
            <p className="text-slate-400 leading-relaxed">
              You are a plastic bag drifting through a world of waste and pollution. 
              Your only chance for redemption lies at the top of the towering landfill, 
              where the sacred recycling symbol awaits.
            </p>
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-slate-300">Controls:</h3>
              <p className="text-slate-400">
                <strong>Desktop:</strong> Hold SPACE to charge jump, release to leap
              </p>
              <p className="text-slate-400">
                <strong>Mobile:</strong> Hold the jump button to charge, release to jump
              </p>
            </div>
            <div className="bg-amber-900/30 border border-amber-600/50 rounded-lg p-3">
              <p className="text-amber-300 text-sm">
                ⚠️ Warning: There are no checkpoints. One wrong jump could send you tumbling down!
              </p>
            </div>
          </div>
        </Card>

        {/* Start Button */}
        <Button
          onClick={() => navigate('/game')}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-8 py-4 text-xl font-bold rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
        >
          <PlayIcon className="w-6 h-6 mr-2" />
          Begin Journey
        </Button>

        {/* Footer */}
        <p className="text-slate-500 text-sm">
          A Jump King-inspired environmental tale
        </p>
      </div>
    </div>
  );
};

export default MainMenu;