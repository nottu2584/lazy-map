#!/bin/bash

echo "========================================="
echo "Testing Layered Map Generation System"
echo "========================================="
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s http://localhost:3030/api/benchmark/health | jq '.'
echo ""

# Test metrics endpoint (generates a 50x50 map)
echo "2. Testing metrics endpoint (generates 50x50 map)..."
curl -s http://localhost:3030/api/benchmark/metrics | jq '{
  success: .success,
  performance: .data.currentPerformance,
  layers: .data.layerMetrics
}'
echo ""

# Run benchmark with small map
echo "3. Running benchmark with 30x30 map..."
curl -s -X POST http://localhost:3030/api/benchmark/run \
  -H "Content-Type: application/json" \
  -d '{"mapSizes": [{"width": 30, "height": 30}], "seeds": [42], "iterations": 1}' | jq '{
  success: .success,
  summary: .data.summary
}' | head -50
echo ""

# Test comparison endpoint
echo "4. Testing comparison endpoint..."
curl -s -X POST http://localhost:3030/api/benchmark/compare \
  -H "Content-Type: application/json" \
  -d '{"mapSize": {"width": 25, "height": 25}, "seed": 99}' | jq '{
  success: .success,
  implementation: .data.implementations[0].name,
  duration: .data.implementations[0].totalDuration,
  rating: .data.implementations[0].rating,
  meetsTarget: .data.implementations[0].meetsTarget,
  layers: .data.implementations[0].layerPerformance
}'
echo ""

echo "========================================="
echo "All tests completed!"
echo "========================================="
