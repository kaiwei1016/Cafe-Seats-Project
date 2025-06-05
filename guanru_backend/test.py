#!/usr/bin/env python3
"""
MongoDB-based Cafe Seat Management Server
Uses MongoDB for data persistence
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from pymongo import MongoClient
from bson import ObjectId
import urllib.parse
import json

app = FastAPI(title="Cafe Seat Management (MongoDB)")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
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

# ======== Pydantic Schemas ========
class SeatBase(BaseModel):
    name: str
    left: int
    top: float
    available: bool
    table_id: Optional[str] = None
    floor: Optional[str] = None
    index: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    capacity: Optional[int] = 1
    occupied: Optional[int] = 0
    extraSeatLimit: Optional[int] = 0
    tags: Optional[str] = ""
    description: Optional[str] = ""
    updateTime: Optional[datetime] = None

class SeatUpdate(BaseModel):
    name: Optional[str] = None
    left: Optional[int] = None
    top: Optional[float] = None
    available: Optional[bool] = None
    table_id: Optional[str] = None
    floor: Optional[str] = None
    index: Optional[int] = None
    width: Optional[int] = None
    height: Optional[int] = None
    capacity: Optional[int] = None
    occupied: Optional[int] = None
    extraSeatLimit: Optional[int] = None
    tags: Optional[str] = None
    description: Optional[str] = None
    updateTime: Optional[datetime] = None

class SeatResponse(SeatBase):
    id: str

# ======== Helper Functions ========
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

def init_sample_data():
    """初始化範例數據（如果集合為空）"""
    if collection.count_documents({}) == 0:
        sample_seats = [
            {
            "id": "1",
            "name": "A",
            "left": 20,
            "top": 20,
            "available": True,
            "table_id": "t_01",
            "floor": "1F",
            "index": 1,
            "width": 2,
            "height": 2,
            "capacity": 4,
            "occupied": 0,
            "extraSeatLimit": 0,
            "tags": "插座、廁所近",
            "description": "四人長方形桌",
            "updateTime": None
            },
            {
            "id": "2",
            "name": "B",
            "left": 40,
            "top": 20,
            "available": True,
            "table_id": "t_02",
            "floor": "1F",
            "index": 2,
            "width": 2,
            "height": 2,
            "capacity": 2,
            "occupied": 0,
            "extraSeatLimit": 0,
            "tags": "插座",
            "description": "靠牆雙人桌",
            "updateTime": datetime.now()
            },
            {
            "id": "3",
            "name": "C",
            "left": 60,
            "top": 20,
            "available": True,
            "table_id": "t_03",
            "floor": "1F",
            "index": 3,
            "width": 2,
            "height": 2,
            "capacity": 2,
            "occupied": 0,
            "extraSeatLimit": 0,
            "tags": "插座",
            "description": "窗邊雙人桌",
            "updateTime": datetime.now()
            },
            {
            "id": "4",
            "name": "D",
            "left": 20,
            "top": 50,
            "available": True,
            "table_id": "t_04",
            "floor": "1F",
            "index": 4,
            "width": 3,
            "height": 2,
            "capacity": 2,
            "occupied": 0,
            "extraSeatLimit": 2,
            "tags": "插座、冷氣通風口",
            "description": "雙人桌",
            "updateTime": datetime.now()
            },
            {
            "id": "5",
            "name": "E",
            "left": 60,
            "top": 50,
            "available": True,
            "table_id": "t_05",
            "floor": "1F",
            "index": 5,
            "width": 1,
            "height": 1,
            "capacity": 5,
            "occupied": 0,
            "extraSeatLimit": 0,
            "tags": "靠窗,安靜",
            "description": "靠窗五人長桌",
            "updateTime": None
            }
        ]
        
        collection.insert_many(sample_seats)
        print("✅ Sample data initialized with 5 tables")

def find_seat_by_id(seat_id: str):
    try:
        seat = collection.find_one({"_id": ObjectId(seat_id)})
        return format_seat(seat) if seat else None
    except:
        return None

def find_seat_by_table_id(table_id: str):
    seat = collection.find_one({"table_id": table_id})
    return format_seat(seat) if seat else None

# ======== Routes ========
@app.on_event("startup")
async def startup_event():
    try:
        # 測試 MongoDB 連線
        client.admin.command('ping')
        print("✅ MongoDB connection successful")
        
        # 初始化範例數據
        init_sample_data()
        
        # 顯示目前資料數量
        count = collection.count_documents({})
        print(f"📊 Current database has {count} seats")
        
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        raise

@app.get("/")
def read_root():
    try:
        count = collection.count_documents({})
        return {
            "message": "Cafe Seat Management API (MongoDB)", 
            "endpoints": {
                "seats": "/seats",
                "customer_interface": "/customer",
                "management_interface": "/management",
                "docs": "/docs"
            },
            "database": {
                "status": "connected",
                "collection": "im_final_project",
                "count": count
            }
        }
    except Exception as e:
        return {
            "message": "Cafe Seat Management API (MongoDB)", 
            "database": {
                "status": "error",
                "error": str(e)
            }
        }

@app.get("/seats", response_model=List[SeatResponse])
def get_all_seats():
    try:
        seats = list(collection.find())
        return [format_seat(seat) for seat in seats]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/seats", response_model=SeatResponse)
def create_seat(seat: SeatBase):
    try:
        seat_dict = seat.dict()
        result = collection.insert_one(seat_dict)
        seat_dict["_id"] = result.inserted_id
        return format_seat(seat_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.patch("/seats/{seat_id}", response_model=SeatResponse)
def update_seat(seat_id: str, seat: SeatUpdate):
    try:
        update_data = seat.dict(exclude_unset=True)
        
        # Handle datetime conversion
        if "updateTime" in update_data and update_data["updateTime"]:
            if isinstance(update_data["updateTime"], str):
                try:
                    update_data["updateTime"] = datetime.fromisoformat(update_data["updateTime"].replace('Z', '+00:00'))
                except:
                    update_data["updateTime"] = datetime.now()
        
        result = collection.update_one({"_id": ObjectId(seat_id)}, {"$set": update_data})
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Seat not found")
            
        updated_seat = collection.find_one({"_id": ObjectId(seat_id)})
        return format_seat(updated_seat)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.delete("/seats/name/{seat_name}")
def delete_seat(seat_name: str):
    try:
        result = collection.delete_one({"name": seat_name})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail=f"Seat '{seat_name}' not found")
        return {"message": f"Seat '{seat_name}' deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/seats/table/{table_id}", response_model=SeatResponse)
def get_seat_by_table_id(table_id: str):
    try:
        seat = find_seat_by_table_id(table_id)
        if not seat:
            raise HTTPException(status_code=404, detail=f"Table '{table_id}' not found")
        return seat
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/seats/available")
def get_available_seats():
    try:
        seats = list(collection.find({"available": True, "capacity": {"$gt": 0}}))
        return [format_seat(seat) for seat in seats]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/health")
def health_check():
    try:
        # 測試 MongoDB 連線
        client.admin.command('ping')
        
        # 獲取統計數據
        seats = list(collection.find())
        total_count = len(seats)
        occupied_total = sum(seat.get("occupied", 0) for seat in seats)
        capacity_total = sum(seat.get("capacity", 0) + seat.get("extraSeatLimit", 0) for seat in seats)
        
        return {
            "status": "healthy", 
            "database": {
                "status": "connected",
                "collection": "im_final_project",
                "host": host
            },
            "stats": {
                "count": total_count,
                "occupied_total": occupied_total,
                "capacity_total": capacity_total,
                "usage_rate": round((occupied_total / capacity_total * 100) if capacity_total > 0 else 0, 1)
            }
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "database": {
                "status": "error",
                "error": str(e)
            }
        }

# Serve HTML files directly (embedded) - Customer Interface
@app.get("/customer", response_class=HTMLResponse)
def serve_customer_interface():
    return """
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>咖啡廳入座系統</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 15px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; font-weight: bold; margin-bottom: 8px; color: #495057; }
        select { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 6px; font-size: 16px; }
        select:focus { border-color: #007bff; outline: none; }
        button { width: 100%; padding: 15px; background: #007bff; color: white; border: none; border-radius: 6px; font-size: 16px; font-weight: bold; cursor: pointer; margin-top: 20px; }
        button:hover { background: #0056b3; }
        button:disabled { background: #6c757d; cursor: not-allowed; }
        .info { background: #e9ecef; padding: 15px; border-radius: 6px; margin-top: 10px; font-size: 14px; }
        .success { background: #d4edda; color: #155724; padding: 15px; border-radius: 6px; margin-top: 20px; }
        .error { background: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; margin-top: 20px; }
        .status { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .status-empty { background: #28a745; }
        .status-partial { background: #ffc107; }
        .status-full { background: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <h1>☕ 咖啡廳入座系統</h1>
        <div class="form-group">
            <label for="tableSelect">選擇桌子：</label>
            <select id="tableSelect" onchange="updateTableInfo()">
                <option value="">-- 請選擇桌子 --</option>
            </select>
            <div id="tableInfo" class="info" style="display: none;"></div>
        </div>
        <div class="form-group" id="extraChairGroup" style="display: none;">
            <label for="extraChair">是否需要加椅子？</label>
            <select id="extraChair" onchange="updateGuestOptions()">
                <option value="no">否</option>
                <option value="yes">是</option>
            </select>
        </div>
        <div class="form-group">
            <label for="guestCount">入座人數：</label>
            <select id="guestCount">
                <option value="">-- 請選擇人數 --</option>
            </select>
        </div>
        <button onclick="makeReservation()" id="reserveBtn">✔️ 確認入座</button>
        <div id="result" style="display: none;"></div>
    </div>

    <script>
        const API_URL = window.location.origin;
        let tables = [];
        let selectedTable = null;

        async function loadTables() {
            try {
                const response = await fetch(`${API_URL}/seats`);
                const data = await response.json();
                tables = data.filter(t => t.capacity > 0 && (!t.table_id || !t.table_id.startsWith('s_')));
                populateTableSelect();
            } catch (error) {
                showResult('載入失敗: ' + error.message, 'error');
            }
        }

        function populateTableSelect() {
            const select = document.getElementById('tableSelect');
            select.innerHTML = '<option value="">-- 請選擇桌子 --</option>';
            
            tables.forEach(table => {
                const occupied = table.occupied || 0;
                const maxCapacity = (table.capacity || 0) + (table.extraSeatLimit || 0);
                const available = maxCapacity - occupied;
                
                let statusClass = occupied === 0 ? 'status-empty' : 
                                 available > 0 ? 'status-partial' : 'status-full';
                let icon = occupied === 0 ? '🟢' : available > 0 ? '🟡' : '🔴';
                
                const option = document.createElement('option');
                option.value = table.table_id || table.id;
                option.textContent = `${icon} ${table.name} - ${table.description} (${available}位空)`;
                
                if (available === 0) {
                    option.disabled = true;
                    option.textContent += ' - 已滿';
                }
                
                select.appendChild(option);
            });
        }

        function updateTableInfo() {
            const tableId = document.getElementById('tableSelect').value;
            const infoDiv = document.getElementById('tableInfo');
            const extraChairGroup = document.getElementById('extraChairGroup');
            
            if (!tableId) {
                infoDiv.style.display = 'none';
                extraChairGroup.style.display = 'none';
                return;
            }
            
            selectedTable = tables.find(t => (t.table_id || t.id) === tableId);
            if (!selectedTable) return;
            
            const occupied = selectedTable.occupied || 0;
            const capacity = selectedTable.capacity || 0;
            const maxCapacity = capacity + (selectedTable.extraSeatLimit || 0);
            const available = maxCapacity - occupied;
            
            let statusClass = occupied === 0 ? 'status-empty' : 
                             available > 0 ? 'status-partial' : 'status-full';
            
            infoDiv.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <span class="status ${statusClass}"></span>
                    <strong>目前狀態:</strong> ${occupied}/${maxCapacity} 人入座
                </div>
                <div><strong>可入座:</strong> ${available} 位</div>
                ${selectedTable.tags ? `<div><strong>特色:</strong> ${selectedTable.tags}</div>` : ''}
                ${selectedTable.updateTime ? `<div style="font-size: 12px; color: #666;">最後更新: ${new Date(selectedTable.updateTime).toLocaleString()}</div>` : ''}
            `;
            infoDiv.style.display = 'block';
            
            if (selectedTable.extraSeatLimit > 0) {
                extraChairGroup.style.display = 'block';
            }
            
            updateGuestOptions();
        }

        function updateGuestOptions() {
            if (!selectedTable) return;
            
            const extraChair = document.getElementById('extraChair').value;
            const guestSelect = document.getElementById('guestCount');
            const occupied = selectedTable.occupied || 0;
            const capacity = selectedTable.capacity || 0;
            const extraSeats = extraChair === 'yes' ? (selectedTable.extraSeatLimit || 0) : 0;
            const maxCapacity = capacity + extraSeats;
            const maxNew = maxCapacity - occupied;
            
            guestSelect.innerHTML = '<option value="">-- 請選擇人數 --</option>';
            for (let i = 1; i <= Math.max(1, maxNew); i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = `${i} 人`;
                if (i > maxNew) {
                    option.disabled = true;
                    option.textContent += ' (超過容量)';
                }
                guestSelect.appendChild(option);
            }
        }

        async function makeReservation() {
            if (!selectedTable) {
                alert('請選擇桌子');
                return;
            }
            
            const guestCount = parseInt(document.getElementById('guestCount').value);
            if (!guestCount) {
                alert('請選擇人數');
                return;
            }
            
            const btn = document.getElementById('reserveBtn');
            btn.disabled = true;
            btn.textContent = '處理中...';
            
            try {
                const newOccupied = (selectedTable.occupied || 0) + guestCount;
                const response = await fetch(`${API_URL}/seats/${selectedTable.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        occupied: newOccupied,
                        updateTime: new Date().toISOString()
                    })
                });
                
                if (!response.ok) throw new Error('更新失敗');
                
                showResult(`✅ 入座成功！桌子: ${selectedTable.name}，人數: ${guestCount} 人`, 'success');
                setTimeout(() => {
                    loadTables();
                    document.getElementById('tableSelect').value = '';
                    updateTableInfo();
                }, 2000);
                
            } catch (error) {
                showResult('入座失敗: ' + error.message, 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = '✔️ 確認入座';
            }
        }

        function showResult(message, type) {
            const result = document.getElementById('result');
            result.className = type;
            result.textContent = message;
            result.style.display = 'block';
            setTimeout(() => result.style.display = 'none', 5000);
        }

        window.addEventListener('DOMContentLoaded', loadTables);
    </script>
</body>
</html>
    """

# Management Interface
@app.get("/management", response_class=HTMLResponse)
def serve_management_interface():
    return """
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <title>咖啡廳管理系統</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 15px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; border-bottom: 3px solid #007bff; padding-bottom: 15px; margin-bottom: 30px; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
        .card h3 { margin: 0 0 10px 0; opacity: 0.9; }
        .card .number { font-size: 2.5em; font-weight: bold; margin: 10px 0; }
        .controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .refresh-btn { background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 6px; cursor: pointer; }
        .table-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .table-item { background: white; border: 2px solid #e9ecef; border-radius: 10px; padding: 20px; }
        .table-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
        .table-name { font-weight: bold; font-size: 18px; }
        .table-status { padding: 5px 10px; border-radius: 15px; font-size: 12px; font-weight: bold; }
        .status-empty { background: #d4edda; color: #155724; }
        .status-partial { background: #fff3cd; color: #856404; }
        .status-full { background: #f8d7da; color: #721c24; }
        .occupancy { background: #f8f9fa; padding: 15px; border-radius: 8px; text-align: center; margin-bottom: 15px; }
        .occupancy-number { font-size: 24px; font-weight: bold; color: #007bff; }
        .btn-controls { display: flex; justify-content: center; gap: 15px; }
        .btn-controls button { width: 40px; height: 40px; border: none; border-radius: 50%; font-size: 18px; font-weight: bold; cursor: pointer; }
        .btn-minus { background: #dc3545; color: white; }
        .btn-plus { background: #28a745; color: white; }
        .btn-controls button:disabled { background: #6c757d; cursor: not-allowed; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🛠️ 咖啡廳管理系統</h1>
        
        <div class="dashboard">
            <div class="card">
                <h3>總桌數</h3>
                <div class="number" id="totalTables">-</div>
            </div>
            <div class="card">
                <h3>總座位</h3>
                <div class="number" id="totalCapacity">-</div>
            </div>
            <div class="card">
                <h3>已入座</h3>
                <div class="number" id="totalOccupied">-</div>
            </div>
            <div class="card">
                <h3>使用率</h3>
                <div class="number" id="occupancyRate">-</div>
            </div>
        </div>
        
        <div class="controls">
            <h2>即時桌位狀態</h2>
            <div>
                <span id="lastUpdate">-</span>
                <button class="refresh-btn" onclick="loadTables()">🔄 重新整理</button>
            </div>
        </div>
        
        <div class="table-grid" id="tableContainer"></div>
    </div>

    <script>
        const API_URL = window.location.origin;
        let tables = [];

        async function loadTables() {
            try {
                const response = await fetch(`${API_URL}/seats`);
                const data = await response.json();
                tables = data.filter(t => t.capacity > 0 && (!t.table_id || !t.table_id.startsWith('s_')));
                renderTables();
                updateStats();
                document.getElementById('lastUpdate').textContent = `最後更新: ${new Date().toLocaleTimeString()}`;
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('lastUpdate').textContent = `載入失敗: ${error.message}`;
            }
        }

        function renderTables() {
            const container = document.getElementById('tableContainer');
            container.innerHTML = tables.map(table => {
                const occupied = table.occupied || 0;
                const capacity = table.capacity || 0;
                const maxCapacity = capacity + (table.extraSeatLimit || 0);
                
                let statusClass, statusText, icon;
                if (occupied === 0) {
                    statusClass = 'status-empty';
                    statusText = '空桌';
                    icon = '🟢';
                } else if (occupied >= maxCapacity) {
                    statusClass = 'status-full';
                    statusText = '滿桌';
                    icon = '🔴';
                } else {
                    statusClass = 'status-partial';
                    statusText = '部分入座';
                    icon = '🟡';
                }

                return `
                    <div class="table-item">
                        <div class="table-header">
                            <div class="table-name">${icon} ${table.name}</div>
                            <div class="table-status ${statusClass}">${statusText}</div>
                        </div>
                        <div style="margin-bottom: 15px; color: #666; font-size: 14px;">
                            ${table.description}<br>
                            容量: ${capacity}${table.extraSeatLimit > 0 ? ` (+${table.extraSeatLimit})` : ''} 人
                            ${table.tags ? `<br>特色: ${table.tags}` : ''}
                        </div>
                        <div class="occupancy">
                            <div class="occupancy-number">${occupied} / ${maxCapacity}</div>
                            <div style="font-size: 14px; color: #666;">目前入座人數</div>
                        </div>
                        <div class="btn-controls">
                            <button class="btn-minus" onclick="updateOccupancy('${table.id}', -1)">−</button>
                            <button class="btn-plus" onclick="updateOccupancy('${table.id}', 1)">+</button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function updateStats() {
            const totalTables = tables.length;
            const totalCapacity = tables.reduce((sum, t) => sum + (t.capacity || 0) + (t.extraSeatLimit || 0), 0);
            const totalOccupied = tables.reduce((sum, t) => sum + (t.occupied || 0), 0);
            const usageRate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

            document.getElementById('totalTables').textContent = totalTables;
            document.getElementById('totalCapacity').textContent = totalCapacity;
            document.getElementById('totalOccupied').textContent = totalOccupied;
            document.getElementById('occupancyRate').textContent = `${usageRate}%`;
        }

        async function updateOccupancy(id, delta) {
            const table = tables.find(t => t.id === id);
            if (!table) return;

            const newOccupied = (table.occupied || 0) + delta;
            const maxCapacity = (table.capacity || 0) + (table.extraSeatLimit || 0);

            if (newOccupied < 0 || newOccupied > maxCapacity) return;

            try {
                const response = await fetch(`${API_URL}/seats/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        occupied: newOccupied,
                        updateTime: new Date().toISOString()
                    })
                });
                if (!response.ok) throw new Error('更新失敗');

                await loadTables();
            } catch (error) {
                alert('更新失敗: ' + error.message);
            }
        }

        window.addEventListener('DOMContentLoaded', loadTables);
    </script>
</body>
</html>
    """
