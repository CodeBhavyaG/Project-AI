import os
import dotenv
from state import API ,endpoint ,State
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

dotenv.load_dotenv()  # Load environment variables from .env file
os.environ["HUGGINGFACEHUB_API_TOKEN"] = os.getenv("HF_TOKEN")

async def API_Agent(state : State):
    repo_id ="microsoft/FastContext-1.0-4B-RL"

    llm = HuggingFaceEndpoint(repo_id=repo_id, task="text-generation",temperature=0.1)
    model = ChatHuggingFace(llm=llm)

    model = model.with_structured_output(API)

    system_prompt="""
    You are an API Architect Agent in an AI software compiler. Your job is to design the API endpoints for the application based on the architect's design.
    
    Analyze the input application design (specifically the "endpoints" listed in the design state) and output a JSON object containing the API schema.
    
    Architectural Rules:
    1. Generate an endpoint path and HTTP method for every endpoint workflow listed in the design.
    2. Every item in the endpoints list must have:
       - path: The relative URL path (e.g., "/api/documents", "/api/chat/{session_id}").
       - method: The HTTP verb. This MUST be prefixed with a slash: "/GET", "/POST", "/PUT", "/PATCH", or "/DELETE". (e.g. use "/POST" instead of "POST").
    
    Output Schema:
    Your output must exactly match this JSON structure:
    {
        "endpoints": [
            {
                "path": "/api/your-endpoint",
                "method": "/GET"
            }
        ]
    }
    Example:
    Input:
    {
        "design": {
            "pages": ["ChatWorkspace"],
            "entities": ["ChatMessage"],
            "endpoints": ["send_message", "get_messages"]
        }
    }
    JSON Output:
    {
        "endpoints": [
            {
                "path": "/messages",
                "method": "/POST"
            },
            {
                "path": "/messages",
                "method": "/GET"
            }
        ]
    }
    """
    prompt = f"""
    Transform the following endpoint names into a complete API schema.

    User Context: {state.get("query")}

    Endpoints to transform:
    {', '.join(state.get("design", {}).get("endpoints", []))}

    Remember:
    - CREATE/ADD → /POST
    - READ/GET → /GET
    - UPDATE/MODIFY → /PATCH or /PUT
    - DELETE → /DELETE

    Convert each endpoint name to a proper REST path and assign the correct HTTP method.
    Output ONLY valid JSON with no additional text.
    """

    messages = [
        {"role" : "system", "content" :system_prompt},
        {"role" : "ai", "content" : prompt}
    ]

    response = await model.ainvoke(messages)

    return {"api":response}


