from state import State
import json

async def test_agent(state : State):
    print(json.dumps(state.get("api").model_dump(), indent=4) if state.get("api") else "{}")
    print(json.dumps(state.get("ui").model_dump(), indent=4) if state.get("ui") else "{}")
    print(json.dumps(state.get("db").model_dump(), indent=4) if state.get("db") else "{}")
    return {}