const http = require('http');

function request(options, data) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = body ? JSON.parse(body) : {};
                    resolve({ statusCode: res.statusCode, body: parsed });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: body });
                }
            });
        });
        req.on('error', reject);
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function test() {
    try {
        console.log('--- Starting Backend Verification ---');

        // 1. Post Complaint
        console.log('\n1. POST /complaints');
        const postData = { name: 'Test User', email: 'test@example.com', text: 'Backend test' };
        const postRes = await request({
            hostname: 'localhost', port: 3000, path: '/complaints', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(postData)) }
        }, postData);
        console.log('Status:', postRes.statusCode);
        console.log('Response:', postRes.body);

        if (postRes.statusCode !== 201) throw new Error('POST failed');
        const id = postRes.body.id;

        // 2. Get Complaints
        console.log('\n2. GET /complaints');
        const getRes = await request({ hostname: 'localhost', port: 3000, path: '/complaints', method: 'GET' });
        console.log('Status:', getRes.statusCode);
        console.log('Count:', getRes.body.length);
        if (getRes.statusCode !== 200 || getRes.body.length < 1) throw new Error('GET failed');

        // 3. Update Status
        console.log(`\n3. PUT /complaints/${id}`);
        const putData = { status: 'Resolved' };
        const putRes = await request({
            hostname: 'localhost', port: 3000, path: `/complaints/${id}`, method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(JSON.stringify(putData)) }
        }, putData);
        console.log('Status:', putRes.statusCode);
        console.log('New Status:', putRes.body.status);
        if (putRes.statusCode !== 200 || putRes.body.status !== 'Resolved') throw new Error('PUT failed');

        // 4. Delete Complaint
        console.log(`\n4. DELETE /complaints/${id}`);
        const delRes = await request({ hostname: 'localhost', port: 3000, path: `/complaints/${id}`, method: 'DELETE' });
        console.log('Status:', delRes.statusCode);
        if (delRes.statusCode !== 200) throw new Error('DELETE failed');

        console.log('\n--- Backend Verification PASSED ---');
    } catch (err) {
        console.error('\n--- Verification FAILED ---');
        console.error(err);
        process.exit(1);
    }
}

test();
