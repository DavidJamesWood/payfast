import React from 'react';
import { PlayIcon } from '@heroicons/react/24/outline';

interface DemoButtonProps {
  onStartDemo: () => void;
  isRunning?: boolean;
}

export default function DemoButton({ onStartDemo, isRunning = false }: DemoButtonProps) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={onStartDemo}
        disabled={isRunning}
        className={`
          flex items-center space-x-2 px-6 py-3 rounded-full shadow-lg font-semibold text-white
          transition-all duration-300 transform hover:scale-105 active:scale-95
          ${isRunning 
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
          }
        `}
      >
        {isRunning ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Running Demo...</span>
          </>
        ) : (
          <>
            <PlayIcon className="h-5 w-5" />
            <span>Start Demo</span>
          </>
        )}
      </button>
    </div>
  );
}
