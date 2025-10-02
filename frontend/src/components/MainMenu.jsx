import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { RecycleIcon, PlayIcon } from 'lucide-react';

const MainMenu = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-lg">
        {/* Title */}
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3">
            <RecycleIcon className="w-16 h-16 text-emerald-400" />
            <h1 className="text-6xl font-bold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
              Plastic Bag King
            </h1>
          </div>
          <p className="text-xl text-slate-300 font-medium">
            Jump your way to redemption
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