FROM golang:1.26-alpine AS build

WORKDIR /app

COPY go.mod ./
COPY cmd ./cmd
COPY internal ./internal

RUN go test ./...
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /temporal-api ./cmd/api

FROM alpine:3.22

RUN adduser -D -H -u 10001 temporal

USER temporal
WORKDIR /app

COPY --from=build /temporal-api /app/temporal-api

EXPOSE 8080

ENTRYPOINT ["/app/temporal-api"]
