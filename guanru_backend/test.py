#!/usr/bin/env python3
"""
Simple Local Server - 直接使用 MongoDB（與 IM_db_server 共用同一個資料庫）
"""

from fastapi import FastAPI, HTTPException, Path
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
from pymongo import MongoClient
from pymongo.collection import ReturnDocument
from bson import ObjectId
from datetime import datetime
import urllib.parse

app = FastAPI(title="Simple Cafe Seat Management (MongoDB)")

# ===== 1. CORS 設定 =====
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== 2. MongoDB 連線設定 =====
# 請確認以下參數與 IM_db_server.py 裡面完全一致
username = urllib.parse.quote_plus("user_01")
password = urllib.parse.quote_plus("ll75dbilab@2025")
host = "140.112.110.129:27017"
database = "dify_db_bilab_2025_accounting"
MONGO_URI = f"mongodb://{username}:{password}@{host}/{database}"

client = MongoClient(MONGO_URI)
db = client[database]
table_collection = db["im_final_project"]
bg_collection    = db["background_settings"]  # 如果你之後還需要背景設定

# ===== 3. Pydantic Schemas =====
class SeatBase(BaseModel):
    # 前端送過來的欄位，和 IM_db_server 中 TableBase 幾乎一致
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
    updateTime: Optional[datetime] = None
    available: bool

    class Config:
        extra = "forbid"

class SeatUpdate(BaseModel):
    # PATCH 時可能只更新部分欄位
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

class SeatResponse(SeatBase):
    id: str  # MongoDB 的 _id 轉成字串

# ===== 4. Helper: 將 MongoDB doc 轉成前端回傳的格式 =====
def format_table(table: dict) -> dict:
    """
    把 MongoDB 拿到的 document 轉成前端要的 JSON schema
    - tags: 如果存成字串，就拆成 list；如果已經是 list，就直接回傳。
    - id: 將原本的 _id 轉成字串
    """
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

# ===== 5. API Routes =====

@app.get("/")
def read_root():
    return {
        "message": "Simple Cafe Seat Management API (MongoDB)",
        "endpoints": {
            "seats": "/seats",
            "customer_interface": "/customer",
            "management_interface": "/management",
            "docs": "/docs"
        },
        "note": "使用 MongoDB 作為後端儲存"
    }

@app.get("/seats", response_model=List[SeatResponse])
def get_all_seats():
    """
    取得所有桌位資料，轉成列表回傳
    """
    tables = table_collection.find()
    return [format_table(t) for t in tables]

@app.post("/seats", response_model=SeatResponse)
def create_seat(seat: SeatBase):
    """
    新增一筆桌位資料到 MongoDB
    """
    data = seat.dict()
    result = table_collection.insert_one(data)
    data["_id"] = result.inserted_id
    return format_table(data)

