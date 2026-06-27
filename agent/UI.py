import os
import dotenv
from state import UI,entity,State
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

dotenv.load_dotenv()  # Load environment variables from .env file
os.environ["HUGGINGFACEHUB_API_TOKEN"] = os.getenv("HF_TOKEN")

async def UI_Agent(state : State):
    repo_id ="microsoft/FastContext-1.0-4B-RL"

    llm = HuggingFaceEndpoint(repo_id=repo_id, task="text-generation",temperature=0.0)
    model = ChatHuggingFace(llm=llm)

    model = model.with_structured_output(UI)

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
    prompt = f"The system users prompt is {state.get("query")} use this as a context and the input give to you is Input: {state.get("design")}"

    messages = [
        {"role" : "system", "content" :system_prompt},
        {"role" : "ai", "content" : prompt}
    ]

    response = await model.ainvoke(messages)

    return {"ui":response}


