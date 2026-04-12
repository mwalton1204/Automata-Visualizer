'use client'

import { useState } from 'react'

export default function Home() {
  const [regex, setRegex] = useState('')
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

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

      // Convert backend response to json and turn it into a JavaScript object
      const data = await response.json()
      setResult(data)
    } catch (err) { // Handle errors
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
            onChange={(e) => setRegex(e.target.value)} // Set regex state on input change
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
      </div>
    </main>
  )
}