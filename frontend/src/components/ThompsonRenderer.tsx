'use client'

import { useMemo } from 'react'
import type { ThompsonNode } from '@/types/automata'
import { resetRendererIds } from '@/lib/thompsonRenderer/ids'
import { renderThompson } from '@/lib/thompsonRenderer/renderThompson'
import SvgEdge from './SvgEdge'
import SvgStateNode from './SvgStateNode'

type Props = {
  tree: ThompsonNode
}

export default function ThompsonRenderer({ tree }: Props) {
  const fragment = useMemo(() => {
    resetRendererIds()
    return renderThompson(tree, 80, 100)
  }, [tree])

  const nodesById = useMemo(() => {
    return Object.fromEntries(fragment.nodes.map((node) => [node.id, node]))
  }, [fragment.nodes])

  const bounds = useMemo(() => {
    const xs = fragment.nodes.map((node) => node.x)
    const ys = fragment.nodes.map((node) => node.y)

    const minNodeX = Math.min(...xs)
    const maxNodeX = Math.max(...xs)
    const minNodeY = Math.min(...ys)
    const maxNodeY = Math.max(...ys)

    const hasBypassArc = fragment.edges.some((edge) => edge.kind === 'bypass-arc')
    const hasLoopbackArc = fragment.edges.some((edge) => edge.kind === 'loopback-arc')
    const hasLoop = fragment.edges.some((edge) => edge.kind === 'loop')

    const paddingLeft = 80
    const paddingRight = 80

    // Base padding
    let paddingTop = 80
    let paddingBottom = 100

    // Add more room when the fragment contains large outer arcs
    if (hasBypassArc) {
      paddingTop += 120
    }

    if (hasLoopbackArc) {
      paddingBottom += 120
    }

    if (hasLoop) {
      paddingTop += 40
    }

    return {
      minX: minNodeX - paddingLeft,
      maxX: maxNodeX + paddingRight,
      minY: minNodeY - paddingTop,
      maxY: maxNodeY + paddingBottom,
    }
  }, [fragment.nodes, fragment.edges])

  const width = bounds.maxX - bounds.minX
  const height = bounds.maxY - bounds.minY

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-white p-4">
      <svg
        width={width}
        height={height}
        viewBox={`${bounds.minX} ${bounds.minY} ${width} ${height}`}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="12"
            markerHeight="8"
            refX="10"
            refY="4"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 12 4, 0 8" fill="black" />
          </marker>
        </defs>

        {fragment.edges.map((edge) => (
          <SvgEdge key={edge.id} edge={edge} nodesById={nodesById} />
        ))}

        {fragment.nodes.map((node) => (
          <SvgStateNode key={node.id} node={node} />
        ))}
      </svg>
    </div>
  )
}