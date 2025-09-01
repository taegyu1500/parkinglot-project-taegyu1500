import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from parking_store import ParkingStore


backend_dir = os.path.dirname(__file__)
dist_dir = os.path.join(backend_dir, 'dist')

# serve static files from backend/dist when present
app = Flask(__name__, static_folder=dist_dir, static_url_path='')
CORS(app)
store = ParkingStore(rows=10, cols=10)
seasonal_list = []

@app.route('/api/')
def api_index():
    return jsonify(message='Parking Tower backend API', frontend='/' )


@app.route('/api/grid', methods=['GET'])
def get_grid():
    return jsonify(store.get_grid())


@app.route('/api/spot/<int:r>/<int:c>', methods=['GET'])
def get_spot(r, c):
    if r < 0 or r >= store.rows or c < 0 or c >= store.cols:
        return jsonify({'ok': False, 'message': 'invalid spot'}), 400
    return jsonify(store.get_grid()[r][c])

@app.route('/api/seasonal/<carNumber>', methods=['GET'])
def get_seasonal(carNumber):
    if carNumber in store.seasonal_cars:
        return jsonify({'ok': True, 'message': 'Car is parked in a seasonal spot'})
    return jsonify({'ok': False, 'message': 'Car is not parked in a seasonal spot'}), 404

@app.route('/api/park', methods=['POST'])
def park():
    data = request.get_json() or {}
    r = data.get('r')
    c = data.get('c')
    carNumber = data.get('carNumber')
    is_seasonal = data.get('isSeasonal', False)
    grid = store.get_grid()
    if(carNumber in store.cars):
        return jsonify({'ok': False, 'message': 'carNumber already parked'}), 400
    if r is None or c is None or not carNumber:
        return jsonify({'ok': False, 'message': 'r, c, carNumber required'}), 400
    ok, message = store.park_at(int(r), int(c), str(carNumber), is_seasonal)
    status = 200 if ok else 400
    return jsonify({'ok': ok, 'message': message, 'grid': grid}), status


@app.route('/api/exit', methods=['POST'])
def exit_car():
    data = request.get_json() or {}
    carNumber = data.get('carNumber')
    if not carNumber:
        return jsonify({'ok': False, 'message': 'carNumber required'}), 400
    result = store.exit_by_number(str(carNumber))
    if not result.get('ok'):
        return jsonify(result), 404
    return jsonify(result)


@app.route('/api/car/<carNumber>', methods=['GET'])
def car_info(carNumber):
    info = store.get_car_info(str(carNumber))
    if not info:
        return jsonify({'ok': False, 'message': 'not found'}), 404
    return jsonify({'ok': True, 'car': info})


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Serve built frontend from backend/dist when available.

    If not built, return a small JSON message for quick sanity checks.
    """
    index_path = os.path.join(dist_dir, 'index.html')
    if os.path.exists(index_path):
        # if path points to an existing static file, return it, otherwise return index.html (SPA)
        target = os.path.join(dist_dir, path)
        if path and os.path.exists(target):
            return send_from_directory(dist_dir, path)
        return send_from_directory(dist_dir, 'index.html')
    return jsonify(message='Parking Tower backend (no frontend built)', api_root='/api')


if __name__ == '__main__':
    # For stable local testing, run without the debug reloader which can make port binding flaky
    app.run(host='0.0.0.0', port=5000, debug=False)

