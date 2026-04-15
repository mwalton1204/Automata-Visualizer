import { HORIZONTAL_GAP } from './geometry'
import { makeStateId } from './ids'
import type { FragmentVisual } from './types'

export function renderLiteral(symbol: string, originX: number, originY: number): FragmentVisual {
  const startId = makeStateId()
  const acceptId = makeStateId()

  return {
    startId,
    acceptId,
    nodes: [
      {
        id: startId,
        x: originX,
        y: originY,
        label: startId,
      },
      {
        id: acceptId,
        x: originX + HORIZONTAL_GAP,
        y: originY,
        label: acceptId,
      },
    ],
    edges: [
      {
        id: `${startId}-${acceptId}`,
        from: startId,
        to: acceptId,
        label: symbol,
        kind: 'straight',
      },
    ],
    width: HORIZONTAL_GAP,
    height: 0,
  }
}