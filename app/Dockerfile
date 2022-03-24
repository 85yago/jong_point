FROM python:3.9

RUN apt-get update && apt-get upgrade -y
RUN apt-get install -y --no-install-recommends \
    libblas-dev \
    libhdf5-dev \
    libopencv-dev

WORKDIR /code

COPY ./requirements.txt /code/requirements.txt

RUN python -m pip install --upgrade pip && pip install --no-cache-dir --upgrade -r /code/requirements.txt
