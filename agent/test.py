from state import State
import json

async def test_agent(state : State):
    print(json.dumps(state.get("validation").model_dump(), indent=4) if state.get("validation") else "{}")
    return {}