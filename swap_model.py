import os
import glob

# Find all agent python files
agent_files = glob.glob("/Users/archbutmac/Desktop/Project-AI/agent/*.py")

for file_path in agent_files:
    with open(file_path, "r") as f:
        content = f.read()
    
    # Replace the broken 70B model with the working 8B model
    new_content = content.replace("meta/llama-3.3-70b-instruct", "meta/llama-3.1-8b-instruct")
    
    with open(file_path, "w") as f:
        f.write(new_content)
        
print("Updated all agent files to use Llama 3.1 8B!")
