FROM ubuntu:latest

COPY . /src

WORKDIR /src

RUN apt-get update && apt-get install -y python3 python3-pip

RUN pip3 install -r requirements.txt

ENTRYPOINT ["/bin/bash"]

