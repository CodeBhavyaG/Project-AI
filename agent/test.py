from state import State
import json

async def test_agent(state : State):
    print(json.dumps(state.get("api"),indent=4))
    print(json.dumps(state.get("ui"),indent=4))
    print(json.dumps(state.get("db"),indent=4))
    return {}