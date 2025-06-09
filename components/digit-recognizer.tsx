"use client"

import type React from "react"

import { useRef, useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { API_ENDPOINTS, APP_CONFIG } from "@/constants"

interface Prediction {
  digit: number
  confidence: number
  alternatives: Array<{ digit: number; confidence: number }>
  boundingBox: { x: number; y: number; width: number; height: number }
  preprocessed_image?: string
}

export default function DigitRecognizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [mode, setMode] = useState<"single" | "multi">("single")
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(APP_CONFIG.DEFAULT_BRUSH_SIZE);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      if (context) {
        context.lineWidth = brushSize
        context.lineCap = "round"
        context.lineJoin = "round"
        context.strokeStyle = "black"
        setCtx(context)

        // Clear canvas initially
        context.fillStyle = "white"
        context.fillRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, []) // Initial setup
  
  // Update brush size when it changes
  useEffect(() => {
    if (ctx) {
      ctx.lineWidth = brushSize;
    }
  }, [brushSize, ctx])

  // Drawing handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)

    if (ctx) {
      ctx.beginPath()

      // Get coordinates
      const coordinates = getCoordinates(e)
      if (coordinates) {
        ctx.moveTo(coordinates.x, coordinates.y)
      }
    }
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !ctx) return

    // Prevent scrolling on touch devices
    e.preventDefault()

    // Get coordinates
    const coordinates = getCoordinates(e)
    if (coordinates) {
      ctx.lineTo(coordinates.x, coordinates.y)
      ctx.stroke()
    }
  }

  const stopDrawing = () => {
    if (isDrawing && ctx) {
      ctx.closePath()
      setIsDrawing(false)

      // Predict after drawing stops
      if (mode === "single") {
        predictSingleDigit()
      } else {
        predictMultipleDigits()
      }
    }
  }

  // Get coordinates from mouse or touch event
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return null

    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()

    let clientX, clientY

    // Check if it's a touch event
    if ("touches" in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  // Clear the canvas
  const clearCanvas = () => {
    if (ctx && canvasRef.current) {
      ctx.fillStyle = "white"
      ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      setPredictions([])
      setError(null);
    }
  }

  // Preprocess the canvas data and make a prediction for a single digit
  const predictSingleDigit = async () => {
    if (!canvasRef.current) return;
    setLoading(true);
    setError(null);
    try {
      // Convert the canvas to a Blob (PNG image)
      const canvas = canvasRef.current;
      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) {
        throw new Error("Failed to convert canvas to image");
      }

      // Send the image to the backend API
      const formData = new FormData();
      formData.append("file", blob, "digit.png");

      const response = await fetch(API_ENDPOINTS.PREDICT, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Prediction request failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      // Check if the response has the expected format
      if (!result.success && !result.digit) {
        throw new Error("Invalid response format from server");
      }
      
      setPredictions([
        {
          digit: result.digit,
          confidence: result.confidence * 100, // backend returns [0,1], convert to percent
          alternatives: result.alternatives || [], // Use alternatives from backend if available
          boundingBox: { x: 0, y: 0, width: canvas.width, height: canvas.height },
          preprocessed_image: result.preprocessed_image
        },
      ]);
    } catch (error) {
      console.error("Prediction error:", error);
      setError(`Failed to fetch prediction: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure the backend is running.`);
      setPredictions([]);
      
      // Auto-retry once after a short delay if it's likely a temporary issue
      if (retryCount < 1) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          predictSingleDigit();
        }, 1500);
      }
    } finally {
      if (retryCount >= 1) {
        setRetryCount(0); // Reset retry count after successful attempt or max retries
      }
      setLoading(false);
    }
  }

  // Segment and predict multiple digits
  const predictMultipleDigits = async () => {
    if (!canvasRef.current) return;
    setLoading(true);
    setError(null);
    try {
      // Convert the canvas to a Blob (PNG image)
      const canvas = canvasRef.current;
      const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
      if (!blob) {
        throw new Error("Failed to convert canvas to image");
      }

      // Send the image to the backend API
      const formData = new FormData();
      formData.append("file", blob, "digits.png");

      const response = await fetch(API_ENDPOINTS.PREDICT_MULTI, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`Multi-digit prediction request failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      
      // Check if the response has the expected format
      if (!result.success) {
        throw new Error("Invalid response format from server");
      }
      
      if (result.predictions.length === 0) {
        setError("No digits detected in the image. Try drawing clearer digits.");
      }
      
      setPredictions(result.predictions);
    } catch (error) {
      console.error("Prediction error:", error);
      setError(`Failed to fetch multi-digit prediction: ${error instanceof Error ? error.message : 'Unknown error'}. Please ensure the backend is running.`);
      setPredictions([]);
      
      // Auto-retry once after a short delay if it's likely a temporary issue
      if (retryCount < 1) {
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          predictMultipleDigits();
        }, 1500);
      }
    } finally {
      if (retryCount >= 1) {
        setRetryCount(0); // Reset retry count after successful attempt or max retries
      }
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen p-8">
      <Tabs
        defaultValue="single"
        className="w-full mb-8"
        onValueChange={(value) => setMode(value as "single" | "multi")}
      >
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-zinc-900 border-2 border-zinc-800 rounded-lg overflow-hidden">
          <TabsTrigger value="single" className="data-[state=active]:bg-zinc-950 data-[state=active]:text-blue-400 text-zinc-200 font-mono transition">Single Digit</TabsTrigger>
          <TabsTrigger value="multi" className="data-[state=active]:bg-zinc-950 data-[state=active]:text-blue-400 text-zinc-200 font-mono transition">Multiple Digits</TabsTrigger>
        </TabsList>
        <TabsContent value="single" className="mt-4 text-center text-zinc-300 font-mono">
          Draw a single digit (0-9) in the center of the canvas
        </TabsContent>
        <TabsContent value="multi" className="mt-4 text-center text-zinc-300 font-mono">
          Draw multiple digits with some space between them
        </TabsContent>
      </Tabs>

      <div className="flex flex-col md:flex-row gap-12 items-center justify-center w-full bg-zinc-900 py-12 rounded-2xl shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="p-4 bg-zinc-900 rounded-2xl border-2 border-zinc-800 shadow-2xl">
            <div className="bg-white rounded-xl border-4 border-zinc-700 overflow-hidden shadow-2xl">
              <canvas
                ref={canvasRef}
                width={280}
                height={280}
                className="touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
          </div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Digit Recognizer</h2>
            <Button onClick={clearCanvas} variant="outline" size="sm">
              Clear Canvas
            </Button>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-sm font-medium">Brush Size: {brushSize}px</span>
            <div className="flex-1">
              <Slider
                value={[brushSize]}
                min={5}
                max={30}
                step={1}
                onValueChange={(value) => setBrushSize(value[0])}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <Card className="p-6 min-w-[360px] min-h-[360px] flex flex-col items-center justify-center bg-zinc-900 border-2 border-zinc-800 shadow-2xl">
            {loading && (
              <div className="flex flex-col items-center mb-6">
                <div className="mt-2 h-4 w-32 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 animate-pulse"></div>
                </div>
                <span className="mt-2 text-sm text-zinc-400 font-mono">Predicting...</span>
              </div>
            )}
            {error && (
              <div className="text-red-400 text-center mb-6 font-semibold font-mono">{error}</div>
            )}
            {!loading && !error && predictions.length === 0 && (
              <div className="text-zinc-400 text-center font-mono">Draw a digit and prediction will appear here.</div>
            )}
            {predictions.length > 0 && !loading && !error && (
              <div className="w-full">
                <h2 className="text-2xl font-extrabold mb-6 text-center text-zinc-100 tracking-tight font-mono">
                  {mode === "single" ? "Prediction" : "Predictions"}
                </h2>
                <div className={`flex ${mode === "single" ? "flex-row justify-center gap-8" : "flex-wrap justify-center gap-6"} mb-8`}>
                  {predictions.map((pred, index) => (
  <div
    key={index}
    className={`relative ${mode === "single" ? "flex flex-col items-center gap-4" : "flex flex-row items-center gap-8"} p-6 border-2 rounded-xl bg-zinc-950 shadow-lg ${
      pred.confidence < 70 ? "border-yellow-400 bg-yellow-900/40" : "border-zinc-800"
    }`}
    style={mode === "multi" ? {
      boxShadow: pred.boundingBox ? `0 0 0 2px #2563eb, 0 0 8px #2563eb88` : undefined
    } : {}}
  >
    {pred.preprocessed_image && (
      <div className="flex flex-col items-center justify-center mb-4">
        <div className="relative">
          <img
            src={`data:image/png;base64,${pred.preprocessed_image}`}
            alt="Preprocessed Digit"
            className="w-20 h-20 rounded-lg bg-zinc-800 border border-zinc-700 shadow-lg"
            style={{objectFit: "contain"}}
          />
          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-xs text-zinc-400 font-mono">Model Input</span>
        </div>
      </div>
    )}
    <div className="flex flex-col items-center">
      <span className="text-8xl font-extrabold text-zinc-100 drop-shadow-lg font-mono">{pred.digit}</span>
      <span className="text-lg text-zinc-400 mt-2 font-mono">{pred.confidence.toFixed(1)}%</span>
      {pred.confidence < 70 && (
        <Badge variant="outline" className="mt-2 bg-yellow-200 text-yellow-900 border-yellow-400 font-semibold font-mono">
          Low confidence
        </Badge>
      )}
      {mode === "multi" && pred.boundingBox && (
        <span className="mt-2 text-sm text-blue-400 bg-zinc-800/80 px-3 py-1 rounded shadow font-mono">
          x:{pred.boundingBox.x}, y:{pred.boundingBox.y}
        </span>
      )}
    </div>
  </div>
))}
                </div>
              </div>
            )}

            {predictions.some(pred => pred.alternatives && pred.alternatives.length > 0) && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-400 font-mono">Alternative interpretations:</h3>
                {predictions.map((pred, predIndex) => (
                  pred.alternatives && pred.alternatives.length > 0 && (
                    <div key={predIndex} className="border border-zinc-800 rounded-lg p-4 bg-zinc-900">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl font-bold text-zinc-100 font-mono">{pred.digit}</span>
                        <span className="text-sm text-zinc-400 font-mono">could also be:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {pred.alternatives.map((alt, altIndex) => (
                          <Badge key={altIndex} variant="secondary" className="text-sm bg-zinc-700 text-zinc-100 font-mono">
                            {alt.digit} ({alt.confidence.toFixed(1)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
