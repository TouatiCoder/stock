"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Copy, Check } from "lucide-react"

function hsvToRgb(h: number, s: number, v: number) {
  s /= 100
  v /= 100
  const i = Math.floor(h / 60) % 6
  const f = h / 60 - Math.floor(h / 60)
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  const channels = [
    [v, q, p, p, t, v],
    [t, v, v, q, p, p],
    [p, p, t, v, v, q],
  ]
  return {
    r: Math.round(channels[0][i] * 255),
    g: Math.round(channels[1][i] * 255),
    b: Math.round(channels[2][i] * 255),
  }
}

function rgbToHex(r: number, g: number, b: number) {
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0").toUpperCase()).join("")
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim())
  if (!result) return { h: 0, s: 100, v: 100 }
  let r = parseInt(result[1], 16) / 255
  let g = parseInt(result[2], 16) / 255
  let b = parseInt(result[3], 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(max === 0 ? 0 : (d / max) * 100),
    v: Math.round(max * 100),
  }
}

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

export function ColorPicker({ value, onChange, disabled }: ColorPickerProps) {
  const [hsv, setHsv] = useState(() => hexToHsv(value || "#3B82F6"))
  const [hexInput, setHexInput] = useState(
    (value || "#3B82F6").replace("#", "").toUpperCase()
  )
  const [copied, setCopied] = useState(false)
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
  const [isDraggingHue, setIsDraggingHue] = useState(false)
  const canvasRef = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)
  // Track the last value emitted by this picker to avoid re-syncing our own changes
  const lastEmitted = useRef<string>("")

  useEffect(() => {
    if (value && value.toUpperCase() !== lastEmitted.current.toUpperCase()) {
      const newHsv = hexToHsv(value)
      setHsv(newHsv)
      setHexInput(value.replace("#", "").toUpperCase())
    }
  }, [value])

  const getHex = useCallback((h: number, s: number, v: number) => {
    const { r, g, b } = hsvToRgb(h, s, v)
    return rgbToHex(r, g, b)
  }, [])

  const updateFromCanvas = useCallback(
    (e: MouseEvent | React.MouseEvent, rect: DOMRect) => {
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height))
      const s = Math.round((x / rect.width) * 100)
      const v = Math.round((1 - y / rect.height) * 100)
      const newHsv = { ...hsv, s, v }
      setHsv(newHsv)
      const hex = getHex(newHsv.h, s, v)
      setHexInput(hex.replace("#", ""))
      lastEmitted.current = hex
      onChange(hex)
    },
    [hsv, getHex, onChange]
  )

  const updateFromHue = useCallback(
    (e: MouseEvent | React.MouseEvent, rect: DOMRect) => {
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
      const h = Math.round((x / rect.width) * 360)
      const newHsv = { ...hsv, h }
      setHsv(newHsv)
      const hex = getHex(h, newHsv.s, newHsv.v)
      setHexInput(hex.replace("#", ""))
      lastEmitted.current = hex
      onChange(hex)
    },
    [hsv, getHex, onChange]
  )

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDraggingCanvas(true)
    updateFromCanvas(e, canvasRef.current!.getBoundingClientRect())
  }

  const handleHueMouseDown = (e: React.MouseEvent) => {
    if (disabled) return
    e.preventDefault()
    setIsDraggingHue(true)
    updateFromHue(e, hueRef.current!.getBoundingClientRect())
  }

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDraggingCanvas && canvasRef.current)
        updateFromCanvas(e, canvasRef.current.getBoundingClientRect())
      if (isDraggingHue && hueRef.current)
        updateFromHue(e, hueRef.current.getBoundingClientRect())
    }
    const onUp = () => {
      setIsDraggingCanvas(false)
      setIsDraggingHue(false)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [isDraggingCanvas, isDraggingHue, updateFromCanvas, updateFromHue])

  const handleHexInput = (val: string) => {
    const cleaned = val.replace(/[^0-9a-fA-F]/g, "").slice(0, 6)
    setHexInput(cleaned.toUpperCase())
    if (cleaned.length === 6) {
      const hex = "#" + cleaned
      setHsv(hexToHsv(hex))
      lastEmitted.current = hex
      onChange(hex)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText("#" + hexInput)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const hueColor = `hsl(${hsv.h}, 100%, 50%)`

  return (
    <div className="w-full space-y-3 select-none">
      {/* Gradient canvas */}
      <div
        ref={canvasRef}
        className="relative w-full rounded-lg overflow-hidden"
        style={{
          height: "176px",
          background: `linear-gradient(to bottom, transparent, #000),
                       linear-gradient(to right, #fff, ${hueColor})`,
          cursor: "crosshair",
        }}
        onMouseDown={handleCanvasMouseDown}
      >
        <div
          className="absolute w-5 h-5 rounded-full pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${hsv.s}%`,
            top: `${100 - hsv.v}%`,
            border: "2px solid white",
            boxShadow: "0 0 0 1px rgba(0,0,0,0.35), 0 2px 6px rgba(0,0,0,0.4)",
          }}
        />
      </div>

      {/* Hue slider */}
      <div
        ref={hueRef}
        className="relative w-full rounded-full"
        style={{
          height: "12px",
          background:
            "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)",
          cursor: "pointer",
        }}
        onMouseDown={handleHueMouseDown}
      >
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white pointer-events-none"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            backgroundColor: hueColor,
            boxShadow: "0 0 0 1px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.3)",
          }}
        />
      </div>

      {/* Hex input row */}
      <div className="flex items-center gap-2 border rounded-lg px-3 py-2 bg-background">
        <div
          className="w-7 h-7 rounded-md flex-shrink-0 border"
          style={{ backgroundColor: "#" + hexInput }}
        />
        <span className="text-muted-foreground text-sm font-mono select-none">#</span>
        <input
          type="text"
          value={hexInput}
          onChange={(e) => handleHexInput(e.target.value)}
          disabled={disabled}
          className="flex-1 bg-transparent font-mono text-sm outline-none uppercase min-w-0"
          maxLength={6}
          spellCheck={false}
        />
        <button
          type="button"
          onClick={handleCopy}
          disabled={disabled}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          title="Copy"
        >
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </button>
        <div className="text-xs font-medium border rounded px-2 py-0.5 text-muted-foreground flex-shrink-0">
          Hex
        </div>
      </div>
    </div>
  )
}
