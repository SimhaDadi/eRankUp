import autocannon = require('autocannon');

async function runStressTest() {
    const url = 'http://localhost:3001';
    console.log(`Starting stress test against ${url}...`);

    const instance = autocannon({
        url,
        connections: 10, // Number of concurrent connections
        duration: 10, // Duration of the test in seconds
        pipelining: 1, // Number of pipelined requests
        workers: 1, // Number of worker threads (requires 1 connection per worker)
    }, (err, result) => {
        if (err) {
            console.error('Error running stress test:', err);
            return;
        }

        console.log('Stress test completed!');
        console.log(autocannon.printResult(result));
    });

    autocannon.track(instance, { renderProgressBar: true });
}

runStressTest();
