FROM rust:1.77-slim AS builder
WORKDIR /app
COPY Cargo.toml Cargo.lock* ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release || true
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates iproute2 iptables && rm -rf /var/lib/apt/lists/*
WORKDIR /root/
COPY --from=builder /app/target/release/ebpf-security-service .
EXPOSE 50055
ENTRYPOINT ["./ebpf-security-service"]
