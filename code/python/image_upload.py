import requests

with open("duck.jpg", "rb") as image:
    requests.post(
        "http://localhost:3000/upload",
        headers={"Content-Type": "image/jpeg"},
        data=image
    )