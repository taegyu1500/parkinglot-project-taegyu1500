import requests
print('calling /api/grid')
r = requests.get('http://127.0.0.1:5000/api/grid', timeout=3)
print('status', r.status_code)
print(r.json())

print('\ncalling /api/park')
r = requests.post('http://127.0.0.1:5000/api/park', json={'r':0,'c':0,'carNumber':'TEST123'}, timeout=3)
print('status', r.status_code)
print(r.json())

print('\ncalling /api/car/TEST123')
r = requests.get('http://127.0.0.1:5000/api/car/TEST123', timeout=3)
print('status', r.status_code)
print(r.json())

print('\ncalling /api/exit')
r = requests.post('http://127.0.0.1:5000/api/exit', json={'carNumber':'TEST123'}, timeout=3)
print('status', r.status_code)
print(r.json())
