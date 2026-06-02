import os
from pathlib import Path


def _load_dotenv() -> None:
    env_path = Path(__file__).parent / ".env"
    if not env_path.exists():
        return
    for raw in env_path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        key = key.strip()
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in ("'", '"'):
            value = value[1:-1]
        os.environ.setdefault(key, value)


_load_dotenv()

from browser_use import Agent, Browser  # noqa: E402
from browser_use.llm.openai.chat import ChatOpenAI  # noqa: E402

llm = ChatOpenAI(
    model="MiniMax-M2.7",
    base_url=os.environ.get("OPENAI_BASE_URL", "https://api.minimaxi.com/v1"),
    api_key=os.environ["OPENAI_API_KEY"],
    temperature=0.2,
)

async def main():
    browser = Browser()
    agent = Agent(
        task="打开 GitHub 并搜索 browser-use 仓库，然后告诉我星的总数",
        llm=llm,
        browser=browser,
    )
    result = await agent.run()
    print("Result:", result)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())