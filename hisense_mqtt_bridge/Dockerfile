FROM alpine:latest

RUN apk add --no-cache bash mosquitto-clients python3 py3-flask

WORKDIR /app
COPY run.sh .
COPY webserver.py .
COPY web /app/web

CMD ["bash", "run.sh"]