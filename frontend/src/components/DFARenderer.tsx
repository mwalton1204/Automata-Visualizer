'use client'

import type { AutomataData } from '@/types/automata'

type Props = {
    dfa: AutomataData
}

const STATE_RADIUS = 30

type EdgeKind =
    | 'straight'
    | 'loop'
    | 'bypass-arc'
    | 'loopback-arc'
    | 'left-arc'
    | 'right-arc'

type RenderNode = {
    id: string
    x: number
    y: number
    isStart: boolean
    isAccept: boolean
}

type RenderEdge = {
    from: string
    to: string
    label: string
    kind: EdgeKind
}

function getNodeRenderRadius(_isAccept: boolean) {
    return STATE_RADIUS
}

function groupTransitionsBySource(dfa: AutomataData) {
    const map = new Map<number, number[]>()

    for (const state of dfa.states) {
        map.set(state, [])
    }

    for (const transition of dfa.transitions) {
        map.get(transition.from)?.push(transition.to)
    }

    return map
}

function computeLevels(dfa: AutomataData) {
    const adjacency = groupTransitionsBySource(dfa)
    const levels = new Map<number, number>()
    const queue: number[] = [dfa.start]

    levels.set(dfa.start, 0)

    while (queue.length > 0) {
        const current = queue.shift()!
        const currentLevel = levels.get(current) ?? 0
        const neighbors = adjacency.get(current) ?? []

        for (const next of neighbors) {
            if (!levels.has(next)) {
                levels.set(next, currentLevel + 1)
                queue.push(next)
            }
        }
    }

    const maxLevel = Math.max(...Array.from(levels.values()), 0)

    for (const state of dfa.states) {
        if (!levels.has(state)) {
            levels.set(state, maxLevel + 1)
        }
    }

    return levels
}

function getLoopDirection(nodeY: number, averageY: number): 'top' | 'bottom' {
    return nodeY <= averageY ? 'top' : 'bottom'
}

function buildNodes(dfa: AutomataData): RenderNode[] {
    const levels = computeLevels(dfa)

    const incoming = new Map<number, number[]>()
    for (const state of dfa.states) {
        incoming.set(state, [])
    }

    for (const transition of dfa.transitions) {
        incoming.get(transition.to)?.push(transition.from)
    }

    const statesByLevel = new Map<number, number[]>()

    for (const state of dfa.states) {
        const level = levels.get(state) ?? 0
        if (!statesByLevel.has(level)) {
            statesByLevel.set(level, [])
        }
        statesByLevel.get(level)!.push(state)
    }

    const sortedLevels = Array.from(statesByLevel.keys()).sort((a, b) => a - b)

    const orderedByLevel = new Map<number, number[]>()
    const previousY = new Map<number, number>()

    for (const level of sortedLevels) {
        const states = [...(statesByLevel.get(level) ?? [])]

        if (level === 0) {
            states.sort((a, b) => a - b)
            orderedByLevel.set(level, states)
            states.forEach((state, index) => {
                previousY.set(state, index)
            })
            continue
        }

        states.sort((a, b) => {
            const aPreds = (incoming.get(a) ?? []).filter(
                (pred) => (levels.get(pred) ?? -1) === level - 1
            )
            const bPreds = (incoming.get(b) ?? []).filter(
                (pred) => (levels.get(pred) ?? -1) === level - 1
            )

            const aScore =
                aPreds.length > 0
                    ? aPreds.reduce(
                          (sum, pred) => sum + (previousY.get(pred) ?? 0),
                          0
                      ) / aPreds.length
                    : Number.MAX_SAFE_INTEGER

            const bScore =
                bPreds.length > 0
                    ? bPreds.reduce(
                          (sum, pred) => sum + (previousY.get(pred) ?? 0),
                          0
                      ) / bPreds.length
                    : Number.MAX_SAFE_INTEGER

            if (aScore !== bScore) {
                return aScore - bScore
            }

            return a - b
        })

        orderedByLevel.set(level, states)

        states.forEach((state, index) => {
            previousY.set(state, index)
        })
    }

    const columnSpacing = dfa.states.length >= 5 ? 300 : 240
    const rowSpacing =
        dfa.states.length <= 3 ? 180 : dfa.states.length >= 5 ? 260 : 220
    const startX = 100
    const centerY = 160

    const nodes: RenderNode[] = []

    for (const level of sortedLevels) {
        const states = orderedByLevel.get(level) ?? []
        const totalHeight = (states.length - 1) * rowSpacing
        const topY = centerY - totalHeight / 2
        const verticalSpreadBoost = states.length > 1 ? 20 : 0

        states.forEach((state, index) => {
            nodes.push({
                id: String(state),
                x: startX + level * columnSpacing,
                y: topY + index * (rowSpacing + verticalSpreadBoost),
                isStart: state === dfa.start,
                isAccept: dfa.accepts.includes(state),
            })
        })
    }

    return nodes
}

