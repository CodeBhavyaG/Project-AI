import os
import json
import docker
import dotenv
from state import State, Generation
from langchain_nvidia_ai_endpoints import ChatNVIDIA

dotenv.load_dotenv()

model = ChatNVIDIA(
    model="meta/llama-3.1-8b-instruct",
    api_key=os.getenv("NVIDIA_API_KEY"),
    temperature=0.1,
    timeout=120
)
model = model.with_structured_output(Generation)

import asyncio

async def Generation_Agent(state: State):
    print("\n🚀 --- GENERATION AGENT STARTED --- 🚀")
    
    system_prompt = """
    You are the Code Generation Agent in an AI software compiler. 
    Your job is to read the validated architectures (API, DB, UI, Design) and write the actual code files.
    
    Generate a simple Express.js backend (server.js) and a package.json that implements a tiny subset of the API schema provided.
    Because this is a test, keep the code very minimal. Just create the Express server, add one or two routes from the API schema, and make it listen on port 3000.
    
    Output a JSON object with a list of files.
    """
    
    state_context = {
        "api": state.get("api").model_dump() if state.get("api") else {},
    }
    
    prompt = f"Here is the API schema:\n{state_context}\n\nGenerate the Node.js Express server.js and package.json files."
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ]
    
    print("Generating code (this may take a minute)...")
    response = await model.ainvoke(messages)
    
    def write_and_test_files(files):
        # Write the files to the Docker sandbox workspace
        sandbox_dir = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(__file__)), "test", "agent_workspace"))
        os.makedirs(sandbox_dir, exist_ok=True)
        
        for file in files:
            file_path = os.path.join(sandbox_dir, file.filepath)
            # Ensure directories exist if the AI provided paths like src/app.js
            os.makedirs(os.path.dirname(file_path), exist_ok=True)
            with open(file_path, "w") as f:
                f.write(file.content)
            print(f"Wrote file to sandbox: {file.filepath}")

        # Now, test the generated code inside a secure Docker container!
        print("\n--- Testing Code in Docker Sandbox ---")
        container = None
        try:
            client = docker.from_env()
            container = client.containers.run(
                "node:20-alpine",
                command="sleep infinity",
                volumes={sandbox_dir: {'bind': '/workspace', 'mode': 'rw'}},
                working_dir="/workspace",
                detach=True,
                remove=True
            )
            
            print("Installing npm dependencies inside sandbox...")
            exit_code, output = container.exec_run("npm install")
            print(f"NPM Install Exit Code: {exit_code}")
            
            print("Running server syntax check (node --check server.js)...")
            # We run --check so it validates the JavaScript syntax without actually starting the blocking Express server
            exit_code, output = container.exec_run("node --check server.js")
            if exit_code == 0:
                print("✅ SUCCESS: The generated Express server started perfectly in the sandbox without syntax errors!")
            else:
                print(f"❌ ERROR: The generated code crashed in the sandbox:\n{output.decode('utf-8')}")
                
        except Exception as e:
            print(f"Docker testing failed: {e}")
        finally:
            if container:
                container.stop()
                print("Sandbox securely destroyed.")
                
    # Run all the blocking file I/O and Docker code inside a separate thread to keep LangGraph happy
    await asyncio.to_thread(write_and_test_files, response.files)
            
    print("--------------------------------------\n")
    return {"generation": response}
