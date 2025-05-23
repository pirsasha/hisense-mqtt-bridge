FROM alpine:latest

RUN apk add --no-cache bash python3 py3-pip
RUN pip3 install flask

WORKDIR /app
COPY run.sh .
COPY bridge.py .
COPY webserver.py .
COPY web /app/web

CMD ["bash", "run.sh"]