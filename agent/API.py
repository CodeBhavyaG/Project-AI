import os
import dotenv
from state import API ,endpoint ,State
from langchain_openai import ChatOpenAI

dotenv.load_dotenv()  # Load environment variables from .env file

async def API_Agent(state : State):
    model = ChatOpenAI(
        model="meta-llama/Llama-3.3-70B-Instruct",
        openai_api_base="https://router.huggingface.co/v1",
        openai_api_key=os.getenv("HF_TOKEN"),
        temperature=0.1
    )

    model = model.with_structured_output(API, method="json_mode")

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

    prompt = f"""\n    Transform the following endpoint names into a complete API schema.\n\n    User Context: {state["query"]}\n\n    Endpoints to transform:\n    {', '.join(state.get("design").endpoints) if state.get("design") else ''}\n\n    Remember:\n    - CREATE/ADD → /POST\n    - READ/GET → /GET\n    - UPDATE/MODIFY → /PATCH or /PUT\n    - DELETE → /DELETE\n\n    Convert each endpoint name to a proper REST path and assign the correct HTTP method.\n    Output ONLY valid JSON with no additional text.\n    """

    messages = [
        {"role" : "system", "content" :system_prompt},
        {"role" : "ai", "content" : prompt}
    ]

    response = await model.ainvoke(messages)

    return {"api":response}


