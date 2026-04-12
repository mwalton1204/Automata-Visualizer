'use client'

import ReactFlow from 'reactflow'
import 'reactflow/dist/style.css'
import { useState } from 'react'
import { nfaToGraph } from '@/lib/nfaToGraph'

export default function Home() {
  const [regex, setRegex] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  // Build graph data from the current backend result
  const graph = result?.nfa ? nfaToGraph(result.nfa) : null

  async function handleConvert() {
    // Clear previous results and errors
    setError('')
    setResult(null)

    try {
      // Send the regex to backend API and await the response
      const response = await fetch('http://127.0.0.1:8000/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ regex }),
      })

      // Check for bad HTTP response
      if (!response.ok) {
        throw new Error('Request failed')
      }

      // Convert backend response to JSON and store it in state
      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Could not connect to backend')
      console.error(err)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-bold">Automata Visualizer</h1>

        <div className="space-y-2">
          <label htmlFor="regex" className="block text-sm font-medium">
            Enter a regular expression
          </label>
          <input
            id="regex"
            type="text"
            value={regex}
            onChange={(e) => setRegex(e.target.value)}
            placeholder="Example: (a|b)*abb"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <button
          onClick={handleConvert}
          className="rounded border px-4 py-2"
        >
          Convert
        </button>

        {error && (
          <div className="rounded border border-red-500 p-3 text-red-600">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded border p-4">
            <h2 className="mb-2 text-xl font-semibold">Backend Response</h2>
            <pre className="overflow-x-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {graph && (
          <div className="h-[500px] w-full rounded border">
            <ReactFlow nodes={graph.nodes} edges={graph.edges} fitView />
          </div>
        )}
      </div>
    </main>
  )
}