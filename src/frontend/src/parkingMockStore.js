// parkingMockStore: tries backend /api endpoints first, falls back to in-memory mock
const rows = 5;
const cols = 10;

let grid = Array.from({ length: rows }).map((_, r) =>
  Array.from({ length: cols }).map((_, c) => ({ available: true, carNumber: null }))
);

// API base can be configured at build time via Vite env VITE_API_BASE
// const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
//   ? import.meta.env.VITE_API_BASE.replace(/\/+$/, '')
//   : '/api';

const API_BASE =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE)
    ? import.meta.env.VITE_API_BASE.replace(/\/+$/, '')
    : (typeof window !== 'undefined'
        ? `http://${window.location.hostname}:8000/api`
        : 'http://localhost:8000/api');

function localGetGrid() {
  return grid.map((row) => row.map((cell) => ({ ...cell })));
}

export async function getGrid() {
  try {
    const res = await fetch(`${API_BASE}/grid`);
    if (!res.ok) throw new Error('api error');
    return await res.json();
  } catch (e) {
    return localGetGrid();
  }
}

export async function parkAt(r, c, carNumber, isSeasonal) {
  try {
    const res = await fetch(`${API_BASE}/park`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ r, c, carNumber, isSeasonal }),
    });
    return await res.json();
  } catch (e) {
    // fallback to local
    if (r < 0 || r >= rows || c < 0 || c >= cols) return { ok: false, message: '잘못된 위치' };
    if (!grid[r][c].available) return { ok: false, message: '이미 사용중' };
    grid[r][c].available = false;
    grid[r][c].carNumber = carNumber;
    return { ok: true, message: `주차 완료: R${r + 1}-C${c + 1}` };
  }
}

export async function findCar(carNumber) {
  try {
    const res = await fetch(`${API_BASE}/car/${encodeURIComponent(carNumber)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.car || null;
  } catch (e) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (grid[r][c].carNumber === carNumber) return { r, c };
      }
    }
    return null;
  }
}

export async function exitCarByNumber(carNumber) {
  try {
    const res = await fetch(`${API_BASE}/exit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ carNumber }),
    });
    return await res.json();
  } catch (e) {
    const found = await findCar(carNumber);
    if (!found) return { ok: false, message: '해당 차량을 찾을 수 없습니다.' };
    const { r, c } = found;
    grid[r][c].available = true;
    grid[r][c].carNumber = null;
    return { ok: true, message: `출차 완료: R${r + 1}-C${c + 1}` };
  }
}

export async function seasonalCheck(carNumber) {
  try {
    const res = await fetch(`${API_BASE}/seasonal/${encodeURIComponent(carNumber)}`);
    return await res.json();
  } catch(e) {
    return { ok: false };
  }
}

export function resetGrid() {
  grid = Array.from({ length: rows }).map((_, r) =>
    Array.from({ length: cols }).map((_, c) => ({ available: true, carNumber: null }))
  );
}

export default {
  getGrid,
  parkAt,
  findCar,
  exitCarByNumber,
  resetGrid,
  seasonalCheck,
};
