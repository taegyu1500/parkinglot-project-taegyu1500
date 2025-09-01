# Parking Tower - Flask Backend (API reference)

간단한 Flask 백엔드입니다. 프론트엔드 개발 서버는 보통 `http://localhost:5173`에서 동작하며, 백엔드는 기본적으로 `http://localhost:5000`에서 실행됩니다.

요약
- Flask app serving a small JSON API under `/api` and optional built frontend from `backend/dist`.

실행 (로컬)

```bash
cd backend
python -m pip install -r requirements.txt
python app.py
```

기본 동작: app은 호스트 `0.0.0.0:5000`에서 실행되며, SPA(빌드된 프론트엔드)가 `backend/dist`에 있으면 정적 파일을 서빙합니다.

데이터 형식
- Grid: 2차원 배열(rows x cols) of cell objects.
	- cell: { available: bool, carNumber: string|null, is_seasonal: bool }
- Car info (store.cars value): { r: int, c: int, entry_time: ISO8601 string, is_seasonal: bool }

API 엔드포인트 (정확한 경로는 `app.py` 기준)

1) GET /api/
	 - 설명: API 기본 정보
	 - 응답: 200
		 ```json
		 { "message": "Parking Tower backend API", "frontend": "/" }
		 ```

2) GET /api/grid
	 - 설명: 전체 주차 그리드 상태 반환 (rows x cols 2차원 배열)
	## Parking Tower - Flask backend — API reference

	이 문서는 현재 `app.py`와 `parking_store.py` (같은 디렉터리)에 구현된 REST API를 기반으로 작성된 명세입니다.

	짧은 요약
	- Flask로 구현된 JSON API를 `/api` 경로 아래에서 제공합니다.
	- SPA 빌드 결과가 `backend/dist`에 있으면 `GET /`로 서빙합니다.

	빠른 시작

	```bash
	cd src/backend
	python -m pip install -r requirements.txt
	python app.py
	```

	기본: 서버는 `0.0.0.0:5000`에서 동작합니다.

	데이터 모델 (간단히)
	- Grid: rows x cols 2차원 배열. 각 cell은 다음 필드를 가집니다:
		- `available` (bool)
		- `carNumber` (string|null)
		- `is_seasonal` (bool)
		- `entry_time` (ISO8601 string|null)
	- Cars store (`store.cars`): carNumber -> `{ r: int, c: int, entry_time: ISO8601 string, is_seasonal: bool }`

	중요: API에서 좌표 `r`, `c`는 0-based 인덱스입니다(코드 내부에서 0부터 시작).

	API 엔드포인트

	### 1) GET /api/
	- 설명: API 루트 정보
	- 응답: 200

	```json
	{ "message": "Parking Tower backend API", "frontend": "/" }
	```

	### 2) GET /api/grid
	- 설명: 전체 주차 그리드를 반환합니다.
	- 응답: 200
	- 반환 예시: JSON 배열(행 목록) — 각 셀은 위의 cell 구조를 가집니다.

	```json
	[
		[ { "available": true, "carNumber": null, "is_seasonal": false, "entry_time": null }, ... ],
		...
	]
	```

	### 3) GET /api/spot/<r>/<c>
	- 설명: 특정 위치의 셀 정보를 반환합니다. `r`, `c`는 0-based입니다.
	- 성공 응답: 200, 셀 객체
	- 잘못된 좌표: 400

	오류 예시:

	```json
	{ "ok": false, "message": "invalid spot" }
	```

	### 4) GET /api/seasonal/<carNumber>
	- 설명: 해당 차량 번호가 시즌권(시즌 회원) 목록에 있는지 확인합니다.
	- 응답:
		- 있으면: 200 `{ "ok": true }`
		- 없으면: 404 `{ "ok": false }`

	### 5) POST /api/park
	- 설명: 지정한 위치에 차량을 주차합니다.
	- 요청 Content-Type: application/json
	- 요청 바디 예시:

	```json
	{ "r": 0, "c": 1, "carNumber": "1234", "isSeasonal": false }
	```

	- 필드 설명:
		- `r`, `c`: 필수, 0-based 정수
		- `carNumber`: 필수, 문자열
		- `isSeasonal`: 선택, boolean (기본 false). 프론트엔드는 `isSeasonal`로 보냅니다.

	- 응답:
		- 성공(주차 가능): 200
			```json
			{ "ok": true, "message": "2층-B에 주차되었습니다.", "grid": [...] }
			```
			(응답의 `grid`는 서버에서 반환하는 그리드 스냅샷을 포함합니다.)
		- 입력 누락: 400 `{ "ok": false, "message": "r, c, carNumber required" }`
		- 이미 동일 차량번호가 존재하거나, 지정 좌표에 이미 차량이 있으면 400과 `ok: false` 메시지를 반환합니다.

	주의: 현재 코드에서는 응답에 포함되는 `grid` 변수는 핸들러 내부에서 읽은 스냅샷을 그대로 반환합니다(동작상 타이밍에 따라 최신 상태 반영 여부가 달라질 수 있음).

	### 6) POST /api/exit
	- 설명: 차량 번호로 출차 및 요금 정산을 수행합니다.
	- 요청 바디 예시:

	```json
	{ "carNumber": "1234" }
	```

	- 동작:
		- 차량을 찾지 못하면 404 `{ "ok": false, "message": "Car not found" }`를 반환합니다.
		- 찾으면 출차 처리 후 자리를 비우고 요금을 계산하여 200 `{ "ok": true, "message": "..." }`를 반환합니다.

	- 요금 계산 로직 (간단히):
		- 체류 시간(분)을 초 단위 차이로 계산하여 분으로 반올림(최소 1분).
		- 10분 단위로 끊어 500원 단위 요금 부과(예: 1~10분 -> 500원, 11~20분 -> 1000원).
		- 시즌권(`is_seasonal`)이면 최종 요금의 50%를 적용합니다.

	예시 응답:

	```json
	{ "ok": true, "message": "총 주차시간은 125분입니다.35000원 결제되었습니다." }
	```

	### 7) GET /api/car/<carNumber>
	- 설명: 차량 번호로 현재 주차 정보(위치, 입차 시각 등)를 조회합니다.
	- 성공: 200 `{ "ok": true, "car": { "r": 2, "c": 3, "entry_time": "2025-09-01T...", "is_seasonal": false } }`
	- 없으면: 404 `{ "ok": false, "message": "not found" }`

	프론트엔드 서빙
	- `GET /` 및 기타 경로는 `backend/dist` 내 빌드된 파일을 우선적으로 서빙합니다. 빌드 파일이 없으면 간단한 JSON을 반환합니다.

	예제 curl 요청

	```bash
	curl -s http://localhost:5000/api/grid | jq

	curl -s -X POST http://localhost:5000/api/park \
		-H 'Content-Type: application/json' \
		-d '{"r":0,"c":1,"carNumber":"1234","isSeasonal":false}' | jq

	curl -s -X POST http://localhost:5000/api/exit \
		-H 'Content-Type: application/json' \
		-d '{"carNumber":"1234"}' | jq
	```

	간단한 fetch 사용 예

	```js
	fetch('/api/grid').then(r => r.json()).then(console.log)
	```

	추가 노트
	- 코드 내부에서 그리드 셀은 `is_seasonal`이라는 snake_case 필드를 사용합니다. API 클라이언트는 주차 요청에서 `isSeasonal`(camelCase)을 보내는 구현입니다(핸들러가 이를 읽어 내부로 전달합니다).
	- `r`, `c`는 0-based 인덱스입니다; UI에서는 사용자 친화적으로 1-based로 표시할 수 있습니다.

