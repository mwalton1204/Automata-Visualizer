import { STATE_RADIUS } from '@/lib/thompsonRenderer/geometry'
import type { VisualEdge, VisualNode } from '@/lib/thompsonRenderer/types'

type Props = {
  edge: VisualEdge
  nodesById: Record<string, VisualNode>
}

export default function SvgEdge({ edge, nodesById }: Props) {
  const fromNode = nodesById[edge.from]
  const toNode = nodesById[edge.to]

  if (!fromNode || !toNode) {
    return null
  }

  const dx = toNode.x - fromNode.x
  const dy = toNode.y - fromNode.y
  const length = Math.sqrt(dx * dx + dy * dy) || 1

  const unitX = dx / length
  const unitY = dy / length

  let x1 = fromNode.x + unitX * STATE_RADIUS
  let y1 = fromNode.y + unitY * STATE_RADIUS
  let x2 = toNode.x - unitX * STATE_RADIUS
  let y2 = toNode.y - unitY * STATE_RADIUS

  if (edge.kind === 'arc-up') {
    x1 = fromNode.x
    y1 = fromNode.y - STATE_RADIUS
    x2 = toNode.x
    y2 = toNode.y - STATE_RADIUS
  }

  if (edge.kind === 'arc-down') {
    x1 = fromNode.x
    y1 = fromNode.y + STATE_RADIUS
    x2 = toNode.x
    y2 = toNode.y + STATE_RADIUS
  }

  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  const normalX = -unitY
  const normalY = unitX

  let path = `M ${x1} ${y1} L ${x2} ${y2}`
  let labelX = midX + normalX * 14
  let labelY = midY + normalY * 14

  const minX = Math.min(fromNode.x, toNode.x)
  const maxX = Math.max(fromNode.x, toNode.x)

  const nodesInSpan = Object.values(nodesById).filter((node) => {
    return node.x >= minX && node.x <= maxX
  })

  const topmostY =
    nodesInSpan.length > 0
      ? Math.min(...nodesInSpan.map((node) => node.y - STATE_RADIUS))
      : Math.min(fromNode.y, toNode.y)

  const bottommostY =
    nodesInSpan.length > 0
      ? Math.max(...nodesInSpan.map((node) => node.y + STATE_RADIUS))
      : Math.max(fromNode.y, toNode.y)

  const ARC_CLEARANCE = 90

  if (edge.kind === 'arc-up') {
    const controlY = topmostY - ARC_CLEARANCE
    path = `M ${x1} ${y1} Q ${midX} ${controlY} ${x2} ${y2}`

    // Place label around 35% across the curve instead of dead center
    labelX = x1 + (x2 - x1) * 0.35
    labelY = controlY - 12
  }

  if (edge.kind === 'arc-down') {
    const controlY = bottommostY + ARC_CLEARANCE
    path = `M ${x1} ${y1} Q ${midX} ${controlY} ${x2} ${y2}`

    // Place label around 65% across the curve
    labelX = x1 + (x2 - x1) * 0.65
    labelY = controlY + 20
  }

  if (edge.kind === 'loop') {
    const loopTop = fromNode.y - 70
    path = `M ${fromNode.x - 10} ${fromNode.y - 18} Q ${fromNode.x} ${loopTop} ${fromNode.x + 10} ${fromNode.y - 18}`
    labelX = fromNode.x
    labelY = loopTop - 8
  }

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="black"
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
      />

      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        fill="black"
      >
        {edge.label}
      </text>
    </g>
  )
}