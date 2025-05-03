from fastapi import FastAPI, HTTPException, Path
from pydantic import BaseModel, Field
from typing import List, Optional
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import urllib.parse

app = FastAPI(title="Cafe Seat Management API")

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
    SeatID: str = Field(..., description="座位ID，例如 1f_A3")
    Name: str = Field(..., description="座位名稱，例如 A3")
    Availability: bool = Field(..., description="座位是否有人")
    Xpos: float = Field(..., description="X 座標")
    Ypos: float = Field(..., description="Y 座標")
    Capacity: Optional[int] = Field(1, ge=1, description="原始座位數")
    ExtraSeatLimit: Optional[int] = Field(0, ge=0, description="可加座位上限")
    CurrentOccupancy: Optional[int] = Field(0, ge=0, description="目前佔用人數")
    Description: Optional[str] = Field("", description="座位備註")
    StatusUpdateTime: Optional[datetime] = Field(None, description="狀態最後更新時間（ISO 格式）")
    Floor: Optional[str] = Field("1F", description="樓層")
    Zone: Optional[str] = Field("", description="區域")
    SeatType: Optional[str] = Field("單人", description="座位類型")
    Tags: Optional[List[str]] = Field(default_factory=list, description="標籤")

    class Config:
        extra = "forbid"

class SeatUpdate(BaseModel):
    SeatID: Optional[str] = Field(None, description="座位代碼，例如 1F_A3")
    Name: Optional[str]
    Availability: Optional[bool]
    Xpos: Optional[float]
    Ypos: Optional[float]
    Capacity: Optional[int]
    ExtraSeatLimit: Optional[int]
    CurrentOccupancy: Optional[int]
    Description: Optional[str]
    StatusUpdateTime: Optional[datetime]
    Floor: Optional[str]
    Zone: Optional[str]
    SeatType: Optional[str]
    Tags: Optional[List[str]]

    class Config:
        extra = "forbid"

class SeatResponse(SeatBase):
    id: str

class SeatStatusPatch(BaseModel):
    Availability: bool
    CurrentOccupancy: int

# ======== Helper Function ========
def format_seat(seat: dict) -> dict:
    return {
        "id": str(seat.get("_id")),
        "SeatID": seat.get("SeatID"),
        "Name": seat.get("Name"),
        "Availability": seat.get("Availability"),
        "Xpos": seat.get("Xpos"),
        "Ypos": seat.get("Ypos"),
        "Capacity": seat.get("Capacity", 1),
        "ExtraSeatLimit": seat.get("ExtraSeatLimit", 0),
        "CurrentOccupancy": seat.get("CurrentOccupancy", 0),
        "Description": seat.get("Description", ""),
        "StatusUpdateTime": seat.get("StatusUpdateTime"),
        "Floor": seat.get("Floor", "1F"),
        "Zone": seat.get("Zone", ""),
        "SeatType": seat.get("SeatType", "單人"),
        "Tags": seat.get("Tags", [])
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
# patch for editting
@app.patch("/seats/{seat_id}", response_model=SeatResponse)
def update_seat(seat_id: str, seat: SeatUpdate):
    update_data = {k: v for k, v in seat.dict(exclude_unset=True).items()}
    result = collection.update_one({"_id": ObjectId(seat_id)}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Seat not found")
    updated = collection.find_one({"_id": ObjectId(seat_id)})
    return format_seat(updated)

# patch for status
@app.patch("/seats/{seat_code}/status", response_model=SeatResponse)
def update_seat_status(seat_code: str, status: SeatStatusPatch):
    update_data = {
        "Availability": status.Availability,
        "CurrentOccupancy": status.CurrentOccupancy,
        "StatusUpdateTime": datetime.now()
    }
    result = collection.update_one({"SeatID": seat_code}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="SeatID not found")
    updated = collection.find_one({"SeatID": seat_code})
    return format_seat(updated)

@app.delete("/seats/{seat_code}")
def delete_seat(seat_code: str):
    result = collection.delete_one({"SeatID": seat_code})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"SeatID '{seat_code}' not found")
    return {"message": f"Seat '{seat_code}' deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)