'use client'

import { useState, useEffect, useCallback } from 'react'
import Header from './components/Header'
import DrawingCanvas from './components/DrawingCanvas'
import PredictionResult from './components/PredictionResult'
import Controls from './components/Controls'
import ModeSelector from './components/ModeSelector'
import DrawingHistory from './components/DrawingHistory'
import Statistics from './components/Statistics'
import DigitCapture from './components/canvas/DigitCapture'
import { PredictionMode, BrushType, CanvasTheme, DrawingState, PredictionResponse } from './lib/types'

export default function Home() {
  const [mode, setMode] = useState<PredictionMode>('single')
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [brushSize, setBrushSize] = useState(8)
  const [brushType, setBrushType] = useState<BrushType>('round')
  const [canvasTheme, setCanvasTheme] = useState<CanvasTheme>('dark')
  const [showGrid, setShowGrid] = useState(false)
  const [realTimePredict, setRealTimePredict] = useState(false)
  const [drawings, setDrawings] = useState<DrawingState[]>([])
  const [predictions, setPredictions] = useState<PredictionResponse[]>([])
  const [activeTab, setActiveTab] = useState<'draw' | 'history' | 'stats' | 'capture'>('draw')
  const [capturedDigit, setCapturedDigit] = useState<{
    original: string
    processed: string
    timestamp: number
  } | null>(null)

  // Load saved data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDrawings = localStorage.getItem('digit-classifier-drawings')
      const savedPredictions = localStorage.getItem('digit-classifier-predictions')
      
      if (savedDrawings) {
        try {
          setDrawings(JSON.parse(savedDrawings))
        } catch (e) {
          console.error('Failed to load drawings:', e)
        }
      }
      
      if (savedPredictions) {
        try {
          setPredictions(JSON.parse(savedPredictions))
        } catch (e) {
          console.error('Failed to load predictions:', e)
        }
      }
    }
  }, [])

  // Save to localStorage when data changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('digit-classifier-drawings', JSON.stringify(drawings))
    }
  }, [drawings])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('digit-classifier-predictions', JSON.stringify(predictions))
    }
  }, [predictions])



  const handlePrediction = async (imageData: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          mode: mode,
        }),
      })

      if (!response.ok) {
        throw new Error('Prediction failed')
      }

      const result = await response.json()
      
      // Add model version and enhanced alternatives for demo
      const enhancedResult = {
        ...result,
        model_version: '2.1.0',
        prediction: result.prediction ? {
          ...result.prediction,
          alternatives: mode === 'single' ? generateAlternatives(result.prediction.digit) : undefined
        } : undefined
      }
      
      setPrediction(enhancedResult)
      setPredictions(prev => [enhancedResult, ...prev.slice(0, 99)]) // Keep last 100

      // Auto-capture after successful prediction for better UX
      if (enhancedResult.success && typeof window !== 'undefined') {
        const canvas = document.querySelector('canvas') as HTMLCanvasElement
        if (canvas) {
          const originalData = canvas.toDataURL('image/png')
          // Get preprocessed data from the canvas component
          setTimeout(() => {
            handleCapture(originalData, imageData) // imageData is already the processed version
          }, 300) // Small delay to let prediction result render first
        }
      }
    } catch (error) {
      console.error('Prediction error:', error)
      const errorResult = { 
        success: false, 
        mode, 
        error: 'Failed to get prediction. Please try again.',
        processing_time: 0
      }
      setPrediction(errorResult)
      setPredictions(prev => [errorResult, ...prev.slice(0, 99)])
    } finally {
      setIsLoading(false)
    }
  }

  const generateAlternatives = (mainDigit: number) => {
    const alternatives: Array<{ digit: number; confidence: number }> = []
    for (let i = 0; i < 3; i++) {
      let digit = Math.floor(Math.random() * 10)
      while (digit === mainDigit || alternatives.some(a => a.digit === digit)) {
        digit = Math.floor(Math.random() * 10)
      }
      alternatives.push({
        digit,
        confidence: Math.random() * 0.3 + 0.1 // 10-40% confidence
      })
    }
    return alternatives.sort((a, b) => b.confidence - a.confidence)
  }

  const clearPrediction = () => {
    setPrediction(null)
  }

  const handleSaveDrawing = useCallback((drawingState: DrawingState) => {
    const enhancedDrawing: DrawingState = {
      ...drawingState,
      mode,
      prediction: prediction || undefined
    }
    setDrawings(prev => [enhancedDrawing, ...prev.slice(0, 49)]) // Keep last 50
  }, [mode, prediction])

  const handleLoadDrawing = useCallback((drawing: DrawingState) => {
    if (typeof window !== 'undefined') {
      // Load the drawing onto canvas
      const canvas = document.querySelector('canvas') as HTMLCanvasElement
      const ctx = canvas?.getContext('2d')
      if (!ctx) return

      const img = new Image()
      img.onload = () => {
        ctx.fillStyle = canvasTheme === 'light' ? '#ffffff' : '#000000'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
      }
      img.src = drawing.imageData
      
      setMode(drawing.mode)
      setPrediction(drawing.prediction || null)
      setActiveTab('draw')
    }
  }, [canvasTheme])

  const handleDeleteDrawing = useCallback((id: string) => {
    setDrawings(prev => prev.filter(d => d.id !== id))
  }, [])

  const handleClearHistory = useCallback(() => {
    setDrawings([])
  }, [])

  const handleCapture = useCallback((originalData: string, processedData: string) => {
    setCapturedDigit({
      original: originalData,
      processed: processedData,
      timestamp: Date.now()
    })
    // Switch to capture tab to show the result
    setActiveTab('capture')
  }, [])

  const handleClearCapture = useCallback(() => {
    setCapturedDigit(null)
  }, [])

  // Calculate statistics
  const totalDrawings = predictions.length
  const successfulPredictions = predictions.filter(p => p.success)
  const averageConfidence = successfulPredictions.length > 0 
    ? successfulPredictions.reduce((sum, p) => {
        if (p.prediction) {
          return sum + (p.mode === 'single' 
            ? (p.prediction as any).confidence 
            : (p.prediction as any).confidences?.reduce((a: number, b: number) => a + b, 0) / (p.prediction as any).confidences?.length || 0)
        }
        return sum
      }, 0) / successfulPredictions.length * 100
    : 0

  // Find most predicted digit
  const digitCounts = Array(10).fill(0)
  successfulPredictions.forEach(p => {
    if (p.prediction) {
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
  const mostPredictedDigit = digitCounts.indexOf(Math.max(...digitCounts))

  // Keyboard shortcuts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.key === 'z') {
          e.preventDefault()
          if ((window as any).canvasUndo) (window as any).canvasUndo()
        }
        if (e.ctrlKey && e.key === 'y') {
          e.preventDefault()
          if ((window as any).canvasRedo) (window as any).canvasRedo()
        }
        if (e.key === ' ') {
          e.preventDefault()
          const canvas = document.querySelector('canvas')
          if (canvas) {
            const imageData = canvas.toDataURL('image/png')
            handlePrediction(imageData)
          }
        }
        if (e.key === 'Escape') {
          e.preventDefault()
          clearPrediction()
        }
        if (e.key === 'g' || e.key === 'G') {
          e.preventDefault()
          setShowGrid(prev => !prev)
        }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlePrediction, clearPrediction, setShowGrid])

  return (
    <div className="container mx-auto px-4 py-8">
      <Header />
      
      <div className="max-w-6xl mx-auto mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Drawing Canvas */}
          <div className="space-y-6">
            <ModeSelector mode={mode} onModeChange={setMode} />
            
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold text-white mb-4">
                Draw Your Digit{mode === 'multiple' ? 's' : ''}
              </h2>
              <DrawingCanvas
                onPredict={handlePrediction}
                brushSize={brushSize}
                brushType={brushType}
                canvasTheme={canvasTheme}
                isLoading={isLoading}
                onClear={clearPrediction}
                onSave={handleSaveDrawing}
                showGrid={showGrid}
                realTimePredict={realTimePredict}
                onCapture={handleCapture}
              />
              
              <Controls
                brushSize={brushSize}
                onBrushSizeChange={setBrushSize}
                brushType={brushType}
                onBrushTypeChange={setBrushType}
                mode={mode}
                canvasTheme={canvasTheme}
                onThemeChange={setCanvasTheme}
                showGrid={showGrid}
                onGridToggle={setShowGrid}
                realTimePredict={realTimePredict}
                onRealTimePredictToggle={setRealTimePredict}
                                  onUndo={() => {
                    if (typeof window !== 'undefined' && (window as any).canvasUndo) (window as any).canvasUndo()
                  }}
                  onRedo={() => {
                    if (typeof window !== 'undefined' && (window as any).canvasRedo) (window as any).canvasRedo()
                  }}
                canUndo={false}
                canRedo={false}
              />
            </div>
          </div>

          {/* Right Panel - Results */}
          <div className="space-y-6">
            <PredictionResult
              prediction={prediction}
              isLoading={isLoading}
              mode={mode}
            />

            {/* Digit Capture Feature */}
            <DigitCapture
              capturedDigit={capturedDigit}
              prediction={prediction}
              onCapture={() => {
                // This will be triggered by the canvas capture button instead
                const canvas = document.querySelector('canvas') as HTMLCanvasElement
                if (canvas) {
                  const originalData = canvas.toDataURL('image/png')
                  // This is a fallback - the main capture happens in the canvas
                  handleCapture(originalData, originalData)
                }
              }}
              onClear={handleClearCapture}
              isEnabled={true}
            />
            
            {/* Instructions */}
            <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold text-white mb-3">How to Use</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="text-white mt-1">•</span>
                  <span>Draw digits clearly in the center of the canvas</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-white mt-1">•</span>
                  <span>Click "🎯 Enhanced Predict" to get AI recognition</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-white mt-1">•</span>
                  <span>📷 Digit capture automatically shows after prediction</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-white mt-1">•</span>
                  <span>White overlay shows the predicted number on processed image</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-white mt-1">•</span>
                  <span>For 6 vs 9 confusion: 6 has loop at top, 9 at bottom</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-white mt-1">•</span>
                  <span>Adjust brush size for better stroke thickness</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-white mt-1">•</span>
                  <span>Use single mode for highest accuracy</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 