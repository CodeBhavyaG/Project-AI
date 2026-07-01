import os
import dotenv
from state import Validation, State
from langchain_nvidia_ai_endpoints import ChatNVIDIA

dotenv.load_dotenv()

model = ChatNVIDIA(
    model="meta/llama-3.1-8b-instruct",
    api_key=os.getenv("NVIDIA_API_KEY"),
    temperature=0.1,
    timeout=120
)

model = model.with_structured_output(Validation)

async def Validation_Agent(state: State):

    system_prompt = """
    You are the Validation Agent (QA) in an AI software compiler.
    Your job is to cross-reference the generated schemas from the Design, UI, API, and DB agents and ensure they are perfectly consistent.

    Review the input state. Check for these specific inconsistencies:
    1. Does every page in the Design schema have a corresponding UI component schema?
    2. Does every endpoint in the API schema have a valid path and method?
    3. Does every entity in the Design schema have a corresponding DB table?
    4. Do the DB tables reference each other correctly (Foreign Keys)?

    If everything is reasonably consistent, set `is_valid` to true and leave `errors` empty.
    DO NOT be overly strict. If there are minor differences in table names or foreign keys, ignore them.
    If you have already rejected this once (you see previous errors), you MUST set `is_valid` to true this time to prevent an infinite loop.

    The output must strictly match this JSON schema format:
    {
        "is_valid": false,
        "errors": [
            {
                "type": "Missing Table",
                "field": "DB.table_name",
                "message": "Detailed explanation of the inconsistency"
            }
        ]
    }
    """

    # Convert Pydantic objects to dicts for the prompt so the LLM can read them easily
    state_context = {
        "design": state.get("design").model_dump() if state.get("design") else {},
        "ui": state.get("ui").model_dump() if state.get("ui") else {},
        "api": state.get("api").model_dump() if state.get("api") else {},
        "db": state.get("db").model_dump() if state.get("db") else {},
    }

    # If there are existing errors, let the Validation agent know what they were
    previous_validation = state.get("validation")
    if previous_validation and not previous_validation.is_valid:
        state_context["previous_errors"] = previous_validation.model_dump()

    prompt = f"Here is the current state of the application schemas:\n{state_context}\n\nAnalyze them and output the Validation JSON."

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]

    response = await model.ainvoke(messages)

    import json
    print("\n🔍 --- VALIDATION AGENT RAN --- 🔍")
    print(json.dumps(response.model_dump(), indent=4))
    print("---------------------------------\n")

    return {"validation": response}
