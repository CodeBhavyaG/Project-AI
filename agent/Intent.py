import os
import dotenv

from state import State, Intent
from langchain.chat_models import init_chat_model

dotenv.load_dotenv()  # Load environment variables from .env file
os.environ["HUGGINGFACEHUB_API_TOKEN"] = os.getenv("HF_TOKEN")

def Intent_Agent(state : State) :

    model = init_chat_model(
        model="Qwen/Qwen3-0.6B:featherless-ai",
        model_provider="openai", # Change from "hugging face" to "openai"
        base_url="https://router.huggingface.co/v1",
        api_key=os.getenv("HF_TOKEN"), # Make sure the HF_TOKEN is passed here as the api_key
        temperature=0.7
    )
    
    model = model.with_structured_output(Intent, method="json_mode")

    prompt = f"""\n\nUser's Request: {state["query"]}
    JSON Output:"""

    system_prompt ="""
    You are the first stage of an AI software compiler. Your job is to analyze the user's request, extract the high-level intent, and infer the complete, normalized technical features required to build the
    application.
    Do not simply copy substrings from the user's prompt. Instead, translate descriptions into standard technical modules and infer implicit features required for that type of application to work. ### Guidelines:
    1. **Normalize**: Translate colloquial terms to standard tags (e.g., "postgrase" -> "postgresql", "login/signup" -> "authentication", "good design" -> "ui_dashboard").
    2. **Infer Implicit Needs**: Look at the core application type and add necessary backbone features (e.g., a "RAG app" needs "document_ingestion" and "vector_embeddings" to function). 3. **Keep Features Canonical**: Use lowercase snake_case for feature names.
    ### Example 1:
    User Request: "RAG app that has a postgrase database and a good frontend design"
    JSON Output:
    {
        "project_name": "RAG Application",
        "features": [
            "authentication",
            "vector_embeddings",
            "document_ingestion",
            "semantic_search",
            "postgresql",
            "chat_ui"
        ]
    }
    ### Example 2:
    User Request: "A simple CRM with contacts, billing, and mail integrations"
    JSON Output:
    {
        "project_name": "CRM",
        "features": [
            "authentication",
        ]
    }
    "contact_management",
    "billing_and_payments",
    "email_notifications",
    "dashboard"
    Output format:
    {"project_name": "Standardized Name of App", "features": ["list", "of", "canonical", "features"]}
    """

    
    messages = [
        {"role": "system", "content":system_prompt},
        {"role": "user", "content": prompt}
    ]

    resoponce = model.invoke(messages)
    
    return {"intent":resoponce}




# def to_json(raw_output:str):
#   json_string = None
  
#   # Remove thinking tags first
#   cleaned_output = re.sub(r'<think>[\s\S]*?</think>', '', raw_output).strip()

#   # Attempt to extract JSON from a markdown block (```json ... ```)
#   match = re.search(r'```json\s*([\s\S]*?)\s*```', cleaned_output)
#   if match:
#       json_string = match.group(1)
#   else:
#       # Try to extract JSON object directly
#       json_match = re.search(r'\{[\s\S]*\}', cleaned_output)
#       if json_match:
#           json_string = json_match.group(0)
#       else:
#           json_string = cleaned_output.strip()

#   if json_string:
#       try:
#           output = json.loads(json_string)
#       except json.JSONDecodeError as e:
#           print(f"Error: Could not decode JSON from extracted string: {e}")
#           print(f"Attempted to decode: {json_string}")
#           output = {} # Handle decoding error
#   else:
#       print("Error: No JSON string found or extracted.")
#       output = {} # Handle case where no string was found
#   return output



