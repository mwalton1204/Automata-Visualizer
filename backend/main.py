from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.regex_utils import insert_concat, is_symbol, to_postfix
from services.nfa import postfix_to_nfa, nfa_to_dict
from services.dfa import nfa_to_dfa, dfa_to_dict
from services.thompson_tree import postfix_to_thompson_tree

app = FastAPI()

# Allow frontend to access backend API during local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://mwalton1204.github.io",],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RegexRequest(BaseModel):
    regex: str

@app.get("/")
def root():
    return {"message": "API is working!"}

@app.post("/convert") # Use POST for sending data
def convert(req: RegexRequest):
    raw_regex = req.regex.strip() # Remove whitespace

    if not raw_regex:
        raise HTTPException(status_code=400, detail="Regular expression cannot be empty")

    valid_operators = set("()|.*+?")
    invalid_characters = sorted({
        char for char in raw_regex
        if not is_symbol(char) and char not in valid_operators
    })

    if invalid_characters:
        invalid_list = ", ".join(repr(char) for char in invalid_characters)
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported character(s): {invalid_list}",
        )

    try:
        with_concat = insert_concat(raw_regex)
        postfix = to_postfix(with_concat)
        thompson_tree = postfix_to_thompson_tree(postfix)
        nfa = postfix_to_nfa(postfix)
        nfa_data = nfa_to_dict(nfa)
        dfa = nfa_to_dfa(nfa)
        dfa_data = dfa_to_dict(dfa)
    except (ValueError, IndexError) as error:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid regular expression: {error}",
        ) from error

    return {
        "input": raw_regex,
        "with_concat": with_concat,
        "postfix": postfix,
        "thompson_tree": thompson_tree,
        "nfa": nfa_data,
        "dfa": dfa_data
    }
