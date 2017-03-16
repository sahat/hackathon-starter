# Dockerazing Hackathon-starter

This is what I did to dockerized hackathon-started, the core idea was taken from [nodejs guides blog](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/). It just need it the Dockerfile to build the node images with the hackathon-starter code, then do some changes over the .env file in order to indicate the mongo contianer that the node app will use; and also I included a docker-compose.yml to raise everything with just command.


* install docker 

```
wget -qO- https://get.docker.com/ | sh
sudo usermod -aG docker your_user
```

* install docker-compose

```
sudo curl -L https://github.com/docker/compose/releases/download/1.7.1/docker-compose-`uname -s`-`uname -m` > /usr/local/bin/docker-compose

```

* modify the .env.example that the hackathon starter bring by default, in order to let know the node app the mongo container that will connect. 
	* In the secction related to mongo db change

```

MONGODB_URI=mongodb://localhost:27017/test
MONGOLAB_URI=mongodb://localhost:27017/test

```
	for this:


```
MONGODB=mongodb://mongo:27017/test
MONGOLAB_URI=mongodb://mongo:27017/test

```

The rest of the file will remain without changes. 

* Download and build the node and mongo images with compose:

```
docker-compose build

```

* Then raise the containers with compose: 

```
docker-compose up

```


* Now just go to your localhost:3000 and the hackathon-starte web app will displayed. 


## Possible issues
* For github or other authentication and authorization api's the url callback needs to match, and for this containerized app note what ports are being exposed. Try adecuate the ports or just for simplicity create a Developer Application at Github and update the github's ID and SECRET at the .env file.

* I raised the hackathon-starter webapp at my job, using this configurations, but due my machine is behind a corporate firewall, or something related (because I have opened ports at my company openstack cloud) because When I tried to get the accesso token from github I got: 

```
Connect
500 InternalOAuthError: Failed to obtain access token
   at Strategy.OAuth2Strategy._createOAuthError (/usr/src/app/node_modules/passport-oauth2/lib/strategy.js:370:17)
   at /usr/src/app/node_modules/passport-oauth2/lib/strategy.js:166:45
   at /usr/src/app/node_modules/passport-github/lib/strategy.js:75:25
   at /usr/src/app/node_modules/oauth/lib/oauth2.js:177:18
   at ClientRequest.<anonymous> (/usr/src/app/node_modules/oauth/lib/oauth2.js:148:5)
   at emitOne (events.js:96:13)
   at ClientRequest.emit (events.js:188:7)
   at TLSSocket.socketErrorListener (_http_client.js:306:9)
   at emitOne (events.js:96:13)
   at TLSSocket.emit (events.js:188:7)
   at emitErrorNT (net.js:1272:8)
   at _combinedTickCallback (internal/process/next_tick.js:74:11)
   at process._tickCallback (internal/process/next_tick.js:98:9)

```
 
