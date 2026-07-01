import os
import dotenv
from state import API ,endpoint ,State
from langchain_nvidia_ai_endpoints import ChatNVIDIA

dotenv.load_dotenv()  # Load environment variables from .env file

model = ChatNVIDIA(
    model="meta/llama-3.1-8b-instruct",
    api_key=os.getenv("NVIDIA_API_KEY"),
    temperature=0.1,
    timeout=120
)

model = model.with_structured_output(API)

async def API_Agent(state : State):

    system_prompt="""
    You are an API Architect Agent in an AI software compiler. Your job is to design the API endpoints for the application based on the architect's design.
    
    Analyze the input application design (specifically the "endpoints" listed in the design state) and output a JSON object containing the API schema.
    
    Architectural Rules:
    1. Generate an endpoint path and HTTP method for every endpoint workflow listed in the design.
    2. Every item in the endpoints list must have:
       - path: The relative URL path (e.g., "/api/documents", "/api/chat/{session_id}").
       - method: The HTTP verb. This MUST NOT be prefixed with a slash: "GET", "POST", "PUT", "PATCH", or "DELETE".
    
    Output Schema:
    Your output must exactly match this JSON structure:
    {
        "endpoints": [
            {
                "path": "/api/your-endpoint",
                "method": "GET"
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
                "method": "POST"
            },
            {
                "path": "/messages",
                "method": "GET"
            }
        ]
    }
    """

    prompt = f"""\n    Transform the following endpoint names into a complete API schema.\n\n    User Context: {state["query"]}\n\n    Endpoints to transform:\n    {', '.join(state.get("design").endpoints) if state.get("design") else ''}\n\n    """
    if state.get("validation") and not state["validation"].is_valid:
        prompt += f"\n\nPREVIOUS VALIDATION ERRORS YOU MUST FIX:\n{state['validation'].model_dump()}\n\n"
    prompt += """    Remember:
    - CREATE/ADD → POST
    - READ/GET → GET
    - UPDATE/MODIFY → PATCH or PUT
    - DELETE → DELETE

    Convert each endpoint name to a proper REST path and assign the correct HTTP method.
    Output ONLY valid JSON with no additional text.
    """

    messages = [
        {"role" : "system", "content" :system_prompt},
        {"role" : "user", "content" : prompt}
    ]

    response = await model.ainvoke(messages)

    return {"api":response}


