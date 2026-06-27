import os
import dotenv
from state import table ,DB ,State
from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace

dotenv.load_dotenv()  # Load environment variables from .env file
os.environ["HUGGINGFACEHUB_API_TOKEN"] = os.getenv("HF_TOKEN")

async def DB_Agent(state : State):
    repo_id ="microsoft/FastContext-1.0-4B-RL"

    llm = HuggingFaceEndpoint(repo_id=repo_id, task="text-generation",temperature=0.0)
    model = ChatHuggingFace(llm=llm)

    model = model.with_structured_output(DB)

    system_prompt="""
    You are a Database Architect Agent in an AI software compiler. Your job is to design the database schema for the application based on the architect's design.
    
    Analyze the input application design (specifically the "entities" listed in the design state) and output a JSON object containing the database tables.
    
    Architectural Rules:
    1. Generate a table for each entity in the design's entities list.
    2. Because the schema format only allows a single attributes list for each table, you MUST format the attributes array as follows:
       - The first element must declare the table's name using this format: "table: <table_name>" (snake_case).
       - The subsequent elements must declare the columns and their constraints in format: "<column_name>: <data_type> [constraints]" (e.g. "id: UUID PRIMARY KEY").
    
    Output Schema:
    Your output must exactly match this JSON structure:
    {
        "tables": [
            {
            "attributes": [
                "table: table_name",
                "column_name_1: DATA_TYPE constraints",
                "column_name_2: DATA_TYPE constraints"
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
    prompt = f"The system users prompt is {state.get("query")} use this as a context and the input give to you is Input: {state.get("design")}"

    messages = [
        {"role" : "system", "content" :system_prompt},
        {"role" : "ai", "content" : prompt}
    ]

    response = await model.ainvoke(messages)

    return {"db":response}


