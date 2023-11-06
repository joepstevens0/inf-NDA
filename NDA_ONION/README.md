# NDA_ONION
NDA task: onion routing, mix with mesh ig
It is set to work with 5 docker containers. 

# How to run
run "python3 pyserver/app.py"
run "cd server && yarn install && yarn start"
run "python3 start_containers.py"

Order matters! Webserver connects to pyserver, containers connect to webserver only if online.

# Closing Docker containers
run "python3 stop_containers.py"
