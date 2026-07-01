# import os
# import asyncio
# from dotenv import load_dotenv
# from langchain_nvidia_ai_endpoints import ChatNVIDIA
# from pydantic import BaseModel

# load_dotenv()

# class Intent(BaseModel):
#     project_name: str
#     features: list[str]

# async def main():
#     model = ChatNVIDIA(
#         model="meta/llama-3.3-70b-instruct",
#         api_key=os.getenv("NVIDIA_API_KEY"),
#     )
#     model = model.with_structured_output(Intent)
#     try:
#         res = await model.ainvoke("I want an online store")
#         print(res)
#     except Exception as e:
#         print(type(e), e)

# asyncio.run(main())
from openai import OpenAI

client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = "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"
)


completion = client.chat.completions.create(
  model="deepseek-ai/deepseek-v4-pro",
  messages=[{"role":"user","content":""}],
  temperature=1,
  top_p=0.95,
  max_tokens=16384,
  extra_body={"chat_template_kwargs":{"thinking":False}},
  stream=False
)

print(completion.choices[0].message.content)