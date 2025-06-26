import React from 'react'
import { StatisticsProps } from '../lib/types'

export default function Statistics({ 
  totalDrawings, 
  averageConfidence, 
  mostPredictedDigit, 
  predictions 
}: StatisticsProps) {
  const successfulPredictions = predictions.filter(p => p.success).length
  const successRate = totalDrawings > 0 ? Math.round((successfulPredictions / totalDrawings) * 100) : 0
  
  // Calculate digit distribution
  const digitCounts = Array(10).fill(0)
  predictions.forEach(p => {
    if (p.success && p.prediction) {
      if (p.mode === 'single') {
        const digit = (p.prediction as any).digit
        if (digit >= 0 && digit <= 9) digitCounts[digit]++
      } else {
        const digits = (p.prediction as any).digits || []
        digits.forEach((digit: number) => {
          if (digit >= 0 && digit <= 9) digitCounts[digit]++
        })
      }
    }
  })

  const maxCount = Math.max(...digitCounts)

  return (
    <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        📊 Statistics & Insights
      </h3>

      {totalDrawings === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-gray-400">
            Start drawing to see your statistics and insights!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{totalDrawings}</div>
              <div className="text-sm text-gray-300">Total Drawings</div>
              <div className="text-xs text-gray-400 mt-1">All time</div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{successRate}%</div>
              <div className="text-sm text-gray-300">Success Rate</div>
              <div className="text-xs text-gray-400 mt-1">{successfulPredictions}/{totalDrawings} successful</div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{Math.round(averageConfidence)}%</div>
              <div className="text-sm text-gray-300">Avg Confidence</div>
              <div className="text-xs text-gray-400 mt-1">Prediction accuracy</div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{mostPredictedDigit}</div>
              <div className="text-sm text-gray-300">Most Drawn</div>
              <div className="text-xs text-gray-400 mt-1">Favorite digit</div>
            </div>
          </div>

          {/* Digit Distribution Chart */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Digit Distribution</h4>
            <div className="space-y-2">
              {digitCounts.map((count, digit) => (
                <div key={digit} className="flex items-center space-x-3">
                  <div className="w-4 text-sm text-gray-300">{digit}</div>
                  <div className="flex-1 bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-white h-full rounded-full transition-all duration-500"
                      style={{ width: maxCount > 0 ? `${(count / maxCount) * 100}%` : '0%' }}
                    ></div>
                  </div>
                  <div className="w-8 text-xs text-gray-400">{count}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Insights */}
          <div className="bg-gray-800/30 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">💡 Insights</h4>
            <div className="space-y-2 text-sm text-gray-300">
              {averageConfidence >= 90 && (
                <div className="flex items-start space-x-2">
                  <span className="text-green-400">🔥</span>
                  <span>Excellent drawing quality! Your digits are very recognizable.</span>
                </div>
              )}
              
              {averageConfidence < 70 && totalDrawings >= 3 && (
                <div className="flex items-start space-x-2">
                  <span className="text-yellow-400">💡</span>
                  <span>Try drawing larger, clearer digits for better recognition.</span>
                </div>
              )}

              {digitCounts.filter(c => c === 0).length <= 3 && totalDrawings >= 10 && (
                <div className="flex items-start space-x-2">
                  <span className="text-blue-400">🌟</span>
                  <span>Great variety! You've drawn most digits at least once.</span>
                </div>
              )}

              {successRate === 100 && totalDrawings >= 5 && (
                <div className="flex items-start space-x-2">
                  <span className="text-purple-400">🏆</span>
                  <span>Perfect success rate! You're a digit drawing master!</span>
                </div>
              )}

              {totalDrawings >= 20 && (
                <div className="flex items-start space-x-2">
                  <span className="text-orange-400">🎖️</span>
                  <span>Dedicated user! You've made {totalDrawings} drawings.</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="text-center text-xs text-gray-400">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  )
} 