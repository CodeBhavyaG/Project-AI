import os
import json
import docker
import dotenv
from state import State, Generation
from langchain_openai import ChatOpenAI
from tools import make_folder, make_file, setting_environment, run_code, read_file, search_web
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage, AIMessage

dotenv.load_dotenv()

model = ChatOpenAI(                                                                                                                                                                 
        base_url="http://localhost:11434/v1", # Ollama's local server                                                                                                                   
        api_key="ollama",                     # Dummy key required by the library                                                                                                       
        model="minimax-m2.5:cloud",                     # The local model you just downloaded                                                                                                     
        temperature=0.3                                                                                                                                                                  
    )

# Bind all tools to the model
tools_list = [make_folder, make_file, read_file, setting_environment, run_code, search_web]
model_with_tools = model.bind_tools(tools_list)

async def Generation_Agent(state: State):
    print("\n🚀 --- GENERATION AGENT (CodeAct Loop) STARTED --- 🚀")
    
    system_prompt = """
    You are an autonomous Code Generation Agent. Your job is to act like a software compiler: you take validated application schemas and turn them into a fully working, beautiful, and feature-complete application.
    
    You have the following tools:
    1. make_folder: Create directories.
    2. make_file: Write code files (this will overwrite the file if it exists).
    3. read_file: Read a file's contents.
    4. setting_environment: Runs `npm install`.
    5. run_code: Runs terminal commands (e.g. `node --check server.js`).
    6. search_web: Search for modern documentation, frameworks, or UI components.
    
    CRITICAL INSTRUCTIONS (PHASE 3 - FULL IMPLEMENTATION):
    1. COMPREHENSIVE IMPLEMENTATION: You are no longer just scaffolding. You MUST implement every single route, page, and feature described in the schemas.
    2. FRONTEND (Vite + React): 
       - Read the `ui_schema`. For EVERY page listed, create a separate React component file inside `frontend/src/pages/` or `frontend/src/components/`.
       - Implement actual UI logic, forms, buttons, and API calls (using `axios` or `fetch`) to the backend.
       - Include BEAUTIFUL, modern CSS styling. Do not leave the app looking like raw text. Create stunning interfaces.
    3. BACKEND (Express + TypeScript + SQLite): 
       - Read the `api_schema` and `db_schema`. 
       - Implement every single CRUD endpoint listed in the `api_schema` in `backend/src/index.ts` (or split into routers).
       - Ensure all tables from `db_schema` are created.
    4. RUNNABLE & TESTED: Scaffold using `run_code` (`npx create-vite@latest frontend --template react`, `npm init -y`, etc.). Run `npm install`, then start testing. Fix any TypeScript/syntax errors.
    5. TOOL EXECUTION: Strictly call ONE tool per turn. DO NOT CONCLUDE UNTIL YOU HAVE BUILT EVERY FEATURE FROM THE SCHEMAS. 
    """
    
    state_context = {
        "intent": state.get("intent").model_dump() if state.get("intent") else {},
        "design": state.get("design").model_dump() if state.get("design") else {},
        "api": state.get("api").model_dump() if state.get("api") else {},
        "db": state.get("db").model_dump() if state.get("db") else {},
        "ui": state.get("ui").model_dump() if state.get("ui") else {},
        "auth": state.get("auth").model_dump() if state.get("auth") else {},
    }
    
    prompt = f"Here is the validated architecture:\n{state_context}\n\nStart building and testing the project iteratively using your tools."
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=prompt)
    ]
    
    print("Starting CodeAct loop (max 50 steps)...")
    
    files_created = []

    for step in range(50): # Increased to 50 steps for full feature implementation
        print(f"\n--- CodeAct Step {step + 1} ---")
        # Robust Retry Logic for API Rate Limits & Timeouts
        max_retries = 5
        response = None
        for attempt in range(max_retries):
            try:
                response = await model_with_tools.ainvoke(messages)
                break
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                print(f"API Error ({str(e)[:100]}), retrying in {10 * (attempt + 1)}s...")
                import asyncio
                await asyncio.sleep(10 * (attempt + 1))
        messages.append(response)
        
        if not response.tool_calls:
            print("✅ Agent concluded its work:")
            print(response.content)
            break
            
        # Execute only the first tool call to prevent parallel execution crashes
        tool_call = response.tool_calls[0]
        tool_name = tool_call["name"]
        tool_args = tool_call["args"]
        
        print(f"🛠️ Agent called tool: {tool_name}")
        
        try:
            if tool_name == "make_file":
                res = make_file.invoke(tool_args)
                if "file_name" in tool_args and tool_args["file_name"] not in files_created:
                    files_created.append(tool_args["file_name"])
            elif tool_name == "make_folder":
                res = make_folder.invoke(tool_args)
            elif tool_name == "read_file":
                res = read_file.invoke(tool_args)
            elif tool_name == "setting_environment":
                res = setting_environment.invoke(tool_args)
            elif tool_name == "run_code":
                res = run_code.invoke(tool_args)
            elif tool_name == "search_web":
                res = search_web.invoke(tool_args)
            else:
                res = f"Error: Unknown tool {tool_name}"
        except Exception as e:
            res = f"Tool execution failed: {e}"
        
        # Sleep for 10 seconds to prevent API 429 Too Many Requests rate limits
        import asyncio
        await asyncio.sleep(10)
            
        print(f"Tool result: {str(res)[:100]}...")
        
        # Truncate result if it's too long to prevent LLM context timeout
        res_str = str(res)
        if len(res_str) > 2000:
            res_str = res_str[:1000] + "\n...[TRUNCATED]...\n" + res_str[-1000:]
        
        # Append success message for the executed tool
        messages.append(ToolMessage(content=res_str, tool_call_id=tool_call["id"]))
        
        # If the model tried parallel tool calls, fail the rest gracefully
        if len(response.tool_calls) > 1:
            print(f"⚠️ Warning: Model attempted {len(response.tool_calls)} parallel calls. Ignoring subsequent calls.")
            for tc in response.tool_calls[1:]:
                messages.append(ToolMessage(
                    content="Error: Parallel tool calls are forbidden. Only the first tool was executed. Call this tool again in the next turn.",
                    tool_call_id=tc["id"]
                ))
                
    print("\n--------------------------------------\n")
    
    # Return a dummy Generation object for state compatibility
    return {"generation": Generation(files=[])}
