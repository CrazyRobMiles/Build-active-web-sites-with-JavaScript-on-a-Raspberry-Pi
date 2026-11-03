import requests

with open("duck.jpg", "rb") as image:
    response = requests.post(
        "http://localhost:3000/upload",
        headers={"Content-Type": "image/jpeg"},
        data=image
    )

print("The picture is stored as:", response.text)
