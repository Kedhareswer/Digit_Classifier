import React from 'react'
import { ModeSelectProps } from '../lib/types'

export default function ModeSelector({ mode, onModeChange }: ModeSelectProps) {
  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Recognition Mode</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => onModeChange('single')}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            mode === 'single'
              ? 'border-white bg-white/20 text-white'
              : 'border-gray-600 bg-gray-900/30 text-gray-300 hover:border-white/50'
          }`}
        >
          <div className="text-2xl mb-2">🔢</div>
          <div className="font-semibold mb-1">Single Digit</div>
          <div className="text-sm opacity-80">
            Recognize one digit at a time for highest accuracy
          </div>
        </button>
        
        <button
          onClick={() => onModeChange('multiple')}
          className={`p-4 rounded-lg border-2 transition-all duration-200 ${
            mode === 'multiple'
              ? 'border-white bg-white/20 text-white'
              : 'border-gray-600 bg-gray-900/30 text-gray-300 hover:border-white/50'
          }`}
        >
          <div className="text-2xl mb-2">🔢🔢</div>
          <div className="font-semibold mb-1">Multiple Digits</div>
          <div className="text-sm opacity-80">
            Process multiple digits in sequence
          </div>
        </button>
      </div>
      
      <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
        <div className="text-sm text-gray-400">
          <strong className="text-gray-300">Current mode:</strong> {mode === 'single' ? 'Single Digit' : 'Multiple Digits'}
        </div>
      </div>
    </div>
  )
} 