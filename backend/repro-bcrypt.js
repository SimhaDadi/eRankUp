const bcrypt = require('bcrypt');

async function testBcrypt() {
    console.log('Testing bcrypt...');

    try {
        console.log('Case 1: Empty string hash');
        const match1 = await bcrypt.compare('password', '');
        console.log('Case 1 Result:', match1);
    } catch (e) {
        console.log('Case 1 Threw:', e.message);
    }

    try {
        console.log('Case 2: Invalid string hash');
        const match2 = await bcrypt.compare('password', 'not-a-hash');
        console.log('Case 2 Result:', match2);
    } catch (e) {
        console.log('Case 2 Threw:', e.message);
    }

    try {
        console.log('Case 3: Null hash (simulated)');
        // bcrypt.compare expects string, but if somehow it receives null
        const match3 = await bcrypt.compare('password', null);
        console.log('Case 3 Result:', match3);
    } catch (e) {
        console.log('Case 3 Threw:', e.message);
    }
}

testBcrypt();
