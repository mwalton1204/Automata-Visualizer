import { STATE_RADIUS } from '@/lib/thompsonRenderer/geometry'
import type { VisualEdge, VisualNode } from '@/lib/thompsonRenderer/types'

type Props = {
  edge: VisualEdge
  nodesById: Record<string, VisualNode>
}

function getDynamicArcClearance(
  nodesInSpan: VisualNode[],
  sourceX: number,
  targetX: number
): number {
  const spanWidth = Math.abs(targetX - sourceX)
  const nodeCount = nodesInSpan.length

  const baseClearance = 50
  const widthBonus = spanWidth * 0.08
  const densityBonus = Math.max(0, nodeCount - 2) * 8

  return baseClearance + widthBonus + densityBonus
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

  if (edge.kind === 'bypass-arc') {
    x1 = fromNode.x
    y1 = fromNode.y - STATE_RADIUS
    x2 = toNode.x
    y2 = toNode.y - STATE_RADIUS
  }

  if (edge.kind === 'loopback-arc') {
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

  const dynamicClearance = getDynamicArcClearance(
    nodesInSpan,
    fromNode.x,
    toNode.x
  )

  if (edge.kind === 'bypass-arc') {
    const controlY = topmostY - dynamicClearance
    path = `M ${x1} ${y1} Q ${midX} ${controlY} ${x2} ${y2}`

    labelX = x1 + (x2 - x1) * 0.35
    labelY = controlY - 12
  }

  if (edge.kind === 'loopback-arc') {
    const controlY = bottommostY + dynamicClearance
    path = `M ${x1} ${y1} Q ${midX} ${controlY} ${x2} ${y2}`

    labelX = x1 + (x2 - x1) * 0.7
    labelY = controlY + 20
  }

  if (edge.kind === 'loop') {
    const loopTop = fromNode.y - 70
    path = `M ${fromNode.x - 10} ${fromNode.y - 18} Q ${fromNode.x} ${loopTop} ${fromNode.x + 10} ${fromNode.y - 18}`
    labelX = fromNode.x
    labelY = loopTop - 8
  }

  const shouldRenderLabel =
    edge.kind === 'straight' ||
    edge.kind === 'loop' ||
    edge.kind === 'bypass-arc' ||
    edge.kind === 'loopback-arc'

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke="black"
        strokeWidth={2}
        markerEnd="url(#arrowhead)"
      />

      {shouldRenderLabel && (
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
      )}
    </g>
  )
}