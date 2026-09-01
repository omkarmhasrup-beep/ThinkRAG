import requests
import time
import sys

def poll():
    start = time.time()
    while True:
        try:
            res = requests.post('http://127.0.0.1:8000/auth/forgot-password', json={'email': 'omkarmhasrup@gmail.com'})
            print(f"SUCCESS: {res.status_code}")
            print(res.text)
            break
        except requests.exceptions.ConnectionError:
            if time.time() - start > 120:
                print("TIMEOUT")
                sys.exit(1)
            time.sleep(2)
            print("Waiting for server...", flush=True)
        except Exception as e:
            print(f"Other error: {e}")
            break

if __name__ == '__main__':
    poll()
