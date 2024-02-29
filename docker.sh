#!/bin/sh
# TO USE THE SCRIPT, run docker build -t proj410 ONCE.
# and run ./docker.sh 
docker run --mount type=bind,source="$(pwd)"/,target=/src -it proj410