@app.patch("/seats/{table_id}", response_model=SeatResponse)
def update_seat(table_id: str, seat: SeatUpdate):
    """
    用 table_id 來更新某筆桌位資料(局部更新)
    """
    updates = {k: v for k, v in seat.dict(exclude_unset=True).items()}
    if "updateTime" in updates and isinstance(updates["updateTime"], str):
        # 如果前端傳 updateTime 是字串，要轉一次
        try:
            updates["updateTime"] = datetime.fromisoformat(updates["updateTime"].replace('Z', '+00:00'))
        except:
            updates["updateTime"] = datetime.now()

    result = table_collection.update_one(
        {"table_id": table_id},
        {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Table not found")

    updated = table_collection.find_one({"table_id": table_id})
    return format_table(updated)

@app.delete("/seats/{table_id}")
def delete_seat(table_id: str):
    """
    刪除指定 table_id 的桌位
    """
    result = table_collection.delete_one({"table_id": table_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Table '{table_id}' not found")
    return {"message": f"Table '{table_id}' deleted successfully"}

@app.get("/seats/table/{table_id}", response_model=SeatResponse)
def get_seat_by_table_id(table_id: str):
    """
    依 table_id 查單筆桌位
    """
    table = table_collection.find_one({"table_id": table_id})
    if not table:
        raise HTTPException(status_code=404, detail=f"Table '{table_id}' not found")
    return format_table(table)

@app.get("/seats/available")
def get_available_seats():
    """
    取得所有 available 且 capacity > 0 的桌位
    """
    tables = table_collection.find({
        "available": True,
        "capacity": {"$gt": 0}
    })
    return [format_table(t) for t in tables]

@app.get("/health")
def health_check():
    """
    健康檢查：回傳資料庫連線狀態以及桌位總數與座位使用狀況
    """
    count      = table_collection.count_documents({})
    occupied_total = sum(t.get("occupied", 0) for t in table_collection.find())
    capacity_total = sum(
        t.get("capacity", 0) + t.get("extraSeatLimit", 0)
        for t in table_collection.find()
    )
    return {
        "status": "healthy",
        "database": "MongoDB",
        "count": count,
        "occupied_total": occupied_total,
        "capacity_total": capacity_total
    }

# ===== 6. Serve HTML (Customer & Management Interfaces) =====

@app.get("/customer", response_class=HTMLResponse)
def serve_customer_interface():
    """
    客戶端網頁：點到 /customer 時回傳內嵌的 HTML
    （此段內容和原本 simple_local_server.py 幾乎完全相同，只是把 fetch 的 URL 改成 /seats，
     且在載入資料後先做 name 排序。）
    """
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
        const API_URL = "/seats";
        let tables = [];
        let selectedTable = null;
        const preselectTableIdParam =
        new URLSearchParams(window.location.search).get('table_id')
        || new URLSearchParams(window.location.search).get('table');

        async function loadTables() {
            const response = await fetch(API_URL);
            const data = await response.json();
            tables = data.filter(
                t => t.capacity > 0 && !t.table_id.toLowerCase().startsWith('s_')
            );

            tables.sort((a, b) => String(a.name).localeCompare(String(b.name)));
            populateTableSelect();

            if (preselectTableIdParam) {
                const found = tables.find(t => t.table_id === preselectTableIdParam);
                if (found) {
                    document.getElementById('tableSelect').value = found.id;
                    updateTableInfo();
                }
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
                option.value = table.id;
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
            
            selectedTable = tables.find(t => t.id === tableId);
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
                ${selectedTable.tags ? `<div><strong>特色:</strong> ${selectedTable.tags.join(', ')}</div>` : ''}
                ${selectedTable.updateTime ? `<div style="font-size: 12px; color: #666;">最近入座: ${new Date(selectedTable.updateTime).toLocaleString()}</div>` : ''}
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
                const response = await fetch(`${API_URL}/${selectedTable.table_id}`, {
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

@app.get("/management", response_class=HTMLResponse)
def serve_management_interface():
    """
    管理員介面：回傳內嵌 HTML，顯示所有桌位狀態並可 + / − 入座人數
    （此段內容和原本 simple_local_server.py 幾乎完全相同，只是將 fetch URL 改成 /seats，
     並在取得資料後先做 name 排序。）
    """
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
        const API_URL = "/seats";
        let tables = [];

        async function loadTables() {
            try {
                const response = await fetch(API_URL);
                const data = await response.json();
                // 只顯示 capacity > 0、且不是 seat (table_id 不以 "s_" 開頭)
                tables = data.filter(t => t.capacity > 0 && !t.table_id.startsWith('s_'));
                
                // ＝ 新增：依照 name 欄位做排序 ＝
                tables.sort((a, b) => a.name.localeCompare(b.name));
                
                renderTables();
                updateStats();
                document.getElementById('lastUpdate').textContent = `最近入座: ${new Date().toLocaleTimeString()}`;
            } catch (error) {
                console.error('Error:', error);
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
                            ${table.tags.length > 0 ? `<br>特色: ${table.tags.join(', ')}` : ''}
                        </div>
                        <div class="occupancy">
                            <div class="occupancy-number">${occupied} / ${maxCapacity}</div>
                            <div style="font-size: 14px; color: #666;">目前入座人數</div>
                        </div>
                        <div class="btn-controls">
                            <button class="btn-minus" onclick="updateOccupancy('${table.table_id}', -1)" ${occupied <= 0 ? 'disabled' : ''}>−</button>
                            <button class="btn-plus" onclick="updateOccupancy('${table.table_id}', 1)" ${occupied >= maxCapacity ? 'disabled' : ''}>+</button>
                        </div>
                        ${table.updateTime ? `<div style="text-align: center; font-size: 12px; color: #999; margin-top: 10px;">最近入座: ${formatTime(table.updateTime)}</div>` : ''}
                    </div>
                `;
            }).join('');
        }

        function updateStats() {
            const totalTables = tables.length;
            const totalCapacity = tables.reduce((sum, t) => sum + (t.capacity || 0) + (t.extraSeatLimit || 0), 0);
            const totalOccupied = tables.reduce((sum, t) => sum + (t.occupied || 0), 0);
            const rate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

            document.getElementById('totalTables').textContent = totalTables;
            document.getElementById('totalCapacity').textContent = totalCapacity;
            document.getElementById('totalOccupied').textContent = totalOccupied;
            document.getElementById('occupancyRate').textContent = rate + '%';
        }

        function formatTime(isoString) {
            const date = new Date(isoString);
            const now = new Date();
            const diffMins = Math.floor((now - date) / 60000);
            if (diffMins < 1) return '剛剛';
            if (diffMins < 60) return `${diffMins}分鐘前`;
            if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小時前`;
            return `${Math.floor(diffMins / 1440)}天前`;
        }

        async function updateOccupancy(tableId, delta) {
            try {
                const table = tables.find(t => t.table_id === tableId);
                if (!table) return;

                const currentOccupied = table.occupied || 0;
                const maxCapacity = (table.capacity || 0) + (table.extraSeatLimit || 0);
                const newOccupied = Math.max(0, Math.min(maxCapacity, currentOccupied + delta));
                
                if (newOccupied === currentOccupied) return;

                const response = await fetch(`${API_URL}/${tableId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        occupied: newOccupied,
                        updateTime: delta > 0 ? new Date().toISOString() : table.updateTime
                    })
                });

                if (!response.ok) throw new Error('更新失敗');

                table.occupied = newOccupied;
                if (delta > 0) table.updateTime = new Date().toISOString();
                renderTables();
                updateStats();

            } catch (error) {
                console.error('Error:', error);
                alert('更新失敗: ' + error.message);
            }
        }

        window.addEventListener('DOMContentLoaded', () => {
            loadTables();
            setInterval(loadTables, 10000); // 每 10 秒自動刷新
        });
    </script>
</body>
</html>
    """

# ===== 7. 啟動 Uvicorn =====
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting simple local server (using MongoDB)...")
    print("📱 Customer interface: http://localhost:8001/customer")
    print("🛠️  Management interface: http://localhost:8001/management")
    print("📚 API docs: http://localhost:8001/docs")
    uvicorn.run(app, host="0.0.0.0", port=8001)
