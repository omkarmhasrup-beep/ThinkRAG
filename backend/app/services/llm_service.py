import httpx
import json
import re

from ..core.config import settings


# ============================================================
# THINK / REASONING TAGS
# ============================================================

_THINK_OPEN_RE = re.compile(
    r"<(think|thinking|analysis|reasoning)>",
    re.IGNORECASE
)

_THINK_CLOSE_RE = re.compile(
    r"</(think|thinking|analysis|reasoning)>",
    re.IGNORECASE
)


# ============================================================
# FILTER THINK BLOCKS
# ============================================================

def _filter_think_blocks(raw_stream):

    buffer = ""
    inside_think = False
    MAX_PARTIAL_TAG_LENGTH = 20

    import time
    first_chunk_received = False
    
    for token in raw_stream:
        if not first_chunk_received:
            first_chunk_received = True
            t_gemini_first_chunk = time.time() * 1000
            print(f"[E2E] 5. Gemini first chunk arrives at backend: {t_gemini_first_chunk}")

        if not token:
            continue

        buffer += token

        while True:
            if inside_think:
                close_match = _THINK_CLOSE_RE.search(buffer)
                if close_match:
                    buffer = buffer[close_match.end():]
                    inside_think = False
                    continue
                else:
                    if len(buffer) > MAX_PARTIAL_TAG_LENGTH:
                        buffer = buffer[-MAX_PARTIAL_TAG_LENGTH:]
                    break
            else:
                open_match = _THINK_OPEN_RE.search(buffer)
                if open_match:
                    before = buffer[:open_match.start()]
                    if before:
                        yield before
                    buffer = buffer[open_match.end():]
                    inside_think = True
                    continue

                safe_end = len(buffer) - MAX_PARTIAL_TAG_LENGTH
                if safe_end > 0:
                    output = buffer[:safe_end]
                    if output:
                        yield output
                    buffer = buffer[safe_end:]
                break

    if not inside_think and buffer:
        cleaned = _THINK_OPEN_RE.sub("", buffer)
        cleaned = _THINK_CLOSE_RE.sub("", cleaned)
        if cleaned:
            yield cleaned


# ============================================================
# HTTP CLIENT
# ============================================================

_http_client = httpx.Client(
    timeout=600.0
)


# ============================================================
# GOOGLE GEMINI CLIENT
# ============================================================
_gemini_client = None

def get_gemini_client():
    global _gemini_client
    if _gemini_client is None:
        from google import genai
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY environment variable is missing or invalid.")
        try:
            _gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)
        except Exception as e:
            raise RuntimeError(f"Failed to initialize Gemini Client: {e}")
    return _gemini_client

# ============================================================
# GOOGLE GEMINI STREAM
# ============================================================

def _stream_gemini(system_prompt: str, question: str, image: str = None):
    from google.genai import types
    import base64

    client = get_gemini_client()
    model_name = settings.GEMINI_MODEL or "gemini-2.5-flash"

    contents = []
    if image:
        try:
            image_bytes = base64.b64decode(image)
            contents.append(
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type="image/jpeg"
                )
            )
        except Exception as img_err:
            print(f"[GEMINI] Warning: could not parse image: {img_err}")

    contents.append(question)

    config = types.GenerateContentConfig(
        system_instruction=system_prompt,
        temperature=0.7,
        max_output_tokens=2048,
        automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True)
    )

    response = client.models.generate_content_stream(
        model=model_name,
        contents=contents,
        config=config,
    )

    for chunk in response:
        if chunk.text:
            yield chunk.text


# ============================================================
# LLM STREAM (GEMINI / GROQ / OLLAMA)
# ============================================================

