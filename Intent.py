from transformers import AutoModelForCausalLM, AutoTokenizer
import json
import re

def extract_intent(user_prompt: str) -> str:
  model_name = "Qwen/Qwen3-0.6B"

  # load the tokenizer and the model
  tokenizer = AutoTokenizer.from_pretrained(model_name)
  model = AutoModelForCausalLM.from_pretrained(
      model_name,
      torch_dtype="auto",
      device_map="auto"
  )

  # prepare the model input
  system_prompt = """
      You are an intent extraction engine. Analyze the user's prompt and return a valid JSON object.
      
      An example of a valid JSON object is for the prompt "Build a CRM with login and contacts." would be:
      {
      "app_type": "CRM",
      "features": [
          "login",
          "contacts"
          ]
      }

      Output Format:
      {"app_type": "Type of application (e.g., CRM, E-commerce, Social Media, etc.)",
      "features": ["List of features mentioned in the prompt or can be derived from the prompt (e.g., login, contacts, etc.)"]}
  """
  prompt = f"""\n\nUser's Request: {user_prompt}
  JSON Output:"""
  messages = [
      {"role": "user", "content": system_prompt+prompt}
  ]
  text = tokenizer.apply_chat_template(
      messages,
      tokenize=False,
      add_generation_prompt=True,
      enable_thinking=True # Switches between thinking and non-thinking modes. Default is True.
  )
  model_inputs = tokenizer([text], return_tensors="pt").to(model.device)

  # conduct text completion
  generated_ids = model.generate(
      **model_inputs,
      max_new_tokens=32768
  )
  output_ids = generated_ids[0][len(model_inputs.input_ids[0]):].tolist() 

  # parsing thinking content
  try:
      # rindex finding 151668 (</think>)
      index = len(output_ids) - output_ids[::-1].index(151668)
  except ValueError:
      index = 0

  thinking_content = tokenizer.decode(output_ids[:index], skip_special_tokens=True).strip("\n")
  content = tokenizer.decode(output_ids[index:], skip_special_tokens=True).strip("\n")

  print("Thinking Content:", thinking_content)
  return content


def to_json(raw_output:str):
  json_string = None

  # Attempt to extract JSON from a markdown block (```json ... ```)
  match = re.search(r'```json\s*([\s\S]*?)\s*```', raw_output)
  if match:
      json_string = match.group(1)
  else:
      # If no markdown block is found, assume the raw output is a plain JSON string
      json_string = raw_output.strip()

  if json_string:
      try:
          output = json.loads(json_string)
      except json.JSONDecodeError as e:
          print(f"Error: Could not decode JSON from extracted string: {e}")
          print(f"Attempted to decode: {json_string}")
          output = {} # Handle decoding error
  else:
      print("Error: No JSON string found or extracted.")
      output = {} # Handle case where no string was found
  return output