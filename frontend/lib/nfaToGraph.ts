import dagre from 'dagre'
import { Edge, MarkerType, Node, Position } from 'reactflow'

export type NFATransition = {
  from: number
  to: number
  symbol: string
}

export type NFAData = {
  states: number[]
  start: number
  accepts: number[]
  transitions: NFATransition[]
}

type EdgeGroup = {
  source: number
  target: number
  symbols: string[]
}

const NODE_WIDTH = 80
const NODE_HEIGHT = 80

function buildFanMap(edges: { source: string; target: string }[]) {
  const outgoing = new Map<string, string[]>()
  const incoming = new Map<string, string[]>()

  for (const edge of edges) {
    if (!outgoing.has(edge.source)) outgoing.set(edge.source, [])
    if (!incoming.has(edge.target)) incoming.set(edge.target, [])

    outgoing.get(edge.source)!.push(edge.target)
    incoming.get(edge.target)!.push(edge.source)
  }

  return { outgoing, incoming }
}

function getBendValue(
  source: string,
  target: string,
  outgoing: Map<string, string[]>,
  incoming: Map<string, string[]>
): number {
  const outList = [...(outgoing.get(source) ?? [])].sort()
  const inList = [...(incoming.get(target) ?? [])].sort()

  let bend = 0

  if (outList.length > 1) {
    const outIndex = outList.indexOf(target)
    bend += outIndex - (outList.length - 1) / 2
  }

  if (inList.length > 1) {
    const inIndex = inList.indexOf(source)
    bend += inIndex - (inList.length - 1) / 2
  }

  return bend
}

export function nfaToGraph(nfa: NFAData): { nodes: Node[]; edges: Edge[] } {
  // 1) Merge transitions with the same source/target
  const grouped = new Map<string, EdgeGroup>()

  for (const t of nfa.transitions) {
    const key = `${t.from}->${t.to}`
    const existing = grouped.get(key)

    if (existing) {
      if (!existing.symbols.includes(t.symbol)) {
        existing.symbols.push(t.symbol)
      }
    } else {
      grouped.set(key, {
        source: t.from,
        target: t.to,
        symbols: [t.symbol],
      })
    }
  }

  // 2) Build base nodes
  const baseNodes: Node[] = nfa.states.map((state) => {
    const isAccept = nfa.accepts.includes(state)

    return {
      id: String(state),
      data: { label: `q${state}` },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      draggable: false,
      style: {
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        borderRadius: '9999px',
        background: '#ffffff',
        color: '#111111',
        border: isAccept ? '4px double #111111' : '3px solid #111111',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '15px',
      },
    }
  })

  // 3) Build base edges
  const groupedEdges = Array.from(grouped.values()).map((group) => ({
    source: String(group.source),
    target: String(group.target),
    label: group.symbols.join(', '),
    hasEpsilon: group.symbols.includes('ε'),
  }))

  const { outgoing, incoming } = buildFanMap(
    groupedEdges.map((e) => ({
      source: e.source,
      target: e.target,
    }))
  )

  const baseEdges: Edge[] = groupedEdges.map((group, i) => {
    const bend = getBendValue(group.source, group.target, outgoing, incoming)

    return {
      id: `e-${group.source}-${group.target}-${i}`,
      source: group.source,
      target: group.target,
      label: group.label,
      type: 'automata',
      data: { bend },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 18,
        height: 18,
        color: '#f4f4f5',
      },
      style: {
        stroke: '#f4f4f5',
        strokeWidth: 2,
        strokeDasharray: group.hasEpsilon ? '6 4' : undefined,
      },
    }
  })

  // 4) Use dagre for left-to-right layout
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: 'LR',
    nodesep: 60,
    ranksep: 100,
    marginx: 30,
    marginy: 30,
  })

  for (const node of baseNodes) {
    dagreGraph.setNode(node.id, {
      width: NODE_WIDTH,
      height: NODE_HEIGHT,
    })
  }

  for (const edge of baseEdges) {
    dagreGraph.setEdge(edge.source, edge.target)
  }

  dagre.layout(dagreGraph)

  const laidOutNodes: Node[] = baseNodes.map((node) => {
    const pos = dagreGraph.node(node.id)

    return {
      ...node,
      position: {
        x: pos.x - NODE_WIDTH / 2,
        y: pos.y - NODE_HEIGHT / 2,
      },
    }
  })

  // 5) Add a fake invisible node so we can draw a start arrow
  const startNode = laidOutNodes.find((n) => n.id === String(nfa.start))

  if (!startNode) {
    return { nodes: laidOutNodes, edges: baseEdges }
  }

  const startArrowNode: Node = {
    id: '__start__',
    data: { label: '' },
    position: {
      x: startNode.position.x - 90,
      y: startNode.position.y + NODE_HEIGHT / 2,
    },
    sourcePosition: Position.Right,
    targetPosition: Position.Right,
    draggable: false,
    selectable: false,
    style: {
      width: 1,
      height: 1,
      opacity: 0,
      border: 'none',
      background: 'transparent',
    },
  }

  const startEdge: Edge = {
    id: '__start_edge__',
    source: '__start__',
    target: String(nfa.start),
    type: 'automata',
    data: { bend: 0 },
    selectable: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 18,
      height: 18,
      color: '#f4f4f5',
    },
    style: {
      stroke: '#f4f4f5',
      strokeWidth: 2.5,
    },
  }

  return {
    nodes: [...laidOutNodes, startArrowNode],
    edges: [startEdge, ...baseEdges],
  }
}