// Quick test script for the AI agent endpoint
// Run: node test-agent.js

const API_URL = 'http://localhost:5000';

async function testAgent() {
  try {
    // First, test health endpoint
    console.log('Testing health endpoint...');
    const healthRes = await fetch(`${API_URL}/health`);
    const healthData = await healthRes.json();
    console.log('✅ Health check:', healthData);

    // Test agent endpoint (will fail without auth, but shows route exists)
    console.log('\nTesting agent endpoint (without auth - should return 401)...');
    const agentRes = await fetch(`${API_URL}/api/agent/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Test message' }),
    });
    const agentData = await agentRes.json();
    console.log('Agent endpoint response:', agentData);
    console.log('Status:', agentRes.status);
    
    if (agentRes.status === 401) {
      console.log('✅ Agent endpoint is working (requires authentication as expected)');
    } else if (agentRes.status === 200) {
      console.log('✅ Agent endpoint is working and returned data!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAgent();









