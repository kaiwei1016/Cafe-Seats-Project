import urllib.parse
from pymongo import MongoClient
import uuid
from datetime import datetime
# MongoDB 連線設定
username = urllib.parse.quote_plus("user_01")
password = urllib.parse.quote_plus("ll75dbilab@2025")
host = "140.112.110.129:27017"
database = "dify_db_bilab_2025_accounting"
MONGO_URI = f"mongodb://{username}:{password}@{host}/{database}"

client = MongoClient(MONGO_URI)
db = client[database]
collection = db["im_final_project"]
result = collection.delete_many({})
print(f"已刪除 {result.deleted_count} 筆資料")
'''
seat_data = {
    "ID": "1F_A3",
    "Name": "A3",
    "Availability": False,
    "Xpos": 120.5,
    "Ypos": 245.0,
    "Capacity": 2,
    "ExtraSeatLimit": 1,
    "CurrentOccupancy": 0,
    "Description": "靠窗雙人桌，附插座",
    "UpdateTime": datetime.now(),
    "Floor": "1F",
    "Zone": "Window",
    "SeatType": "雙人",
    "Tags": ["插座", "靠窗", "安靜"]
}

# === 3. 插入資料 ===
insert_result = collection.insert_one(seat_data)

# === 4. 查詢剛插入的資料並輸出 ===
inserted_seat = collection.find_one({"_id": insert_result.inserted_id})
print("✅ 已成功插入以下資料：")
print(inserted_seat)
'''