import requests
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

# Fetch the API key
api_key = os.getenv('STANNP_API_KEY')
if not api_key:
    raise ValueError("API key not found. Please set the STANNP_API_KEY in the .env file.")

# Data for the letter
data = {
    'test': '13373',
    'pages': 'Hello {firstname},\n\nThis is my first letter.',
    'recipient[title]': 'Mr',
    'recipient[firstname]': 'Adam',
    'recipient[lastname]': 'Rogas #56445-048',
    'recipient[address1]': 'PO BOX 700',
    'recipient[address2]': 'FPC Yankton Federal Prison Camp',
    'recipient[town]': 'YANKTON',
    'recipient[zipcode]': '57078-0700',
    'recipient[country]': 'US'
}

# Send the request
try:
    response = requests.post(f'https://us.stannp.com/api/v1/letters/create?api_key={api_key}', data=data)
    response.raise_for_status()
    print("Letter Sent Successfully:", response.text)
except requests.RequestException as e:
    print("Error:", e)

