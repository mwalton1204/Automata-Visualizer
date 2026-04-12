from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from services.regex_utils import insert_concat, to_postfix
from services.nfa import postfix_to_nfa, nfa_to_dict

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

@app.get("/")
def root():
    return {"message": "API is working!"}

@app.post("/convert") # Use POST for sending data
def convert(req: RegexRequest):
    raw_regex = req.regex.strip() # Remove whitespace

    with_concat = insert_concat(raw_regex)
    postfix = to_postfix(with_concat)
    nfa = postfix_to_nfa(postfix)
    nfa_data = nfa_to_dict(nfa)

    return {
        "input": raw_regex,
        "with_concat": with_concat,
        "postfix": postfix,
        "nfa": nfa_data
    }