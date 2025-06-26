'use client'

import React from 'react'

interface SkeletonLoaderProps {
  className?: string
  variant?: 'text' | 'rectangular' | 'circular' | 'image'
  width?: string | number
  height?: string | number
  lines?: number
}

export default function SkeletonLoader({
  className = '',
  variant = 'rectangular',
  width = '100%',
  height = '1rem',
  lines = 1
}: SkeletonLoaderProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-700 via-gray-600 to-gray-700 bg-[length:200%_100%]'
  
  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'rounded h-4'
      case 'circular':
        return 'rounded-full'
      case 'image':
        return 'rounded-lg'
      case 'rectangular':
      default:
        return 'rounded'
    }
  }

  const skeletonStyle = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    animation: 'shimmer 2s ease-in-out infinite',
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${getVariantClasses()}`}
            style={{
              ...skeletonStyle,
              width: index === lines - 1 ? '75%' : width, // Last line is shorter
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${baseClasses} ${getVariantClasses()} ${className}`}
      style={skeletonStyle}
    />
  )
}

// Specialized skeleton components
export const ImageSkeleton = ({ className = '', width = 200, height = 200 }: {
  className?: string
  width?: number
  height?: number
}) => (
  <SkeletonLoader
    variant="image"
    width={width}
    height={height}
    className={className}
  />
)

export const TextSkeleton = ({ 
  lines = 3, 
  className = '' 
}: { 
  lines?: number
  className?: string 
}) => (
  <SkeletonLoader
    variant="text"
    lines={lines}
    className={className}
  />
)

export const CircularSkeleton = ({ 
  size = 40, 
  className = '' 
}: { 
  size?: number
  className?: string 
}) => (
  <SkeletonLoader
    variant="circular"
    width={size}
    height={size}
    className={className}
  />
)

export const CardSkeleton = ({ className = '' }: { className?: string }) => (
  <div className={`bg-gray-800/50 rounded-xl p-4 space-y-3 ${className}`}>
    <SkeletonLoader variant="text" height="1.5rem" width="60%" />
    <SkeletonLoader variant="rectangular" height="8rem" />
    <div className="space-y-2">
      <SkeletonLoader variant="text" height="1rem" />
      <SkeletonLoader variant="text" height="1rem" width="80%" />
    </div>
  </div>
) 