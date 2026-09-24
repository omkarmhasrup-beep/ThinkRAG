import os
import time
from dotenv import load_dotenv
load_dotenv('.env')

from google import genai
from google.genai import types

def run_benchmark(client, model_name, iterations=3):
    print(f"\n=============================================")
    print(f"BENCHMARKING: {model_name}")
    print(f"=============================================")
    
    system_prompt = (
        "You are a precise, helpful AI assistant that answers "
        "questions based on provided documents. "
        "IMPORTANT RULES:\n"
        "1. Answer ONLY using the provided context. "
        "Do NOT use any prior knowledge.\n"
        "2. NEVER show your reasoning, thinking steps, analysis, "
        "chain-of-thought, or any intermediate processing. "
        "Output ONLY the final answer.\n"
        "3. Match the language of the user's question "
        "(English or Marathi).\n"
        "4. Provide detailed, comprehensive, and well-structured answers "
        "with explanations and examples when possible.\n"
        "TASK: Answer the user's question strictly based "
        "on the context below.\n"
        "If the answer is not present in the context, "
        "respond by saying that you don't have enough "
        "information in the provided knowledge base to "
        "answer that. "
        "CRITICAL: You MUST translate this fallback response "
        "into the SAME LANGUAGE as the user's question "
        "(e.g. if the user asks in Marathi, reply in Marathi).\n\n"
        "Context:\n"
        "\n--- Excerpt 1 from dummy.pdf ---\n"
        "The quick brown fox jumps over the lazy dog.\n"
    )
    question = "What does the fox jump over?"
    
    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=0.7,
        max_output_tokens=2048,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
    )

    ttfts = []
    totals = []

    for i in range(iterations):
        print(f"\n--- Request {i+1} ---")
        t0 = time.perf_counter()
        
        response = client.models.generate_content_stream(
            model=model_name,
            contents=[question],
            config=config,
        )
        
        t1 = time.perf_counter()
        print(f"API request start overhead: {(t1 - t0) * 1000:.2f} ms")
        
        first_token_time = None
        for chunk in response:
            if first_token_time is None:
                first_token_time = time.perf_counter()
                
        t2 = time.perf_counter()
        
        if first_token_time:
            ttft = (first_token_time - t1) * 1000
            streaming_time = (t2 - first_token_time) * 1000
        else:
            ttft = (t2 - t1) * 1000
            streaming_time = 0

        total_time = (t2 - t0) * 1000
        
        ttfts.append(ttft)
        totals.append(total_time)
        
        print(f"First byte/chunk received (TTFT): {ttft:.2f} ms")
        print(f"Total streaming time: {streaming_time:.2f} ms")
        print(f"Total response time: {total_time:.2f} ms")
        
    print(f"\n--- {model_name} AVERAGE ---")
    print(f"Average TTFT: {sum(ttfts)/len(ttfts):.2f} ms")
    print(f"Average Total Time: {sum(totals)/len(totals):.2f} ms")

if __name__ == '__main__':
    api_key = os.getenv('GEMINI_API_KEY')
    client = genai.Client(api_key=api_key)
    
    # Run alternative fast model
    run_benchmark(client, "gemini-3.5-flash", 2)
    
    # Run production model
    run_benchmark(client, "gemini-3.6-flash", 2)
