import '../models/radio_station.dart';

final List<RadioStation> favoriteStations = [
  RadioStation(
    id: '1',
    name: 'Mirt Internet Radio',
    frequency: 'Online',
    city: 'Ethiopia',
    imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuACjSKU528SEMPc3XOyJVONhGegF7jsC-SU4WnIijzfhhZAaoW8dVPPYs7VMW2Qv5IWMCRuWHKm8KFhW_YkpOJ3IACPdwrhLqYjxBEhmKT2MP4Dy6TpnW4lh0qEEhwDX47fWVPuX1qKmOZbQs-BFcYC1WIMgmHA0pF0avqPCFEDUw3jMtoZSUy6JkZArm3oZp0hO1jU3rZpq6y_XoxHwL3YyIkrmxNFvDidfSIJEoiyz3frP1VBB9VJaCsFn4QCM-wU-0SorSiahw',
    // Note: If the stream URL doesn't work, the token (rj-tok) may have expired.
    // You may need to get a fresh URL from the Zeno.fm stream provider.
    streamUrl:
        'https://stream-175.zeno.fm/akmuznguawzuv?zt=eyJhbGciOiJIUzI1NiJ9.eyJzdHJlYW0iOiJha211em5ndWF3enV2IiwiaG9zdCI6InN0cmVhbS0xNzUuemVuby5mbSIsInJ0dGwiOjUsImp0aSI6IlFGYkRnSkpKUkdLU3BTazdDV2NGZlEiLCJpYXQiOjE3NjI3MTg2MjUsImV4cCI6MTc2MjcxODY4NX0.DPMtGQ6GqhNwzfcSAVpBil2tfPGxOdQPAu2G7bZCPOI&rj-ttl=5&rj-tok=AAABct-Y5fsAU83o0_k8PYaxlQ',
  ),
  RadioStation(
    id: '2',
    name: 'Fana FM 98.1',
    frequency: '98.1',
    city: 'Addis Ababa',
    imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBj3yYoxm4SSUu6a5ENCcXIEgsQTJrpwsmJhuaXNCNd0usBG02gk4WBskkECaKaiPmciXnyLHzx8vqgaHhMry0orRcGzMF9WM0LBlkztE3gQrCNV5FaH-w9xruVKz-3X_M8FYo3uJxjRO7d-PKXnj3RMr5HfDJ7uESCBx75Yx3DCBIMjNRvdQalFpWfexGZ52_9PfRqKVsUTFBnBHAcwq4QS_75YGAh94GWiXPE_9TOgWvs36ZscsgXkW06E-s8qICuGM847H4DFQ',
  ),
  RadioStation(
    id: '3',
    name: 'Zami 90.7',
    frequency: '90.7',
    city: 'Addis Ababa',
    imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuC3UZYEljyMihEcvvxTrvXLjM6omisIPMyb6-4DwNWQ4YFz9T5CivYfXYQKYrZ2VgGs9udxHZqxxB_misvBZmc6uAZp3J0tEzBJHEJg9lFUpevLnvF6nvVX5VU016yLHhZZINADvhlKKKcxjMSZZDKgmvQzTcjJJHECtxnY_UyhgMdw3bjNePSWlOOiaelz_bI2bdelnGyjwBxZf83uBgI3Jj5N6k8bAdzHP04ADI_yRV6YqQvfjDyG6GqkRwFaTSo59LxgZkoGqQ',
  ),
  RadioStation(
    id: '4',
    name: 'Bisrat FM 101.1',
    frequency: '101.1',
    city: 'Addis Ababa',
    imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuDusQ3ZVdTzBDDKfYHiRtzffzKudXTjmqzjET5g7A1vbzcGYBY3zuKd0e63OfpIdVgLSLDr2MUnbeTGzT46VxpSU9jLKXPNpT9Buen2wrn439b7FOcJvZJmdMGfFZ56IEL70a9KZdI3YLsrbgbapPgtYiFCzfy4fcJwOqVBTY54qEi2u9mhyos5QihyxcsgjgFO5scOdDDOTt-Hf8tvQ2aEKq8GO8jfaXBDH8oLFXozgMqQxA5JRUTSAQJkDUPP6t71gyzGeazPwQ',
  ),
  RadioStation(
    id: '5',
    name: 'Ahadu FM 94.3',
    frequency: '94.3',
    city: 'Addis Ababa',
    imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuB2XC5Herg0t51XPDuAkqGSYyQU8j6tDVIQIUer5M9Go8NcAy4VK6iiP31K4RjXmzD9020qeNH2yF_mmh9YxcCORE5Cppvn0Ik78wocRQXH89q6d_YOFgwBLpI_VQcj59yTGNEOcBFoHdwtx0GK0TL729ktSryR0LWo28AtGcpFMcLesRKs6kKbPGtj5r6oru5AFQiDnbsNkvJ9GBMie7WGY_nHkqvqXNzdAxVthAqMesW6OStIBH8y0AnZCS8-BpIefRm8VhT27w',
  ),
  RadioStation(
    id: '6',
    name: 'Ethio FM 107.8',
    frequency: '107.8',
    city: 'Addis Ababa',
    imageUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAFc7fsMULfU6sIAd6GS2hqXVEtKPED9A7_aUomyr0iUiBPCFFI3bYT-OFzS7UQpVBsMtYaTrro_pZ3yPNaEGczryBdY-69pF8-xa1I3LFAuC-JxUEDBUUbFQXX7boyM5WiHez02y7dxjUHIIUIl4R42yfsMjSRXOC0S36avTndiu6FFAQ35zR7j2ABxdqFX2jgS7u2oiU5f432ZZ2L9d50OIlyYy2X629X3bHl9WhIMg99cQfZjGQAZuMN4QcmpWhlXeHFhKbBWg',
  ),
];

final RadioStation nowPlayingStation = favoriteStations[0];

