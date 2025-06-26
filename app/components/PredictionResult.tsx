import React from 'react'
import { PredictionResultProps, SingleDigitPrediction, MultipleDigitPrediction } from '../lib'
import SkeletonLoader, { TextSkeleton } from './ui/SkeletonLoader'

export default function PredictionResult({ prediction, isLoading, mode, showAlternatives = true }: PredictionResultProps) {
  if (isLoading) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-white mb-2">Processing...</h3>
          <p className="text-gray-400">AI is analyzing your drawing</p>
          
          {/* Enhanced loading with skeleton */}
          <div className="mt-6 bg-gray-800/30 rounded-lg p-4 space-y-3">
            <div className="flex justify-center">
              <SkeletonLoader variant="circular" width={60} height={60} />
            </div>
            <TextSkeleton lines={1} className="mx-auto w-24" />
            <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse shimmer" style={{ width: '60%' }}></div>
            </div>
            <TextSkeleton lines={2} className="mx-auto w-48" />
          </div>
          
          <div className="mt-4 text-xs text-gray-500 animate-pulse">
            🧠 Neural network inference in progress...
          </div>
        </div>
      </div>
    )
  }

  if (!prediction) {
    return (
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🤖</div>
          <h3 className="text-lg font-semibold text-white mb-2">Ready to Predict</h3>
          <p className="text-gray-400">Draw a digit and click "Predict" to see AI magic!</p>
          
          {/* Feature highlights */}
          <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-800/30 rounded-lg p-3">
              <div className="text-2xl mb-1">⚡</div>
              <div className="text-white font-medium">Fast</div>
              <div className="text-gray-400 text-xs">Sub-second prediction</div>
            </div>
            <div className="bg-gray-800/30 rounded-lg p-3">
              <div className="text-2xl mb-1">🎯</div>
              <div className="text-white font-medium">Accurate</div>
              <div className="text-gray-400 text-xs">98%+ accuracy</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (prediction.error) {
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h3 className="text-lg font-semibold text-white mb-2">Prediction Error</h3>
          <p className="text-gray-300">{prediction.error}</p>
          
          {/* Retry suggestion */}
          <div className="mt-4 bg-gray-800/50 rounded-lg p-3">
            <div className="text-sm text-gray-400">
              💡 Try drawing a clearer digit or check your connection
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'single' && prediction.prediction) {
    const singlePrediction = prediction.prediction as SingleDigitPrediction
    const confidencePercent = Math.round(singlePrediction.confidence * 100)
    
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-in slide-in-from-bottom duration-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-white mb-2">Prediction Result</h3>
          
          <div className="bg-gray-900/50 rounded-lg p-6 mb-4">
            <div className="text-6xl font-bold text-white mb-3 animate-in zoom-in duration-700">
              {singlePrediction.digit}
            </div>
            <div className="text-white text-lg">
              Confidence: {confidencePercent}%
            </div>
            
            {/* Confidence visualization */}
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    confidencePercent >= 90 ? 'bg-green-500' :
                    confidencePercent >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${confidencePercent}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-400">
                {confidencePercent >= 90 ? '🔥 Excellent confidence!' :
                 confidencePercent >= 70 ? '👍 Good confidence' : '⚠️ Low confidence'}
              </div>
            </div>
          </div>

          {/* Alternative predictions */}
          {showAlternatives && singlePrediction.alternatives && singlePrediction.alternatives.length > 0 && (
            <div className="bg-gray-800/30 rounded-lg p-4 mb-4">
              <h4 className="text-white font-medium mb-3">Alternative Predictions:</h4>
              <div className="space-y-2">
                {singlePrediction.alternatives.slice(0, 3).map((alt, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-gray-300">Digit {alt.digit}:</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-700 rounded-full h-1">
                        <div 
                          className="bg-gray-400 h-1 rounded-full transition-all duration-500"
                          style={{ width: `${Math.round(alt.confidence * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-gray-400 text-sm w-10">
                        {Math.round(alt.confidence * 100)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {prediction.processing_time && (
            <div className="flex justify-center items-center space-x-4 text-xs text-gray-400">
              <div>⚡ {Math.round(prediction.processing_time * 1000)}ms</div>
              {prediction.model_version && (
                <div>🧠 Model v{prediction.model_version}</div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (mode === 'multiple' && prediction.prediction) {
    const multiplePrediction = prediction.prediction as MultipleDigitPrediction
    const averageConfidence = Math.round(
      multiplePrediction.confidences.reduce((a, b) => a + b, 0) / multiplePrediction.confidences.length * 100
    )
    
    return (
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 animate-in slide-in-from-bottom duration-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-white mb-2">Multiple Digits Result</h3>
          
          <div className="bg-gray-900/50 rounded-lg p-6 mb-4">
            <div className="text-5xl font-bold text-white mb-3 animate-in zoom-in duration-700 tracking-wider">
              {multiplePrediction.sequence}
            </div>
            <div className="text-white mb-4">
              Detected: {multiplePrediction.digits.length} digit{multiplePrediction.digits.length !== 1 ? 's' : ''}
            </div>
            
            {/* Individual digit confidences */}
            <div className="space-y-3">
              <div className="text-white text-sm font-medium">Individual Confidences:</div>
              {multiplePrediction.digits.map((digit, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-gray-300">Position {index + 1} (Digit {digit}):</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.round(multiplePrediction.confidences[index] * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm w-10">
                      {Math.round(multiplePrediction.confidences[index] * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Average confidence */}
            <div className="mt-4 pt-4 border-t border-gray-700">
              <div className="text-white">
                Average Confidence: {averageConfidence}%
              </div>
              <div className="mt-2 w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    averageConfidence >= 85 ? 'bg-green-500' :
                    averageConfidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${averageConfidence}%` }}
                ></div>
              </div>
            </div>
          </div>
          
          {prediction.processing_time && (
            <div className="flex justify-center items-center space-x-4 text-xs text-gray-400">
              <div>⚡ {Math.round(prediction.processing_time * 1000)}ms</div>
              <div>🔍 {multiplePrediction.digits.length} segments</div>
              {prediction.model_version && (
                <div>🧠 Model v{prediction.model_version}</div>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
} 