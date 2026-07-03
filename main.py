import asyncio

from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph ,START ,END
from agent.Intent import Intent_Agent
from agent.Generation import Generation_Agent
from agent.Design import Design_Agent
from agent.API import API_Agent
from agent.DB import DB_Agent
from agent.UI import UI_Agent
from agent.Validation import Validation_Agent
import json
from state import State

def route_validation(state: State):
    if state.get("validation") and state["validation"].is_valid:
        return "Generation Agent"
    else:
        # Loop back to fix issues
        print(json.dumps(state.get("validation").model_dump(), indent=4) if state.get("validation") else "{}")
        return ["API Agent", "DB Agent", "UI Agent"]


def run_pipeline():
    graph = StateGraph(State)
    graph.add_node("Intent Agent",Intent_Agent)
    graph.add_node("Design Agent",Design_Agent)
    graph.add_node("API Agent",API_Agent)
    graph.add_node("DB Agent",DB_Agent)
    graph.add_node("UI Agent",UI_Agent)
    graph.add_node("Validation Agent", Validation_Agent)
    graph.add_node("Generation Agent",Generation_Agent)

    graph.add_edge(START,"Intent Agent")
    graph.add_edge("Intent Agent","Design Agent")
    graph.add_edge("Design Agent","API Agent")
    graph.add_edge("Design Agent","DB Agent")
    graph.add_edge("Design Agent","UI Agent")
    graph.add_edge("API Agent","Validation Agent")
    graph.add_edge("DB Agent","Validation Agent")
    graph.add_edge("UI Agent","Validation Agent")
    
    graph.add_conditional_edges("Validation Agent", route_validation, {
        "Generation Agent": "Generation Agent",
        "API Agent": "API Agent",
        "DB Agent": "DB Agent",
        "UI Agent": "UI Agent"
    })
    graph.add_edge("Generation Agent",END)
    return graph

# Create and compile the graph so LangGraph CLI can discover it
builder = run_pipeline()
compiled_graph = builder.compile()

async def run_pipeline_async(query: str):
    async for event in compiled_graph.astream({"query": f"{query}"}):
        for k, v in event.items():
            print(f"Finished node: {k}")

if __name__ == "__main__":
    # This is the standard entry point to run an async function
    query = "Make a complex online marketplace for selling digital art, including user profiles, shopping carts, reviews, and a payment processing endpoint."
    query = "build a pintrest clone"
    asyncio.run(run_pipeline_async(query))