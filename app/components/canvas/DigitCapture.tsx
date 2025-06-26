'use client'

import React, { useState, useEffect } from 'react'
import { DigitCaptureProps, SingleDigitPrediction } from '@/lib/types'
import SkeletonLoader, { ImageSkeleton, TextSkeleton } from '../ui/SkeletonLoader'

export default function DigitCapture({ 
  capturedDigit, 
  prediction,
  onCapture, 
  onClear, 
  isEnabled 
}: DigitCaptureProps) {
  const [showCaptured, setShowCaptured] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (capturedDigit) {
      setIsProcessing(true)
      setImageLoaded(false)
      
      // Simulate processing time for better UX
      setTimeout(() => {
        setShowCaptured(true)
        setIsProcessing(false)
      }, 800)
    }
  }, [capturedDigit])

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  return (
    <div className="space-y-4">
      {/* Capture Controls */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-4 border border-white/20">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          📷 Digit Capture
        </h3>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={onCapture}
            disabled={!isEnabled}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            📸 Capture Digit
          </button>
          
          {capturedDigit && (
            <button
              onClick={() => {
                onClear()
                setShowCaptured(false)
              }}
              className="btn-secondary"
            >
              🗑️ Clear Capture
            </button>
          )}
        </div>

                {/* Processing State */}
        {isProcessing && (
          <div className="space-y-3 capture-container">
            <div className="bg-black/30 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Processing Capture...</span>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">
                    {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Processing Animation */}
              <div className="bg-blue-900/20 rounded-lg p-2 mb-3 border border-blue-500/30">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-blue-300 text-sm">Analyzing digit...</span>
                </div>
              </div>

              {/* Skeleton Loaders */}
              <div className="bg-white rounded-lg p-2 mb-3">
                <ImageSkeleton width={128} height={128} className="mx-auto" />
                <TextSkeleton lines={1} className="mt-2 mx-auto w-32" />
              </div>

              <div className="bg-black rounded-lg p-2">
                <ImageSkeleton width={64} height={64} className="mx-auto" />
                <TextSkeleton lines={1} className="mt-2 mx-auto w-24" />
              </div>
            </div>
          </div>
        )}

        {/* Captured Digit Display */}
        {showCaptured && capturedDigit && !isProcessing && (
          <div className="space-y-3 capture-container">
            <div className="bg-black/30 rounded-lg p-3 border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">Captured Digit:</span>
                <span className="text-xs text-gray-400">
                  {new Date(capturedDigit.timestamp).toLocaleTimeString()}
                </span>
              </div>

              {/* Enhanced Prediction Status */}
              {prediction && prediction.success && prediction.prediction ? (
                <div className="bg-green-900/30 rounded-lg p-3 mb-3 border border-green-500/30 animate-slide-in-up">
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-green-300 text-sm font-medium">🎯 AI Prediction:</span>
                    <span className="text-white text-4xl font-black animate-scale-in drop-shadow-lg">
                      {(prediction.prediction as SingleDigitPrediction).digit}
                    </span>
                    <div className="text-center">
                      <div className="text-green-300 text-lg font-bold">
                        {Math.round(((prediction.prediction as SingleDigitPrediction).confidence || 0) * 100)}%
                      </div>
                      <div className="text-xs text-green-400">
                        Confidence
                      </div>
                    </div>
                  </div>
                  
                  {/* Confidence bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                          ((prediction.prediction as SingleDigitPrediction).confidence || 0) >= 0.9 ? 'bg-green-500' :
                          ((prediction.prediction as SingleDigitPrediction).confidence || 0) >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.round(((prediction.prediction as SingleDigitPrediction).confidence || 0) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {((prediction.prediction as SingleDigitPrediction).confidence || 0) < 0.7 && (
                    <div className="text-center text-xs text-yellow-300 mt-2 animate-pulse bg-yellow-900/20 rounded px-2 py-1">
                      ⚠️ Low confidence - try drawing clearer or thicker strokes
                    </div>
                  )}
                  
                  {((prediction.prediction as SingleDigitPrediction).confidence || 0) >= 0.95 && (
                    <div className="text-center text-xs text-green-300 mt-2 bg-green-900/20 rounded px-2 py-1">
                      🔥 Excellent prediction! Ultra-clear recognition
                    </div>
                  )}
                </div>
              ) : prediction && !prediction.success ? (
                <div className="bg-red-900/30 rounded-lg p-3 mb-3 border border-red-500/30">
                  <div className="text-center text-red-300">
                    ❌ Prediction Error
                  </div>
                  <div className="text-center text-xs text-red-400 mt-1">
                    {prediction.error || 'Unknown error occurred'}
                  </div>
                </div>
              ) : (
                <TextSkeleton lines={2} className="mb-3" />
              )}
               
              {/* Original Size Display */}
              <div className="bg-white rounded-lg p-2 mb-3 capture-image transition-all duration-300 hover:scale-105">
                <div className="relative">
                  {!imageLoaded && (
                    <ImageSkeleton width={128} height={128} className="mx-auto" />
                  )}
                  <img 
                    src={capturedDigit.original} 
                    alt="Captured digit" 
                    className={`w-32 h-32 mx-auto object-contain border border-gray-300 rounded transition-opacity duration-300 ${
                      imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
                    }`}
                    onLoad={handleImageLoad}
                  />
                </div>
                <p className="text-center text-xs text-gray-600 mt-1">
                  Your Drawing (400×400)
                </p>
              </div>
 
              {/* Ultra-Enhanced MNIST Preprocessed Display */}
              <div className="bg-black rounded-lg p-4 relative border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-gray-300 font-medium">AI Processing View</span>
                  <span className="text-xs text-blue-400 bg-blue-900/30 px-2 py-1 rounded">28×28 MNIST</span>
                </div>
                
                {/* Crystal-clear processed image display */}
                <div className="relative mx-auto w-32 h-32 bg-gray-900 rounded-lg border-2 border-gray-600 overflow-hidden group">
                  <img 
                    src={capturedDigit.processed} 
                    alt="Ultra-processed MNIST digit" 
                    className="w-full h-full object-contain rounded-lg transition-all duration-300 group-hover:scale-110"
                    style={{ 
                      imageRendering: 'pixelated',
                      filter: 'brightness(1.2) contrast(1.4) saturate(1.1)'
                    }}
                  />
                  
                  {/* Enhanced Predicted Number Overlay */}
                  {prediction && prediction.success && prediction.prediction && (
                    <div className="absolute -top-3 -right-3 bg-gradient-to-br from-white via-gray-100 to-gray-200 rounded-full w-12 h-12 flex items-center justify-center shadow-xl border-3 border-gray-400 animate-bounce-slow">
                      <span className="text-black text-xl font-black drop-shadow-sm">
                        {(prediction.prediction as SingleDigitPrediction).digit}
                      </span>
                    </div>
                  )}
                  
                  {/* Advanced quality indicators */}
                  <div className="absolute top-2 left-2 bg-green-500/80 rounded-full px-2 py-1">
                    <span className="text-white text-xs font-bold">Ultra HD</span>
                  </div>
                  
                  {/* Processing steps indicator */}
                  <div className="absolute bottom-2 left-2 right-2 bg-gradient-to-t from-black/70 to-transparent p-2 rounded">
                    <div className="text-center text-xs text-green-300 font-medium">
                      ✨ 8x Resolution → Progressive Downsampling → Otsu Thresholding
                    </div>
                  </div>
                </div>
                
                {/* Processing statistics */}
                <div className="mt-3 bg-gray-800/50 rounded-lg p-3 space-y-2">
                  <div className="text-center text-sm text-gray-300 font-medium">
                    Advanced Processing Pipeline
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div className="text-blue-400 font-bold">224×224</div>
                      <div className="text-gray-400">Ultra HD</div>
                    </div>
                    <div className="text-center">
                      <div className="text-green-400 font-bold">Otsu</div>
                      <div className="text-gray-400">Threshold</div>
                    </div>
                    <div className="text-center">
                      <div className="text-purple-400 font-bold">28×28</div>
                      <div className="text-gray-400">MNIST</div>
                    </div>
                  </div>
                </div>
                
                <p className="text-center text-xs text-gray-400 mt-2">
                  🚀 Ultra-Enhanced for Maximum AI Accuracy
                </p>
              </div>

              {/* 6 vs 9 Detection Helper */}
              {prediction && prediction.success && prediction.prediction && 
               ((prediction.prediction as SingleDigitPrediction).digit === 6 || 
                (prediction.prediction as SingleDigitPrediction).digit === 9) && (
                <div className="bg-yellow-900/30 rounded-lg p-2 border border-yellow-500/30">
                  <h5 className="text-yellow-300 text-xs font-semibold mb-1">
                    🔄 6 vs 9 Detection
                  </h5>
                  <p className="text-yellow-200 text-xs">
                    {(prediction.prediction as SingleDigitPrediction).digit === 6 
                      ? "Detected as 6. If this should be 9, try drawing with the loop at the bottom."
                      : "Detected as 9. If this should be 6, try drawing with the loop at the top."}
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Capture Info with Tips */}
            <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/30">
              <h4 className="text-sm font-semibold text-blue-300 mb-2">
                💡 AI Analysis Details
              </h4>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• Shows your drawing exactly as the AI processes it</li>
                <li>• Preprocessed to 28×28 pixels (MNIST standard)</li>
                <li>• Automatically centered and normalized</li>
                <li>• White number overlay shows AI's prediction</li>
                {prediction && prediction.success && prediction.prediction && 
                 (prediction.prediction as SingleDigitPrediction).confidence < 0.8 && (
                  <li className="text-yellow-300">• Try drawing thicker, clearer strokes for better accuracy</li>
                )}
              </ul>
            </div>

            {/* Drawing Tips for Common Confusions */}
            <div className="bg-purple-900/20 rounded-lg p-3 border border-purple-500/30">
              <h4 className="text-sm font-semibold text-purple-300 mb-2">
                ✏️ Drawing Tips
              </h4>
              <div className="text-xs text-gray-300 space-y-1">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-purple-300">6:</span> Loop at top, tail down
                  </div>
                  <div>
                    <span className="text-purple-300">9:</span> Loop at bottom, tail up
                  </div>
                  <div>
                    <span className="text-purple-300">1:</span> Straight vertical line
                  </div>
                  <div>
                    <span className="text-purple-300">7:</span> Horizontal top, diagonal
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!capturedDigit && (
          <div className="bg-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-4xl mb-2">📷</div>
            <p className="text-gray-400 text-sm">
              Draw a digit and click "Capture" to see how the AI processes your drawing
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 