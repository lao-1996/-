import urllib.request
url = "http://192.168.43.17:8080/game_mobile.html"
qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={urllib.parse.quote(url)}"
import urllib.parse
qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={urllib.parse.quote(url)}"
urllib.request.urlretrieve(qr_url, "qr.png")
print("done")
