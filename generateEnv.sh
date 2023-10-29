#!/bin/bash

# Configuration data
CONFIG_DATA=$(<.env.example)  

# Write the data to a .env file
echo "$CONFIG_DATA" > .env

echo ".env file generated successfully."

