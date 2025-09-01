import React, {useState} from 'react';
import './App.css';
import ParkingGrid from './ParkingGrid';

const Alert = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="custom-alert-overlay">
      <div className="custom-alert-box">
        <h2>알림</h2>
        <p>{message}</p>
        <button onClick={onClose}>확인</button>
      </div>
    </div>
  );
};

export default function App() {
  const [carNumber, setCarNumber] = useState('');
  const [alertMessage, setAlertMessage] = useState(null); // 알림 메시지 상태
  const [mode, setMode] = useState('입차'); // 입차/출차 상태
  const [view, setView] = useState('home'); // 'home' or 'grid'
  const [selectedCarNumber, setSelectedCarNumber] = useState(null);
  const maxDigits = 4; // 4자리 차량 번호 (예시)

  const handleNumericKeyClick = (key) => {
    if (key === 'clear') {
      setCarNumber('');
    } else if (key === 'delete') {
      setCarNumber(carNumber.slice(0, -1));
    } else if (key === 'confirm') {
      // Confirm behavior depends on view
      if (carNumber.length !== maxDigits) {
        setAlertMessage('차량번호 4자리를 입력해주세요.');
        return;
      }
      if (view === 'input') {
        setSelectedCarNumber(carNumber);
        setCarNumber('');
        setView('grid');
      }
    } else {
      if (carNumber.length >= maxDigits) return; // limit
      setCarNumber(carNumber + key);
    }
  };

  const handleLargeButtonClick = (action) => {
    setMode(action);
    if (action === '입차') {
      // 입차 누르면 차량번호 입력 화면으로 이동
      setView('input');
      setSelectedCarNumber(null);
    } else if (action === '출차') {
      // 출차 흐름: 바로 그리드(출차 모드)로 이동
      setView('grid-exit');
      setCarNumber('');
    }
  };

  const largeButtons = [
    { text: '입차', className: 'success', action: '입차' },
    { text: '출차', className: 'danger', action: '출차' },
  ];

  const numericKeys = ['1','2','3','4','5','6','7','8','9'];

    const numberDigits = Array(maxDigits).fill(null).map((_, index) => {
    const digit = carNumber[index] || '';
    const isFocused = index === carNumber.length;
    return (
      <div key={index} className={`car-number-digit ${isFocused ? 'focused' : ''}`}>
        {digit}
      </div>
    );
  });

  // 홈 뷰: 환영 문구와 좌우 입차/출차 버튼
  if (view === 'home') {
    return (
      <div className="app-container full-height">
        <h1 style={{ fontSize: '2.4rem', marginBottom: '1rem' }}>Neuro-Truck 지하 주차장</h1>

        <div className="home-actions">
          {largeButtons.map((button, index) => (
            <button
              key={index}
              className={`large-button ${button.className}`}
              onClick={() => handleLargeButtonClick(button.action)}
            >
              {button.text}
            </button>
          ))}
        </div>

        <Alert 
          message={alertMessage} 
          onClose={() => setAlertMessage(null)} // '확인' 버튼 클릭 시 알림 닫기
        />
      </div>
    );
  }

  // 입력 뷰: 차량번호 입력 (키패드)
  if (view === 'input' || view === 'input-exit') {
    const isConfirmActive = carNumber.length === maxDigits;
    return (
      <div className="app-container">
        <h1>차량번호 입력</h1>
        <div className="car-number-input-container">{numberDigits}</div>
        <div className="numeric-keypad">
          {/* digits 1-9 as 3x3 */}
          {['1','2','3','4','5','6','7','8','9'].map((key) => (
            <div key={key} className="key" onClick={() => handleNumericKeyClick(key)}>
              <span>{key}</span>
            </div>
          ))}

          {/* bottom row: delete, 0, confirm */}
          <div className="key special" onClick={() => handleNumericKeyClick('delete')}>
            <span>←</span>
          </div>
          <div className="key" onClick={() => handleNumericKeyClick('0')}>
            <span>0</span>
          </div>
          <div className={`key confirm ${isConfirmActive ? '' : 'disabled'}`} onClick={() => isConfirmActive && handleNumericKeyClick('confirm')}>
            <span>확인</span>
          </div>
        </div>

        <Alert message={alertMessage} onClose={() => setAlertMessage(null)} />
      </div>
    );
  }

  

  // grid 뷰: 선택한 차량번호로 자리 선택
  return (
    <div className="app-container full-height">
          <h1>주차 자리 선택</h1>
          {view !== 'grid-exit' && (
            <div style={{ marginBottom: '1rem' }}>입력 차량번호: <strong>{selectedCarNumber}</strong></div>
          )}
          <ParkingGrid
            carNumber={selectedCarNumber}
            onBack={() => setView('home')}
            mode={view === 'grid-exit' ? 'exit' : 'park'}
            setAlertMessage={(msg) => setAlertMessage(msg)}
            onDone={(message) => {
              if (message) setAlertMessage(message);
              setTimeout(() => setView('home'), 900);
            }}
          />

      <Alert 
        message={alertMessage} 
        onClose={() => setAlertMessage(null)} // '확인' 버튼 클릭 시 알림 닫기
      />
    </div>
  );
}

