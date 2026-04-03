# Multi-stage build for C++ Order Book Engine

# Stage 1: Build
FROM gcc:13 AS builder

RUN apt-get update && apt-get install -y cmake git && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY engine/ engine/
COPY CMakeLists.txt .

RUN cmake -B build -DBUILD_TESTS=OFF -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build --config Release

# Stage 2: Runtime
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y libstdc++6 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/build/engine/orderbook_server /usr/local/bin/orderbook_server

ENTRYPOINT ["orderbook_server"]
