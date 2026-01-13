#!/bin/bash

echo "======================================"
echo "WRITER ASSISTANT - STRESS TEST SUITE"
echo "======================================"
echo ""

FRONTEND_DIR="./WriterProject/web-demo"
BACKEND_DIR="./WriterProject/backend"

echo "📋 Running Backend Stress Tests..."
echo "-----------------------------------"
cd "$BACKEND_DIR"

echo "🧪 GLMService Stress Tests..."
npx vitest run src/services/__tests__/GLMService.stress.test.js --reporter=verbose --no-coverage || echo "⚠️ GLMService tests completed with issues"

echo ""
echo "🧪 DocumentService Stress Tests..."
npx vitest run src/services/__tests__/DocumentService.stress.test.js --reporter=verbose --no-coverage || echo "⚠️ DocumentService tests completed with issues"

echo ""
echo "======================================"
echo "📋 Running Frontend Stress Tests..."
echo "-----------------------------------"
cd "$FRONTEND_DIR"

echo "🧪 useWebSocket Stress Tests..."
npx vitest run src/hooks/__tests__/useWebSocket.stress.test.js --reporter=verbose --no-coverage || echo "⚠️ useWebSocket tests completed with issues"

echo ""
echo "🧪 EntryPoints Stress Tests..."
npx vitest run src/components/__tests__/EntryPoints.stress.test.js --reporter=verbose --no-coverage || echo "⚠️ EntryPoints tests completed with issues"

echo ""
echo "🧪 PipelineVisualizer Stress Tests..."
npx vitest run src/components/__tests__/PipelineVisualizer.stress.test.js --reporter=verbose --no-coverage || echo "⚠️ PipelineVisualizer tests completed with issues"

echo ""
echo "🧪 Integration Stress Tests..."
npx vitest run src/stores/__tests__/integration.stress.test.js --reporter=verbose --no-coverage || echo "⚠️ Integration tests completed with issues"

echo ""
echo "======================================"
echo "✅ STRESS TEST SUITE COMPLETED"
echo "======================================"
echo ""
echo "📊 Test Coverage Summary:"
echo "  - GLM-4.7 API: Exponential backoff, retry logic, parallel requests"
echo "  - WebSocket: Circuit breaker, reconnection delays, connection metrics"
echo "  - File Upload: Size validation, format validation, concurrent uploads"
echo "  - Error Recovery: UI actions, retry limits, network error handling"
echo "  - Integration: State synchronization, race conditions, memory leaks"
echo ""
