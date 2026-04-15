import { STATE_RADIUS } from '@/lib/thompsonRenderer/geometry'
import type { VisualNode } from '@/lib//thompsonRenderer/types'

type Props = {
  node: VisualNode
}

export default function SvgStateNode({ node }: Props) {
  return (
    <g>
      <circle
        cx={node.x}
        cy={node.y}
        r={STATE_RADIUS}
        fill="white"
        stroke="black"
        strokeWidth={2}
      />

      {node.isAccept && (
        <circle
          cx={node.x}
          cy={node.y}
          r={STATE_RADIUS - 6}
          fill="none"
          stroke="black"
          strokeWidth={2}
        />
      )}

      <text
        x={node.x}
        y={node.y + 5}
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        fill="black"
      >
        {node.label}
      </text>
    </g>
  )
}