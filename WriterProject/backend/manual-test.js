#!/usr/bin/env node

import axios from 'axios'

const BASE_URL = 'http://localhost:5001'

async function testHealth() {
  console.log('\n=== Testing /health endpoint ===')
  try {
    const response = await axios.get(`${BASE_URL}/health`)
    console.log('✅ Health check passed:', response.data)
    return true
  } catch (error) {
    console.log('❌ Health check failed:', error.message)
    return false
  }
}

async function testSelfTest() {
  console.log('\n=== Testing /api/self-test/run/unit ===')
  try {
    const response = await axios.post(`${BASE_URL}/api/self-test/run/unit`)
    console.log('✅ Self-test passed')
    console.log('Results:', JSON.stringify(response.data, null, 2))
    return true
  } catch (error) {
    console.log('❌ Self-test failed:', error.message)
    if (error.response) {
      console.log('Error details:', error.response.data)
    }
    return false
  }
}

async function testAIGeneration() {
  console.log('\n=== Testing AI generation ===')
  try {
    const response = await axios.post(`${BASE_URL}/api/ai/generate-hypothesis`, {
      topic: 'Тестовая тема для проверки работы AI'
    })
    console.log('✅ AI generation passed')
    console.log('Generated hypothesis:', response.data.hypothesis?.substring(0, 100) + '...')
    return true
  } catch (error) {
    console.log('❌ AI generation failed:', error.message)
    if (error.response) {
      console.log('Error details:', error.response.data)
    }
    return false
  }
}

async function testMetrics() {
  console.log('\n=== Testing metrics ===')
  try {
    const response = await axios.get(`${BASE_URL}/api/metrics`)
    console.log('✅ Metrics endpoint passed')
    console.log('Metrics:', JSON.stringify(response.data, null, 2))
    return true
  } catch (error) {
    console.log('❌ Metrics endpoint failed:', error.message)
    if (error.response) {
      console.log('Error details:', error.response.data)
    }
    return false
  }
}

async function runAllTests() {
  console.log('🚀 Starting WriterAssistant Backend Manual Tests\n')
  
  const results = {
    health: await testHealth(),
    selfTest: await testSelfTest(),
    aiGeneration: await testAIGeneration(),
    metrics: await testMetrics()
  }
  
  console.log('\n=== Test Summary ===')
  const passed = Object.values(results).filter(r => r).length
  const total = Object.keys(results).length
  
  console.log(`Passed: ${passed}/${total}`)
  console.log(`Failed: ${total - passed}/${total}`)
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Backend is ready.')
    process.exit(0)
  } else {
    console.log('\n⚠️  Some tests failed. Please check the logs above.')
    process.exit(1)
  }
}

runAllTests().catch(error => {
  console.error('❌ Fatal error:', error)
  process.exit(1)
})
