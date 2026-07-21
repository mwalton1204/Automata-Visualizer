# Regex Automata API

A FastAPI service that parses regular expressions, constructs nondeterministic
finite automata with Thompson's construction, and converts them into
deterministic finite automata using subset construction.

The repository also includes a dependency-free API playground for inspecting
the conversion pipeline, transition tables, and JSON response data.

> **Live demo:** [API Playground](https://mwalton1204.github.io/Automata-Visualizer/)
> · [OpenAPI documentation](https://regex-automata-api.onrender.com/docs)

## Project overview

This project implements the core automata algorithms directly rather than
delegating parsing or conversion to a regular-expression or graph library.
A request moves through the following pipeline:

```text
Regular expression
       │
       ▼
Insert explicit concatenation operators
       │
       ▼
Convert infix notation to postfix (shunting-yard algorithm)
       │
       ├──► Build a Thompson construction tree
       │
       ▼
Construct an NFA (Thompson's construction)
       │
       ▼
Construct an equivalent DFA (subset construction)
       │
       ▼
Return JSON-serializable automata
```

### Highlights

- Implements operator precedence and infix-to-postfix conversion.
- Supports implicit and explicit concatenation.
- Builds NFAs from composable Thompson fragments.
- Computes epsilon closures and DFA states through subset construction.
- Serializes graph-based automata into JSON-friendly numeric state identifiers.
- Returns structured `400` responses for empty, malformed, or unsupported input.
- Exposes automatically generated OpenAPI documentation through FastAPI.
- Includes a responsive, dependency-free frontend for exercising the API.

## Supported regular-expression syntax

| Syntax | Meaning |
| --- | --- |
| `a-z`, `A-Z`, `0-9` | Literal symbols |
| `ε` | Epsilon symbol |
| `ab` or `a.b` | Concatenation |
| `a\|b` | Union |
| `a*` | Zero or more |
| `a+` | One or more |
| `a?` | Zero or one |
| `(ab)` | Grouping |

The parser operates on individual characters. Multi-character tokens, character
classes, escaped metacharacters, wildcard matching, and bounded repetition are
outside the current scope.

## API

### `POST /convert`

Converts one regular expression into its normalized representation, postfix
notation, Thompson construction tree, NFA, and DFA.

Request body:

```json
{
  "regex": "(a|b)*abb"
}
```

Example request:

```bash
curl -X POST http://127.0.0.1:8000/convert \
  -H "Content-Type: application/json" \
  -d '{"regex":"(a|b)*abb"}'
```

The response contains:

| Field | Description |
| --- | --- |
| `input` | Trimmed expression supplied by the client |
| `with_concat` | Expression with explicit `.` concatenation operators |
| `postfix` | Postfix expression produced by the shunting-yard pass |
| `thompson_tree` | Recursive construction tree used by the Thompson representation |
| `nfa` | Serialized NFA states, start state, accepting states, and transitions |
| `dfa` | Serialized DFA states, start state, accepting states, and transitions |

Automata use the following JSON shape:

```json
{
  "states": [0, 1],
  "start": 0,
  "accepts": [1],
  "transitions": [
    { "from": 0, "to": 1, "symbol": "a" }
  ]
}
```

Invalid input returns `400 Bad Request` with a human-readable `detail` field.
Malformed request bodies are handled by FastAPI's request validation.

### Additional endpoints

- `GET /` provides a basic API health response.
- `GET /docs` opens the interactive Swagger UI documentation.
- `GET /openapi.json` returns the generated OpenAPI schema.

## Run locally

### Prerequisites

- Python 3.10 or newer
- A modern web browser

The API and playground run as separate local processes. The committed dashboard
uses the deployed Render API by default, but its API URL can be changed at
runtime without modifying source files.

### 1. Create a Python environment

From the repository root:

```bash
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

### 2. Start the API

```bash
cd backend
uvicorn main:app --reload
```

The API will be available at <http://127.0.0.1:8000>, with interactive
documentation at <http://127.0.0.1:8000/docs>.

The API can be exercised without running the frontend:

```bash
curl -X POST http://127.0.0.1:8000/convert \
  -H "Content-Type: application/json" \
  -d '{"regex":"(a|b)*abb"}'
```

### 3. Start the API playground

In a second terminal, from the repository root:

```bash
cd frontend-demo
python3 -m http.server 3000
```

Open <http://localhost:3000>. Use `localhost` rather than `127.0.0.1` for the
frontend because that is the local origin permitted by the API's CORS policy.

The dashboard is configured to call the deployed Render API by default. To use
the local API:

1. Find the **API URL** field in the upper-right corner of the dashboard.
2. Replace its value with `http://127.0.0.1:8000`.
3. Submit a regular expression. The OpenAPI documentation link will also update
   to the local `/docs` endpoint.

This setting lasts until the page is refreshed and requires no source changes.

### Use localhost as the frontend default

If repeatedly testing the local API, temporarily change these two values in
`frontend-demo/index.html`:

```html
<a id="docs-link" href="http://127.0.0.1:8000/docs" ...>
<input id="api-url" value="http://127.0.0.1:8000" ...>
```

Before committing or deploying the dashboard, restore both values to:

```text
https://regex-automata-api.onrender.com
```

The local API permits requests from `http://localhost:3000`, while the deployed
API also permits the GitHub Pages origin `https://mwalton1204.github.io`.

## Project structure

```text
.
├── backend/
│   ├── main.py                  # FastAPI application and request validation
│   ├── requirements.txt         # Python runtime dependencies
│   └── services/
│       ├── regex_utils.py       # Concatenation insertion and postfix parsing
│       ├── thompson_tree.py     # Recursive construction-tree generation
│       ├── nfa.py               # Thompson NFA construction and serialization
│       └── dfa.py               # Subset construction and serialization
├── frontend-demo/
│   ├── index.html               # API playground markup
│   ├── styles.css               # Responsive dashboard styling
│   └── app.js                   # API requests and response rendering
├── .gitignore
└── README.md
```

## Implementation notes

- NFA states are linked Python objects during construction. Serialization walks
  all reachable states and assigns numeric identifiers before producing JSON.
- Each DFA state is represented internally as a `frozenset` of NFA states.
- Transition labels sharing the same source and destination remain independently
  represented in the API response.
- The frontend intentionally uses plain HTML, CSS, and JavaScript. Its purpose is
  to demonstrate the API contract without introducing a separate build system.
- CORS is restricted to the local playground at `http://localhost:3000` and the
  published GitHub Pages origin at `https://mwalton1204.github.io`.
