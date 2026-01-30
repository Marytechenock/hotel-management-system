'use client'

import { useRef, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Eraser, Pen } from 'lucide-react'

interface SignaturePadProps {
  value?: string
  onChange: (signatureData: string) => void
  label?: string
  className?: string
}

export function SignaturePad({ value, onChange, label = "Digital Signature", className }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height

    // Set drawing styles
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // Load existing signature if provided
    if (value) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0)
        setIsEmpty(false)
      }
      img.src = value
    }
  }, [value])

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsDrawing(true)
    setIsEmpty(false)

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    let x, y

    if ('touches' in e) {
      e.preventDefault()
      x = e.touches[0].clientX - rect.left
      y = e.touches[0].clientY - rect.top
    } else {
      x = e.clientX - rect.left
      y = e.clientY - rect.top
    }

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    
    // Save the signature as base64
    const canvas = canvasRef.current
    if (canvas) {
      const signatureData = canvas.toDataURL('image/png')
      onChange(signatureData)
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
    onChange('')
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-32 border border-input rounded-md bg-white cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground text-sm">Click and drag to sign</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearSignature}
          className="flex items-center gap-2"
        >
          <Eraser className="size-4" />
          Clear
        </Button>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Pen className="size-3" />
          Use mouse or touch to sign
        </div>
      </div>
    </div>
  )
}
