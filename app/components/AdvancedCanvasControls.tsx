import React, { useState } from 'react'

interface AdvancedCanvasControlsProps {
  onSmoothing: (enabled: boolean) => void
  onStabilization: (level: number) => void
  onPressureSensitivity: (enabled: boolean) => void
  onAutoCenter: () => void
  onCropToFit: () => void
  onEnhanceContrast: () => void
  onNoiseReduction: () => void
}

export default function AdvancedCanvasControls({
  onSmoothing,
  onStabilization,
  onPressureSensitivity,
  onAutoCenter,
  onCropToFit,
  onEnhanceContrast,
  onNoiseReduction
}: AdvancedCanvasControlsProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [smoothingEnabled, setSmoothingEnabled] = useState(true)
  const [stabilizationLevel, setStabilizationLevel] = useState(3)
  const [pressureEnabled, setPressureEnabled] = useState(true)

  const handleSmoothing = (enabled: boolean) => {
    setSmoothingEnabled(enabled)
    onSmoothing(enabled)
  }

  const handleStabilization = (level: number) => {
    setStabilizationLevel(level)
    onStabilization(level)
  }

  const handlePressure = (enabled: boolean) => {
    setPressureEnabled(enabled)
    onPressureSensitivity(enabled)
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-white/20">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 text-left flex items-center justify-between text-white hover:bg-gray-800/30 transition-colors duration-200 rounded-xl"
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg">⚙️</span>
          <span className="font-semibold">Advanced Controls</span>
        </div>
        <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ↓
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 space-y-6 animate-slide-in-down">
          {/* Drawing Enhancement */}
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center gap-2">
              ✨ Drawing Enhancement
            </h4>

            {/* Stroke Smoothing */}
            <div className="flex items-center justify-between">
              <label className="text-gray-300 text-sm">Stroke Smoothing:</label>
              <button
                onClick={() => handleSmoothing(!smoothingEnabled)}
                className={`px-3 py-1 rounded text-xs transition-colors duration-200 ${
                  smoothingEnabled
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {smoothingEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* Stabilization */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-gray-300 text-sm">Stabilization:</label>
                <span className="text-white text-sm">{stabilizationLevel}/5</span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={stabilizationLevel}
                onChange={(e) => handleStabilization(Number(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                title="Higher values reduce hand shake"
              />
            </div>

            {/* Pressure Sensitivity */}
            <div className="flex items-center justify-between">
              <label className="text-gray-300 text-sm">Pressure Sensitivity:</label>
              <button
                onClick={() => handlePressure(!pressureEnabled)}
                className={`px-3 py-1 rounded text-xs transition-colors duration-200 ${
                  pressureEnabled
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {pressureEnabled ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Image Processing */}
          <div className="space-y-4">
            <h4 className="text-white font-medium flex items-center gap-2">
              🔧 Image Processing
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onAutoCenter}
                className="btn-secondary text-xs py-2"
                title="Center the drawing in the canvas"
              >
                📍 Auto Center
              </button>

              <button
                onClick={onCropToFit}
                className="btn-secondary text-xs py-2"
                title="Crop canvas to fit drawing"
              >
                ✂️ Crop to Fit
              </button>

              <button
                onClick={onEnhanceContrast}
                className="btn-secondary text-xs py-2"
                title="Enhance contrast for better recognition"
              >
                🔆 Enhance
              </button>

              <button
                onClick={onNoiseReduction}
                className="btn-secondary text-xs py-2"
                title="Remove noise and artifacts"
              >
                🧹 Clean Up
              </button>
            </div>
          </div>

          {/* AI Optimization Tips */}
          <div className="bg-gray-800/30 rounded-lg p-3">
            <h5 className="text-white text-sm font-medium mb-2 flex items-center gap-2">
              🤖 AI Optimization Tips
            </h5>
            <ul className="space-y-1 text-xs text-gray-300">
              <li>• Use Auto Center for consistent positioning</li>
              <li>• Enable smoothing for cleaner digit shapes</li>
              <li>• Higher stabilization helps with tremor compensation</li>
              <li>• Enhance contrast before prediction for better accuracy</li>
            </ul>
          </div>

          {/* Performance Info */}
          <div className="text-center">
            <div className="text-xs text-gray-400">
              💡 These controls optimize your drawings for maximum AI accuracy
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 