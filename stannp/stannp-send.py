import requests
import json
from dotenv import load_dotenv
import os
import argparse

# Load environment variables from .env file
load_dotenv()

# Command line argument parsing
parser = argparse.ArgumentParser(description='Interact with the Stannp API.')
parser.add_argument('--debug', action='store_true', help='Enable debug mode for more verbose output')
parser.add_argument('--recipient_file', type=str, help='Path to the recipient JSON file', required=False)
parser.add_argument('--pdf_file', type=str, help='Path to the PDF file', required=False)
args = parser.parse_args()

def authenticate(api_key):
    try:
        response = requests.get(f'https://us.stannp.com/api/v1/users/me?api_key={api_key}')
        response.raise_for_status()
        if args.debug:
            print("Authentication Response:", response.text)
        return True
    except requests.RequestException as e:
        if args.debug:
            print("Authentication Failed:", e)
        return False

def list_recipients(api_key, group_id):
    try:
        url = f'https://us.stannp.com/api/v1/recipients/list/{group_id}?api_key={api_key}'
        response = requests.get(url)
        response.raise_for_status()
        if args.debug:
            print("Recipients List Response:", response.text)
        return response.text
    except requests.RequestException as e:
        print("Error:", e)
        return None

def send_letter(api_key, letter_data, pdf_file_path=None):
    url = f'https://us.stannp.com/api/v1/letters/create?api_key={api_key}'
    headers = {
        'X-Idempotency-Key': 'e367c03e-3082-4c8e-b647-d6810761dcd4'
    }

    files = {}
    if pdf_file_path:
        files['file'] = open(pdf_file_path, 'rb')

    try:
        response = requests.post(url, data=letter_data, headers=headers, files=files)
        response.raise_for_status()
        if args.debug:
            print("Letter Sent Response:", response.text)
        return response.text
    except requests.RequestException as e:
        print("Error:", e)
        return None
    finally:
        if pdf_file_path:
            files['file'].close()

def read_json_file(file_path):
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error reading JSON file: {e}")
        return None

def send_postcard(api_key):
    # Add your postcard data here
    data = {
        # ...
    }

    try:
        response = requests.post(f'https://us.stannp.com/api/v1/postcards/create?api_key={api_key}', data=data)
        response.raise_for_status()
        if args.debug:
            print("Postcard Request Data:", data)
            print("Postcard Response:", response.text)
    except requests.exceptions.RequestException as e:
        print("Error:", e)

def main():
    api_key = os.getenv('STANNP_API_KEY')
    if not api_key:
        print("API key not found. Please set the STANNP_API_KEY in the .env file.")
        return

    if not authenticate(api_key):
        print("Authentication failed. Please check your API key.")
        return

    if args.recipient_file:
        recipient_data = read_json_file(args.recipient_file)
        if recipient_data:
            send_letter(api_key, recipient_data, args.pdf_file)
    else:
        send_postcard(api_key)

if __name__ == "__main__":
    main()
