import os
import subprocess
from langchain.tools import tool

WORKSPACE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "test", "agent_workspace"))
os.makedirs(WORKSPACE_DIR, exist_ok=True)

@tool
def make_folder(folder_name: str) -> str:
    """
    Create a new folder in the current working directory.
    """
    path = os.path.join(WORKSPACE_DIR, folder_name)
    os.makedirs(path, exist_ok=True)
    return f"Folder {folder_name} created successfully."
    
@tool
def make_file(file_name: str, content: str) -> str:
    """
    Create a new file with the code in the current working directory.
    """
    path = os.path.join(WORKSPACE_DIR, file_name)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        f.write(content)
    return f"File {file_name} created successfully."

@tool
def read_file(file_name: str) -> str:
    """
    Read the contents of a file in the current working directory.
    """
    path = os.path.join(WORKSPACE_DIR, file_name)
    try:
        with open(path, "r") as f:
            return f.read()
    except Exception as e:
        return f"Error reading file {file_name}: {e}"

@tool
def setting_environment() -> str:
    """
    Set up the environment for the project. This runs `npm install` inside the workspace to install package.json dependencies.
    """
    try:
        result = subprocess.run(
            ["npm", "install"],
            cwd=WORKSPACE_DIR,
            capture_output=True,
            text=True,
            check=True
        )
        return f"Environment set up successfully. Output: {result.stdout}"
    except subprocess.CalledProcessError as e:
        return f"Error setting up environment: {e.stderr}"
    except Exception as e:
        return f"Error setting up environment: {e}"

@tool
def run_code(command: str) -> str:
    """
    Run a command in the current working directory (e.g., 'node --check server.js' or 'npm test' or 'node my_script.js').
    Return the output or any errors encountered during execution.
    """
    try:
        res = subprocess.run(command, shell=True, cwd=WORKSPACE_DIR, capture_output=True, text=True, timeout=60)
        return f"Command executed successfully. Output: \n{res.stdout}\n{res.stderr}"
    except subprocess.TimeoutExpired:
        return f"Command execution timed out after 60 seconds."
    except Exception as e:
        return f"Error executing command: {e}"

from duckduckgo_search import DDGS

@tool
def search_web(query: str) -> str:
    """
    Search the web for documentation, modern UI components, frameworks, or code snippets.
    Use this to look up React, TailwindCSS, or any other modern library syntax.
    """
    try:
        results = DDGS().text(query, max_results=3)
        return "\n\n".join([f"Title: {r['title']}\nBody: {r['body']}\nURL: {r['href']}" for r in results])
    except Exception as e:
        return f"Error searching the web: {e}"