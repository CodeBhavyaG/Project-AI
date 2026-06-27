import asyncio

from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph ,START ,END
from agent.Intent import Intent_Agent
from agent.test import test_agent
from agent.Design import Design_Agent
from agent.API import API_Agent
from agent.DB import DB_Agent
from agent.UI import UI_Agent

from state import State


async def run_pipeline():
    graph = StateGraph(State)
    graph.add_node("Intent Agent",Intent_Agent)
    graph.add_node("Design Agent",Design_Agent)
    graph.add_node("API Agent",API_Agent)
    graph.add_node("DB Agent",DB_Agent)
    graph.add_node("UI Agent",UI_Agent)
    graph.add_node("Test Agent",test_agent)

    graph.add_edge(START,"Intent Agent")
    graph.add_edge("Intent Agent","Design Agent")
    graph.add_edge("Design Agent","API Agent")
    graph.add_edge("Design Agent","DB Agent")
    graph.add_edge("Design Agent","UI Agent")
    graph.add_edge("API Agent","Test Agent")
    graph.add_edge("DB Agent","Test Agent")
    graph.add_edge("UI Agent","Test Agent")
    graph.add_edge("Test Agent",END)

    graph = graph.compile()
    await graph.ainvoke({"query": "Make a online python compiler"})

if __name__ == "__main__":
    # This is the standard entry point to run an async function
    asyncio.run(run_pipeline())