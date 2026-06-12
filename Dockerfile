FROM debian:bookworm-slim AS builder

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    tar \
    xz-utils \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /worker

# Node and pnpm
COPY .node-version .node-version
RUN curl --fail -sSf https://raw.githubusercontent.com/creationix/nvm/v0.40.3/install.sh | bash
ENV NVM_DIR=/root/.nvm
RUN . "$NVM_DIR/nvm.sh" && nvm install "$(cat .node-version)"
RUN . "$NVM_DIR/nvm.sh" && nvm use "v$(cat .node-version)"
RUN . "$NVM_DIR/nvm.sh" && nvm alias default "v$(cat .node-version)"
RUN ln -s "$NVM_DIR/versions/node/v$(cat .node-version)" "$NVM_DIR/versions/node/default"
ENV PATH="$NVM_DIR/versions/node/default/bin/:${PATH}"
RUN node --version
RUN npm --version

COPY package.json .
RUN npm install -g pnpm@$(node -e "console.log(require('./package.json').packageManager.split('@')[1])")

# kyu CLI
RUN curl -fsSL https://kyushu.dev/install | bash
ENV PATH="/root/.kyu/bin:${PATH}"

COPY . .

RUN pnpm install --frozen-lockfile

RUN kyu build

RUN mkdir -p /out/worker && \
    cp worker/__kyushu_worker.wasm /out/worker/ && \
    tar -czf /worker.tar.gz -C /out .

FROM scratch AS export
COPY --from=builder /worker.tar.gz /