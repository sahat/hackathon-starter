# This script can be found in http://www.bennadel.com/blog/2321-how-i-got-node-js-running-on-a-linux-micro-instance-using-amazon-ec2.htm

#!/bin/bash
 
# Invoke the Forever module (to STOP our Node.js server).
./node_modules/forever/bin/forever stop app.js