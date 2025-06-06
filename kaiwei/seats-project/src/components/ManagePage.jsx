import React, { useEffect, useState } from 'react';
import '../styles/ManagePage.css';

const ManagePage = () => {
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState({ totalTables: 0, totalCapacity: 0, totalOccupied: 0, occupancyRate: '0%' });
  const [lastUpdate, setLastUpdate] = useState('-');

  // 判斷是否為 guest 視角
  const isGuest = window.location.pathname.includes('/guest');

  useEffect(() => {
    loadTables();
    const interval = setInterval(loadTables, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTables = async () => {
    try {
      const response = await fetch('http://localhost:8002/tables');
      let data = await response.json();
      data = data.filter(t => t.capacity > 0 && !t.table_id.startsWith('s_'));
      data.sort((a, b) => a.name.localeCompare(b.name));
      setTables(data);
      setLastUpdate(new Date().toLocaleTimeString());
      updateStats(data);
    } catch (err) {
      console.error('載入失敗:', err);
    }
  };

  const updateStats = (data) => {
    const totalCapacity = data.reduce((sum, t) => sum + t.capacity + (t.extraSeatLimit || 0), 0);
    const totalOccupied = data.reduce((sum, t) => sum + t.occupied, 0);
    const rate = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
    setStats({ totalTables: data.length, totalCapacity, totalOccupied, occupancyRate: `${rate}%` });
  };

  const updateOccupancy = async (tableId, delta) => {
    try {
      const table = tables.find(t => t.table_id === tableId);
      if (!table) return;

      const maxCapacity = table.capacity + (table.extraSeatLimit || 0);
      const newOccupied = Math.max(0, Math.min(maxCapacity, table.occupied + delta));
      if (newOccupied === table.occupied) return;

      const response = await fetch(`http://localhost:8002/tables/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          occupied: newOccupied,
          updateTime: delta > 0 ? new Date().toISOString() : table.updateTime
        })
      });
      if (!response.ok) throw new Error('更新失敗');

      loadTables();
    } catch (error) {
      alert('更新錯誤: ' + error.message);
    }
  };

  const formatTime = iso => {
    if (!iso) return '';
    const date = new Date(iso);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return '剛剛';
    if (diffMins < 60) return `${diffMins}分鐘前`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}小時前`;
    return `${Math.floor(diffMins / 1440)}天前`;
  };

  return (
    <div className="management-container">
      {/* 只有非 guest 模式才顯示 dashboard */}
      {!isGuest && (
        <div className="dashboard">
          <div className="card"><h3>總桌數</h3><div className="number">{stats.totalTables}</div></div>
          <div className="card"><h3>總座位</h3><div className="number">{stats.totalCapacity}</div></div>
          <div className="card"><h3>已入座</h3><div className="number">{stats.totalOccupied}</div></div>
          <div className="card"><h3>使用率</h3><div className="number">{stats.occupancyRate}</div></div>
        </div>
      )}

      {/* 只有非 guest 模式才顯示控制區 (含重新整理按鈕) */}
      {!isGuest && (
        <div className="controls">
          <h2>即時桌位狀態</h2>
          <div style={{ gap: '1rem', display: 'flex', alignItems: 'center' }}>
            <span>{lastUpdate && `最近入座: ${lastUpdate}`}</span>
            <button className="refresh-btn" onClick={loadTables}>🔄 重新整理</button>
          </div>
        </div>
      )}

      <div className="table-grid">
        {tables.map(t => {
          const occupied = t.occupied || 0;
          const maxCapacity = t.capacity + (t.extraSeatLimit || 0);
          const available = maxCapacity - occupied;
          let statusClass = occupied === 0 ? 'status-empty' : (available > 0 ? 'status-partial' : 'status-full');
          let statusText = occupied === 0 ? '空桌' : (available > 0 ? '部分入座' : '滿桌');
          let icon = occupied === 0 ? '🟢' : available > 0 ? '🟡' : '🔴';

          return (
            <div key={t.table_id} className="table-item">
              <div className="table-header">
                <div className="table-name">{icon} {t.name}</div>
                <div className={`table-status ${statusClass}`}>{statusText}</div>
              </div>
              <div className="table-desc">
                <div className="update-time">
                {t.occupied > 0
                    ? `最近入座: ${formatTime(t.updateTime)}`
                    : '\u00A0'}
                </div>
                {t.description}<br />可容納: {t.capacity}{t.extraSeatLimit > 0 ? ` (+${t.extraSeatLimit})` : ''} 人
                <div className="table-tags">
                    {Array.isArray(t.tags) && t.tags.length > 0
                    ? t.tags.map(tag => (
                        <span key={tag} className="tag">
                            {tag}
                        </span>
                        ))
                    : '\u00A0'}
                </div>
              </div>
              <div className="occupancy">
                <div className="occupancy-number">{occupied} / {maxCapacity}</div>
                <div className="subtext">目前入座人數</div>
              </div>
              {/* 只有非 guest 模式才顯示加減按鈕 */}
              {!isGuest && (
                <div className="btn-controls">
                  <button className="btn-minus" onClick={() => updateOccupancy(t.table_id, -1)} disabled={occupied <= 0}>−</button>
                  <button className="btn-plus"  onClick={() => updateOccupancy(t.table_id, +1)} disabled={occupied >= maxCapacity}>＋</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default ManagePage;