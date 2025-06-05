from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional
from pymongo import MongoClient
from pymongo.collection import ReturnDocument
from bson import ObjectId
from datetime import datetime
import urllib.parse

app = FastAPI(title="Cafe Table Management API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

# MongoDB 連線設定
username = urllib.parse.quote_plus("user_01")
password = urllib.parse.quote_plus("ll75dbilab@2025")
host = "140.112.110.129:27017"
database = "dify_db_bilab_2025_accounting"
MONGO_URI = f"mongodb://{username}:{password}@{host}/{database}"

client = MongoClient(MONGO_URI)
db = client[database]
collection = db["im_final_project"]
bg_collection = db["background_settings"]


# ======== Pydantic Schemas ========
class TableBase(BaseModel):
    table_id: str
    floor: str
    index: int
    name: str

    left: float
    top: float
    width: float
    height: float

    capacity: int
    occupied: int
    extraSeatLimit: int

    tags: List[str]
    description: str
    updateTime: Optional[datetime]
    available: bool

    class Config:
        extra = "forbid"

class TableUpdate(BaseModel):
    table_id: Optional[str]
    floor: Optional[str]
    index: Optional[int]
    name: Optional[str]

    left: Optional[float]
    top: Optional[float]
    width: Optional[float]
    height: Optional[float]

    capacity: Optional[int]
    occupied: Optional[int]
    extraSeatLimit: Optional[int]

    tags: Optional[List[str]]
    description: Optional[str]
    updateTime: Optional[datetime]
    available: Optional[bool]


    class Config:
        extra = "forbid"

class TableResponse(TableBase):
    id: str

class BackgroundSetting(BaseModel):
    floor_id: str
    cropX: int
    cropY: int
    cropWidth: int
    cropHeight: int
    cropZoom: float
    rotation: int
    bgHidden: bool
    gridHidden: bool
    seatIndex: bool
    title: Optional[str] = "Seats Viewer"
    logo: Optional[str] = "/img/logo.png"

class BackgroundSettingResponse(BackgroundSetting):
    id: str

# ======== Helper Function ========
def format_table(table: dict) -> dict:
    tags = table.get("tags", [])
    if isinstance(tags, str):
        tags = [tag.strip() for tag in tags.split(",") if tag.strip()]

    return {
        "id": str(table["_id"]),
        "table_id": table["table_id"],
        "floor": table["floor"],
        "index": table["index"],
        "name": table["name"],
        "left": table["left"],
        "top": table["top"],
        "width": table["width"],
        "height": table["height"],
        "capacity": table["capacity"],
        "occupied": table["occupied"],
        "extraSeatLimit": table["extraSeatLimit"],
        "tags": tags,
        "description": table.get("description", ""),
        "updateTime": table.get("updateTime"),
        "available": table["available"]
    }

# --- API Routes ---
@app.get("/tables", response_model=List[TableResponse])
def get_all_tables():
    return [format_table(t) for t in collection.find()]

@app.post("/tables", response_model=TableResponse)
def create_table(table: TableBase):
    data = table.dict()
    result = collection.insert_one(data)
    data["_id"] = result.inserted_id
    return format_table(data)

@app.delete("/tables/clear")
def clear_all_tables():
    result = collection.delete_many({})
    return {"message": f"Deleted {result.deleted_count} tables"}

@app.patch("/tables/{table_id}", response_model=TableResponse)
def update_table(table_id: str, table: TableUpdate):
    updates = {k: v for k, v in table.dict(exclude_unset=True).items()}
    result = collection.update_one({"table_id": table_id}, {"$set": updates})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")
    updated = collection.find_one({"table_id": table_id})
    return format_table(updated)

@app.delete("/tables/{table_id}")
def delete_table(table_id: str):
    result = collection.delete_one({"table_id": table_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Table '{table_id}' not found")
    return {"message": f"Table '{table_id}' deleted successfully"}

@app.post("/background", response_model=BackgroundSettingResponse)
def create_or_update_bg_setting(setting: BackgroundSetting):
    result = bg_collection.find_one_and_replace(
        {"floor_id": setting.floor_id},
        setting.dict(),
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return result

@app.get("/background/{floor_id}", response_model=BackgroundSettingResponse)
def get_bg_setting(floor_id: str):
    doc = bg_collection.find_one({"floor_id": floor_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    doc["id"] = str(doc["_id"])
    return doc

