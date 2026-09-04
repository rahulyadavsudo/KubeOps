# Build stage
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod go.sum* ./
RUN go mod download || true
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o k8s-collector .

# Minimal Scratch Runner (<15MB container)
FROM alpine:3.19
RUN apk --no-cache add ca-certificates tzdata
WORKDIR /root/
COPY --from=builder /app/k8s-collector .
EXPOSE 50051
USER 10001:10001
ENTRYPOINT ["./k8s-collector"]