function buildEdges(dfa: AutomataData, nodes: RenderNode[]): RenderEdge[] {
    const grouped = new Map<string, { from: number; to: number; symbols: string[] }>()

    for (const transition of dfa.transitions) {
        const key = `${transition.from}->${transition.to}`

        if (!grouped.has(key)) {
            grouped.set(key, {
                from: transition.from,
                to: transition.to,
                symbols: [],
            })
        }

        grouped.get(key)!.symbols.push(transition.symbol)
    }

    const groupedEdges = Array.from(grouped.values()).map((group) => ({
        from: group.from,
        to: group.to,
        label: Array.from(new Set(group.symbols)).sort().join(', '),
    }))

    const nodesById = Object.fromEntries(nodes.map((node) => [node.id, node]))
    const edgeSet = new Set(groupedEdges.map((edge) => `${edge.from}->${edge.to}`))

    return groupedEdges.map((edge) => {
        let kind: EdgeKind = 'straight'

        const fromNode = nodesById[String(edge.from)]
        const toNode = nodesById[String(edge.to)]

        if (edge.from === edge.to) {
            kind = 'loop'
        } else if (fromNode && toNode) {
            const dx = Math.abs(toNode.x - fromNode.x)
            const dy = Math.abs(toNode.y - fromNode.y)

            const isVertical = dx < 10 && dy > 40
            const isReversePair = edgeSet.has(`${edge.to}->${edge.from}`)

            if (isVertical) {
                kind = fromNode.y < toNode.y ? 'right-arc' : 'left-arc'
            } else if (isReversePair) {
                if (dx >= dy) {
                    kind = edge.from < edge.to ? 'bypass-arc' : 'loopback-arc'
                } else {
                    kind = fromNode.y < toNode.y ? 'right-arc' : 'left-arc'
                }
            }
        }

        return {
            from: String(edge.from),
            to: String(edge.to),
            label: edge.label,
            kind,
        }
    })
}

function getQuadraticPoint(
    t: number,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number }
) {
    const oneMinusT = 1 - t

    return {
        x:
            oneMinusT * oneMinusT * p0.x +
            2 * oneMinusT * t * p1.x +
            t * t * p2.x,
        y:
            oneMinusT * oneMinusT * p0.y +
            2 * oneMinusT * t * p1.y +
            t * t * p2.y,
    }
}

function getQuadraticTangent(
    t: number,
    p0: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number }
) {
    return {
        x: 2 * (1 - t) * (p1.x - p0.x) + 2 * t * (p2.x - p1.x),
        y: 2 * (1 - t) * (p1.y - p0.y) + 2 * t * (p2.y - p1.y),
    }
}

