import React from 'react'

export default function Header() {
  return (
    <header className="text-center">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
          🔢 Digit Classifier
        </h1>
        <p className="text-xl text-white mb-2">
          Deep Learning Powered Recognition
        </p>
        <p className="text-gray-300 max-w-2xl mx-auto">
          A sophisticated deep learning web application for real-time handwritten digit recognition.
          Draw digits and watch AI predict them with confidence scores.
        </p>
        
        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          <span className="bg-white/10 text-white px-3 py-1 rounded-full text-sm border border-white/30">
            Real-time Recognition
          </span>
          <span className="bg-white/10 text-white px-3 py-1 rounded-full text-sm border border-white/30">
            High Accuracy
          </span>
          <span className="bg-white/10 text-white px-3 py-1 rounded-full text-sm border border-white/30">
            Multiple Modes
          </span>
        </div>
      </div>
    </header>
  )
} 