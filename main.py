from langgraph.graph.message import add_messages
from langgraph.graph import StateGraph ,START ,END
from agent.Intent import Intent_Agent
from agent.test import test_agent
from agent.Design import Design_Agent
from state import State

if __name__ == "__main__":
    graph = StateGraph(State)
    graph.add_node("Intent Agent",Intent_Agent)
    graph.add_node("Design Agent",Design_Agent)
    graph.add_node("Test Agent",test_agent)
    graph.add_edge(START,"Intent Agent")
    graph.add_edge("Intent Agent","Design Agent")
    graph.add_edge("Design Agent","Test Agent")
    graph.add_edge("Test Agent",END)

    graph = graph.compile()
    graph.invoke({"query":"Make a online python compiler"})
    

    