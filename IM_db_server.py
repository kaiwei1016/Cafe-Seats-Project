from fastapi import FastAPI, HTTPException, Path
from pydantic import BaseModel, Field
from typing import List, Optional
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import urllib.parse

app = FastAPI(title="Cafe Seat Management API (Updated)")

# MongoDB 連線設定
username = urllib.parse.quote_plus("user_01")
password = urllib.parse.quote_plus("ll75dbilab@2025")
host = "140.112.110.129:27017"
database = "dify_db_bilab_2025_accounting"
MONGO_URI = f"mongodb://{username}:{password}@{host}/{database}"

client = MongoClient(MONGO_URI)
db = client[database]
collection = db["im_final_project"]

# ======== Pydantic Schemas ========
class SeatBase(BaseModel):
    name: str = Field(..., description="座位名稱")
    left: int = Field(..., description="X 座標")
    top: float = Field(..., description="Y 座標")
    available: bool = Field(..., description="是否有人")

    table_id: Optional[str] = Field(None, description="桌子 ID")
    floor: Optional[str] = Field(None, description="樓層")
    index: Optional[int] = Field(None, description="排列 index")
    width: Optional[int] = Field(None, description="寬度")
    height: Optional[int] = Field(None, description="高度")
    capacity: Optional[int] = Field(1, ge=1, description="原始座位數")
    occupied: Optional[int] = Field(0, ge=0, description="已占位人數")
    extraSeatLimit: Optional[int] = Field(0, ge=0, description="可額外增加座位")
    tags: Optional[str] = Field("", description="標籤")
    description: Optional[str] = Field("", description="備註")
    updateTime: Optional[datetime] = Field(None, description="更新時間")

    class Config:
        extra = "forbid"

class SeatUpdate(BaseModel):
    name: Optional[str]
    left: Optional[int]
    top: Optional[float]
    available: Optional[bool]
    table_id: Optional[str]
    floor: Optional[str]
    index: Optional[int]
    width: Optional[int]
    height: Optional[int]
    capacity: Optional[int]
    occupied: Optional[int]
    extraSeatLimit: Optional[int]
    tags: Optional[str]
    description: Optional[str]
    updateTime: Optional[datetime]

    class Config:
        extra = "forbid"

class SeatResponse(SeatBase):
    id: str

# ======== Helper Function ========
def format_seat(seat: dict) -> dict:
    return {
        "id": str(seat.get("_id")),
        "name": seat.get("name"),
        "left": seat.get("left"),
        "top": seat.get("top"),
        "available": seat.get("available"),
        "table_id": seat.get("table_id"),
        "floor": seat.get("floor"),
        "index": seat.get("index"),
        "width": seat.get("width"),
        "height": seat.get("height"),
        "capacity": seat.get("capacity", 1),
        "occupied": seat.get("occupied", 0),
        "extraSeatLimit": seat.get("extraSeatLimit", 0),
        "tags": seat.get("tags", ""),
        "description": seat.get("description", ""),
        "updateTime": seat.get("updateTime"),
    }

# ======== Routes ========
@app.get("/seats", response_model=List[SeatResponse])
def get_all_seats():
    return [format_seat(seat) for seat in collection.find()]

@app.post("/seats", response_model=SeatResponse)
def create_seat(seat: SeatBase):
    seat_dict = seat.dict()
    result = collection.insert_one(seat_dict)
    seat_dict["_id"] = result.inserted_id
    return format_seat(seat_dict)

@app.patch("/seats/{seat_id}", response_model=SeatResponse)
def update_seat(seat_id: str, seat: SeatUpdate):
    update_data = {k: v for k, v in seat.dict(exclude_unset=True).items()}
    result = collection.update_one({"_id": ObjectId(seat_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Seat not found")
    updated = collection.find_one({"_id": ObjectId(seat_id)})
    return format_seat(updated)

@app.delete("/seats/name/{seat_name}")
def delete_seat(seat_name: str):
    result = collection.delete_one({"name": seat_name})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Seat '{seat_name}' not found")
    return {"message": f"Seat '{seat_name}' deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
