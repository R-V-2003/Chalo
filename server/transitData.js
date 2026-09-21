// Pan-India Transit Data — Metros, Trains, Suburban Locals, BRTS & State Road Transport Corporations (SRTC)
module.exports = {
  cities: [
    { id: 'ahmedabad', name: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, has_metro: 1, has_brts: 1, has_suburban: 0, has_state_bus: 1, state_bus_corp: 'GSRTC' },
    { id: 'delhi', name: 'Delhi NCR', state: 'Delhi', lat: 28.6139, lng: 77.2090, has_metro: 1, has_brts: 0, has_suburban: 1, has_state_bus: 1, state_bus_corp: 'DTC / UPSRTC' },
    { id: 'mumbai', name: 'Mumbai', state: 'Maharashtra', lat: 19.0760, lng: 72.8777, has_metro: 1, has_brts: 0, has_suburban: 1, has_state_bus: 1, state_bus_corp: 'MSRTC (Shivneri)' },
    { id: 'bengaluru', name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, has_metro: 1, has_brts: 0, has_suburban: 1, has_state_bus: 1, state_bus_corp: 'KSRTC (Airavat)' },
    { id: 'kolkata', name: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, has_metro: 1, has_brts: 0, has_suburban: 1, has_state_bus: 1, state_bus_corp: 'SBSTC / WBTC' },
    { id: 'hyderabad', name: 'Hyderabad', state: 'Telangana', lat: 17.3850, lng: 78.4867, has_metro: 1, has_brts: 0, has_suburban: 1, has_state_bus: 1, state_bus_corp: 'TSRTC (Garuda)' },
    { id: 'pune', name: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, has_metro: 1, has_brts: 1, has_suburban: 1, has_state_bus: 1, state_bus_corp: 'MSRTC' },
    { id: 'chennai', name: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, has_metro: 1, has_brts: 0, has_suburban: 1, has_state_bus: 1, state_bus_corp: 'SETC / TNSTC' },
    { id: 'jaipur', name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, has_metro: 1, has_brts: 0, has_suburban: 0, has_state_bus: 1, state_bus_corp: 'RSRTC (Scania)' },
    { id: 'lucknow', name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, has_metro: 1, has_brts: 0, has_suburban: 0, has_state_bus: 1, state_bus_corp: 'UPSRTC (Janrath)' },
    { id: 'surat', name: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, has_metro: 0, has_brts: 1, has_suburban: 0, has_state_bus: 1, state_bus_corp: 'GSRTC' },
    { id: 'indore', name: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, has_metro: 1, has_brts: 1, has_suburban: 0, has_state_bus: 1, state_bus_corp: 'MPSRTC / Atal' }
  ],

  // ─── METRO SYSTEMS ACROSS INDIA ───
  metroLines: [
    // Ahmedabad Metro (Phase 1 — Operational)
    { city: 'Ahmedabad', state: 'Gujarat', system: 'Ahmedabad Metro (GMRC)', name: 'Blue Line (East-West)', code: 'BL', color: '#0066CC', from: 'Thaltej Gam', to: 'Vastral Gam', stations: 18, dist: 21.2, hours: '06:00-22:00', freq: 7,
      stationList: [
        { name: 'Thaltej Gam', lat: 23.0519, lng: 72.5056, zone: 'West' },
        { name: 'Thaltej', lat: 23.0497, lng: 72.5162, zone: 'West' },
        { name: 'Doordarshan Kendra', lat: 23.0481, lng: 72.5244, zone: 'West' },
        { name: 'Gurukul Road', lat: 23.0458, lng: 72.5350, zone: 'West' },
        { name: 'Gujarat University', lat: 23.0447, lng: 72.5436, zone: 'West' },
        { name: 'Commerce Six Road', lat: 23.0408, lng: 72.5531, zone: 'West' },
        { name: 'SP Stadium', lat: 23.0400, lng: 72.5617, zone: 'West' },
        { name: 'Old High Court', lat: 23.0373, lng: 72.5670, zone: 'Central', is_interchange: 1 },
        { name: 'Shahpur', lat: 23.0392, lng: 72.5811, zone: 'Central' },
        { name: 'Gheekanta', lat: 23.0286, lng: 72.5869, zone: 'Central' },
        { name: 'Kalupur Railway Stn', lat: 23.0251, lng: 72.6031, zone: 'Central' },
        { name: 'Kankaria East', lat: 23.0153, lng: 72.6044, zone: 'Central' },
        { name: 'Apparel Park', lat: 23.0106, lng: 72.6181, zone: 'East' },
        { name: 'Amraiwadi', lat: 23.0078, lng: 72.6286, zone: 'East' },
        { name: 'Rabari Colony', lat: 23.0056, lng: 72.6356, zone: 'East' },
        { name: 'Vastral', lat: 23.0036, lng: 72.6475, zone: 'East' },
        { name: 'Nirant Cross Road', lat: 23.0003, lng: 72.6578, zone: 'East' },
        { name: 'Vastral Gam', lat: 22.9972, lng: 72.6678, zone: 'East' }
      ]
    },
    { city: 'Ahmedabad', state: 'Gujarat', system: 'Ahmedabad Metro (GMRC)', name: 'Red Line (North-South)', code: 'RL', color: '#CC0000', from: 'APMC', to: 'Motera Stadium', stations: 15, dist: 18.8, hours: '06:00-22:00', freq: 8,
      stationList: [
        { name: 'APMC', lat: 22.9978, lng: 72.5372, zone: 'South' },
        { name: 'Jivraj Park', lat: 22.9995, lng: 72.5390, zone: 'South' },
        { name: 'Rajiv Nagar', lat: 23.0030, lng: 72.5448, zone: 'South' },
        { name: 'Shreyas', lat: 23.0075, lng: 72.5535, zone: 'South' },
        { name: 'Paldi', lat: 23.0060, lng: 72.5650, zone: 'Central' },
        { name: 'Gandhigram', lat: 23.0245, lng: 72.5685, zone: 'Central' },
        { name: 'Old High Court', lat: 23.0373, lng: 72.5670, zone: 'Central', is_interchange: 1 },
        { name: 'Usmanpura', lat: 23.0460, lng: 72.5650, zone: 'North' },
        { name: 'Vijay Nagar', lat: 23.0560, lng: 72.5654, zone: 'North' },
        { name: 'Vadaj', lat: 23.0678, lng: 72.5658, zone: 'North' },
        { name: 'Ranip', lat: 23.0678, lng: 72.5742, zone: 'North' },
        { name: 'Sabarmati Railway Stn', lat: 23.0697, lng: 72.5878, zone: 'North' },
        { name: 'AEC', lat: 23.0780, lng: 72.5900, zone: 'North' },
        { name: 'Sabarmati', lat: 23.0856, lng: 72.5922, zone: 'North' },
        { name: 'Motera Stadium', lat: 23.0967, lng: 72.6008, zone: 'North' }
      ]
    },

    // Delhi Metro (DMRC)
    { city: 'Delhi NCR', state: 'Delhi', system: 'Delhi Metro (DMRC)', name: 'Yellow Line (Line 2)', code: 'D-YL', color: '#FFD700', from: 'Samaypur Badli', to: 'Millennium City Centre Gurugram', stations: 37, dist: 49.3, hours: '05:30-23:30', freq: 3,
      stationList: [
        { name: 'Samaypur Badli', lat: 28.7466, lng: 77.1352, zone: 'North' }, { name: 'Jahangirpuri', lat: 28.7258, lng: 77.1633, zone: 'North' },
        { name: 'Vishwa Vidyalaya (DU)', lat: 28.6947, lng: 77.2155, zone: 'North' }, { name: 'Kashmere Gate', lat: 28.6675, lng: 77.2285, zone: 'Central', is_interchange: 1 },
        { name: 'Chandni Chowk', lat: 28.6578, lng: 77.2301, zone: 'Old Delhi' }, { name: 'New Delhi Railway Stn', lat: 28.6431, lng: 77.2223, zone: 'Central', is_interchange: 1 },
        { name: 'Rajiv Chowk (CP)', lat: 28.6328, lng: 77.2197, zone: 'Central', is_interchange: 1 }, { name: 'Patel Chowk', lat: 28.6231, lng: 77.2137, zone: 'Central' },
        { name: 'Central Secretariat', lat: 28.6147, lng: 77.2119, zone: 'Central', is_interchange: 1 }, { name: 'INA Market (Dilli Haat)', lat: 28.5756, lng: 77.2091, zone: 'South', is_interchange: 1 },
        { name: 'AIIMS', lat: 28.5684, lng: 77.2078, zone: 'South' }, { name: 'Hauz Khas', lat: 28.5433, lng: 77.2065, zone: 'South', is_interchange: 1 },
        { name: 'Qutab Minar', lat: 28.5133, lng: 77.1856, zone: 'South' }, { name: 'HUDA City Centre / Millennium City', lat: 28.4593, lng: 77.0725, zone: 'Gurugram' }
      ]
    },
    { city: 'Delhi NCR', state: 'Delhi', system: 'Delhi Metro (DMRC)', name: 'Blue Line (Line 3/4)', code: 'D-BL', color: '#0066CC', from: 'Dwarka Sector 21', to: 'Noida Electronic City', stations: 50, dist: 56.6, hours: '05:30-23:30', freq: 3,
      stationList: [
        { name: 'Dwarka Sector 21', lat: 28.5522, lng: 77.0583, zone: 'West', is_interchange: 1 }, { name: 'Janakpuri West', lat: 28.6293, lng: 77.0778, zone: 'West', is_interchange: 1 },
        { name: 'Rajouri Garden', lat: 28.6492, lng: 77.1225, zone: 'West', is_interchange: 1 }, { name: 'Karol Bagh', lat: 28.6441, lng: 77.1895, zone: 'Central' },
        { name: 'Rajiv Chowk (CP)', lat: 28.6328, lng: 77.2197, zone: 'Central', is_interchange: 1 }, { name: 'Mandi House', lat: 28.6258, lng: 77.2344, zone: 'Central', is_interchange: 1 },
        { name: 'Indraprastha', lat: 28.6189, lng: 77.2505, zone: 'East' }, { name: 'Akshardham', lat: 28.6180, lng: 77.2790, zone: 'East' },
        { name: 'Mayur Vihar 1', lat: 28.6042, lng: 77.2944, zone: 'East', is_interchange: 1 }, { name: 'Botanical Garden (Noida)', lat: 28.5642, lng: 77.3344, zone: 'Noida', is_interchange: 1 },
        { name: 'Noida Sector 18 (Atta)', lat: 28.5708, lng: 77.3261, zone: 'Noida' }, { name: 'Noida Electronic City', lat: 28.6280, lng: 77.3750, zone: 'Noida' }
      ]
    },
    { city: 'Delhi NCR', state: 'Delhi', system: 'Delhi Metro (DMRC)', name: 'Airport Express (Orange Line)', code: 'D-AL', color: '#FF8000', from: 'New Delhi Railway Stn', to: 'Yashobhoomi Dwarka Sector 25', stations: 7, dist: 24.9, hours: '04:45-23:30', freq: 10,
      stationList: [
        { name: 'New Delhi Railway Stn', lat: 28.6431, lng: 77.2223, zone: 'Central', is_interchange: 1 },
        { name: 'Shivaji Stadium', lat: 28.6289, lng: 77.2117, zone: 'Central' },
        { name: 'Dhaula Kuan', lat: 28.5919, lng: 77.1611, zone: 'South' },
        { name: 'Delhi Aerocity', lat: 28.5494, lng: 77.1211, zone: 'Airport' },
        { name: 'IGI Airport Terminal 3', lat: 28.5562, lng: 77.0872, zone: 'Airport' },
        { name: 'Dwarka Sector 21', lat: 28.5522, lng: 77.0583, zone: 'West', is_interchange: 1 },
        { name: 'Yashobhoomi Dwarka Sec 25', lat: 28.5480, lng: 77.0390, zone: 'West' }
      ]
    },

    // Mumbai Metro (MMRDA)
    { city: 'Mumbai', state: 'Maharashtra', system: 'Mumbai Metro (Maha Metro / MMRDA)', name: 'Line 1 (Blue Line)', code: 'M-L1', color: '#007ACC', from: 'Versova', to: 'Ghatkopar', stations: 12, dist: 11.4, hours: '05:30-23:30', freq: 4,
      stationList: [
        { name: 'Versova', lat: 19.1311, lng: 72.8172, zone: 'West' }, { name: 'D.N. Nagar', lat: 19.1305, lng: 72.8335, zone: 'West', is_interchange: 1 },
        { name: 'Azad Nagar', lat: 19.1294, lng: 72.8428, zone: 'West' }, { name: 'Andheri Railway Station', lat: 19.1197, lng: 72.8464, zone: 'West', is_interchange: 1 },
        { name: 'Western Express Highway (WEH)', lat: 19.1167, lng: 72.8569, zone: 'Central' }, { name: 'Chakala (J.B. Nagar)', lat: 19.1114, lng: 72.8669, zone: 'East' },
        { name: 'Airport Road', lat: 19.1086, lng: 72.8744, zone: 'Airport' }, { name: 'Marol Naka', lat: 19.1069, lng: 72.8831, zone: 'East' },
        { name: 'Saki Naka', lat: 19.1028, lng: 72.8881, zone: 'East' }, { name: 'Asalpha', lat: 19.0989, lng: 72.8953, zone: 'East' },
        { name: 'Jagruti Nagar', lat: 19.0928, lng: 72.9039, zone: 'East' }, { name: 'Ghatkopar Railway Station', lat: 19.0864, lng: 72.9081, zone: 'Central', is_interchange: 1 }
      ]
    },
    { city: 'Mumbai', state: 'Maharashtra', system: 'Mumbai Metro (Maha Metro / MMRDA)', name: 'Line 2A (Yellow Line)', code: 'M-L2A', color: '#FFB800', from: 'Dahisar East', to: 'Andheri West (DN Nagar)', stations: 17, dist: 18.6, hours: '06:00-23:00', freq: 7,
      stationList: [
        { name: 'Dahisar East', lat: 19.2575, lng: 72.8625, zone: 'North', is_interchange: 1 }, { name: 'Borivali West', lat: 19.2319, lng: 72.8564, zone: 'North' },
        { name: 'Kandivali West', lat: 19.2064, lng: 72.8489, zone: 'North' }, { name: 'Malad West', lat: 19.1869, lng: 72.8394, zone: 'North' },
        { name: 'Oshiwara', lat: 19.1481, lng: 72.8344, zone: 'West' }, { name: 'D.N. Nagar (Andheri West)', lat: 19.1305, lng: 72.8335, zone: 'West', is_interchange: 1 }
      ]
    },

    // Bengaluru Namma Metro (BMRCL)
    { city: 'Bengaluru', state: 'Karnataka', system: 'Namma Metro (BMRCL)', name: 'Purple Line', code: 'B-PL', color: '#8A2BE2', from: 'Challaghatta', to: 'Whitefield (Kadugodi)', stations: 37, dist: 43.5, hours: '05:00-23:00', freq: 5,
      stationList: [
        { name: 'Challaghatta', lat: 12.9125, lng: 77.4750, zone: 'West' }, { name: 'Kengeri', lat: 12.9150, lng: 77.4850, zone: 'West' },
        { name: 'Vijayanagar', lat: 12.9694, lng: 77.5361, zone: 'West' }, { name: 'Majestic (Nadaprabhu Kempegowda)', lat: 12.9756, lng: 77.5728, zone: 'Central', is_interchange: 1 },
        { name: 'Vidhana Soudha', lat: 12.9797, lng: 77.5908, zone: 'Central' }, { name: 'MG Road', lat: 12.9756, lng: 77.6067, zone: 'Central' },
        { name: 'Indiranagar', lat: 12.9783, lng: 77.6389, zone: 'East' }, { name: 'Baiyappanahalli', lat: 12.9914, lng: 77.6525, zone: 'East' },
        { name: 'KR Puram (Railway Stn)', lat: 13.0019, lng: 77.6872, zone: 'East' }, { name: 'Whitefield (Kadugodi)', lat: 12.9961, lng: 77.7611, zone: 'IT Hub' }
      ]
    },
    { city: 'Bengaluru', state: 'Karnataka', system: 'Namma Metro (BMRCL)', name: 'Green Line', code: 'B-GL', color: '#00A859', from: 'Nagasandra', to: 'Silk Institute', stations: 31, dist: 30.5, hours: '05:00-23:00', freq: 6,
      stationList: [
        { name: 'Nagasandra', lat: 13.0481, lng: 77.5000, zone: 'North' }, { name: 'Yeshwantpur Railway Stn', lat: 13.0236, lng: 77.5500, zone: 'North', is_interchange: 1 },
        { name: 'Malleshwaram', lat: 13.0050, lng: 77.5689, zone: 'North' }, { name: 'Majestic (Nadaprabhu Kempegowda)', lat: 12.9756, lng: 77.5728, zone: 'Central', is_interchange: 1 },
        { name: 'Lalbagh', lat: 12.9461, lng: 77.5800, zone: 'South' }, { name: 'Jayanagar', lat: 12.9300, lng: 77.5800, zone: 'South' },
        { name: 'Banashankari', lat: 12.9150, lng: 77.5739, zone: 'South' }, { name: 'Silk Institute', lat: 12.8600, lng: 77.5300, zone: 'South' }
      ]
    },

    // Kolkata Metro
    { city: 'Kolkata', state: 'West Bengal', system: 'Kolkata Metro (KMRCL)', name: 'Green Line (Underwater East-West)', code: 'K-GL', color: '#00A859', from: 'Howrah Maidan', to: 'Salt Lake Sector V', stations: 12, dist: 16.6, hours: '06:30-22:00', freq: 8,
      stationList: [
        { name: 'Howrah Maidan', lat: 22.5850, lng: 88.3320, zone: 'West' },
        { name: 'Howrah Railway Station (Underwater Hub)', lat: 22.5830, lng: 88.3420, zone: 'Central', is_interchange: 1 },
        { name: 'Mahakaran (BBD Bagh)', lat: 22.5730, lng: 88.3490, zone: 'Central' },
        { name: 'Esplanade', lat: 22.5644, lng: 88.3517, zone: 'Central', is_interchange: 1 },
        { name: 'Sealdah Railway Station', lat: 22.5680, lng: 88.3710, zone: 'Central', is_interchange: 1 },
        { name: 'Phoolbagan', lat: 22.5710, lng: 88.3940, zone: 'East' },
        { name: 'Salt Lake Stadium', lat: 22.5714, lng: 88.4069, zone: 'Salt Lake' },
        { name: 'Salt Lake Sector V (IT Hub)', lat: 22.5780, lng: 88.4320, zone: 'Salt Lake' }
      ]
    },

    // Hyderabad Metro (L&T Metro)
    { city: 'Hyderabad', state: 'Telangana', system: 'Hyderabad Metro (HMRL)', name: 'Red Line (Corridor 1)', code: 'H-RL', color: '#CC0000', from: 'Miyapur', to: 'LB Nagar', stations: 27, dist: 29.2, hours: '06:00-23:00', freq: 5,
      stationList: [
        { name: 'Miyapur', lat: 17.4969, lng: 78.3614, zone: 'West' }, { name: 'KPHB Colony', lat: 17.4925, lng: 78.3889, zone: 'West' },
        { name: 'Kukatpally', lat: 17.4847, lng: 78.4111, zone: 'West' }, { name: 'Ameerpet', lat: 17.4375, lng: 78.4483, zone: 'Central', is_interchange: 1 },
        { name: 'MGBS (Central Bus Stand)', lat: 17.3789, lng: 78.4811, zone: 'Central', is_interchange: 1 }, { name: 'Dilsukhnagar', lat: 17.3689, lng: 78.5244, zone: 'East' },
        { name: 'LB Nagar', lat: 17.3458, lng: 78.5528, zone: 'East' }
      ]
    },
    { city: 'Hyderabad', state: 'Telangana', system: 'Hyderabad Metro (HMRL)', name: 'Blue Line (Corridor 3)', code: 'H-BL', color: '#0066CC', from: 'Nagole', to: 'Raidurg (HITEC City)', stations: 23, dist: 27.0, hours: '06:00-23:00', freq: 5,
      stationList: [
        { name: 'Nagole', lat: 17.3775, lng: 78.5622, zone: 'East' }, { name: 'Secunderabad East Railway Stn', lat: 17.4339, lng: 78.5028, zone: 'North', is_interchange: 1 },
        { name: 'Begumpet', lat: 17.4419, lng: 78.4611, zone: 'Central' }, { name: 'Ameerpet', lat: 17.4375, lng: 78.4483, zone: 'Central', is_interchange: 1 },
        { name: 'Madhapur', lat: 17.4411, lng: 78.3911, zone: 'HITEC' }, { name: 'HITEC City / Cyber Towers', lat: 17.4481, lng: 78.3811, zone: 'HITEC' },
        { name: 'Raidurg (Mindspace)', lat: 17.4394, lng: 78.3769, zone: 'HITEC' }
      ]
    },

    // Pune Metro (Maha Metro)
    { city: 'Pune', state: 'Maharashtra', system: 'Pune Metro (Maha Metro)', name: 'Purple Line (Line 1)', code: 'P-PL', color: '#8A2BE2', from: 'PCMC (Pimpri)', to: 'Swargate', stations: 14, dist: 17.4, hours: '06:00-22:00', freq: 8,
      stationList: [
        { name: 'PCMC Bhavan', lat: 18.6297, lng: 73.8131, zone: 'Pimpri' }, { name: 'Bhosari', lat: 18.6019, lng: 73.8269, zone: 'North' },
        { name: 'Dapodi', lat: 18.5786, lng: 73.8339, zone: 'North' }, { name: 'Shivajinagar Railway Stn', lat: 18.5319, lng: 73.8514, zone: 'Central', is_interchange: 1 },
        { name: 'Civil Court (Pune Interchange)', lat: 18.5286, lng: 73.8569, zone: 'Central', is_interchange: 1 }, { name: 'Swargate Bus Terminal', lat: 18.5019, lng: 73.8581, zone: 'South' }
      ]
    },

    // Chennai Metro (CMRL)
    { city: 'Chennai', state: 'Tamil Nadu', system: 'Chennai Metro (CMRL)', name: 'Blue Line (Corridor 1)', code: 'C-BL', color: '#0066CC', from: 'Wimco Nagar', to: 'Chennai International Airport', stations: 26, dist: 32.6, hours: '05:00-23:00', freq: 6,
      stationList: [
        { name: 'Wimco Nagar', lat: 13.1706, lng: 80.3014, zone: 'North' }, { name: 'Chennai Central (Puratchi Thalaivar)', lat: 13.0827, lng: 80.2756, zone: 'Central', is_interchange: 1 },
        { name: 'Government Estate', lat: 13.0694, lng: 80.2731, zone: 'Central' }, { name: 'LIC', lat: 13.0622, lng: 80.2667, zone: 'Central' },
        { name: 'Nandanam', lat: 13.0306, lng: 80.2408, zone: 'South' }, { name: 'Guindy Railway Stn', lat: 13.0069, lng: 80.2125, zone: 'South', is_interchange: 1 },
        { name: 'Chennai International Airport', lat: 12.9814, lng: 80.1639, zone: 'Airport' }
      ]
    }
  ],

  // ─── LOCAL & SUBURBAN TRAINS (Mumbai Local, Kolkata Local, Chennai EMU, Delhi EMU) ───
  suburbanTrains: [
    { city: 'Mumbai', system: 'Mumbai Suburban Railway', name: 'Western Line Local (Fast/Slow)', route: 'Churchgate ➔ Dadar ➔ Bandra ➔ Andheri ➔ Borivali ➔ Virar', freq: 'Every 3 min', fare: '₹5 - ₹20', timing: '04:00 - 01:30' },
    { city: 'Mumbai', system: 'Mumbai Suburban Railway', name: 'Central Main Line Local', route: 'CSMT ➔ Byculla ➔ Dadar ➔ Kurla ➔ Ghatkopar ➔ Thane ➔ Kalyan', freq: 'Every 4 min', fare: '₹5 - ₹20', timing: '24 Hours' },
    { city: 'Mumbai', system: 'Mumbai Suburban Railway', name: 'Harbour Line Local', route: 'CSMT ➔ Wadala ➔ Kurla ➔ Vashi ➔ Belapur ➔ Panvel', freq: 'Every 5 min', fare: '₹5 - ₹20', timing: '04:30 - 01:15' },
    { city: 'Kolkata', system: 'Kolkata Suburban Railway', name: 'Howrah Division EMU', route: 'Howrah ➔ Bally ➔ Rishra ➔ Chandannagar ➔ Bandel ➔ Bardhaman', freq: 'Every 8 min', fare: '₹5 - ₹15', timing: '04:00 - 23:45' },
    { city: 'Kolkata', system: 'Kolkata Suburban Railway', name: 'Sealdah Main Division EMU', route: 'Sealdah ➔ Dum Dum ➔ Barrackpore ➔ Naihati ➔ Ranaghat', freq: 'Every 6 min', fare: '₹5 - ₹15', timing: '04:00 - 23:45' },
    { city: 'Chennai', system: 'Chennai Suburban Railway', name: 'South Line EMU', route: 'Chennai Beach ➔ Chennai Fort ➔ Guindy ➔ Tambaram ➔ Chengalpattu', freq: 'Every 7 min', fare: '₹5 - ₹15', timing: '04:00 - 23:30' },
    { city: 'Delhi NCR', system: 'Delhi NCR Suburban Railway', name: 'Delhi EMU Ring / Main', route: 'New Delhi ➔ Hazrat Nizamuddin ➔ Ghaziabad / Faridabad / Palwal', freq: 'Every 15 min', fare: '₹10 - ₹25', timing: '05:00 - 23:00' }
  ],

  // ─── PAN-INDIA & AHMEDABAD BRTS NETWORKS ───
  brtsNetworks: [
    // Ahmedabad Janmarg BRTS (Pioneer Network)
    { city: 'Ahmedabad', system: 'Ahmedabad Janmarg BRTS', number: '1D', name: 'RTO Circle to Maninagar', from: 'RTO Circle', to: 'Maninagar', stops: 18, dist: 16.2, fare: 10, freq: 4, hours: '06:00-23:00',
      stopList: [
        { name: 'RTO Circle', lat: 23.0665, lng: 72.5839 },
        { name: 'Ranip Cross Road', lat: 23.0670, lng: 72.5730 },
        { name: 'Akhbarnagar', lat: 23.0674, lng: 72.5626 },
        { name: 'Pragatinagar', lat: 23.0570, lng: 72.5520 },
        { name: 'Shastri Nagar', lat: 23.0520, lng: 72.5460 },
        { name: 'Memnagar', lat: 23.0452, lng: 72.5419 },
        { name: 'Helmet Cross Road', lat: 23.0452, lng: 72.5419 },
        { name: 'Panjrapole', lat: 23.0398, lng: 72.5385 },
        { name: 'Himmatlal Park', lat: 23.0298, lng: 72.5324 },
        { name: 'Shivranjani', lat: 23.0243, lng: 72.5313 },
        { name: 'Jhansi Ki Rani', lat: 23.0230, lng: 72.5370 },
        { name: 'Nehrunagar', lat: 23.0223, lng: 72.5428 },
        { name: 'Manekbaug', lat: 23.0160, lng: 72.5475 },
        { name: 'Dharnidhar', lat: 23.0100, lng: 72.5510 },
        { name: 'Anjali (Vasna)', lat: 23.0037, lng: 72.5539 },
        { name: 'Danilimda', lat: 23.0015, lng: 72.5830 },
        { name: 'Kankaria Lake', lat: 23.0032, lng: 72.5990 },
        { name: 'Maninagar', lat: 22.9972, lng: 72.6064 }
      ]
    },
    { city: 'Ahmedabad', system: 'Ahmedabad Janmarg BRTS', number: '2D', name: 'Anjali to Naroda', from: 'Anjali (Vasna)', to: 'Naroda', stops: 13, dist: 18.5, fare: 12, freq: 5, hours: '06:00-23:00',
      stopList: [
        { name: 'Anjali (Vasna)', lat: 23.0037, lng: 72.5539 },
        { name: 'Chandranagar', lat: 23.0030, lng: 72.5680 },
        { name: 'Danilimda', lat: 23.0015, lng: 72.5830 },
        { name: 'Kankaria Lake', lat: 23.0032, lng: 72.5990 },
        { name: 'Geeta Mandir Central Bus Stand', lat: 23.0135, lng: 72.5890 },
        { name: 'Raipur Darwaja', lat: 23.0180, lng: 72.5950 },
        { name: 'Sarangpur Darwaja', lat: 23.0210, lng: 72.5990 },
        { name: 'Kalupur Railway Station', lat: 23.0251, lng: 72.6031 },
        { name: 'Saraspur', lat: 23.0280, lng: 72.6010 },
        { name: 'Memco Sports Complex', lat: 23.0450, lng: 72.6180 },
        { name: 'Naroda Fruit Market', lat: 23.0680, lng: 72.6480 },
        { name: 'Naroda Gam', lat: 23.0771, lng: 72.6558 }
      ]
    },
    { city: 'Ahmedabad', system: 'Ahmedabad Janmarg BRTS', number: '4D', name: 'Iskcon Cross Road to Naroda Gam', from: 'Iskcon Cross Road', to: 'Naroda Gam', stops: 11, dist: 21.4, fare: 15, freq: 5, hours: '06:00-23:00',
      stopList: [
        { name: 'Iskcon Cross Road', lat: 23.0275, lng: 72.5075 },
        { name: 'Ramdev Nagar', lat: 23.0260, lng: 72.5180 },
        { name: 'Star Bazaar', lat: 23.0245, lng: 72.5250 },
        { name: 'Shivranjani', lat: 23.0243, lng: 72.5313 },
        { name: 'Nehrunagar', lat: 23.0223, lng: 72.5428 },
        { name: 'Anjali (Vasna)', lat: 23.0037, lng: 72.5539 },
        { name: 'Danilimda', lat: 23.0015, lng: 72.5830 },
        { name: 'Geeta Mandir Central Bus Stand', lat: 23.0135, lng: 72.5890 },
        { name: 'Kalupur Railway Station', lat: 23.0251, lng: 72.6031 },
        { name: 'Naroda Gam', lat: 23.0771, lng: 72.6558 }
      ]
    },
    { city: 'Ahmedabad', system: 'Ahmedabad Janmarg BRTS', number: '8D', name: 'Science City to Odhav Ring Road', from: 'Science City', to: 'Odhav Ring Road', stops: 9, dist: 22.8, fare: 15, freq: 6, hours: '06:00-23:00',
      stopList: [
        { name: 'Science City', lat: 23.0779, lng: 72.4948 },
        { name: 'Sola Bhagwat', lat: 23.0652, lng: 72.5293 },
        { name: 'Sola Bridge', lat: 23.0560, lng: 72.5340 },
        { name: 'Gulab Tower', lat: 23.0490, lng: 72.5370 },
        { name: 'Helmet Cross Road', lat: 23.0452, lng: 72.5419 },
        { name: 'Panjrapole', lat: 23.0398, lng: 72.5385 },
        { name: 'Shivranjani', lat: 23.0243, lng: 72.5313 },
        { name: 'Anjali (Vasna)', lat: 23.0037, lng: 72.5539 },
        { name: 'Geeta Mandir Central Bus Stand', lat: 23.0135, lng: 72.5890 },
        { name: 'Odhav Ring Road', lat: 23.0259, lng: 72.6725 }
      ]
    },
    { city: 'Ahmedabad', system: 'Ahmedabad Janmarg BRTS', number: '12D', name: 'Bopal to Maninagar', from: 'Bopal (Ghuma Gam)', to: 'Maninagar', stops: 9, dist: 24.5, fare: 18, freq: 5, hours: '06:00-23:00',
      stopList: [
        { name: 'Bopal Gam', lat: 23.0265, lng: 72.4822 },
        { name: 'Ambli Gam', lat: 23.0280, lng: 72.4950 },
        { name: 'Iskcon Cross Road', lat: 23.0275, lng: 72.5075 },
        { name: 'Shivranjani', lat: 23.0243, lng: 72.5313 },
        { name: 'Nehrunagar', lat: 23.0223, lng: 72.5428 },
        { name: 'Anjali (Vasna)', lat: 23.0037, lng: 72.5539 },
        { name: 'Kankaria Lake', lat: 23.0032, lng: 72.5990 },
        { name: 'Maninagar', lat: 22.9972, lng: 72.6064 }
      ]
    },

    // Pune Rainbow BRTS
    { city: 'Pune', system: 'Rainbow BRTS (PMPML)', number: 'R-1', name: 'Swargate to Katraj Corridor', from: 'Swargate', to: 'Katraj', stops: 9, dist: 6.8, fare: 10, freq: 5, hours: '06:00-23:00' },
    { city: 'Pune', system: 'Rainbow BRTS (PMPML)', number: 'R-2', name: 'Hadapsar to Pune Station', from: 'Hadapsar Gadital', to: 'Pune Railway Station', stops: 11, dist: 9.5, fare: 15, freq: 6, hours: '05:30-23:30' },
    { city: 'Pune', system: 'Rainbow BRTS (PMPML)', number: 'R-3', name: 'Nigdi to Dapodi Corridor (Old Highway)', from: 'Nigdi Pavana', to: 'Dapodi', stops: 14, dist: 13.2, fare: 15, freq: 5, hours: '06:00-23:00' },

    // Surat Sitilink BRTS
    { city: 'Surat', system: 'Sitilink BRTS', number: 'S-1', name: 'ONGC to Udhna Darwaja', from: 'ONGC Nagar', to: 'Udhna Darwaja', stops: 12, dist: 10.5, fare: 8, freq: 6, hours: '06:00-22:30' },
    { city: 'Surat', system: 'Sitilink BRTS', number: 'S-2', name: 'Surat Railway Station to Dumas Resort', from: 'Surat Central Railway Stn', to: 'Dumas Beach Resort', stops: 16, dist: 19.8, fare: 14, freq: 8, hours: '06:00-22:00' },

    // Indore iBus BRTS
    { city: 'Indore', system: 'iBus BRTS (AICTSL)', number: 'i-1', name: 'AB Road Dedicated Corridor', from: 'Niranjanpur', to: 'Rajiv Gandhi Square', stops: 21, dist: 11.5, fare: 10, freq: 4, hours: '06:00-23:00' },

    // Hubballi-Dharwad Chigari BRTS
    { city: 'Hubballi-Dharwad', system: 'Chigari BRTS (HDBRTS)', number: 'C-100', name: 'Hubballi CBT to Dharwad CBT Superfast', from: 'Hubballi CBT', to: 'Dharwad New Bus Stand', stops: 18, dist: 22.5, fare: 18, freq: 3, hours: '06:00-23:00' }
  ],

  // ─── ALL-INDIA STATE TRANSPORT CORPORATIONS (SRTCs) ───
  stateBuses: [
    // Gujarat (GSRTC)
    { operator: 'GSRTC', state: 'Gujarat', from: 'Ahmedabad (Geeta Mandir Central)', to: 'Mumbai (Borivali/Dadar)', type: 'Volvo AC Sleeper', dep: '20:00, 21:30, 22:15', arr: '8h 30m', fare: 450, fareAc: 650, via: 'NE-1 Expressway, Surat, Vapi' },
    { operator: 'GSRTC', state: 'Gujarat', from: 'Ahmedabad (Geeta Mandir)', to: 'Gandhinagar (Pathika)', type: 'Gurjarnagri / Express', dep: 'Every 10 min (05:30-23:00)', arr: '45m', fare: 30, fareAc: 50, via: 'Koba Circle, SG Highway' },
    { operator: 'GSRTC', state: 'Gujarat', from: 'Ahmedabad (Geeta Mandir)', to: 'Vadodara (Central Bus Stand)', type: 'Volvo AC / Express', dep: 'Every 15 min (24 Hours)', arr: '1h 45m', fare: 120, fareAc: 190, via: 'NE-1 National Expressway 1' },
    { operator: 'GSRTC', state: 'Gujarat', from: 'Ahmedabad (Geeta Mandir)', to: 'Surat (Central Bus Station)', type: 'Volvo AC Sleeper / Express', dep: 'Every 20 min (24 Hours)', arr: '4h 30m', fare: 240, fareAc: 380, via: 'Vadodara, Bharuch, Ankleshwar' },
    { operator: 'GSRTC', state: 'Gujarat', from: 'Ahmedabad (Paldi / Geeta Mandir)', to: 'Rajkot (Shastri Maidan)', type: 'Volvo AC / Express', dep: 'Every 20 min', arr: '4h 0m', fare: 210, fareAc: 340, via: 'Bagodara, Limbdi, Chotila' },
    { operator: 'GSRTC', state: 'Gujarat', from: 'Ahmedabad (Geeta Mandir)', to: 'Bhavnagar (ST Stand)', type: 'Express', dep: 'Every 30 min', arr: '3h 30m', fare: 180, fareAc: 280, via: 'Dhandhuka, Vallabhipur' },
    { operator: 'GSRTC', state: 'Gujarat', from: 'Ahmedabad (Geeta Mandir)', to: 'Bhuj (Kutch)', type: 'Volvo AC Sleeper', dep: '07:00, 14:00, 21:00, 22:30', arr: '7h 0m', fare: 350, fareAc: 550, via: 'Halvad, Gandhidham' },
    { operator: 'GSRTC', state: 'Gujarat', from: 'Ahmedabad (Geeta Mandir)', to: 'Somnath / Dwarka', type: 'Sleeper AC Express', dep: '20:30, 21:30', arr: '9h 30m', fare: 420, fareAc: 680, via: 'Rajkot, Junagadh' },

    // Maharashtra (MSRTC)
    { operator: 'MSRTC', state: 'Maharashtra', from: 'Mumbai (Dadar/Borivali)', to: 'Pune (Swargate/Shivajinagar)', type: 'Shivneri Volvo AC', dep: 'Every 15 min (05:00-23:30)', arr: '3h 30m', fare: 525, fareAc: 525, via: 'Mumbai-Pune Expressway' },
    { operator: 'MSRTC', state: 'Maharashtra', from: 'Mumbai (Parel)', to: 'Nashik (CBS)', type: 'Shivshahi AC', dep: 'Every 30 min (06:00-22:00)', arr: '4h 0m', fare: 320, fareAc: 450, via: 'Kasara Ghat, Igatpuri' },
    { operator: 'MSRTC', state: 'Maharashtra', from: 'Pune (Swargate)', to: 'Kolhapur (CBS)', type: 'Shivneri Volvo AC', dep: 'Every 1 hr', arr: '4h 45m', fare: 390, fareAc: 680, via: 'Satara, Karad' },
    { operator: 'MSRTC', state: 'Maharashtra', from: 'Nagpur', to: 'Amravati', type: 'Express', dep: 'Every 20 min', arr: '3h 0m', fare: 190, fareAc: 310, via: 'Karanja, Wardha' },

    // Karnataka (KSRTC)
    { operator: 'KSRTC', state: 'Karnataka', from: 'Bengaluru (Majestic)', to: 'Mysuru (Suburban Stand)', type: 'Airavat Club Class (Multi-Axle)', dep: 'Every 10 min (24 Hours)', arr: '2h 15m', fare: 340, fareAc: 340, via: 'Bengaluru-Mysuru Expressway' },
    { operator: 'KSRTC', state: 'Karnataka', from: 'Bengaluru (Shantinagar)', to: 'Mangaluru (KSRTC Stand)', type: 'Ambari Dream Class (Volvo Sleeper)', dep: '21:00, 22:00, 23:00', arr: '7h 30m', fare: 550, fareAc: 980, via: 'Hassan, Sakleshpur Shiradi Ghat' },
    { operator: 'KSRTC', state: 'Karnataka', from: 'Bengaluru (Kempegowda)', to: 'Panaji / Goa', type: 'Ambari Utsav (Premium AC Sleeper)', dep: '20:30', arr: '12h 0m', fare: 950, fareAc: 1450, via: 'Hubballi, Belagavi' },
    { operator: 'KSRTC', state: 'Karnataka', from: 'Mysuru', to: 'Ooty (Tamil Nadu)', type: 'Rajahamsa Executive', dep: '07:00, 09:30, 13:00', arr: '4h 30m', fare: 210, fareAc: 380, via: 'Bandipur National Park, Mudumalai' },

    // Uttar Pradesh (UPSRTC)
    { operator: 'UPSRTC', state: 'Uttar Pradesh', from: 'Delhi (Anand Vihar)', to: 'Agra (ISBT)', type: 'Janrath AC', dep: 'Every 30 min (06:00-23:00)', arr: '3h 30m', fare: 290, fareAc: 420, via: 'Yamuna Expressway' },
    { operator: 'UPSRTC', state: 'Uttar Pradesh', from: 'Delhi (Kashmere Gate)', to: 'Lucknow (Alambagh)', type: 'Shatabdi Bus / Volvo AC', dep: '20:00, 21:30, 22:30', arr: '7h 30m', fare: 650, fareAc: 1150, via: 'Agra-Lucknow Expressway' },
    { operator: 'UPSRTC', state: 'Uttar Pradesh', from: 'Lucknow (Charbagh)', to: 'Varanasi (Cantt)', type: 'Janrath AC', dep: 'Every 1 hr', arr: '6h 0m', fare: 380, fareAc: 580, via: 'Sultanpur, Jaunpur' },
    { operator: 'UPSRTC', state: 'Uttar Pradesh', from: 'Ayodhya Dham', to: 'Gorakhpur', type: 'City Express', dep: 'Every 20 min', arr: '2h 30m', fare: 140, fareAc: 240, via: 'Basti' },

    // Rajasthan (RSRTC)
    { operator: 'RSRTC', state: 'Rajasthan', from: 'Jaipur (Sindhi Camp)', to: 'Delhi (Bikaner House / ISBT)', type: 'Super Luxury Scania AC', dep: 'Every 30 min (24 Hours)', arr: '5h 0m', fare: 450, fareAc: 850, via: 'Delhi-Jaipur Expressway' },
    { operator: 'RSRTC', state: 'Rajasthan', from: 'Jaipur (Sindhi Camp)', to: 'Udaipur (City Stand)', type: 'Volvo AC Sleeper', dep: '21:00, 22:00, 23:00', arr: '7h 0m', fare: 480, fareAc: 890, via: 'Ajmer, Bhilwara' },
    { operator: 'RSRTC', state: 'Rajasthan', from: 'Jaipur (Sindhi Camp)', to: 'Jodhpur (Rai Ka Bagh)', type: 'Express AC', dep: '07:00, 11:00, 15:00', arr: '6h 0m', fare: 360, fareAc: 620, via: 'Ajmer, Beawar' },

    // Delhi Transport Corporation / NCR
    { operator: 'DTC / NCR', state: 'Delhi NCR', from: 'Delhi (Kashmere Gate)', to: 'Gurugram (IFFCO Chowk)', type: 'Electric AC Express', dep: 'Every 10 min (06:00-23:00)', arr: '1h 15m', fare: 40, fareAc: 40, via: 'NH-48 Cyber City' },
    { operator: 'DTC / NCR', state: 'Delhi NCR', from: 'Delhi (Anand Vihar)', to: 'Greater Noida (Pari Chowk)', type: 'AC City Express', dep: 'Every 15 min', arr: '1h 10m', fare: 45, fareAc: 45, via: 'Noida Expressway' },

    // Tamil Nadu (SETC / TNSTC)
    { operator: 'SETC', state: 'Tamil Nadu', from: 'Chennai (Kalaignar Centenary Bus Terminus Kilambakkam)', to: 'Coimbatore', type: 'Ultra Deluxe AC Sleeper', dep: 'Every 1 hr (Night/Day)', arr: '8h 0m', fare: 490, fareAc: 850, via: 'Salem, Erode' },
    { operator: 'SETC', state: 'Tamil Nadu', from: 'Chennai (KCBT Kilambakkam)', to: 'Madurai (Mattuthavani)', type: 'Non-Stop AC Seater', dep: 'Every 30 min', arr: '7h 30m', fare: 430, fareAc: 740, via: 'Tiruchirappalli (Trichy)' },
    { operator: 'SETC', state: 'Tamil Nadu', from: 'Chennai (KCBT)', to: 'Bengaluru (Shantinagar)', type: 'Ultra Deluxe', dep: 'Every 30 min', arr: '6h 30m', fare: 380, fareAc: 650, via: 'Vellore, Hosur' },

    // Telangana & Andhra Pradesh (TSRTC & APSRTC)
    { operator: 'TSRTC & APSRTC', state: 'Telangana / AP', from: 'Hyderabad (MGBS)', to: 'Vijayawada (Pandit Nehru Stand)', type: 'Garuda Plus AC Multi-Axle', dep: 'Every 20 min (24 Hours)', arr: '5h 0m', fare: 420, fareAc: 680, via: 'Suryapet, Nandigama' },
    { operator: 'APSRTC', state: 'Andhra Pradesh', from: 'Hyderabad (MGBS)', to: 'Tirupati (Alipiri)', type: 'Vennela AC Sleeper', dep: '19:30, 20:30, 21:30', arr: '9h 30m', fare: 650, fareAc: 1100, via: 'Kurnool, Kadapa' },
    { operator: 'APSRTC', state: 'Andhra Pradesh', from: 'Visakhapatnam (Dwaraka Stand)', to: 'Vijayawada (PNBS)', type: 'Super Luxury / Amaravathi AC', dep: 'Every 30 min', arr: '6h 30m', fare: 390, fareAc: 650, via: 'Rajamahendravaram, Eluru' },

    // Kerala (KSRTC SWIFT)
    { operator: 'KSRTC Kerala', state: 'Kerala', from: 'Thiruvananthapuram (Thampanoor)', to: 'Kochi (Ernakulam KSRTC)', type: 'K-SWIFT Super Fast / Seater', dep: 'Every 20 min', arr: '5h 30m', fare: 260, fareAc: 460, via: 'Kollam, Alappuzha' },
    { operator: 'KSRTC Kerala', state: 'Kerala', from: 'Kochi (Ernakulam)', to: 'Kozhikode (Calicut)', type: 'K-SWIFT AC Airavat', dep: 'Every 45 min', arr: '4h 45m', fare: 280, fareAc: 490, via: 'Thrissur, Malappuram' },
    { operator: 'KSRTC Kerala', state: 'Kerala', from: 'Kochi (Ernakulam)', to: 'Munnar (Tea Valley)', type: 'Fast Passenger (Hill Highway)', dep: '06:00, 08:00, 11:30, 14:00', arr: '4h 0m', fare: 165, fareAc: 280, via: 'Kothamangalam, Adimali' }
  ],

  // ─── AHMEDABAD AMTS LOCAL CITY BUSES ───
  amtsBuses: [
    { number: '40/1', from: 'Lal Darwaja', to: 'Bopal Gam', route: 'Lal Darwaja ➔ Paldi ➔ Nehrunagar ➔ Shivranjani ➔ Iskcon ➔ Bopal', freq: 'Every 8 min', fare: '₹5 - ₹15', hours: '06:00-22:30' },
    { number: '13/1', from: 'Kalupur Railway Stn', to: 'Gujarat University', route: 'Kalupur ➔ Income Tax ➔ Ashram Road ➔ Navrangpura ➔ Gujarat University', freq: 'Every 10 min', fare: '₹5 - ₹10', hours: '06:00-22:30' },
    { number: '151', from: 'Vadaj Terminus', to: 'Sarkhej Roza', route: 'Vadaj ➔ Usmanpura ➔ Paldi ➔ Vasna ➔ APMC ➔ Sarkhej', freq: 'Every 12 min', fare: '₹5 - ₹15', hours: '06:00-22:00' },
    { number: '83', from: 'Maninagar', to: 'RTO Circle', route: 'Maninagar ➔ Geeta Mandir ➔ Kalupur ➔ Subhash Bridge ➔ RTO', freq: 'Every 15 min', fare: '₹5 - ₹12', hours: '06:00-22:00' }
  ],

  // ─── GSRTC BUS STANDS ───
  gsrtcBusStands: [
    { name: 'Geeta Mandir Central Bus Station', code: 'GTM', lat: 23.0135, lng: 72.5890, city: 'Ahmedabad', type: 'Central Hub' },
    { name: 'Paldi Central Bus Stand', code: 'PLD', lat: 23.0160, lng: 72.5645, city: 'Ahmedabad', type: 'West Hub' },
    { name: 'Ranip Bus Port (Modern Terminal)', code: 'RNP', lat: 23.0610, lng: 72.5620, city: 'Ahmedabad', type: 'North Hub' },
    { name: 'Subhash Bridge Depot', code: 'SBH', lat: 23.0645, lng: 72.5800, city: 'Ahmedabad', type: 'Depot' },
    { name: 'ISCON Cross Road GSRTC Pick-up', code: 'ISC', lat: 23.0280, lng: 72.5075, city: 'Ahmedabad', type: 'Highway Pick-up' },
    { name: 'C.T.M. Cross Road Express Bus Stand', code: 'CTM', lat: 22.9960, lng: 72.6320, city: 'Ahmedabad', type: 'Express Pick-up' }
  ],

  // ─── RAILWAY STATIONS ───
  railwayStations: [
    { name: 'Ahmedabad Junction (Kalupur)', code: 'ADI', lat: 23.0251, lng: 72.6031, city: 'Ahmedabad', state: 'Gujarat' },
    { name: 'Sabarmati Junction', code: 'SBI', lat: 23.0697, lng: 72.5878, city: 'Ahmedabad', state: 'Gujarat' },
    { name: 'Maninagar Railway Station', code: 'MAN', lat: 22.9996, lng: 72.5990, city: 'Ahmedabad', state: 'Gujarat' },
    { name: 'Gandhinagar Capital', code: 'GNC', lat: 23.2320, lng: 72.6390, city: 'Gandhinagar', state: 'Gujarat' },
    { name: 'Chandlodiya Railway Station', code: 'CLDY', lat: 23.0780, lng: 72.5370, city: 'Ahmedabad', state: 'Gujarat' },
    { name: 'Asarva Railway Station', code: 'ASV', lat: 23.0450, lng: 72.6020, city: 'Ahmedabad', state: 'Gujarat' }
  ],

  // ─── PAN-INDIA TOP INTERCITY TRAINS ───
  panIndiaTrains: [
    // Ahmedabad to Mumbai Corridors
    { number: '20902', name: 'Gandhinagar - Mumbai Central Vande Bharat Express', type: 'Vande Bharat', from: 'Ahmedabad Jn (ADI)', to: 'Mumbai Central (MMCT)', dep: '15:30', arr: '21:45', dur: '6h 15m', dist: 493, runs: 'Daily exc Wed', plat: '1', cc: 1385, ec: 2505 },
    { number: '20901', name: 'Mumbai Central - Gandhinagar Vande Bharat', type: 'Vande Bharat', from: 'Mumbai Central (MMCT)', to: 'Gandhinagar Capital (GNC)', dep: '06:10', arr: '12:25', dur: '6h 15m', dist: 522, runs: 'Daily exc Wed', plat: '3', cc: 1385, ec: 2505 },
    { number: '12010', name: 'Ahmedabad - Mumbai Central Shatabdi Express', type: 'Shatabdi', from: 'Ahmedabad Jn (ADI)', to: 'Mumbai Central (MMCT)', dep: '15:00', arr: '21:25', dur: '6h 25m', dist: 493, runs: 'Daily exc Sun', plat: '1', cc: 825, ec: 1565 },
    { number: '12009', name: 'Mumbai Central - Ahmedabad Shatabdi Express', type: 'Shatabdi', from: 'Mumbai Central (MMCT)', to: 'Ahmedabad Jn (ADI)', dep: '06:20', arr: '12:45', dur: '6h 25m', dist: 493, runs: 'Daily exc Sun', plat: '1', cc: 825, ec: 1565 },
    { number: '12902', name: 'Gujarat Mail (Overnight Sleeper)', type: 'Mail/Express', from: 'Ahmedabad Jn (ADI)', to: 'Mumbai Central (MMCT)', dep: '22:15', arr: '06:15', dur: '8h 00m', dist: 493, runs: 'Daily', plat: '5', sl: 365, ac3: 965, ac2: 1400, ac1: 2365 },
    { number: '12901', name: 'Gujarat Mail', type: 'Mail/Express', from: 'Mumbai Central (MMCT)', to: 'Ahmedabad Jn (ADI)', dep: '21:40', arr: '05:55', dur: '8h 15m', dist: 493, runs: 'Daily', plat: '5', sl: 365, ac3: 965, ac2: 1400, ac1: 2365 },
    { number: '12934', name: 'Karnavati Express', type: 'Superfast', from: 'Ahmedabad Jn (ADI)', to: 'Mumbai Central (MMCT)', dep: '05:00', arr: '12:35', dur: '7h 35m', dist: 493, runs: 'Daily', plat: '6', sl: 195, cc: 720 },
    { number: '12951', name: 'Mumbai Rajdhani Express', type: 'Rajdhani', from: 'Mumbai Central (MMCT)', to: 'New Delhi (NDLS)', dep: '17:00', arr: '08:32', dur: '15h 32m', dist: 1386, runs: 'Daily', plat: '1', sl: 0, ac3: 2465, ac2: 3485, ac1: 5210 },
    { number: '22436', name: 'New Delhi - Varanasi Vande Bharat', type: 'Vande Bharat', from: 'New Delhi (NDLS)', to: 'Varanasi Jn (BSB)', dep: '06:00', arr: '14:00', dur: '8h 0m', dist: 759, runs: 'Daily exc Mon, Thu', plat: '1', cc: 1750, ec: 3300 },
    { number: '20607', name: 'Chennai Central - Mysuru Vande Bharat', type: 'Vande Bharat', from: 'MGR Chennai Central (MAS)', to: 'Mysuru Jn (MYS)', dep: '05:50', arr: '12:20', dur: '6h 30m', dist: 497, runs: 'Daily exc Wed', plat: '2', cc: 1200, ec: 2295 },
    { number: '22301', name: 'Howrah - New Jalpaiguri Vande Bharat', type: 'Vande Bharat', from: 'Howrah Jn (HWH)', to: 'New Jalpaiguri (NJP)', dep: '05:55', arr: '13:25', dur: '7h 30m', dist: 561, runs: 'Daily exc Wed', plat: '8', cc: 1565, ec: 2825 },
    { number: '20701', name: 'Secunderabad - Tirupati Vande Bharat', type: 'Vande Bharat', from: 'Secunderabad Jn (SC)', to: 'Tirupati (TPTY)', dep: '06:00', arr: '14:30', dur: '8h 30m', dist: 661, runs: 'Daily exc Tue', plat: '10', cc: 1680, ec: 3080 },
    { number: '12301', name: 'Howrah Rajdhani Express', type: 'Rajdhani', from: 'Howrah Jn (HWH)', to: 'New Delhi (NDLS)', dep: '16:50', arr: '10:05', dur: '17h 15m', dist: 1451, runs: 'Daily exc Sun', plat: '9', sl: 0, ac3: 2540, ac2: 3620, ac1: 5400 },
    { number: '22691', name: 'Bengaluru Rajdhani Express', type: 'Rajdhani', from: 'KSR Bengaluru (SBC)', to: 'Hazrat Nizamuddin (NZM)', dep: '20:00', arr: '05:30', dur: '33h 30m', dist: 2365, runs: 'Daily', plat: '5', sl: 0, ac3: 3820, ac2: 5410, ac1: 7920 },
    { number: '12123', name: 'Deccan Queen Express', type: 'Superfast', from: 'CSMT Mumbai (CSMT)', to: 'Pune Jn (PUNE)', dep: '17:10', arr: '20:25', dur: '3h 15m', dist: 192, runs: 'Daily', plat: '8', cc: 395, ec: 890, sl: 120 },
    { number: '12841', name: 'Coromandel Express', type: 'Superfast', from: 'Howrah Jn (HWH)', to: 'MGR Chennai Central (MAS)', dep: '15:20', arr: '16:50', dur: '25h 30m', dist: 1662, runs: 'Daily', plat: '21', sl: 660, ac3: 1750, ac2: 2540, ac1: 4320 },
    { number: '12626', name: 'Kerala Express', type: 'Superfast', from: 'New Delhi (NDLS)', to: 'Trivandrum Central (TVC)', dep: '20:10', arr: '19:15', dur: '47h 5m', dist: 3036, runs: 'Daily', plat: '3', sl: 980, ac3: 2560, ac2: 3750, ac1: 6200 }
  ]
};
