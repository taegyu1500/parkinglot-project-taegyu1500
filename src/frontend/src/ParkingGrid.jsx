import React, { useEffect, useState } from "react";
import "./App.css";
import mockStore from "./parkingMockStore";

// Props: { carNumber, onBack, setAlertMessage }
export default function ParkingGrid({
  carNumber,
  onBack,
  setAlertMessage,
  mode = "park",
  onDone,
}) {
  const rows = 10;
  const cols = 10;
  const [grid, setGrid] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentTarget, setPaymentTarget] = useState(null);
  const [seasonalTarget, setSeasonalTarget] = useState(false);

  // Fetch grid state from Flask API
  // For now use mock data while grid is under development.
  const fetchGrid = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use mock store
      await new Promise((res) => setTimeout(res, 150));
      const g = await mockStore.getGrid();
      setGrid(g);
    } catch (err) {
      setError(err.message || "Mock error");
      setGrid(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrid();
    // poll occasionally (kept for when real API is used)
    const id = setInterval(fetchGrid, 10000);
    return () => clearInterval(id);
  }, []);

  const handleSlotClick = async (r, c) => {
    if (!grid) return;
    const slot = grid[r] && grid[r][c];
    if (!slot) return;
    // behavior depends on mode
    if (mode === "park") {
      if (!slot.available) {
        setAlertMessage("이 자리는 주차 불가합니다.");
        return;
      }
      const check = await seasonalCheck(r,c, carNumber);
      if(!check.ok){
      setSeasonalTarget({ r, c, slot });
      }
    }

    // exit mode: only occupied slots are candidate for exit
    if (mode === "exit") {
      if (slot.available) {
        setAlertMessage("이 자리는 비어 있습니다.");
        return;
      }
      // open payment modal for confirmation
      
      // const res = await mockStore.findCar(grid[r][c].carNumber);
    //   if (res) {
    //     const entry = res.entry_time;
    //     const exit = new Date().toISOString();
    //     const fee = calculateParkingFee(entry, exit, res.is_seasonal);
    //     setPaymentAmount(fee);
    //   }

      setPaymentTarget({ r, c, slot });
    // }
  };
  // const calculateParkingFee = (entryTime, exitTime, isSeasonal) => {
  //   const entry = new Date(entryTime);
  //   const exit = new Date(exitTime);
  //   const duration = (exit - entry) / 1000 / 60 / 60; // duration in hours
  //   const rate = isSeasonal ? 1000 : 2000; // seasonal rate is cheaper
  //   return Math.ceil(duration) * rate;
  // };

}
  const confirmExitWithPayment = () => {
    if (!paymentTarget) return;
    const { r, c } = paymentTarget;
    (async () => {
      const res = await mockStore.exitCarByNumber(grid[r][c].carNumber);
      setAlertMessage(res.message);
      const newGrid = await mockStore.getGrid();
      setGrid(newGrid);
      setPaymentTarget(null);
      if (onDone) setTimeout(onDone, 900);
    })();
  };

  const seasonalCheck = async (r,c,carNumber) => {
    const res = await mockStore.seasonalCheck(carNumber);
    if (res.ok) {
      confirmParkWithSeasonal(r, c, carNumber, true);
      return true
    } else {
      return false
    }
  };

  const confirmParkWithSeasonal = async (r, c, carNumber, seasonal) => {
    // if (!seasonalTarget) return;
    // const { r, c } = seasonalTarget;
    // (async () => {
    //   const res = await mockStore.parkAt(r, c, grid[r][c].carNumber, seasonal);
    //   setAlertMessage(res.message);
    //   const newGrid = await mockStore.getGrid();
    //   setGrid(newGrid);
    //   setSeasonalTarget(null);
    //   if (onDone) setTimeout(onDone, 900);
    // })();

      const res = await mockStore.parkAt(r, c, carNumber, seasonal);
      const newGrid = await mockStore.getGrid();
      setGrid(newGrid);
      // success: route message to parent via onDone to avoid duplicate alerts
      if (onDone) onDone(res.message);
      else setAlertMessage(res.message);
      return;
  };



