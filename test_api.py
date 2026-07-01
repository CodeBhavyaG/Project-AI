import asyncio
import os
import dotenv
from langchain_nvidia_ai_endpoints import ChatNVIDIA

dotenv.load_dotenv()

async def test_api():
    print("Testing NVIDIA API...")
    try:
        model = ChatNVIDIA(
            model="meta/llama-3.3-70b-instruct",
            api_key=os.getenv("NVIDIA_API_KEY"),
            temperature=0.1,
            timeout=10
        )
        print("Model initialized. Sending prompt...")
        response = await model.ainvoke([{"role": "user", "content": "Say hello!"}])
        print(f"API Response: {response.content}")
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_api())
