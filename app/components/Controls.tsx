import React from 'react'
import { ControlsProps } from '@/lib/types'

export default function Controls({ 
  brushSize, 
  onBrushSizeChange, 
  brushType,
  onBrushTypeChange,
  mode,
  canvasTheme,
  onThemeChange,
  showGrid,
  onGridToggle,
  realTimePredict,
  onRealTimePredictToggle,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}: ControlsProps) {
  return (
    <div className="mt-6 space-y-6">
      {/* Brush Controls */}
      <div className="space-y-4">
        <h4 className="text-white font-semibold">🖌️ Brush Settings</h4>
        
        {/* Brush Size */}
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Size:</label>
          <div className="flex items-center space-x-3">
            <span className="text-gray-300 text-sm w-8">{brushSize}px</span>
            <input
              type="range"
              min="2"
              max="30"
              value={brushSize}
              onChange={(e) => onBrushSizeChange(Number(e.target.value))}
              className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Brush Type */}
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Type:</label>
          <div className="flex gap-2">
            {[
              { type: 'round' as const, icon: '⚫', label: 'Round' },
              { type: 'square' as const, icon: '⬛', label: 'Square' },
              { type: 'marker' as const, icon: '🖊️', label: 'Marker' }
            ].map(({ type, icon, label }) => (
              <button
                key={type}
                onClick={() => onBrushTypeChange(type)}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  brushType === type
                    ? 'bg-white text-black'
                    : 'bg-gray-800 text-white hover:bg-gray-700 border border-white/30'
                }`}
                title={label}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Canvas Settings */}
      <div className="space-y-4">
        <h4 className="text-white font-semibold">🎨 Canvas Settings</h4>
        
        {/* Canvas Theme */}
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Theme:</label>
          <div className="flex gap-2">
            {[
              { theme: 'dark' as const, icon: '🌑', label: 'Dark' },
              { theme: 'light' as const, icon: '☀️', label: 'Light' },
              { theme: 'grid' as const, icon: '📐', label: 'Grid' }
            ].map(({ theme, icon, label }) => (
              <button
                key={theme}
                onClick={() => onThemeChange(theme)}
                className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  canvasTheme === theme
                    ? 'bg-white text-black'
                    : 'bg-gray-800 text-white hover:bg-gray-700 border border-white/30'
                }`}
                title={label}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        {/* Grid Toggle */}
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Grid Helper:</label>
          <button
            onClick={() => onGridToggle(!showGrid)}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
              showGrid
                ? 'bg-white text-black'
                : 'bg-gray-800 text-white hover:bg-gray-700 border border-white/30'
            }`}
          >
            {showGrid ? '📐 On' : '📐 Off'}
          </button>
        </div>
      </div>

      {/* AI Settings */}
      <div className="space-y-4">
        <h4 className="text-white font-semibold">🤖 AI Settings</h4>
        
        {/* Real-time Prediction */}
        <div className="flex items-center justify-between">
          <label className="text-white font-medium">Real-time Predict:</label>
          <button
            onClick={() => onRealTimePredictToggle(!realTimePredict)}
            className={`px-4 py-2 rounded-lg text-sm transition-all duration-200 ${
              realTimePredict
                ? 'bg-white text-black'
                : 'bg-gray-800 text-white hover:bg-gray-700 border border-white/30'
            }`}
          >
            {realTimePredict ? '🔍 On' : '🔍 Off'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h4 className="text-white font-semibold">⚡ Quick Actions</h4>
        
        <div className="flex gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex-1 btn-secondary disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex-1 btn-secondary disabled:opacity-30 disabled:cursor-not-allowed text-sm"
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
        </div>
      </div>

      {/* Mode-specific tips */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="text-sm text-gray-300">
          <strong className="text-white">💡 {mode === 'single' ? 'Single Mode' : 'Multiple Mode'} Tips:</strong>
          <ul className="mt-2 space-y-1 text-xs">
            {mode === 'single' ? (
              <>
                <li>• Draw one digit centered in the canvas</li>
                <li>• Use larger brush sizes for better recognition</li>
                <li>• Try the grid helper for alignment</li>
              </>
            ) : (
              <>
                <li>• Leave clear spaces between digits</li>
                <li>• Draw from left to right</li>
                <li>• Use consistent sizing</li>
              </>
            )}
            <li>• Use real-time prediction for instant feedback</li>
            <li>• Save interesting drawings for later</li>
          </ul>
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <div className="bg-gray-900/50 rounded-lg p-4">
        <div className="text-sm text-gray-300">
          <strong className="text-white">⌨️ Keyboard Shortcuts:</strong>
          <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
            <div>Ctrl+Z - Undo</div>
            <div>Ctrl+Y - Redo</div>
            <div>Space - Predict</div>
            <div>Ctrl+S - Save</div>
            <div>Escape - Clear</div>
            <div>G - Toggle Grid</div>
          </div>
        </div>
      </div>
    </div>
  )
} 