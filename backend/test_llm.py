import time
from app.services.llm_service import generate_llm_response

t0 = time.time()
print("Starting generation...")
generator = generate_llm_response("system", "what is AI?")
first = True
for chunk in generator:
    if first:
        print(f"TTFT: {time.time()-t0:.2f}s")
        first = False
    print(f"Chunk: {time.time()-t0:.2f}s - {len(chunk)} chars")

print(f"Total: {time.time()-t0:.2f}s")
