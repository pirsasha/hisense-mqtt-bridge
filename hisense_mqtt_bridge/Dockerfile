FROM node:18-alpine
RUN apk add --no-cache bash python3 py3-flask
WORKDIR /app
COPY run.sh .
COPY index.js .
COPY package.json .
COPY webserver.py .
COPY web /app/web
CMD ["bash", "run.sh"]