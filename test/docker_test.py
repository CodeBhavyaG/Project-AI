import docker
import os

def run_docker_sandbox():
    print("Connecting to Docker daemon...")
    try:
        client = docker.from_env()
    except Exception as e:
        print(f"Failed to connect to Docker. Is Docker Desktop running? Error: {e}")
        return

    # Create a local directory for the sandbox volume
    sandbox_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "agent_workspace"))
    os.makedirs(sandbox_dir, exist_ok=True)
    print(f"Created isolated workspace at: {sandbox_dir}")

    # Create a dummy file in the workspace to prove it mounts
    test_file_path = os.path.join(sandbox_dir, "test.js")
    with open(test_file_path, "w") as f:
        f.write('console.log("Hello! This JavaScript file was executed safely inside the Docker container!");\n')
        f.write('const fs = require("fs");\n')
        f.write('fs.writeFileSync("/workspace/output.txt", "The agent successfully wrote this file back to the host!");\n')
        
    print("Starting secure Docker sandbox (node:20-alpine)...")
    container = None
    try:
        # Run the container securely
        # Using node:20-alpine because it's tiny and has Node.js (which you need for React/Express)
        container = client.containers.run(
            "node:20-alpine",
            command="sleep infinity",  # Keep the container alive so we can run multiple commands
            volumes={sandbox_dir: {'bind': '/workspace', 'mode': 'rw'}},
            working_dir="/workspace",
            detach=True,
            remove=True # Automatically clean up the container when it stops
        )
        
        print(f"Sandbox container {container.short_id} is running.")
        
        print("\n--- Executing Code Inside Sandbox ---")
        # Execute the JS file using node
        exit_code, output = container.exec_run("node test.js")
        
        print(f"Exit Code: {exit_code}")
        print(f"Agent Output:\n{output.decode('utf-8')}")
        print("-------------------------------------\n")
        
        # Verify the agent wrote the output file correctly
        output_txt_path = os.path.join(sandbox_dir, "output.txt")
        if os.path.exists(output_txt_path):
            with open(output_txt_path, "r") as f:
                print(f"Content of newly created file on host: {f.read()}")
        else:
            print("The agent failed to write the file.")
            
    finally:
        if container:
            print(f"\nStopping and destroying sandbox container {container.short_id}...")
            container.stop()
            print("Sandbox securely destroyed.")

if __name__ == "__main__":
    run_docker_sandbox()
