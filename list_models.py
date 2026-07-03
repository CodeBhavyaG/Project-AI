import os
import google.genai
client = google.genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
for m in client.models.list():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
