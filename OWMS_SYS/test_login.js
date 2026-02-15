import axios from 'axios';

const API_URL = 'http://localhost:4000/auth/login';

async function testLogin(userId, password) {
    try {
        console.log(`Attempting login for ${userId} at ${API_URL}...`);
        const response = await axios.post(API_URL, { userId, password });
        console.log(`Login Success for ${userId}:`, response.data);
    } catch (error) {
        if (error.response) {
            console.error(`Login Failed for ${userId}:`, error.response.status, error.response.data);
        } else {
            console.error(`Login Error for ${userId}:`, error.message);
        }
    }
}

// Test with 99999 which was created in verify_gongga.ts
testLogin('99999', 'password');
