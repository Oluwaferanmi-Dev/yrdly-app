"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface DismissibleBannerProps {
  children: React.ReactNode
  className?: string
  autoDismissDelay?: number
  onDismiss?: () => void
}

export function DismissibleBanner({
  children,
  className = "",
  autoDismissDelay = 4000,
  onDismiss,
}: DismissibleBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss()
    }, autoDismissDelay)

    return () => clearTimeout(timer)
  }, [autoDismissDelay])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX)
    setIsDragging(true)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return
    setCurrentX(e.touches[0].clientX - startX)
  }

  const handleTouchEnd = () => {
    if (!isDragging) return

    // If swiped more than 100px in either direction, dismiss
    if (Math.abs(currentX) > 100) {
      handleDismiss()
    } else {
      // Reset position if not swiped enough
      setCurrentX(0)
    }
    setIsDragging(false)
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX)
    setIsDragging(true)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    setCurrentX(e.clientX - startX)
  }

  const handleMouseUp = () => {
    if (!isDragging) return

    if (Math.abs(currentX) > 100) {
      handleDismiss()
    } else {
      setCurrentX(0)
    }
    setIsDragging(false)
  }

  if (!isVisible) return null

  return (
    <Card
      className={`relative transition-transform duration-200 cursor-grab active:cursor-grabbing ${className}`}
      style={{
        transform: `translateX(${currentX}px)`,
        opacity: isDragging ? Math.max(0.3, 1 - Math.abs(currentX) / 200) : 1,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {children}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 w-6 h-6 opacity-70 hover:opacity-100"
        onClick={handleDismiss}
      >
        <X className="w-4 h-4" />
      </Button>
    </Card>
  )
}
