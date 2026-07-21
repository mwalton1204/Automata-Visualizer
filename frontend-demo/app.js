const form = document.querySelector('#convert-form')
const regexInput = document.querySelector('#regex')
const apiUrlInput = document.querySelector('#api-url')
const submitButton = document.querySelector('#submit-button')
const resetButton = document.querySelector('#reset-button')
const status = document.querySelector('#status')
const results = document.querySelector('#results')
const docsLink = document.querySelector('#docs-link')
const copyButton = document.querySelector('#copy-curl')

let currentCurl = ''

function apiBaseUrl() {
  return apiUrlInput.value.trim().replace(/\/$/, '')
}

function setStatus(message, kind = '') {
  status.textContent = message
  status.className = `status ${kind}`.trim()
}

function summarizeAutomaton(elementId, automaton) {
  const values = [
    ['Start', `q${automaton.start}`],
    ['Accepting', automaton.accepts.map((state) => `q${state}`).join(', ') || 'None'],
    ['Transitions', String(automaton.transitions.length)],
  ]

  document.querySelector(elementId).innerHTML = values
    .map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`)
    .join('')
}

function renderTransitionTable(elementId, automaton) {
  const container = document.querySelector(elementId)
  const shell = container.closest('.table-scroll-shell')
  const table = document.createElement('table')
  table.className = 'transition-table'

  const header = table.createTHead().insertRow()
  for (const label of ['From', '', 'Symbol', '', 'To']) {
    const cell = document.createElement('th')
    cell.scope = 'col'
    cell.textContent = label
    if (!label) cell.setAttribute('aria-hidden', 'true')
    header.appendChild(cell)
  }

  const body = table.createTBody()
  const transitions = [...automaton.transitions].sort((a, b) => {
    return a.from - b.from || a.symbol.localeCompare(b.symbol) || a.to - b.to
  })

  for (const transition of transitions) {
    const row = body.insertRow()
    const appendStateCell = (state) => {
      const cell = row.insertCell()
      const isStart = state === automaton.start
      const isAccept = automaton.accepts.includes(state)
      const badge = document.createElement('span')
      badge.className = 'state-badge'
      badge.textContent = `q${state}`

      if (isStart && isAccept) {
        badge.classList.add('start-accept-state')
        badge.dataset.stateRole = 'START · ACCEPTING'
      } else if (isStart) {
        badge.classList.add('start-state')
        badge.dataset.stateRole = 'START'
      } else if (isAccept) {
        badge.classList.add('accept-state')
        badge.dataset.stateRole = 'ACCEPTING'
      }

      if (badge.dataset.stateRole) {
        badge.tabIndex = 0
        badge.setAttribute('aria-label', `${badge.textContent}, ${badge.dataset.stateRole.toLowerCase()}`)
      }

      cell.classList.add('state-cell')
      cell.appendChild(badge)
    }

    const appendConnector = (hasArrow = false) => {
      const cell = row.insertCell()
      cell.className = `transition-connector${hasArrow ? ' arrow' : ''}`
      cell.setAttribute('aria-hidden', 'true')
      cell.appendChild(document.createElement('span'))
    }

    appendStateCell(transition.from)
    appendConnector()

    const symbolCell = row.insertCell()
    symbolCell.className = 'symbol'
    symbolCell.textContent = transition.symbol

    appendConnector(true)
    appendStateCell(transition.to)
  }

  container.replaceChildren(table)

  const updateScrollFade = () => {
    const remainingScroll = container.scrollHeight - container.scrollTop - container.clientHeight
    shell.classList.toggle('is-at-bottom', remainingScroll <= 2)
  }

  container.onscroll = updateScrollFade
  requestAnimationFrame(updateScrollFade)
}

function renderResults(data, regex) {
  document.querySelector('#input-output').textContent = data.input
  document.querySelector('#concat-output').textContent = data.with_concat
  document.querySelector('#postfix-output').textContent = data.postfix

  document.querySelector('#nfa-count').textContent = `${data.nfa.states.length} states`
  document.querySelector('#dfa-count').textContent = `${data.dfa.states.length} states`
  summarizeAutomaton('#nfa-summary', data.nfa)
  summarizeAutomaton('#dfa-summary', data.dfa)
  renderTransitionTable('#nfa-transitions', data.nfa)
  renderTransitionTable('#dfa-transitions', data.dfa)

  document.querySelector('#nfa-json').textContent = JSON.stringify(data.nfa, null, 2)
  document.querySelector('#dfa-json').textContent = JSON.stringify(data.dfa, null, 2)
  document.querySelector('#full-json').textContent = JSON.stringify(data, null, 2)

  currentCurl = [
    `curl -X POST '${apiBaseUrl()}/convert' \\`,
    "  -H 'Content-Type: application/json' \\",
    `  -d '${JSON.stringify({ regex })}'`,
  ].join('\n')
  document.querySelector('#curl-output').textContent = currentCurl

  results.hidden = false
}

async function convert(regex) {
  submitButton.disabled = true
  submitButton.textContent = 'Converting…'
  results.hidden = true
  setStatus('Sending request…')

  const wakeMessageTimer = apiBaseUrl().includes('.onrender.com')
    ? window.setTimeout(() => {
        setStatus('Waking the free API instance. The first request may take up to a minute.')
      }, 4000)
    : null

  try {
    const response = await fetch(`${apiBaseUrl()}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ regex }),
    })

    let data
    try {
      data = await response.json()
    } catch {
      throw new Error(`The API returned an unreadable response (${response.status}).`)
    }

    if (!response.ok) {
      const detail = typeof data.detail === 'string' ? data.detail : `Request failed (${response.status}).`
      throw new Error(detail)
    }

    renderResults(data, regex)
    setStatus('Conversion completed successfully.', 'success')
  } catch (error) {
    const connectionHint = error instanceof TypeError
      ? 'Could not reach the API. Check the URL and confirm the backend is running.'
      : error.message
    setStatus(connectionHint, 'error')
  } finally {
    if (wakeMessageTimer !== null) window.clearTimeout(wakeMessageTimer)
    submitButton.disabled = false
    submitButton.textContent = 'Convert'
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault()
  const regex = regexInput.value.trim()

  if (!regex) {
    setStatus('Enter a regular expression first.', 'error')
    return
  }

  convert(regex)
})

resetButton.addEventListener('click', () => {
  regexInput.value = ''
  results.hidden = true
  setStatus('')
  currentCurl = ''
  regexInput.focus()
})

document.querySelectorAll('[data-example]').forEach((button) => {
  button.addEventListener('click', () => {
    regexInput.value = button.dataset.example
    regexInput.focus()
  })
})

apiUrlInput.addEventListener('input', () => {
  docsLink.href = `${apiBaseUrl()}/docs`
})

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(currentCurl)
    copyButton.textContent = 'Copied'
    window.setTimeout(() => { copyButton.textContent = 'Copy' }, 1400)
  } catch {
    setStatus('Could not access the clipboard. Select and copy the command manually.', 'error')
  }
})
