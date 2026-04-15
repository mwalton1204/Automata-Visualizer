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

  const width = Math.max(300, fragment.width + 160)
  const height = Math.max(220, fragment.height + 200)

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-800 bg-white p-4">
      <svg width={width} height={height}>
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