'use client'

import { useState } from 'react'
import type { ConvertResponse } from '@/types/automata'
import ThompsonRenderer from '@/components/ThompsonRenderer'
import DFARenderer from '@/components/DFARenderer'

export default function Home() {
  const [regex, setRegex] = useState('')
  const [result, setResult] = useState<ConvertResponse | null>(null)
  const [error, setError] = useState('')

  async function handleConvert() {
    setError('')
    setResult(null)

    try {
      const response = await fetch('http://127.0.0.1:8000/convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ regex }),
      })

      if (!response.ok) {
        throw new Error('Request failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError('Could not connect to backend')
      console.error(err)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-8 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Automata Visualizer</h1>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-lg">
          <div className="space-y-2">
            <label htmlFor="regex" className="block text-sm font-medium text-zinc-200">
              Enter a regular expression
            </label>
            <input
              id="regex"
              type="text"
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              placeholder="Example: (a|b)*abb"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleConvert}
            className="mt-4 rounded-lg border border-zinc-600 bg-zinc-800 px-4 py-2 font-medium text-zinc-100 hover:bg-zinc-700"
          >
            Convert
          </button>

          {error && (
            <div className="mt-4 rounded-lg border border-red-700 bg-red-950/40 p-3 text-red-300">
              {error}
            </div>
          )}
        </div>

        {result?.thompson_tree && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">
              Custom Thompson Renderer
            </h2>

            <ThompsonRenderer tree={result.thompson_tree} />
          </div>
        )}

        {result?.dfa && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg">
            <h2 className="mb-4 text-xl font-semibold text-zinc-100">
              DFA Visualization
            </h2>

            <DFARenderer dfa={result.dfa} />
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 shadow-lg">
            <h2 className="mb-2 text-xl font-semibold text-zinc-100">Backend Response</h2>
            <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-3 text-sm text-zinc-300">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {result?.thompson_tree && (
          <div className="rounded border p-4">
            <h2 className="text-lg font-semibold">Thompson Tree</h2>
            <pre className="text-sm">
              {JSON.stringify(result.thompson_tree, null, 2)}
            </pre>
          </div>
        )}

      </div>
    </main>
  )
}