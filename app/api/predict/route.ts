import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // If we have a backend URL configured, proxy to it
    const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL
    
    if (backendUrl) {
      const response = await fetch(`${backendUrl}/predict`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        throw new Error(`Backend responded with status: ${response.status}`)
      }
      
      const data = await response.json()
      return NextResponse.json(data)
    }
    
    // Fallback: Return a mock response for demonstration when no backend is available
    const mockPrediction = body.mode === 'single' 
      ? {
          digit: Math.floor(Math.random() * 10),
          confidence: 0.85 + Math.random() * 0.15
        }
      : {
          digits: [Math.floor(Math.random() * 10), Math.floor(Math.random() * 10)],
          confidences: [0.85 + Math.random() * 0.15, 0.80 + Math.random() * 0.15],
          sequence: `${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`
        }

    return NextResponse.json({
      success: true,
      mode: body.mode || 'single',
      prediction: mockPrediction,
      processing_time: 0.1 + Math.random() * 0.2
    })
    
  } catch (error) {
    console.error('API Route Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process prediction request',
      prediction: null
    }, { status: 500 })
  }
} 