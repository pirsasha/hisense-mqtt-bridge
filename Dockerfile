FROM homeassistant/amd64-base-debian:bullseye

ENV LANG C.UTF-8

RUN apt-get update && \
    apt-get install -y mosquitto-clients && \
    apt-get clean

COPY run.sh /run.sh
RUN chmod a+x /run.sh

CMD [ "/run.sh" ]
