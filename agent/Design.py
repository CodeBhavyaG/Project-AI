# from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
from langchain_openai import ChatOpenAI
from state import State, Design
import os
import dotenv

dotenv.load_dotenv()  # Load environment variables from .env file

async def Design_Agent(state : State):
    model = ChatOpenAI(
      model="meta-llama/Llama-3.3-70B-Instruct",
      openai_api_base="https://router.huggingface.co/v1",
      openai_api_key=os.getenv("HF_TOKEN"),
      temperature=0.1
    )

    model = model.with_structured_output(Design, method="json_mode")

    system_prompt = """
    You are a software architect agent. Your task is to convert high-level application features into a concrete application architecture design.

    Analyze the input application intent (project name and features list) and output a JSON object containing pages, database entities, and API endpoints.

    ### Architectural Rules:
    1. `pages`: Must ONLY represent full view screens/pages (e.g., HomeFeed, Dashboard). Do NOT include buttons, features (like "real-time"), or styles (like "responsive").
    2. `entities`: Must ONLY represent database tables/data models (e.g., User, Pin, Board). Do NOT include UI components or transient states.
    3. `endpoints`: Must ONLY represent API routes/actions (e.g., get_feed, create_pin). Do NOT include UI rendering descriptors.

    ### Output Format:
    Your output must match this schema:
    {
      "pages": ["List of frontend page names in PascalCase"],
      "entities": ["List of core database entity/model names in PascalCase"],
      "endpoints": ["List of API workflow names in snake_case"]
    }

    ### Example:
    Input:
    {
      "project_name": "RAG Application",
      "features": ["vector_search", "document_ingestion", "postgresql_database", "chat_interface"]
    }

    JSON Output:
    {
      "pages": [
        "ChatWorkspace",
        "DocumentUploadDashboard"
      ],
      "entities": [
        "User",
        "Document",
        "ChatMessage"
      ],
      "endpoints": [
        "upload_document",
        "search_semantic",
        "send_chat_message",
        "get_chat_history"
      ]
    }
    """

    messages = [
        {"role" : "system", "content" :system_prompt},
        {"role" : "ai", "content" : str(state.get("intent"))}
    ]

    response = await model.ainvoke(messages)

    return {"design":response}
