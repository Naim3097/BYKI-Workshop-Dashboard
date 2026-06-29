'use client'

// Generative honeycomb backdrop — the MNA storefront's signature texture, ported
// from the static site's vanilla script to a React client component.

import { useEffect, useRef } from 'react'

const MASK =
  'linear-gradient(180deg,#000 0%,rgba(0,0,0,.62) 24%,rgba(0,0,0,.4) 48%,rgba(0,0,0,.36) 76%,rgba(0,0,0,.5) 100%)'

export function Honeycomb() {
  const ref = useRef<SVGSVGElement>(null)

  useEffect(() => {
    const svg = ref.current
    if (!svg) return

    function hexPoints(cx: number, cy: number, R: number) {
      let p = ''
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 180) * (60 * i - 90)
        p += (cx + R * Math.cos(a)).toFixed(1) + ',' + (cy + R * Math.sin(a)).toFixed(1) + ' '
      }
      return p.trim()
    }

    function build() {
      if (!svg) return
      const W = window.innerWidth
      const H = window.innerHeight
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H)
      const R = Math.max(38, Math.min(58, W / 22))
      const dx = Math.sqrt(3) * R
      const dy = 1.5 * R
      const cols = Math.ceil(W / dx) + 2
      const rows = Math.ceil(H / dy) + 2
      let fills = '',
        glow = '',
        edges = ''
      for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
          const cx = col * dx + (row & 1 ? dx / 2 : 0)
          const cy = row * dy
          const pts = hexPoints(cx, cy, R - 1.5)
          const t = Math.max(0, Math.min(1, cy / H))
          let light = 13 - t * 8
          const rnd = Math.random()
          light += (rnd - 0.5) * 3.5
          if (rnd > 0.94) light += 6
          light = Math.max(4, Math.min(19, light))
          const sat = 52 + (rnd > 0.94 ? 10 : 0)
          fills += '<polygon points="' + pts + '" fill="hsl(217,' + sat + '%,' + light.toFixed(0) + '%)"/>'
          const ge = 0.045 + (rnd > 0.88 ? 0.05 : 0)
          glow += '<polygon points="' + pts + '" fill="none" stroke="#4ec5f5" stroke-width="3" opacity="' + ge.toFixed(3) + '"/>'
          const ce = 0.11 + Math.random() * 0.1
          edges += '<polygon points="' + pts + '" fill="none" stroke="#34b9f0" stroke-width="1" opacity="' + ce.toFixed(2) + '"/>'
        }
      }
      svg.innerHTML =
        '<rect width="100%" height="100%" fill="#050b1c"/>' +
        '<g>' + fills + '</g>' +
        '<g>' + glow + '</g>' +
        '<g>' + edges + '</g>'
    }

    build()
    let timer: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(timer)
      timer = setTimeout(build, 220)
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <svg
      ref={ref}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
      className="pointer-events-none fixed inset-0 block h-full w-full"
      style={{ zIndex: -3, opacity: 0.6, maskImage: MASK, WebkitMaskImage: MASK }}
    />
  )
}
