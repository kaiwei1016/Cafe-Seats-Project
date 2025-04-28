import React, { useState, useEffect } from 'react';
import './KCafe.css';

const seatPositions = [
  { id: 1, left: '32.40%', top: '9.00%' },
  { id: 2, left: '42.80%', top: '9.00%' },
  { id: 3, left: '53.20%', top: '9.00%' },
  { id: 4, left: '63.60%', top: '9.00%' },
  { id: 5, left: '32.40%', top: '17.30%' },
  { id: 6, left: '42.80%', top: '17.30%' },
  { id: 7, left: '53.20%', top: '17.30%' },
  { id: 8, left: '63.60%', top: '17.30%' },
  { id: 9, left: '32.40%', top: '26.30%' },
  { id: 10, left: '42.80%', top: '26.30%' },
  { id: 11, left: '53.20%', top: '26.30%' },
  { id: 12, left: '63.60%', top: '26.30%' },
  { id: 13, left: '32.40%', top: '34.60%' },
  { id: 14, left: '42.80%', top: '34.60%' },
  { id: 15, left: '53.20%', top: '34.60%' },
  { id: 16, left: '63.60%', top: '34.60%' },
  { id: 17, left: '34.00%', top: '75.50%' },
  { id: 18, left: '48.00%', top: '75.50%' },
  { id: 19, left: '72.00%', top: '75.50%' },
  { id: 20, left: '86.00%', top: '75.50%' },
  { id: 21, left: '9.00%', top: '11.00%' },
  { id: 22, left: '17.30%', top: '11.70%' },
  { id: 23, left: '9.00%', top: '20.00%' },
  { id: 24, left: '17.00%', top: '20.30%' },
  { id: 25, left: '9.00%', top: '34.80%' },
  { id: 26, left: '17.00%', top: '35.60%' },
  { id: 27, left: '9.00%', top: '43.80%' },
  { id: 28, left: '17.00%', top: '43.80%' },
  { id: 29, left: '8.80%', top: '59.70%' },
  { id: 30, left: '17.00%', top: '60.00%' },
  { id: 31, left: '8.80%', top: '67.70%' },
  { id: 32, left: '16.30%', top: '67.80%' },
];

const KCafe = () => {
  const [seats, setSeats] = useState(Array(32).fill(false)); // 預設全部無人
  const [currentTime, setCurrentTime] = useState(new Date());

  const toggleSeat = (index) => {
    const updatedSeats = [...seats];
    updatedSeats[index] = !updatedSeats[index];
    setSeats(updatedSeats);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="kcafe-container">
      <h1>Welcome to KCafe!</h1>
      <h2>
        現在時間：{currentTime.toLocaleString()}　
        目前剩餘座位：<span className="remaining">{seats.filter(seat => !seat).length}</span>/32
      </h2>
      <div className="background">
        <img src="/img/KCafe.jpg" alt="KCafe Background" className="bg-image" />
        {seatPositions.map((seat, index) => (
          <img
            key={seat.id}
            src={seats[index] ? '/img/r_circle.png' : '/img/g_circle.png'}
            alt={`Seat ${seat.id}`}
            title={`Seat ${seat.id}`}
            className={`seat ${seats[index] ? 'occupied' : ''}`}
            style={{ left: seat.left, top: seat.top }}
            onClick={() => toggleSeat(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default KCafe;
