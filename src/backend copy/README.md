# Parking Tower - Flask Backend (example)

간단한 Flask 예제 서버입니다. 프론트엔드(Vite)는 기본적으로 http://localhost:5173 에서 동작합니다.

엔드포인트 요약:

- GET / -> 서버 기본 정보 (프론트엔드 주소 포함)
- GET /grid -> 전체 주차 그리드 상태
- GET /spot/<r>/<c> -> 특정 슬롯 상태
- POST /park -> 주차 수행 (JSON: { r: int, c: int, carNumber: str })
- POST /exit -> 출차 및 결제 계산 (JSON: { carNumber: str })
- GET /car/<carNumber> -> 특정 차량 정보

요금 계산은 간단한 시간 기반(시간당 2,000원, 초단위 반올림하여 한 시간 단위로 계산)입니다.

실행 방법 (Windows PowerShell):

```powershell
cd <repo-root>\backend
python -m venv .venv; .\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python app.py
```

또는 가상환경을 사용하지 않으면:

```powershell
python -m pip install -r backend\requirements.txt
python backend\app.py
```

프론트엔드에서 호출 예시 (fetch):

fetch('http://localhost:5000/grid').then(r=>r.json()).then(console.log)
