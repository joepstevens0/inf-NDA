FROM ubuntu:latest

RUN apt update && apt install -y iputils-ping iproute2 python3 python3-pip
RUN pip install rsa

COPY code ./code

CMD ["python3","./code/app.py"]