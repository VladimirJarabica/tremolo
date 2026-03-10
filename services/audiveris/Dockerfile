FROM --platform=linux/amd64 ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    wget \
    openjdk-21-jre \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

ENV AUDIVERIS_VERSION=5.9.0
RUN mkdir -p /usr/share/applications /usr/share/desktop-directories && \
    wget -q https://github.com/Audiveris/audiveris/releases/download/${AUDIVERIS_VERSION}/Audiveris-${AUDIVERIS_VERSION}-ubuntu22.04-x86_64.deb \
    && dpkg -i ./Audiveris-${AUDIVERIS_VERSION}-ubuntu22.04-x86_64.deb || true \
    && rm Audiveris-${AUDIVERIS_VERSION}-ubuntu22.04-x86_64.deb

WORKDIR /app
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

COPY process.py .

RUN mkdir -p /app/input /app/output
