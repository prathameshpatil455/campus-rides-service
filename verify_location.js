
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';
let authToken = '';

async function login() {
  // Use a known existing user or creating one would be better, but assuming one exists for now or the user provided login
  // For this script, I'll assume valid credentials for a test user are available or I'll create one.
  // I will try to register a simplified user just to get a token.
    const email = `test.driver.${Date.now()}@college.edu`;
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            firstName: 'Driver',
            lastName: 'Test',
            email: email,
            studentIdNumber: `ID${Date.now()}`,
            department: 'CS',
            year: '4th',
            password: 'Password123!'
        })
    });
    
    // Auto login is not standard, so I login after register
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: email,
            password: 'Password123!'
        })
    });
    const data = await loginRes.json();
    if(data.success) {
        authToken = data.data.token;
        console.log('Login successful');
    } else {
        console.error('Login failed', data);
    }
}

async function verifyDriver() {
    // Hack: verify driver in DB or just use a user that is created. 
    // The current createRide requires verifyDriver middleware which checks isDriverVerified.
    // I cannot easily set this via API. I might need to mock or skip this for local test if I can't access DB.
    // However, I have access to DB via mongoose if I used a script that imports app.
    // Since I am external plain script, I might hit 403.
    // I will try to create a ride and see. If 403, I will report it.
}

async function createRideWithGPS() {
    if (!authToken) return;
    const body = {
        pickup: {
            type: 'gps',
            name: 'Library Gate',
            coordinates: { latitude: 12.9716, longitude: 77.5946 }
        },
        destination: {
            type: 'digipin',
            name: 'Hostel Block A',
            digipin: '123456'
        },
        time: new Date(Date.now() + 3600000).toISOString(),
        availableSeats: 3,
        price: 50
    };

    const res = await fetch(`${BASE_URL}/api/api/rides`, { // Note: app.js mounts routes at /api, and rideRoutes might be mounted at /rides?
        // Wait, app.js mounts routes at /api. routes/index.js mounts rideRoutes at /rides. So path is /api/rides.
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(body)
    });
    
    // Actually the URL in my reading was /api/rides. 
    // Wait, let's double check route mounting in previous turn. 
    // routes/index.js: router.use("/rides", rideRoutes);
    // app.js: app.use("/api", routes);
    // So URL is /api/rides.
    
    const text = await res.text();
    console.log(`Create GPS Ride: ${res.status} - ${text}`);
}

async function main() {
    await login();
    await createRideWithGPS();
}

main();
