import requests

with open("duck.jpg", "rb") as image:
    requests.post(
        "http://server:3000/upload",
        headers={"Content-Type": "image/jpeg"},
        data=image
    )