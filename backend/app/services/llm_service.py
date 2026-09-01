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
    """
    Remove model reasoning/thinking blocks from the user-visible
    response while keeping the actual answer streaming normally.

    Supported tags:
        <think>...</think>
        <thinking>...</thinking>
        <analysis>...</analysis>
        <reasoning>...</reasoning>

    Handles tags that are split across multiple stream chunks.
    """

    buffer = ""
    inside_think = False

    # Maximum number of characters we keep waiting for a possible tag.
    # This prevents unnecessary buffering and keeps streaming responsive.
    MAX_PARTIAL_TAG_LENGTH = 20

    for token in raw_stream:

        if not token:
            continue

        buffer += token

        while True:

            # ====================================================
            # CURRENTLY INSIDE THINK BLOCK
            # ====================================================

            if inside_think:

                close_match = _THINK_CLOSE_RE.search(buffer)

                if close_match:

                    # Remove everything before and including
                    # the closing think tag.
                    buffer = buffer[close_match.end():]

                    inside_think = False

                    # There may already be actual answer content
                    # after the closing tag.
                    continue

                else:
                    # We haven't received </think> yet.
                    #
                    # Do NOT send reasoning to the frontend.
                    # Keep only a small tail in case the closing
                    # tag is split between chunks.

                    if len(buffer) > MAX_PARTIAL_TAG_LENGTH:
                        buffer = buffer[-MAX_PARTIAL_TAG_LENGTH:]

                    break

            # ====================================================
            # OUTSIDE THINK BLOCK
            # ====================================================

            else:

                open_match = _THINK_OPEN_RE.search(buffer)

                if open_match:

                    # Send anything that came BEFORE <think>.
                    before = buffer[:open_match.start()]

                    if before:
                        yield before

                    # Remove opening tag.
                    buffer = buffer[open_match.end():]

                    inside_think = True

                    continue

                # =================================================
                # NO THINK TAG FOUND
                # =================================================

                # Keep a small tail because the next token may
                # complete a split tag such as:
                #
                # "<thi" + "nk>"
                #
                safe_end = len(buffer) - MAX_PARTIAL_TAG_LENGTH

                if safe_end > 0:

                    output = buffer[:safe_end]

                    if output:
                        yield output

                    buffer = buffer[safe_end:]

                break

    # ============================================================
    # STREAM FINISHED
    # ============================================================

    if not inside_think and buffer:

        # Remove any accidental tags that remain.
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
# GROQ / OLLAMA LLM STREAM
# ============================================================

def generate_llm_response(
    system_prompt: str,
    question: str,
    image: str = None
):

    # ============================================================
    # GROQ
    # ============================================================

    if settings.GROQ_API_KEY:

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