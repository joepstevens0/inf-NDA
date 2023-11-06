import os

for i in range(0,5):
    os.system('docker rm -f nda_onion' + str(i + 2))

os.system('docker network remove nda_onion')
