import type { ThompsonNode } from '@/types/automata'
import type { FragmentVisual, VisualEdge } from './types'
import { renderThompson } from './renderThompson'
import { offsetFragment } from './utils'
import { HORIZONTAL_GAP } from './geometry'
import { makeStateId } from './ids'

export function renderStar(
  childNode: ThompsonNode,
  originX: number,
  originY: number
): FragmentVisual {
  const childRaw = renderThompson(childNode, 0, 0)

  const childFrag = offsetFragment(
    childRaw,
    originX + HORIZONTAL_GAP,
    originY
  )

  const startId = makeStateId()
  const acceptId = makeStateId()

  const startNode = {
    id: startId,
    x: originX,
    y: originY,
    label: startId,
  }

  const acceptX = originX + HORIZONTAL_GAP + childRaw.width + HORIZONTAL_GAP

  const acceptNode = {
    id: acceptId,
    x: acceptX,
    y: originY,
    label: acceptId,
  }

  const nodes = [
    startNode,
    acceptNode,
    ...childFrag.nodes,
  ]

  const edges: VisualEdge[] = [
    ...childFrag.edges,

    // Enter child
    {
      id: `${startId}-${childFrag.startId}`,
      from: startId,
      to: childFrag.startId,
      label: 'ε',
      kind: 'straight',
    },

    // Exit child to accept
    {
      id: `${childFrag.acceptId}-${acceptId}`,
      from: childFrag.acceptId,
      to: acceptId,
      label: 'ε',
      kind: 'straight',
    },

    // Bypass: start directly to accept
    {
      id: `${startId}-${acceptId}-bypass`,
      from: startId,
      to: acceptId,
      label: 'ε',
      kind: 'bypass-arc',
    },

    // Loopback: child accept back to child start
    {
      id: `${childFrag.acceptId}-${childFrag.startId}-loopback`,
      from: childFrag.acceptId,
      to: childFrag.startId,
      label: 'ε',
      kind: 'loopback-arc',
    },
  ]

  return {
    startId,
    acceptId,
    nodes,
    edges,
    width: HORIZONTAL_GAP + childRaw.width + HORIZONTAL_GAP,
    height: Math.max(childRaw.height, 140),
  }
}