const renderGrid = () => {
    if (!grid) return null;
    const colsCount = grid[0]?.length || cols;
    const rowsCount = grid.length || rows;
    const colLetters = Array.from({ length: colsCount }, (_, i) =>
      String.fromCharCode(65 + i)
    );
    const gridTemplateColumns = `48px repeat(${colsCount}, 1fr)`;

    return (
      <div className="parking-grid-with-labels">
        <div className="grid-table" style={{ gridTemplateColumns }}>
          {/* corner */}
          <div className="corner-cell" />

          {/* column headers */}
          {colLetters.map((letter, ci) => (
            <div key={ci} className="col-header-cell">
              {letter}
            </div>
          ))}

          {/* rows */}
          {grid.map((rowArr, r) => (
            <React.Fragment key={r}>
              {/* left row label */}
              <div className="row-label">{r + 1}층</div>

              {/* cells for this row */}
              {rowArr.map((slot, c) => {
                const isOccupied = !slot.available;
                const statusClass =
                  mode === "exit" ? (isOccupied ? "occupied" : "free") : slot.available ? "available" : "unavailable";

                // clickable when exiting occupied, or when parking into available
                const clickableForExit = mode === "exit" && isOccupied;
                const clickableForPark = mode === "park" && slot.available;
                const isClickable = clickableForExit || clickableForPark;

                return (
                  <div
                    key={c}
                    className={`parking-cell ${statusClass} ${clickableForPark ? "clickable park-target" : ""} ${clickableForExit ? "clickable exit-target" : ""}`}
                    onClick={isClickable ? () => handleSlotClick(r, c) : undefined}
                    role={isClickable ? "button" : undefined}
                    tabIndex={isClickable ? 0 : -1}
                  >
                    <div className="cell-inner">
                      {/* 출차 모드: 차량번호 중앙 표시
                          입차 모드: 내용 비우고 테두리만 표시 (cell-vacant) */}
                      {mode === "exit" ? (
                        <div className="cell-number-center"><div>{slot.carNumber}</div>
                          {slot.entry_time && (
                            <span className="entry-time">
                              {Math.floor((Date.now() - new Date(slot.entry_time)) / 60000)}분 경과
                            </span>
                          )}
                        </div>
                      ) : (
                        // park mode
                        <div className="cell-action">
                          {slot.available ? (
                            <div className="cell-vacant" /> // empty content, styled via CSS to show only border/color
                          ) : (
                            <div className={`disabled-label ${slot.is_seasonal ? "seasonal" : "regular"}`}>
                              {slot.is_seasonal ? "🚙" : "🛻"}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ width: "100%" }}>
      <div className="grid-header">
        <button className="icon-btn" onClick={onBack} aria-label="뒤로">
          ⟵
        </button>
        <button className="icon-btn" onClick={fetchGrid} aria-label="새로고침">
          ⟳
        </button>
      </div>

      {error && <div style={{ color: "red" }}>에러: {error}</div>}

      <div className="grid-wrapper">
        {grid ? renderGrid() : <div>그리드를 불러올 수 없습니다.</div>}
      </div>

      {/* payment modal for exit flow */}
      {paymentTarget && (
        <div className="custom-alert-overlay">
          <div className="custom-alert-box">
            <h2>확인</h2>
            <p>{`${paymentTarget.r + 1}층-${String.fromCharCode(paymentTarget.c + 65)}에서 출차하시겠습니까?`}</p>
            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button onClick={() => setPaymentTarget(null)}>취소</button>
              <button onClick={confirmExitWithPayment}>확인</button>
            </div>
          </div>
        </div>
      )}
      {seasonalTarget && (
        <div className="custom-alert-overlay">
          <div className="custom-alert-box">
            <h2>정기권 확인</h2>
            <p>{`${seasonalTarget.r + 1}층-${String.fromCharCode(seasonalTarget.c + 65)}에 주차합니다. 정기권을 사용하시겠습니까?`}</p>
            <div
              style={{ display: "flex", gap: "1rem", justifyContent: "center" }}
            >
              <button onClick={() => confirmParkWithSeasonal(seasonalTarget.r, seasonalTarget.c, carNumber, false)}>아니오</button>
              <button onClick={() => confirmParkWithSeasonal(seasonalTarget.r, seasonalTarget.c, carNumber, true)}>확인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
