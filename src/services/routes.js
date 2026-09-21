// Routes data - Real Ahmedabad shared auto routes

export const routes = [
  {
    id: 'route-1',
    name: 'Gujarat University to Thaltej',
    shortName: 'GU → Thaltej',
    fare: 10,
    distance: 5.2,
    duration: '15 min',
    color: '#4285F4',
    stops: [
      { name: 'Gujarat University', lat: 23.0339, lng: 72.5467, passengers: 3, distance: '200 m' },
      { name: 'Gurukul Road', lat: 23.0365, lng: 72.5395, passengers: 1, distance: '1.2 km' },
      { name: 'Drive-in Road', lat: 23.0465, lng: 72.5335, passengers: 2, distance: '2.5 km' },
      { name: 'Thaltej', lat: 23.0520, lng: 72.5080, passengers: 0, distance: '5.2 km' },
    ],
    path: [
      [23.0339, 72.5467],
      [23.0345, 72.5420],
      [23.0365, 72.5395],
      [23.0400, 72.5370],
      [23.0440, 72.5350],
      [23.0465, 72.5335],
      [23.0490, 72.5270],
      [23.0510, 72.5150],
      [23.0520, 72.5080],
    ],
    autos: [
      { lat: 23.0350, lng: 72.5440, heading: 315 },
      { lat: 23.0430, lng: 72.5355, heading: 300 },
    ]
  },
  {
    id: 'route-2',
    name: 'Akbarnagar to Satellite Road',
    shortName: 'Akbarnagar → Satellite',
    fare: 10,
    distance: 4.8,
    duration: '12 min',
    color: '#EA4335',
    stops: [
      { name: 'Akbarnagar', lat: 23.0400, lng: 72.5550, passengers: 2, distance: '400 m' },
      { name: 'Memnagar', lat: 23.0420, lng: 72.5480, passengers: 4, distance: '1.0 km' },
      { name: 'Vijay Cross Roads', lat: 23.0350, lng: 72.5350, passengers: 1, distance: '2.8 km' },
      { name: 'Satellite Road', lat: 23.0260, lng: 72.5140, passengers: 0, distance: '4.8 km' },
    ],
    path: [
      [23.0400, 72.5550],
      [23.0415, 72.5510],
      [23.0420, 72.5480],
      [23.0400, 72.5420],
      [23.0370, 72.5380],
      [23.0350, 72.5350],
      [23.0320, 72.5280],
      [23.0290, 72.5200],
      [23.0260, 72.5140],
    ],
    autos: [
      { lat: 23.0410, lng: 72.5500, heading: 250 },
      { lat: 23.0355, lng: 72.5360, heading: 225 },
      { lat: 23.0300, lng: 72.5220, heading: 210 },
    ]
  },
  {
    id: 'route-3',
    name: 'Gurukul Metro to Vastrapur',
    shortName: 'Gurukul → Vastrapur',
    fare: 8,
    distance: 3.5,
    duration: '10 min',
    color: '#34A853',
    stops: [
      { name: 'Gurukul Metro', lat: 23.0370, lng: 72.5400, passengers: 2, distance: '800 m' },
      { name: 'Anand Nagar', lat: 23.0340, lng: 72.5330, passengers: 1, distance: '1.5 km' },
      { name: 'Vastrapur Lake', lat: 23.0310, lng: 72.5230, passengers: 1, distance: '3.0 km' },
      { name: 'Vastrapur', lat: 23.0290, lng: 72.5180, passengers: 0, distance: '3.5 km' },
    ],
    path: [
      [23.0370, 72.5400],
      [23.0355, 72.5370],
      [23.0340, 72.5330],
      [23.0330, 72.5290],
      [23.0310, 72.5230],
      [23.0290, 72.5180],
    ],
    autos: [
      { lat: 23.0360, lng: 72.5380, heading: 220 },
    ]
  },
  {
    id: 'route-4',
    name: 'Paldi to Navrangpura',
    shortName: 'Paldi → Navrangpura',
    fare: 12,
    distance: 4.0,
    duration: '14 min',
    color: '#FBBC04',
    stops: [
      { name: 'Paldi', lat: 23.0170, lng: 72.5650, passengers: 3, distance: '600 m' },
      { name: 'Income Tax', lat: 23.0220, lng: 72.5620, passengers: 2, distance: '1.2 km' },
      { name: 'CG Road', lat: 23.0280, lng: 72.5580, passengers: 1, distance: '2.8 km' },
      { name: 'Navrangpura', lat: 23.0330, lng: 72.5560, passengers: 0, distance: '4.0 km' },
    ],
    path: [
      [23.0170, 72.5650],
      [23.0195, 72.5635],
      [23.0220, 72.5620],
      [23.0250, 72.5600],
      [23.0280, 72.5580],
      [23.0305, 72.5570],
      [23.0330, 72.5560],
    ],
    autos: [
      { lat: 23.0200, lng: 72.5630, heading: 20 },
      { lat: 23.0270, lng: 72.5590, heading: 350 },
    ]
  },
  {
    id: 'route-5',
    name: 'Ashram Road to SG Highway',
    shortName: 'Ashram Rd → SG Hwy',
    fare: 15,
    distance: 7.5,
    duration: '20 min',
    color: '#9C27B0',
    stops: [
      { name: 'Ashram Road', lat: 23.0250, lng: 72.5700, passengers: 4, distance: '300 m' },
      { name: 'Stadium', lat: 23.0300, lng: 72.5620, passengers: 2, distance: '1.5 km' },
      { name: 'Gujarat University', lat: 23.0339, lng: 72.5562, passengers: 3, distance: '3.0 km' },
      { name: 'Bodakdev', lat: 23.0380, lng: 72.5100, passengers: 1, distance: '5.5 km' },
      { name: 'SG Highway', lat: 23.0370, lng: 72.4980, passengers: 0, distance: '7.5 km' },
    ],
    path: [
      [23.0250, 72.5700],
      [23.0270, 72.5660],
      [23.0300, 72.5620],
      [23.0320, 72.5590],
      [23.0339, 72.5562],
      [23.0350, 72.5450],
      [23.0360, 72.5300],
      [23.0380, 72.5100],
      [23.0370, 72.4980],
    ],
    autos: [
      { lat: 23.0280, lng: 72.5645, heading: 310 },
      { lat: 23.0345, lng: 72.5520, heading: 280 },
      { lat: 23.0370, lng: 72.5200, heading: 260 },
    ]
  },
  {
    id: 'route-6',
    name: 'Maninagar to Kalupur Station',
    shortName: 'Maninagar → Kalupur',
    fare: 10,
    distance: 5.0,
    duration: '18 min',
    color: '#FF5722',
    stops: [
      { name: 'Maninagar', lat: 22.9996, lng: 72.5990, passengers: 5, distance: '500 m' },
      { name: 'Kankaria Lake', lat: 23.0080, lng: 72.6020, passengers: 2, distance: '1.2 km' },
      { name: 'Raipur Darwaja', lat: 23.0180, lng: 72.5950, passengers: 3, distance: '2.8 km' },
      { name: 'Kalupur Station', lat: 23.0251, lng: 72.6031, passengers: 0, distance: '4.5 km' },
    ],
    path: [
      [22.9996, 72.5990],
      [23.0040, 72.6010],
      [23.0080, 72.6020],
      [23.0130, 72.5980],
      [23.0180, 72.5950],
      [23.0210, 72.5990],
      [23.0251, 72.6031],
    ],
    autos: [
      { lat: 23.0080, lng: 72.6020, heading: 350 },
      { lat: 23.0180, lng: 72.5950, heading: 40 },
    ]
  }
];

export function getRouteById(id) {
  return routes.find(r => r.id === id);
}

export function getRoutesNearby(lat, lng, radiusKm = 5) {
  return routes.filter(route => {
    const stop = route.stops[0];
    const d = haversineDistance(lat, lng, stop.lat, stop.lng);
    return d <= radiusKm;
  });
}

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
