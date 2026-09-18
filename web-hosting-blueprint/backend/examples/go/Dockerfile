FROM golang:1.22-alpine AS build
WORKDIR /src
COPY main.go .
RUN CGO_ENABLED=0 go build -o /app/server main.go

FROM alpine:3.20
RUN adduser -D app
USER app
COPY --from=build /app/server /app/server
EXPOSE 8000
HEALTHCHECK CMD wget -qO- http://127.0.0.1:8000/health || exit 1
CMD ["/app/server"]
