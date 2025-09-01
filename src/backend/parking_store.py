import datetime
import math
import random

class ParkingStore:
    def __init__(self, rows=10, cols=10):
        self.rows = rows
        self.cols = cols
        # grid cells: { available: bool, carNumber: str | None }
        self.grid = [[{'available': True, 'carNumber': None, 'is_seasonal': False} for _ in range(cols)] for _ in range(rows)]
        # cars: carNumber -> { r, c, entry_time(iso) }
        self.cars = {}
        self.seasonal_cars = set()

        # Example pre-filled car for testing (optional)
        # self.park_at(1, 2, '1234')
        # populate random dummy cars (10~20), avoid collisions
        num_dummy = random.randint(10, 20)
        used_numbers = set()
        max_attempts = self.rows * self.cols * 3
        for _ in range(num_dummy):
            # pick a unique 4-digit car number
            car_num = None
            for _ in range(500):
                cand = ''.join(random.choices('0123456789', k=4))
                if cand not in used_numbers:
                    car_num = cand
                    used_numbers.add(cand)
                    break
            if not car_num:
                break

            # find a random empty slot
            placed = False
            for _ in range(max_attempts):
                r = random.randrange(self.rows)
                c = random.randrange(self.cols)
                if self.grid[r][c]['available']:
                    isSeasonal = random.random() < 0.4  # ~40% seasonal
                    self.park_at(r, c, car_num, isSeasonal=isSeasonal)
                    placed = True
                    break
            if not placed:
                # no available slot found (grid likely full)
                break
# ...existing code...
    def get_grid(self):
        # return deep copy-ish simple structure
        return [[cell.copy() for cell in row] for row in self.grid]

    def park_at(self, r, c, carNumber, isSeasonal=False):
        if not (0 <= r < self.rows and 0 <= c < self.cols):
            return False, 'Invalid position'
        if not self.grid[r][c]['available']:
            return False, 'Spot already occupied'
        self.grid[r][c]['available'] = False
        self.grid[r][c]['carNumber'] = carNumber
        self.grid[r][c]['is_seasonal'] = isSeasonal
        entry_time = datetime.datetime.utcnow()
        self.cars[carNumber] = {'r': r, 'c': c, 'entry_time': entry_time.isoformat(), 'is_seasonal': isSeasonal}
        if isSeasonal:
            self.seasonal_cars.add(carNumber)
        # c+1은 A,B,C, ...
        col_letter = chr(c + 65)  # 65 is the ASCII code for 'A'
        return True, f'{r+1}층-{col_letter}에 주차되었습니다.'

    def find_car(self, carNumber):
        return self.cars.get(carNumber)

    def exit_by_number(self, carNumber):
        car = self.find_car(carNumber)
        if not car:
            return {'ok': False, 'message': 'Car not found'}
        r = car['r']
        c = car['c']
        entry_time = datetime.datetime.fromisoformat(car['entry_time'])
        exit_time = datetime.datetime.utcnow()
        is_seasonal = car.get('is_seasonal', False)
        print(entry_time, exit_time, is_seasonal)
        fee, minutes = self.compute_fee(entry_time, exit_time, is_seasonal)
    
        # free the spot
        self.grid[r][c]['available'] = True
        self.grid[r][c]['carNumber'] = None
        self.grid[r][c]['is_seasonal'] = False
        # remove from cars
        del self.cars[carNumber]
        return {
            'ok': True,
            'message': f'총 주차시간은 {minutes}분입니다.{fee}원 결제되었습니다.',
            # 'payment': {
            #     'amount': fee,
            #     'hours': hours,
            #     'entry': entry_time.isoformat(),
            #     'exit': exit_time.isoformat()
            # },
            # 'is_seasonal': car["is_seasonal"] or False,
        }
    
    def compute_fee(self, entry, exit, is_seasonal):
        seconds = (exit - entry).total_seconds()
        minutes = math.ceil(seconds / 60) if seconds > 0 else 1
        fee = math.ceil(minutes / 10) * 500
        if is_seasonal:
            fee = int(fee * 0.5)
        return fee, minutes

    def get_car_info(self, carNumber):
        car = self.find_car(carNumber)
        if not car:
            return None
        return car.copy()
    