def generate_llm_response(
    system_prompt: str,
    question: str,
    image: str = None
):

    # ============================================================
    # 1. GOOGLE GEMINI
    # ============================================================
    if settings.GEMINI_API_KEY:
        try:
            for chunk in _filter_think_blocks(_stream_gemini(system_prompt, question, image)):
                if chunk:
                    yield chunk
            return
        except Exception as e:
            yield f"\n[Google Gemini API Error]: {e}"
            return

    # ============================================================
    # 2. GROQ
    # ============================================================
    elif settings.GROQ_API_KEY:

        try:
            
            user_content = question
            model_to_use = settings.GROQ_MODEL
            
            if image:
                user_content = [
                    {"type": "text", "text": question},
                    {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image}"}}
                ]
                # Default to a vision model if the current one might not support vision
                if "vision" not in model_to_use.lower() and "qwen" not in model_to_use.lower():
                    model_to_use = "llama-3.2-11b-vision-preview" # Fallback vision model

            with _http_client.stream(
                "POST",
                "https://api.groq.com/openai/v1/chat/completions",

                headers={
                    "Authorization": (
                        f"Bearer {settings.GROQ_API_KEY}"
                    ),
                    "Content-Type": "application/json"
                },

                json={
                    "model": model_to_use,

                    "messages": [
                        {
                            "role": "system",
                            "content": system_prompt
                        },
                        {
                            "role": "user",
                            "content": user_content
                        }
                    ],

                    "stream": True,

                    "max_tokens": 2048,

                    "temperature": 0.7
                },

                timeout=600.0

            ) as response:

                response.raise_for_status()

                # =================================================
                # RAW GROQ STREAM
                # =================================================

                def _raw_groq():

                    for line in response.iter_lines():

                        if not line:
                            continue

                        if not line.startswith("data: "):
                            continue

                        line = line[6:]

                        # Stream finished
                        if line == "[DONE]":
                            break

                        try:

                            data = json.loads(line)

                            # =====================================
                            # GROQ ERROR
                            # =====================================

                            if "error" in data:

                                msg = data["error"].get(
                                    "message",
                                    str(data["error"])
                                )

                                yield (
                                    f"\n[Groq API Error]: {msg}"
                                )

                                break

                            # =====================================
                            # EXTRACT TOKEN
                            # =====================================

                            choices = data.get(
                                "choices",
                                []
                            )

                            if not choices:
                                continue

                            delta = choices[0].get(
                                "delta",
                                {}
                            )

                            content = delta.get(
                                "content"
                            )

                            if content is not None:

                                # Send each received chunk
                                # immediately.
                                yield content

                        except json.JSONDecodeError:
                            # Ignore malformed/non-JSON SSE lines.
                            continue

                        except Exception:
                            # Ignore individual stream parsing errors.
                            continue

                # =================================================
                # FILTER THINKING
                # =================================================

                for chunk in _filter_think_blocks(
                    _raw_groq()
                ):

                    if chunk:
                        yield chunk

        except Exception as e:

            error_details = str(e)

            if (
                hasattr(e, "response")
                and e.response is not None
            ):

                try:
                    error_details = str(
                        e.response.content
                    )

                except Exception:
                    pass

            yield (
                f"\nError connecting to Groq API: "
                f"{error_details}"
            )

    # ============================================================
    # LOCAL OLLAMA
    # ============================================================

    else:

        try:

            user_msg = {
                "role": "user",
                "content": question
            }
            if image:
                user_msg["images"] = [image]

            with _http_client.stream(
                "POST",
                "http://localhost:11434/api/chat",

                json={
                    "model": "llama3", # Local vision model should be selected, e.g. llava, but we keep default for now

                    "messages": [
                        {
                            "role": "system",
                            "content": system_prompt
                        },
                        user_msg
                    ],

                    "stream": True
                },

                timeout=600.0

            ) as response:

                response.raise_for_status()

                # =================================================
                # RAW OLLAMA STREAM
                # =================================================

                def _raw_ollama():

                    for line in response.iter_lines():

                        if not line:
                            continue

                        try:

                            data = json.loads(line)

                            if (
                                "message" in data
                                and
                                "content" in data["message"]
                            ):

                                content = data[
                                    "message"
                                ][
                                    "content"
                                ]

                                if content:
                                    yield content

                        except json.JSONDecodeError:
                            continue

                        except Exception:
                            continue

                # =================================================
                # FILTER THINKING
                # =================================================

                for chunk in _filter_think_blocks(
                    _raw_ollama()
                ):

                    if chunk:
                        yield chunk

        except Exception as e:

            error_details = str(e)

            if (
                hasattr(e, "response")
                and e.response is not None
            ):

                try:
                    error_details = str(
                        e.response.content
                    )

                except Exception:
                    pass

            yield (
                "Error connecting to local Ollama "
                f"(is it running?): {error_details}"
            )