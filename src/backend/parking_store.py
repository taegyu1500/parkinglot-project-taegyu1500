import datetime
import math

class ParkingStore:
    def __init__(self, rows=5, cols=10):
        self.rows = rows
        self.cols = cols
        # grid cells: { available: bool, carNumber: str | None }
        self.grid = [[{'available': True, 'carNumber': None} for _ in range(cols)] for _ in range(rows)]
        # cars: carNumber -> { r, c, entry_time(iso) }
        self.cars = {}

        # Example pre-filled car for testing (optional)
        # self.park_at(1, 2, '1234')

    def get_grid(self):
        # return deep copy-ish simple structure
        return [[cell.copy() for cell in row] for row in self.grid]

    def park_at(self, r, c, carNumber):
        if not (0 <= r < self.rows and 0 <= c < self.cols):
            return False, 'Invalid position'
        if not self.grid[r][c]['available']:
            return False, 'Spot already occupied'
        self.grid[r][c]['available'] = False
        self.grid[r][c]['carNumber'] = carNumber
        entry_time = datetime.datetime.utcnow()
        self.cars[carNumber] = {'r': r, 'c': c, 'entry_time': entry_time.isoformat()}
        return True, f'Parked at R{r+1}-C{c+1}'

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
        fee, hours = self.compute_fee(entry_time, exit_time)
        # free the spot
        self.grid[r][c]['available'] = True
        self.grid[r][c]['carNumber'] = None
        # remove from cars
        del self.cars[carNumber]
        return {
            'ok': True,
            'message': f'Exited R{r+1}-C{c+1}',
            'payment': {
                'amount': fee,
                'hours': hours,
                'entry': entry_time.isoformat(),
                'exit': exit_time.isoformat()
            }
        }

    def compute_fee(self, entry, exit):
        seconds = (exit - entry).total_seconds()
        hours = math.ceil(seconds / 3600) if seconds > 0 else 1
        rate_per_hour = 2000
        return hours * rate_per_hour, hours

    def get_car_info(self, carNumber):
        car = self.find_car(carNumber)
        if not car:
            return None
        return car.copy()
