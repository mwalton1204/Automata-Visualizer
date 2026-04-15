export type VisualNode = {
  id: string
  x: number
  y: number
  label: string
  isAccept?: boolean
  isStart?: boolean
}

export type EdgeKind =
  | 'straight'
  | 'bypass-arc'
  | 'loopback-arc'
  | 'loop'

export type VisualEdge = {
  id: string
  from: string
  to: string
  label: string
  kind: EdgeKind
}

export type FragmentVisual = {
  startId: string
  acceptId: string
  nodes: VisualNode[]
  edges: VisualEdge[]
  width: number
  height: number
}