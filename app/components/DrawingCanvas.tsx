'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { CanvasProps, DrawingState } from '../lib/types'

export default function DrawingCanvas({ 
  onPredict, 
  brushSize, 
  brushType,
  canvasTheme,
  isLoading, 
  onClear,
  onSave,
  showGrid,
  realTimePredict
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawing, setHasDrawing] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [lastPredictTime, setLastPredictTime] = useState(0)

  // Debounced real-time prediction
  const realTimePredictDelay = 500 // ms

  const canvasBackground = useMemo(() => {
    switch (canvasTheme) {
      case 'light': return '#ffffff'
      case 'grid': return '#000000'
      default: return '#000000'
    }
  }, [canvasTheme])

  const strokeColor = useMemo(() => {
    switch (canvasTheme) {
      case 'light': return '#000000'
      default: return '#ffffff'
    }
  }, [canvasTheme])

  const getCoordinates = useCallback((event: MouseEvent | TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in event) {
      const touch = event.touches[0] || event.changedTouches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    } else {
      return {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
      }
    }
  }, [])

  const saveToHistory = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const imageData = canvas.toDataURL()
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(imageData)
      return newHistory.slice(-20) // Keep last 20 states
    })
    setHistoryIndex(prev => Math.min(prev + 1, 19))
  }, [historyIndex])

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!showGrid) return
    
    ctx.strokeStyle = '#333333'
    ctx.lineWidth = 0.5
    ctx.setLineDash([2, 2])
    
    // Draw grid lines every 40px
    for (let x = 0; x <= canvas.width; x += 40) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    
    for (let y = 0; y <= canvas.height; y += 40) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    
    ctx.setLineDash([])
  }, [showGrid])

  const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    event.preventDefault()
    setIsDrawing(true)
    setHasDrawing(true)
    
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(event)
    ctx.beginPath()
    ctx.moveTo(x, y)
    
    // Save state before starting to draw
    saveToHistory()
  }, [getCoordinates, saveToHistory])

  const draw = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDrawing) return
    
    event.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(event)
    
    ctx.lineTo(x, y)
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = brushSize
    
    // Different brush types
    switch (brushType) {
      case 'round':
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        break
      case 'square':
        ctx.lineCap = 'square'
        ctx.lineJoin = 'miter'
        break
      case 'marker':
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = 0.7
        break
    }
    
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(x, y)
    
    // Reset alpha for marker
    if (brushType === 'marker') {
      ctx.globalAlpha = 1.0
    }

    // Real-time prediction with debouncing
    if (realTimePredict) {
      const now = Date.now()
      if (now - lastPredictTime > realTimePredictDelay) {
        setLastPredictTime(now)
        setTimeout(() => {
          if (canvas && hasDrawing) {
            const imageData = canvas.toDataURL('image/png')
            onPredict(imageData)
          }
        }, 100)
      }
    }
  }, [isDrawing, brushSize, brushType, strokeColor, getCoordinates, realTimePredict, lastPredictTime, hasDrawing, onPredict])

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
  }, [])

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    ctx.fillStyle = canvasBackground
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    if (showGrid) {
      drawGrid(ctx, canvas)
    }
    
    setHasDrawing(false)
    setHistory([])
    setHistoryIndex(-1)
    onClear()
  }, [canvasBackground, showGrid, drawGrid, onClear])

  const handlePredict = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawing) return

    const imageData = canvas.toDataURL('image/png')
    onPredict(imageData)
  }, [hasDrawing, onPredict])

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawing) return

    const imageData = canvas.toDataURL('image/png')
    const drawingState: DrawingState = {
      id: Date.now().toString(),
      imageData,
      timestamp: Date.now(),
      mode: 'single' // Will be updated by parent
    }
    onSave(drawingState)
  }, [hasDrawing, onSave])

  const undo = useCallback(() => {
    if (historyIndex <= 0) return
    
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const prevState = history[historyIndex - 1]
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = canvasBackground
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      
      if (showGrid) {
        drawGrid(ctx, canvas)
      }
    }
    img.src = prevState
    
    setHistoryIndex(prev => prev - 1)
    setHasDrawing(historyIndex > 0)
  }, [history, historyIndex, canvasBackground, showGrid, drawGrid])

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const nextState = history[historyIndex + 1]
    const img = new Image()
    img.onload = () => {
      ctx.fillStyle = canvasBackground
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)
      
      if (showGrid) {
        drawGrid(ctx, canvas)
      }
    }
    img.src = nextState
    
    setHistoryIndex(prev => prev + 1)
    setHasDrawing(true)
  }, [history, historyIndex, canvasBackground, showGrid, drawGrid])

  // Expose undo/redo to parent
  useEffect(() => {
    (window as any).canvasUndo = undo;
    (window as any).canvasRedo = redo;
    return () => {
      delete (window as any).canvasUndo;
      delete (window as any).canvasRedo;
    }
  }, [undo, redo])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = canvasBackground
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    if (showGrid) {
      drawGrid(ctx, canvas)
    }

    // Mouse events
    const handleMouseDown = (e: MouseEvent) => startDrawing(e)
    const handleMouseMove = (e: MouseEvent) => draw(e)
    const handleMouseUp = () => stopDrawing()
    const handleMouseLeave = () => stopDrawing()

    // Touch events
    const handleTouchStart = (e: TouchEvent) => startDrawing(e)
    const handleTouchMove = (e: TouchEvent) => draw(e)
    const handleTouchEnd = () => stopDrawing()

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [startDrawing, draw, stopDrawing, canvasBackground, showGrid, drawGrid])

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  return (
    <div className="space-y-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className={`drawing-canvas w-full max-w-md mx-auto block touch-none transition-all duration-300 ${
            canvasTheme === 'light' ? 'border-black' : 'border-white'
          }`}
          style={{ aspectRatio: '1' }}
        />
        
        {/* Real-time prediction indicator */}
        {realTimePredict && isDrawing && (
          <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
            🔍 Real-time
          </div>
        )}
      </div>
      
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={handlePredict}
          disabled={!hasDrawing || isLoading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
              Processing...
            </>
          ) : (
            '🔍 Predict'
          )}
        </button>
        
        <button
          onClick={undo}
          disabled={!canUndo || isLoading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo (Ctrl+Z)"
        >
          ↶ Undo
        </button>
        
        <button
          onClick={redo}
          disabled={!canRedo || isLoading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          title="Redo (Ctrl+Y)"
        >
          ↷ Redo
        </button>
        
        <button
          onClick={handleSave}
          disabled={!hasDrawing || isLoading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save Drawing"
        >
          💾 Save
        </button>
        
        <button
          onClick={clearCanvas}
          disabled={isLoading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Quick actions hint */}
      <div className="text-center text-xs text-gray-400">
        💡 Press Ctrl+Z to undo, Ctrl+Y to redo, Space to predict
      </div>
    </div>
  )
} 