import os
import dotenv
from state import table ,DB ,State
from langchain_nvidia_ai_endpoints import ChatNVIDIA

dotenv.load_dotenv()  # Load environment variables from .env file

model = ChatNVIDIA(
    model="meta/llama-3.1-8b-instruct",
    api_key=os.getenv("NVIDIA_API_KEY"),
    temperature=0.1,
    timeout=120
)

model = model.with_structured_output(DB)

async def DB_Agent(state : State):

    system_prompt="""
    You are a Database Architect Agent in an AI software compiler. Your job is to design the database schema for the application based on the architect's design.
    
    Analyze the input application design (specifically the "entities" listed in the design state) and output a JSON object containing the database tables.
    
    Architectural Rules:
    1. Generate a table for each entity in the design's entities list.
    2. Define a primary key for every table (e.g., UUID PRIMARY KEY).
    3. Define appropriate foreign keys if relationships are implied between entities.
    
    Output Schema:
    Your output must exactly match this JSON structure:
    {
        "tables": [
            {
                "name": "user",
                "attributes": [
                    {
                        "name": "id",
                        "type": "UUID",
                        "constraints": "PRIMARY KEY"
                    },
                    {
                        "name": "email",
                        "type": "VARCHAR(255)",
                        "constraints": "UNIQUE NOT NULL"
                    }
                ]
            }
        ]
    }
    Example:
    Input:
    {
        "design": {
            "pages": ["ChatWorkspace"],
            "entities": ["User", "ChatMessage"],
            "endpoints": ["send_message"]
        }
    }
    """
    prompt = f"The system users prompt is {state['query']} use this as a context and the input give to you is Input: {state.get('design')}"

    if state.get("validation") and not state["validation"].is_valid:
        prompt += f"\n\nPREVIOUS VALIDATION ERRORS YOU MUST FIX:\n{state['validation'].model_dump()}"

    messages = [
        {"role" : "system", "content" :system_prompt},
        {"role" : "user", "content" : prompt}
    ]

    response = await model.ainvoke(messages)

    return {"db":response}


