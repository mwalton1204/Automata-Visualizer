import type { ThompsonNode } from '@/types/automata'
import type { FragmentVisual } from './types'
import { renderThompson } from './renderThompson'
import { offsetFragment } from './utils'
import {
  HORIZONTAL_GAP,
  BRANCH_GAP,
} from './geometry'
import { makeStateId } from './ids'

export function renderUnion(
  leftNode: ThompsonNode,
  rightNode: ThompsonNode,
  originX: number,
  originY: number
): FragmentVisual {
  // Render child fragments
  const leftRaw = renderThompson(leftNode, 0, 0)
  const rightRaw = renderThompson(rightNode, 0, 0)

  // Position children (stacked vertically)
  const leftFrag = offsetFragment(
    leftRaw,
    originX + HORIZONTAL_GAP,
    originY - BRANCH_GAP / 2
  )

  const rightFrag = offsetFragment(
    rightRaw,
    originX + HORIZONTAL_GAP,
    originY + BRANCH_GAP / 2
  )

  // Create new start and accept
  const startId = makeStateId()
  const acceptId = makeStateId()

  const startNode = {
    id: startId,
    x: originX,
    y: originY,
    label: startId,
  }

  const acceptX =
    originX +
    HORIZONTAL_GAP +
    Math.max(leftRaw.width, rightRaw.width) +
    HORIZONTAL_GAP

  const acceptNode = {
    id: acceptId,
    x: acceptX,
    y: originY,
    label: acceptId,
  }

  // Combine nodes
  const nodes = [
    startNode,
    acceptNode,
    ...leftFrag.nodes,
    ...rightFrag.nodes,
  ]

  // Combine edges
  const edges = [
    ...leftFrag.edges,
    ...rightFrag.edges,

    // start → left (top)
    {
      id: `${startId}-${leftFrag.startId}`,
      from: startId,
      to: leftFrag.startId,
      label: 'ε',
      kind: 'straight' as const,
    },

    // start → right (bottom)
    {
      id: `${startId}-${rightFrag.startId}`,
      from: startId,
      to: rightFrag.startId,
      label: 'ε',
      kind: 'straight' as const,
    },

    // left → accept
    {
      id: `${leftFrag.acceptId}-${acceptId}`,
      from: leftFrag.acceptId,
      to: acceptId,
      label: 'ε',
      kind: 'straight' as const,
    },

    // right → accept
    {
      id: `${rightFrag.acceptId}-${acceptId}`,
      from: rightFrag.acceptId,
      to: acceptId,
      label: 'ε',
      kind: 'straight' as const,
    },
  ]

  return {
    startId,
    acceptId,
    nodes,
    edges,
    width:
      HORIZONTAL_GAP +
      Math.max(leftRaw.width, rightRaw.width) +
      HORIZONTAL_GAP,
    height: BRANCH_GAP + Math.max(leftRaw.height, rightRaw.height),
  }
}