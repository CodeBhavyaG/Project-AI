import os 
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from state import State

def test_agent(state : State):
    print("Test Agent - Design extracted:", state.get("design"))
    return {}