import os
import dotenv
from state import UI,entity,State
from langchain_nvidia_ai_endpoints import ChatNVIDIA

dotenv.load_dotenv()  # Load environment variables from .env file

model = ChatNVIDIA(
    model="meta/llama-3.1-8b-instruct",
    api_key=os.getenv("NVIDIA_API_KEY"),
    temperature=0.1,
    timeout=120
)

model = model.with_structured_output(UI)

async def UI_Agent(state : State):

    system_prompt="""
    You are a UI Architect Agent in an AI software compiler. Your job is to design the user interface structure for the application based on the architect's design.
    Analyze the input application design (specifically the "pages" and "features" listed in the design state) and output a JSON object containing the components for each page.
    
    Architectural Rules:
    
    1. Generate an item in the ui_schema list for every page in the design's pages list.
    
    2. For each page:
    
    -   name: Must match the page name from the design (in PascalCase, e.g., "ChatWorkspace").
    -   components: A list of specific frontend components needed for that page (in PascalCase, e.g., ["MessageList", "MessageInput", "DocumentSidebar"]).
    
    Output Schema:
    Your output must exactly match this JSON structure:
    {
        "ui_schema": [
            {
                "name": "PageName",
                "components": ["Component1", "Component2", "Component3"]
            }
        ]
    }

    Example:
    Input:
    {
        "design": {
            "pages": ["ChatWorkspace", "SettingsPage"],
            "entities": ["ChatMessage", "User"],
            "endpoints": ["send_message", "get_messages"]
        }
    }
    JSON Output:
    {
        "ui_schema": [
            {
                "name": "ChatWorkspace",
                "components": [
                    "ChatContainer",
                    "MessageHistory",
                    "MessageInputField",
                    "SendButton",
                    "UserStatusIndicator"
                ]
            },
            {
                "name": "SettingsPage",
                "components": [
                    "ProfileSection",
                    "NotificationToggle",
                    "SaveButton"
                ]
            }
        ]
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

    return {"ui":response}


