import requests
import json
import os
import argparse
import uuid
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Command line argument parsing
parser = argparse.ArgumentParser(description='Create a letter with the Stannp API.')
parser.add_argument('--debug', action='store_true', help='Enable debug mode for more verbose output')
parser.add_argument('--recipient_file', type=str, help='Path to the recipient JSON file', required=True)
parser.add_argument('--letter_params_file', type=str, help='Path to the letter parameters JSON file', required=True)
parser.add_argument('--pdf_file', type=str, help='Path to the PDF file', required=True)
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

def read_json_file(file_path):
    try:
        with open(file_path, 'r') as file:
            return json.load(file)
    except Exception as e:
        print(f"Error reading JSON file: {e}")
        return None

def send_letter(api_key, recipient_data, letter_params, pdf_file_path):
    url = f'https://us.stannp.com/api/v1/letters/create?api_key={api_key}'
    headers = {
        'X-Idempotency-Key': str(uuid.uuid4())
    }

    files = {'file': open(pdf_file_path, 'rb')}
    data = {**recipient_data, **letter_params}

    try:
        response = requests.post(url, headers=headers, data=data, files=files)
        response.raise_for_status()
        if args.debug:
            print("Letter Sent Response:", response.text)
        return response.text
    except requests.RequestException as e:
        if args.debug:
            print("Error:", e)
            print("Response Content:", response.text if response else "No response")
            print("Request Data:", data)
            print("PDF File Path:", pdf_file_path)
        return None
    finally:
        files['file'].close()

def main():
    api_key = os.getenv('STANNP_API_KEY')
    if not api_key:
        print("API key not found. Please set the STANNP_API_KEY in the .env file.")
        return

    if not authenticate(api_key):
        print("Authentication failed. Please check your API key.")
        return

    recipient_data = read_json_file(args.recipient_file)
    letter_params = read_json_file(args.letter_params_file)
    
    if recipient_data and letter_params:
        send_letter(api_key, recipient_data, letter_params, args.pdf_file)

if __name__ == "__main__":
    main()
