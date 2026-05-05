from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.regex_utils import insert_concat, to_postfix
from services.nfa import postfix_to_nfa, nfa_to_dict
from services.dfa import nfa_to_dfa, dfa_to_dict, build_state_ids, simulate_dfa
from services.thompson_tree import postfix_to_thompson_tree

app = FastAPI()

# Allow frontend to access backend API during local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegexRequest(BaseModel):
    regex: str

class SimulateRequest(BaseModel):
    regex: str
    input: str

def _build_dfa(raw_regex: str):
    if not raw_regex:
        raise ValueError("Regex cannot be empty")
    with_concat = insert_concat(raw_regex)
    postfix = to_postfix(with_concat)
    nfa = postfix_to_nfa(postfix)
    dfa = nfa_to_dfa(nfa)
    return postfix, nfa, dfa

@app.get("/")
def root():
    return {"message": "API is working!"}

@app.post("/convert")
def convert(req: RegexRequest):
    raw_regex = req.regex.strip()

    try:
        postfix, nfa, dfa = _build_dfa(raw_regex)
        with_concat = insert_concat(raw_regex)
        thompson_tree = postfix_to_thompson_tree(postfix)
        nfa_data = nfa_to_dict(nfa)
        dfa_data = dfa_to_dict(dfa)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {
        "input": raw_regex,
        "with_concat": with_concat,
        "postfix": postfix,
        "thompson_tree": thompson_tree,
        "nfa": nfa_data,
        "dfa": dfa_data
    }

@app.post("/simulate")
def simulate(req: SimulateRequest):
    raw_regex = req.regex.strip()

    try:
        _, _, dfa = _build_dfa(raw_regex)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    state_ids = build_state_ids(dfa)
    result = simulate_dfa(dfa, state_ids, req.input)

    return result