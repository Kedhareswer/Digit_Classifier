import React from 'react'
import { DrawingHistoryProps } from '../lib/types.js'

export default function DrawingHistory({ 
  drawings, 
  onLoadDrawing, 
  onDeleteDrawing, 
  onClearHistory 
}: DrawingHistoryProps) {
  if (drawings.length === 0) {
    return (
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="text-lg font-semibold text-white mb-2">Drawing History</h3>
          <p className="text-gray-400 text-sm">
            Your saved drawings will appear here. Start drawing and save your creations!
          </p>
        </div>
      </div>
    )
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">📝 Drawing History</h3>
        {drawings.length > 0 && (
          <button
            onClick={onClearHistory}
            className="text-xs text-gray-400 hover:text-white transition-colors duration-200"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto">
        {drawings.map((drawing) => (
          <div
            key={drawing.id}
            className="bg-gray-800/50 rounded-lg p-3 border border-white/10 hover:border-white/30 transition-all duration-200"
          >
            <div className="flex items-center space-x-3">
              {/* Thumbnail */}
              <div className="flex-shrink-0">
                <img
                  src={drawing.imageData}
                  alt="Drawing thumbnail"
                  className="w-12 h-12 bg-black rounded-lg object-cover border border-white/20"
                />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-white text-sm font-medium">
                    {drawing.mode === 'single' ? '🔢' : '🔢🔢'} 
                    {drawing.mode === 'single' ? 'Single' : 'Multiple'}
                  </span>
                  {drawing.prediction && (
                    <span className="text-xs text-gray-400">
                      • {drawing.prediction.success ? '✅' : '❌'}
                    </span>
                  )}
                </div>
                
                <div className="text-xs text-gray-400">
                  {formatDate(drawing.timestamp)}
                </div>

                {/* Prediction result if available */}
                {drawing.prediction && drawing.prediction.success && drawing.prediction.prediction && (
                  <div className="text-xs text-gray-300 mt-1">
                    {drawing.mode === 'single' 
                      ? `Result: ${(drawing.prediction.prediction as any).digit} (${Math.round((drawing.prediction.prediction as any).confidence * 100)}%)`
                      : `Result: ${(drawing.prediction.prediction as any).sequence}`
                    }
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col space-y-1">
                <button
                  onClick={() => onLoadDrawing(drawing)}
                  className="px-3 py-1 bg-white text-black text-xs rounded hover:bg-gray-200 transition-colors duration-200"
                  title="Load this drawing"
                >
                  Load
                </button>
                <button
                  onClick={() => onDeleteDrawing(drawing.id)}
                  className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-600 transition-colors duration-200"
                  title="Delete this drawing"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 text-center">
          📊 Total drawings: {drawings.length} • 
          Recent: {drawings.filter(d => Date.now() - d.timestamp < 24 * 60 * 60 * 1000).length} today
        </div>
      </div>
    </div>
  )
} 