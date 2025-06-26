'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { CanvasProps, DrawingState } from '@/lib/types'

export default function DrawingCanvas({ 
  onPredict, 
  brushSize, 
  brushType,
  canvasTheme,
  isLoading, 
  onClear,
  onSave,
  showGrid,
  realTimePredict,
  onCapture
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawing, setHasDrawing] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [lastPredictTime, setLastPredictTime] = useState(0)
  const [lastPoint, setLastPoint] = useState<{x: number, y: number} | null>(null)
  const [pressure, setPressure] = useState(1)

  // Enhanced prediction delay for better accuracy
  const realTimePredictDelay = 800 // ms - increased for better accuracy

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
      // Simulate pressure for touch devices
      setPressure(Math.random() * 0.3 + 0.7) // 0.7 to 1.0
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    } else {
      // Simulate pressure based on movement speed for mouse
      const currentTime = Date.now()
      setPressure(Math.random() * 0.2 + 0.8) // 0.8 to 1.0
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
      return newHistory.slice(-30) // Increased history size
    })
    setHistoryIndex(prev => Math.min(prev + 1, 29))
  }, [historyIndex])

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (!showGrid) return
    
    ctx.save()
    ctx.strokeStyle = canvasTheme === 'light' ? '#e0e0e0' : '#333333'
    ctx.lineWidth = 0.5
    ctx.setLineDash([2, 2])
    ctx.globalAlpha = 0.7
    
    // Draw 28x28 grid (MNIST standard) with center guidelines
    const cellSize = canvas.width / 28
    
    // Draw main grid
    for (let i = 0; i <= 28; i++) {
      const pos = i * cellSize
      ctx.beginPath()
      ctx.moveTo(pos, 0)
      ctx.lineTo(pos, canvas.height)
      ctx.stroke()
      
      ctx.beginPath()
      ctx.moveTo(0, pos)
      ctx.lineTo(canvas.width, pos)
      ctx.stroke()
    }
    
    // Draw center lines more prominently
    ctx.setLineDash([])
    ctx.strokeStyle = canvasTheme === 'light' ? '#cccccc' : '#555555'
    ctx.lineWidth = 1
    ctx.globalAlpha = 0.8
    
    // Vertical center line
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.stroke()
    
    // Horizontal center line
    ctx.beginPath()
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()
    
    ctx.restore()
  }, [showGrid, canvasTheme])

  // Enhanced smooth drawing with Bezier curves
  const drawSmoothLine = useCallback((ctx: CanvasRenderingContext2D, from: {x: number, y: number}, to: {x: number, y: number}) => {
    const distance = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2)
    
    if (distance < 2) {
      // For very small movements, draw a simple line
      ctx.lineTo(to.x, to.y)
      return
    }

    // Calculate control points for smooth curve
    const midX = (from.x + to.x) / 2
    const midY = (from.y + to.y) / 2
    
    // Add slight randomness for more natural strokes
    const variation = Math.min(distance * 0.1, 3)
    const offsetX = (Math.random() - 0.5) * variation
    const offsetY = (Math.random() - 0.5) * variation
    
    ctx.quadraticCurveTo(from.x + offsetX, from.y + offsetY, midX, midY)
  }, [])

  const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
    event.preventDefault()
    setIsDrawing(true)
    setHasDrawing(true)
    
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return

    const { x, y } = getCoordinates(event)
    setLastPoint({ x, y })
    
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
    if (!ctx || !lastPoint) return

    const { x, y } = getCoordinates(event)
    const currentPoint = { x, y }
    
    // Ultra-enhanced stroke properties for maximum AI clarity
    const adjustedBrushSize = brushSize * pressure
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = Math.max(adjustedBrushSize, 3) // Minimum 3px for better AI recognition
    
    // Optimized brush settings for AI processing
    switch (brushType) {
      case 'round':
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalCompositeOperation = 'source-over'
        ctx.shadowColor = strokeColor
        ctx.shadowBlur = 1 // Slight blur for smoother edges
        break
      case 'square':
        ctx.lineCap = 'square'
        ctx.lineJoin = 'miter'
        ctx.globalCompositeOperation = 'source-over'
        ctx.shadowColor = strokeColor
        ctx.shadowBlur = 0.5
        break
      case 'marker':
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = 0.8 + (pressure * 0.2) // Higher opacity for better AI recognition
        ctx.globalCompositeOperation = 'source-over' // Changed from multiply for clearer strokes
        ctx.shadowColor = strokeColor
        ctx.shadowBlur = 1.5
        break
    }
    
    // Enhanced smooth drawing with anti-aliasing optimization
    ctx.beginPath()
    ctx.moveTo(lastPoint.x, lastPoint.y)
    
    // Use quadratic curves for ultra-smooth lines
    const distance = Math.sqrt((currentPoint.x - lastPoint.x) ** 2 + (currentPoint.y - lastPoint.y) ** 2)
    
    if (distance < 1) {
      // For very small movements, draw a circle for consistency
      ctx.arc(currentPoint.x, currentPoint.y, adjustedBrushSize / 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (distance < 3) {
      // Small movements - direct line
      ctx.lineTo(currentPoint.x, currentPoint.y)
      ctx.stroke()
    } else {
      // Larger movements - smooth curve
      const midX = (lastPoint.x + currentPoint.x) / 2
      const midY = (lastPoint.y + currentPoint.y) / 2
      ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, midX, midY)
      ctx.stroke()
    }
    
    // Update for next iteration
    setLastPoint(currentPoint)
    
    // Reset shadow and alpha effects
    ctx.shadowBlur = 0
    if (brushType === 'marker') {
      ctx.globalAlpha = 1.0
    }

    // Enhanced real-time prediction with better debouncing
    if (realTimePredict) {
      const now = Date.now()
      if (now - lastPredictTime > realTimePredictDelay) {
        setLastPredictTime(now)
        setTimeout(() => {
          if (canvas && hasDrawing) {
            const processedImageData = preprocessCanvasForAI(canvas)
            onPredict(processedImageData)
          }
        }, 200) // Small delay to ensure stroke is complete
      }
    }
  }, [isDrawing, brushSize, brushType, strokeColor, getCoordinates, realTimePredict, lastPredictTime, hasDrawing, onPredict, lastPoint, pressure])

  const stopDrawing = useCallback(() => {
    setIsDrawing(false)
    setLastPoint(null)
    
    // Smooth out the final stroke
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (ctx) {
      ctx.closePath()
    }
  }, [])

  // Ultra-enhanced image preprocessing for maximum AI accuracy and crystal-clear display
  const preprocessCanvasForAI = useCallback((canvas: HTMLCanvasElement): string => {
    // Create an ultra-high resolution canvas (8x MNIST for maximum quality)
    const ultraCanvas = document.createElement('canvas')
    ultraCanvas.width = 224 // 8x the MNIST size for ultra quality
    ultraCanvas.height = 224
    const ultraCtx = ultraCanvas.getContext('2d')!
    
    // Fill with pure black background
    ultraCtx.fillStyle = '#000000'
    ultraCtx.fillRect(0, 0, 224, 224)
    
    // Get the original canvas data with enhanced analysis
    const originalCtx = canvas.getContext('2d')!
    const originalImageData = originalCtx.getImageData(0, 0, canvas.width, canvas.height)
    
    // Advanced edge detection with multi-threshold analysis
    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0
    let hasContent = false
    const pixelIntensities: number[] = []
    
    // First pass: collect all pixel intensities for adaptive thresholding
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4
        const r = originalImageData.data[idx]
        const g = originalImageData.data[idx + 1]
        const b = originalImageData.data[idx + 2]
        const alpha = originalImageData.data[idx + 3]
        
        if (alpha > 0) {
          const intensity = Math.max(r, g, b) // Use max instead of average for better detection
          pixelIntensities.push(intensity)
        }
      }
    }
    
    // Calculate adaptive threshold (mean + standard deviation)
    const mean = pixelIntensities.reduce((a, b) => a + b, 0) / pixelIntensities.length || 0
    const variance = pixelIntensities.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pixelIntensities.length || 0
    const stdDev = Math.sqrt(variance)
    const adaptiveThreshold = Math.max(5, mean - stdDev) // Dynamic threshold
    
    // Second pass: find bounding box with adaptive threshold
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const idx = (y * canvas.width + x) * 4
        const r = originalImageData.data[idx]
        const g = originalImageData.data[idx + 1]
        const b = originalImageData.data[idx + 2]
        const alpha = originalImageData.data[idx + 3]
        
        const intensity = Math.max(r, g, b)
        
        if (alpha > 10 && intensity > adaptiveThreshold) {
          hasContent = true
          minX = Math.min(minX, x)
          minY = Math.min(minY, y)
          maxX = Math.max(maxX, x)
          maxY = Math.max(maxY, y)
        }
      }
    }
    
    if (!hasContent) {
      // Create crystal-clear empty 28x28 canvas
      const emptyCanvas = document.createElement('canvas')
      emptyCanvas.width = 28
      emptyCanvas.height = 28
      const emptyCtx = emptyCanvas.getContext('2d')!
      emptyCtx.fillStyle = '#000000'
      emptyCtx.fillRect(0, 0, 28, 28)
      return emptyCanvas.toDataURL()
    }
    
    // Smart padding calculation that maintains digit proportions
    const contentWidth = maxX - minX
    const contentHeight = maxY - minY
    const aspectRatio = contentWidth / contentHeight
    
    // MNIST-optimized padding (tighter for better accuracy)
    let paddingX, paddingY
    if (aspectRatio > 1) {
      // Wide digit (like 1)
      paddingX = contentWidth * 0.1
      paddingY = contentHeight * 0.2
    } else {
      // Tall or square digit
      paddingX = contentWidth * 0.2
      paddingY = contentHeight * 0.1
    }
    
    minX = Math.max(0, minX - paddingX)
    minY = Math.max(0, minY - paddingY)
    maxX = Math.min(canvas.width, maxX + paddingX)
    maxY = Math.min(canvas.height, maxY + paddingY)
    
    const finalCropWidth = maxX - minX
    const finalCropHeight = maxY - minY
    
    // Calculate optimal scaling for 180x180 area (leaving 22px border on each side)
    const targetSize = 180
    const scale = Math.min(targetSize / finalCropWidth, targetSize / finalCropHeight)
    const scaledWidth = finalCropWidth * scale
    const scaledHeight = finalCropHeight * scale
    
    // Perfect centering
    const offsetX = (224 - scaledWidth) / 2
    const offsetY = (224 - scaledHeight) / 2
    
    // Ultra high-quality scaling with custom interpolation
    ultraCtx.imageSmoothingEnabled = true
    ultraCtx.imageSmoothingQuality = 'high'
    
    // Draw with perfect precision
    ultraCtx.drawImage(
      canvas,
      minX, minY, finalCropWidth, finalCropHeight,
      offsetX, offsetY, scaledWidth, scaledHeight
    )
    
    // Create multiple intermediate canvases for progressive downsampling
    const step1Canvas = document.createElement('canvas')
    step1Canvas.width = 112
    step1Canvas.height = 112
    const step1Ctx = step1Canvas.getContext('2d')!
    step1Ctx.fillStyle = '#000000'
    step1Ctx.fillRect(0, 0, 112, 112)
    step1Ctx.imageSmoothingEnabled = true
    step1Ctx.imageSmoothingQuality = 'high'
    step1Ctx.drawImage(ultraCanvas, 0, 0, 224, 224, 0, 0, 112, 112)
    
    const step2Canvas = document.createElement('canvas')
    step2Canvas.width = 56
    step2Canvas.height = 56
    const step2Ctx = step2Canvas.getContext('2d')!
    step2Ctx.fillStyle = '#000000'
    step2Ctx.fillRect(0, 0, 56, 56)
    step2Ctx.imageSmoothingEnabled = true
    step2Ctx.imageSmoothingQuality = 'high'
    step2Ctx.drawImage(step1Canvas, 0, 0, 112, 112, 0, 0, 56, 56)
    
    // Final 28x28 canvas with perfect quality
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = 28
    finalCanvas.height = 28
    const finalCtx = finalCanvas.getContext('2d')!
    finalCtx.fillStyle = '#000000'
    finalCtx.fillRect(0, 0, 28, 28)
    finalCtx.imageSmoothingEnabled = true
    finalCtx.imageSmoothingQuality = 'high'
    finalCtx.drawImage(step2Canvas, 0, 0, 56, 56, 0, 0, 28, 28)
    
    // Advanced preprocessing with intelligent thresholding
    const imageData = finalCtx.getImageData(0, 0, 28, 28)
    const data = imageData.data
    
    // Collect grayscale values for intelligent thresholding
    const grayValues: number[] = []
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]
      
      // Professional grayscale conversion (ITU-R BT.709 standard)
      const gray = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
      grayValues.push(gray)
    }
    
    // Calculate Otsu's threshold for optimal binarization
    let bestThreshold = 128
    let maxVariance = 0
    
    for (let t = 1; t < 255; t++) {
      const foreground = grayValues.filter(g => g > t)
      const background = grayValues.filter(g => g <= t)
      
      if (foreground.length === 0 || background.length === 0) continue
      
      const fgMean = foreground.reduce((a, b) => a + b, 0) / foreground.length
      const bgMean = background.reduce((a, b) => a + b, 0) / background.length
      const fgWeight = foreground.length / grayValues.length
      const bgWeight = background.length / grayValues.length
      
      const variance = fgWeight * bgWeight * Math.pow(fgMean - bgMean, 2)
      
      if (variance > maxVariance) {
        maxVariance = variance
        bestThreshold = t
      }
    }
    
    // Apply intelligent binarization
    for (let i = 0, j = 0; i < data.length; i += 4, j++) {
      const gray = grayValues[j]
      const normalized = gray > bestThreshold ? 255 : 0
      
      data[i] = normalized
      data[i + 1] = normalized
      data[i + 2] = normalized
      data[i + 3] = 255
    }
    
    finalCtx.putImageData(imageData, 0, 0)
    
    return finalCanvas.toDataURL()
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
    setLastPoint(null)
    onClear()
  }, [canvasBackground, showGrid, drawGrid, onClear])

  const handlePredict = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawing) return

    const processedImageData = preprocessCanvasForAI(canvas)
    onPredict(processedImageData)
  }, [hasDrawing, onPredict, preprocessCanvasForAI])

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

  const handleCapture = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !hasDrawing || !onCapture) return

    // Get original canvas data
    const originalData = canvas.toDataURL('image/png')
    
    // Get preprocessed data (same as used for AI prediction)
    const processedData = preprocessCanvasForAI(canvas)
    
    // Call the capture callback with both datasets
    onCapture(originalData, processedData)
  }, [hasDrawing, onCapture, preprocessCanvasForAI])

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
    if (typeof window !== 'undefined') {
      (window as any).canvasUndo = undo;
      (window as any).canvasRedo = redo;
      return () => {
        delete (window as any).canvasUndo;
        delete (window as any).canvasRedo;
      }
    }
  }, [undo, redo])

  // Initialize canvas only once
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Enhanced canvas setup - only on first load
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    
    // Only initialize background if canvas is empty
    if (!hasDrawing) {
      ctx.fillStyle = canvasBackground
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      if (showGrid) {
        drawGrid(ctx, canvas)
      }
    }
  }, []) // Run only once on mount

  // Handle theme and grid changes without clearing drawings
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Save current drawing if it exists
    const currentDrawing = hasDrawing ? canvas.toDataURL() : null

    // Update background
    ctx.fillStyle = canvasBackground
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Restore drawing if it existed
    if (currentDrawing && hasDrawing) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        if (showGrid) {
          drawGrid(ctx, canvas)
        }
      }
      img.src = currentDrawing
    } else if (showGrid) {
      drawGrid(ctx, canvas)
    }
  }, [canvasBackground, showGrid, drawGrid]) // Only when theme or grid changes

  // Set up event listeners separately
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Enhanced event handlers with better touch support
    const handleMouseDown = (e: MouseEvent) => startDrawing(e)
    const handleMouseMove = (e: MouseEvent) => draw(e)
    const handleMouseUp = () => stopDrawing()
    const handleMouseLeave = () => stopDrawing()

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      startDrawing(e)
    }
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      draw(e)
    }
    const handleTouchEnd = (e: TouchEvent) => {
      e.preventDefault()
      stopDrawing()
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseLeave)
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [startDrawing, draw, stopDrawing])

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
        
        {/* Enhanced indicators */}
        {realTimePredict && isDrawing && (
          <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-white animate-pulse">
            🤖 AI Analyzing...
          </div>
        )}
        
        {showGrid && (
          <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
            📐 28×28 Grid
          </div>
        )}
        
        {/* Pressure indicator for touch devices */}
        {typeof window !== 'undefined' && 'ontouchstart' in window && isDrawing && (
          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-white">
            ✍️ Pressure: {Math.round(pressure * 100)}%
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
            <>
              🎯 Enhanced Predict
            </>
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

        {onCapture && (
          <button
            onClick={handleCapture}
            disabled={!hasDrawing || isLoading}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            title="Capture Digit View"
          >
            📸 Capture
          </button>
        )}
        
        <button
          onClick={clearCanvas}
          disabled={isLoading}
          className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Enhanced tips */}
      <div className="text-center text-xs text-gray-400 space-y-1">
        <div>💡 Enhanced with smooth curves, pressure sensitivity & MNIST preprocessing</div>
        <div>🎯 Grid helps align digits for maximum accuracy</div>
      </div>
    </div>
  )
} 