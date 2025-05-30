import qrcode

base_url = "https://你的網址/cafe-check-people.html?table_id="
table_ids = ["A", "B", "C"]  # 每張桌子的代號

for table_id in table_ids:
    full_url = base_url + table_id
    img = qrcode.make(full_url)
    img.save(f"{table_id}_QR.png")
