import type { ThompsonNode } from '@/types/automata'
import type { FragmentVisual } from './types'
import { renderThompson } from './renderThompson'
import { offsetFragment } from './utils'
import { HORIZONTAL_GAP } from './geometry'

export function renderConcat(
  leftNode: ThompsonNode,
  rightNode: ThompsonNode,
  originX: number,
  originY: number
): FragmentVisual {
  // Render left fragment
  const leftFrag = renderThompson(leftNode, originX, originY)

  // Render right fragment (temporarily at 0,0)
  const rightFragRaw = renderThompson(rightNode, 0, 0)

  // Shift right fragment to the right of left
  const rightFrag = offsetFragment(
    rightFragRaw,
    originX + leftFrag.width + HORIZONTAL_GAP,
    originY
  )

  // Combine nodes
  const nodes = [...leftFrag.nodes, ...rightFrag.nodes]

  // Combine edges + concat epsilon edge
  const edges = [
    ...leftFrag.edges,
    ...rightFrag.edges,
    {
      id: `${leftFrag.acceptId}-${rightFrag.startId}-eps`,
      from: leftFrag.acceptId,
      to: rightFrag.startId,
      label: 'ε',
      kind: 'straight' as const,
    },
  ]

  return {
    startId: leftFrag.startId,
    acceptId: rightFrag.acceptId,
    nodes,
    edges,
    width: leftFrag.width + HORIZONTAL_GAP + rightFrag.width,
    height: Math.max(leftFrag.height, rightFrag.height),
  }
}