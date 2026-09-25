FROM node:22-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl ca-certificates bash \
    && rm -rf /var/lib/apt/lists/*

RUN npm install -g --no-fund --no-audit \
    @anthropic-ai/claude-code \
    @openai/codex \
    @github/copilot

RUN useradd --create-home --shell /bin/bash sandbox

COPY entrypoint.sh /entrypoint.sh
COPY sandbox-bashrc /etc/sandbox-bashrc
RUN chmod +x /entrypoint.sh

USER sandbox
WORKDIR /home/sandbox
ENV HOME=/home/sandbox
ENV CODEX_HOME=/home/sandbox/.codex-runtime

ENTRYPOINT ["/entrypoint.sh"]
