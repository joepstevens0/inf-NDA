import rsa

priv_keys = open("private_keys.txt", "w")
pub_keys = open("public_keys.txt", "w")

for i in range(0,10):
    publicKey, privateKey = rsa.newkeys(2048)
    priv_keys.write(privateKey.save_pkcs1().decode('utf8')  + ',')
    pub_keys.write(publicKey.save_pkcs1().decode('utf8')  + ',')


priv_keys.close()
pub_keys.close()