export default function DFARenderer({ dfa }: Props) {
    const rawNodes = buildNodes(dfa)

    const minX = Math.min(...rawNodes.map((n) => n.x), 0)
    const maxX = Math.max(...rawNodes.map((n) => n.x), 0)
    const minY = Math.min(...rawNodes.map((n) => n.y), 0)
    const maxY = Math.max(...rawNodes.map((n) => n.y), 0)

    const paddingLeft = 100
    const paddingRight = 120
    const paddingTop = 100
    const paddingBottom = 100

    const width = maxX - minX + paddingLeft + paddingRight
    const height = Math.max(320, maxY - minY + paddingTop + paddingBottom)

    const nodes = rawNodes.map((node) => ({
        ...node,
        x: node.x - minX + paddingLeft,
        y: node.y - minY + paddingTop,
    }))

    const edges = buildEdges(dfa, nodes)
    const nodesById = Object.fromEntries(nodes.map((node) => [node.id, node]))
    const averageY =
        nodes.reduce((sum, node) => sum + node.y, 0) / Math.max(nodes.length, 1)

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
            <defs>
                <marker
                    id="dfa-arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="10"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon points="0 0, 10 3.5, 0 7" fill="white" />
                </marker>
            </defs>

            {edges.map((edge, index) => {
                const fromNode = nodesById[edge.from]
                const toNode = nodesById[edge.to]

                if (!fromNode || !toNode) {
                    return null
                }

                const fromRadius = getNodeRenderRadius(fromNode.isAccept)
                const toRadius = getNodeRenderRadius(toNode.isAccept)

                const dx = toNode.x - fromNode.x
                const dy = toNode.y - fromNode.y
                const length = Math.sqrt(dx * dx + dy * dy) || 1

                const unitX = dx / length
                const unitY = dy / length

                let x1 = fromNode.x + unitX * fromRadius
                let y1 = fromNode.y + unitY * fromRadius
                let x2 = toNode.x - unitX * toRadius
                let y2 = toNode.y - unitY * toRadius

                let path = `M ${x1} ${y1} L ${x2} ${y2}`

                if (edge.kind === 'bypass-arc') {
                    x1 = fromNode.x
                    y1 = fromNode.y - fromRadius
                    x2 = toNode.x
                    y2 = toNode.y - toRadius

                    const midX = (x1 + x2) / 2
                    const controlY = Math.min(fromNode.y, toNode.y) - 85

                    path = `M ${x1} ${y1} Q ${midX} ${controlY} ${x2} ${y2}`
                }

                if (edge.kind === 'loopback-arc') {
                    x1 = fromNode.x
                    y1 = fromNode.y + fromRadius
                    x2 = toNode.x
                    y2 = toNode.y + toRadius

                    const midX = (x1 + x2) / 2
                    const controlY = Math.max(fromNode.y, toNode.y) + 85

                    path = `M ${x1} ${y1} Q ${midX} ${controlY} ${x2} ${y2}`
                }

                if (edge.kind === 'left-arc') {
                    x1 = fromNode.x - fromRadius
                    y1 = fromNode.y
                    x2 = toNode.x - toRadius
                    y2 = toNode.y

                    const midY = (y1 + y2) / 2
                    const controlX = Math.min(fromNode.x, toNode.x) - 120

                    path = `M ${x1} ${y1} Q ${controlX} ${midY} ${x2} ${y2}`
                }

                if (edge.kind === 'right-arc') {
                    x1 = fromNode.x + fromRadius
                    y1 = fromNode.y
                    x2 = toNode.x + toRadius
                    y2 = toNode.y

                    const midY = (y1 + y2) / 2
                    const controlX = Math.max(fromNode.x, toNode.x) + 120

                    path = `M ${x1} ${y1} Q ${controlX} ${midY} ${x2} ${y2}`
                }

                if (edge.kind === 'loop') {
                    const r = fromRadius
                    const loopDirection = getLoopDirection(fromNode.y, averageY)

                    if (loopDirection === 'top') {
                        const start = {
                            x: fromNode.x - r * 0.55,
                            y: fromNode.y - r * 0.84,
                        }
                        const end = {
                            x: fromNode.x + r * 0.55,
                            y: fromNode.y - r * 0.84,
                        }

                        const c1 = {
                            x: fromNode.x - r * 1.15,
                            y: fromNode.y - r * 2.25,
                        }
                        const c2 = {
                            x: fromNode.x + r * 1.15,
                            y: fromNode.y - r * 2.25,
                        }

                        path = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`
                    } else {
                        const start = {
                            x: fromNode.x + r * 0.55,
                            y: fromNode.y + r * 0.84,
                        }
                        const end = {
                            x: fromNode.x - r * 0.55,
                            y: fromNode.y + r * 0.84,
                        }

                        const c1 = {
                            x: fromNode.x + r * 1.15,
                            y: fromNode.y + r * 2.25,
                        }
                        const c2 = {
                            x: fromNode.x - r * 1.15,
                            y: fromNode.y + r * 2.25,
                        }

                        path = `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`
                    }
                }

                return (
                    <path
                        key={`path-${edge.from}-${edge.to}-${edge.label}-${index}`}
                        d={path}
                        fill="none"
                        stroke="white"
                        strokeWidth={2}
                        markerEnd="url(#dfa-arrowhead)"
                    />
                )
            })}

            {edges.map((edge, index) => {
                const fromNode = nodesById[edge.from]
                const toNode = nodesById[edge.to]

                if (!fromNode || !toNode) {
                    return null
                }

                const fromRadius = getNodeRenderRadius(fromNode.isAccept)
                const toRadius = getNodeRenderRadius(toNode.isAccept)

                const dx = toNode.x - fromNode.x
                const dy = toNode.y - fromNode.y
                const length = Math.sqrt(dx * dx + dy * dy) || 1

                const unitX = dx / length
                const unitY = dy / length

                let x1 = fromNode.x + unitX * fromRadius
                let y1 = fromNode.y + unitY * fromRadius
                let x2 = toNode.x - unitX * toRadius
                let y2 = toNode.y - unitY * toRadius

                let labelX = (x1 + x2) / 2
                let labelY = (y1 + y2) / 2 - 10

                if (edge.kind === 'straight') {
                    const t = 0.35
                    labelX = x1 + (x2 - x1) * t
                    labelY = y1 + (y2 - y1) * t

                    const dx2 = x2 - x1
                    const dy2 = y2 - y1
                    const length2 = Math.sqrt(dx2 * dx2 + dy2 * dy2) || 1

                    const normalX = -dy2 / length2
                    const normalY = dx2 / length2
                    const offset = 18

                    labelX += normalX * offset
                    labelY += normalY * offset
                }

                if (edge.kind === 'bypass-arc') {
                    x1 = fromNode.x
                    y1 = fromNode.y - fromRadius
                    x2 = toNode.x
                    y2 = toNode.y - toRadius

                    const midX = (x1 + x2) / 2
                    const controlY = Math.min(fromNode.y, toNode.y) - 85

                    const point = getQuadraticPoint(
                        0.5,
                        { x: x1, y: y1 },
                        { x: midX, y: controlY },
                        { x: x2, y: y2 }
                    )
                    const tangent = getQuadraticTangent(
                        0.5,
                        { x: x1, y: y1 },
                        { x: midX, y: controlY },
                        { x: x2, y: y2 }
                    )
                    const tangentLength =
                        Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y) || 1
                    const normalX = -tangent.y / tangentLength
                    const normalY = tangent.x / tangentLength

                    labelX = point.x - normalX * 20
                    labelY = point.y - normalY * 20
                }

                if (edge.kind === 'loopback-arc') {
                    x1 = fromNode.x
                    y1 = fromNode.y + fromRadius
                    x2 = toNode.x
                    y2 = toNode.y + toRadius

                    const midX = (x1 + x2) / 2
                    const controlY = Math.max(fromNode.y, toNode.y) + 85

                    const point = getQuadraticPoint(
                        0.5,
                        { x: x1, y: y1 },
                        { x: midX, y: controlY },
                        { x: x2, y: y2 }
                    )
                    const tangent = getQuadraticTangent(
                        0.5,
                        { x: x1, y: y1 },
                        { x: midX, y: controlY },
                        { x: x2, y: y2 }
                    )
                    const tangentLength =
                        Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y) || 1
                    const normalX = -tangent.y / tangentLength
                    const normalY = tangent.x / tangentLength

                    labelX = point.x + normalX * 20
                    labelY = point.y + normalY * 20
                }

                if (edge.kind === 'left-arc') {
                    x1 = fromNode.x - fromRadius
                    y1 = fromNode.y
                    x2 = toNode.x - toRadius
                    y2 = toNode.y

                    const midY = (y1 + y2) / 2
                    const controlX = Math.min(fromNode.x, toNode.x) - 120
                    const verticalSpan = Math.abs(y2 - y1)

                    let t = 0.5
                    if (verticalSpan > 120) t = 0.42
                    if (verticalSpan > 220) t = 0.36

                    const point = getQuadraticPoint(
                        t,
                        { x: x1, y: y1 },
                        { x: controlX, y: midY },
                        { x: x2, y: y2 }
                    )
                    const tangent = getQuadraticTangent(
                        t,
                        { x: x1, y: y1 },
                        { x: controlX, y: midY },
                        { x: x2, y: y2 }
                    )
                    const tangentLength =
                        Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y) || 1
                    const normalX = -tangent.y / tangentLength
                    const normalY = tangent.x / tangentLength

                    labelX = point.x - normalX * 28
                    labelY = point.y - normalY * 28
                }

                if (edge.kind === 'right-arc') {
                    x1 = fromNode.x + fromRadius
                    y1 = fromNode.y
                    x2 = toNode.x + toRadius
                    y2 = toNode.y

                    const midY = (y1 + y2) / 2
                    const controlX = Math.max(fromNode.x, toNode.x) + 120
                    const verticalSpan = Math.abs(y2 - y1)

                    let t = 0.5
                    if (verticalSpan > 120) t = 0.58
                    if (verticalSpan > 220) t = 0.64

                    const point = getQuadraticPoint(
                        t,
                        { x: x1, y: y1 },
                        { x: controlX, y: midY },
                        { x: x2, y: y2 }
                    )
                    const tangent = getQuadraticTangent(
                        t,
                        { x: x1, y: y1 },
                        { x: controlX, y: midY },
                        { x: x2, y: y2 }
                    )
                    const tangentLength =
                        Math.sqrt(tangent.x * tangent.x + tangent.y * tangent.y) || 1
                    const normalX = -tangent.y / tangentLength
                    const normalY = tangent.x / tangentLength

                    labelX = point.x - normalX * 28
                    labelY = point.y - normalY * 28
                }

                if (edge.kind === 'loop') {
                    const r = fromRadius
                    const loopDirection = getLoopDirection(fromNode.y, averageY)

                    if (loopDirection === 'top') {
                        const loopTopY = fromNode.y - r * 2.25
                        labelX = fromNode.x
                        labelY = loopTopY - 14
                    } else {
                        const loopBottomY = fromNode.y + r * 2.25
                        labelX = fromNode.x
                        labelY = loopBottomY + 14
                    }
                }

                return (
                    <g key={`label-${edge.from}-${edge.to}-${edge.label}-${index}`}>
                        <rect
                            x={labelX - 12}
                            y={labelY - 10}
                            width={24}
                            height={20}
                            rx={4}
                            fill="#111318"
                        />
                        <text
                            x={labelX}
                            y={labelY}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={dfa.states.length >= 5 ? 12 : 14}
                            fontWeight="600"
                            fill="white"
                        >
                            {edge.label}
                        </text>
                    </g>
                )
            })}

            {nodes.map((node) => (
                <g key={node.id}>
                    {node.isStart && (
                        <line
                            x1={node.x - 65}
                            y1={node.y}
                            x2={node.x - getNodeRenderRadius(node.isAccept)}
                            y2={node.y}
                            stroke="white"
                            strokeWidth={2}
                            markerEnd="url(#dfa-arrowhead)"
                        />
                    )}

                    <circle
                        cx={node.x}
                        cy={node.y}
                        r={STATE_RADIUS}
                        fill="none"
                        stroke="white"
                        strokeWidth={2}
                    />

                    {node.isAccept && (
                        <circle
                            cx={node.x}
                            cy={node.y}
                            r={STATE_RADIUS - 6}
                            fill="none"
                            stroke="white"
                            strokeWidth={2}
                        />
                    )}

                    <text
                        x={node.x}
                        y={node.y + 5}
                        textAnchor="middle"
                        fontSize="14"
                        fontWeight="600"
                        fill="white"
                    >
                        q{node.id}
                    </text>
                </g>
            ))}
        </svg>
    )
}