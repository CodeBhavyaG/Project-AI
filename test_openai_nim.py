import asyncio
import os
import dotenv
from langchain_openai import ChatOpenAI

dotenv.load_dotenv()

async def test_api():
    print("Testing NVIDIA API via ChatOpenAI...")
    try:
        model = ChatOpenAI(
            model="meta/llama-3.3-70b-instruct",
            api_key=os.getenv("NVIDIA_API_KEY"),
            base_url="https://integrate.api.nvidia.com/v1",
            temperature=0.1,
            timeout=15
        )
        print("Model initialized. Sending prompt...")
        response = await model.ainvoke([{"role": "user", "content": "Say hello!"}])
        print(f"API Response: {response.content}")
    except Exception as e:
        print(f"API Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_api())
