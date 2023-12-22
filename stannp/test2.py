import requests
import base64
import argparse
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Parse command line arguments
parser = argparse.ArgumentParser(description='Send a base64 encoded file to the Stannp API.')
parser.add_argument('--file', type=str, required=True, help='Path to the file to encode and send')
args = parser.parse_args()

# Fetch the API key
api_key = os.getenv('STANNP_API_KEY')
if not api_key:
    raise ValueError("API key not found. Please set the STANNP_API_KEY in the .env file.")

# Function to convert file to base64
def file_to_base64(file_path):
    with open(file_path, "rb") as file:
        encoded_string = base64.b64encode(file.read()).decode('utf-8')
    return encoded_string

# Convert the file to base64
encoded_file = file_to_base64(args.file)

# Data for the request including the base64 encoded file
data = {
    'pages': 'Hello {firstname},\n\nThis is my first letter.',
    'recipient[title]': 'Mr',
    'recipient[firstname]': 'Adam',
    'recipient[lastname]': 'Rogas #56445-048',
    'recipient[address1]': 'PO BOX 700',
    'recipient[address2]': 'FPC Yankton Federal Prison Camp',
    'recipient[town]': 'YANKTON',
    'recipient[zipcode]': '57078-0700',
    'recipient[country]': 'US',
    'pdf':'letter.pdf',
    'duplex':1,
    'transactional':1,
    'addons':'FIRST_CLASS',
    'tags':'doflo',
    'ocr':1,
    'file': encoded_file
}

# Send the request
try:
    response = requests.post(f'https://us.stannp.com/api/v1/letters/create?api_key={api_key}', data=data)
    response.raise_for_status()
    print("Letter Sent Successfully:", response.text)
except requests.RequestException as e:
    print("Error:", e)
