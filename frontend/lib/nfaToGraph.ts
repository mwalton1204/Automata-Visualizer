// frontend/lib/nfaToGraph.ts

export type NFATransition = {
  from: number
  to: number
  symbol: string
}

export type NFAData = {
  states: number[]
  start: number
  accept: number
  transitions: NFATransition[]
}

export function nfaToGraph(nfa: NFAData) {
  const nodes = nfa.states.map((id) => {
    const isStart = id === nfa.start
    const isAccept = id === nfa.accept

    return {
      id: String(id),
      data: { label: `q${id}` },
      position: {
        x: Math.random() * 400,
        y: Math.random() * 400,
      },
      style: {
        border: isStart
          ? '2px solid green'
          : isAccept
          ? '2px solid red'
          : '1px solid black',
      },
    }
  })

  const edges = nfa.transitions.map((t, i) => ({
    id: `e${i}`,
    source: String(t.from),
    target: String(t.to),
    label: t.symbol,
  }))

  return { nodes, edges }
}