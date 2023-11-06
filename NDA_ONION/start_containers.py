import os

os.system('docker network create --subnet=172.18.0.0/16 nda_onion')

os.system('docker build -t nda_onion_image .')

for i in range(0,5):
    os.popen('docker run --name nda_onion' + str(i + 2) + ' --net nda_onion --ip 172.18.0.' + str(i + 2) + ' nda_onion_image')
