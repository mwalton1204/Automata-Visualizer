from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
    return {
        "input": req.regex,
        "message": "Backend received the regex successfully!"
    }