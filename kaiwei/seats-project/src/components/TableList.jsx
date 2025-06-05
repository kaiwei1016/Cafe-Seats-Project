// src/components/TableList.jsx
import React from 'react';
import '../styles/TableList.css';

export default function TableList({
  tables,
  mode,
  onEditTable,
  onToggleAvailable
}) {
  const safeTables = Array.isArray(tables) ? tables : [];

  // 依照 name 屬性排序
  const sortedTables = [...safeTables].sort((a, b) =>
    String(a.name).localeCompare(String(b.name))
  );

  const filteredTables = sortedTables.filter(
    t => !(t.table_id?.[0]?.toLowerCase() === 's') // 排除 seat
  );

  const totalSeats    = filteredTables.reduce((s, t) => s + t.capacity, 0);
  const occupiedSeats = filteredTables.reduce((s, t) => s + t.occupied, 0);

  const formatRelative = iso => {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    if (diff < 60_000) return '1 分鐘';
    if (diff < 3_600_000) {
      const m = Math.floor(diff / 60_000);
      return `約 ${m} 分鐘`;
    }
    if (diff < 86_400_000) {
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      return m > 0 ? `約 ${h} 小時 ${m} 分鐘` : `約 ${h} 小時`;
    }
    const d = Math.floor(diff / 86_400_000);
    return `約 ${d} 天`;
  };

  return (
    <div className="table-list">
      <h2>
        Seat Availability and status (
        <span style={{ color: '#f44336', fontWeight: 500 }}>
          {occupiedSeats}
        </span>
        /{totalSeats})
      </h2>

      <ul>
        {filteredTables.map(t => {
          let statusLabel = '';
          let statusClass = '';
          let statusColor = '';

          if (t.capacity === 0 && t.occupied === 0) {
            statusLabel = 'Empty';
            statusClass = 'empty';
            statusColor = '#4caf50';
          } else if ((t.occupied || 0) >= (t.capacity || 0)) {
            statusLabel = 'Full';
            statusClass = 'full';
            statusColor = '#f44336';
          } else if ((t.occupied || 0) > 0) {
            statusLabel = 'Available';
            statusClass = 'partial';
            statusColor = '#ffb300';
          } else {
            statusLabel = 'Empty';
            statusClass = 'empty';
            statusColor = '#4caf50';
          }

          return (
            <li key={t.table_id} className="table-item">
              <div className="table-content">
                <div className={`table-icon ${statusClass}`}>🪑</div>
                <div className="table-card">
                  <div className="info-top">
                    <div className="table-name">
                      {t.name} (
                      <span
                        style={{
                          color: statusClass === 'full' ? '#f44336' : 'inherit'
                        }}
                      >
                        {t.occupied}
                      </span>
                      /{t.capacity})
                    </div>
                    <div
                      className="table-status"
                      style={{ color: statusColor, fontWeight: 500 }}
                    >
                      {statusLabel}
                    </div>
                  </div>

                  <div className="info-bottom">
                    {t.updateTime && (
                      <div className="last-updated">
                        最近入座：{formatRelative(t.updateTime)}前
                      </div>
                    )}
                    {t.description && (
                      <div className="table-description">
                        備註：{t.description}
                      </div>
                    )}
                    {Array.isArray(t.tags) && t.tags.length > 0 && (
                      <div className="table-tags">
                        {t.tags.map(tag => (
                          <span key={tag} className="tag">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {mode === 'business' && (
                <button
                  className="table-edit-btn"
                  onClick={() => onEditTable(t.table_id)}
                >
                  編輯
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
