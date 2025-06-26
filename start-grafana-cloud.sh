#!/bin/bash

echo "🚀 Starting Address Service with Grafana Cloud Observability"
echo "=========================================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create one with your Grafana Cloud credentials."
    exit 1
fi

# Load environment variables
source .env

# Validate required Grafana Cloud environment variables
if [ -z "$OTEL_EXPORTER_OTLP_ENDPOINT" ]; then
    echo "❌ OTEL_EXPORTER_OTLP_ENDPOINT not set in .env file"
    exit 1
fi

if [ -z "$OTEL_EXPORTER_OTLP_HEADERS" ]; then
    echo "❌ OTEL_EXPORTER_OTLP_HEADERS not set in .env file"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "📍 Grafana Cloud Endpoint: $OTEL_EXPORTER_OTLP_ENDPOINT"
echo "🔑 Service Name: $OTEL_SERVICE_NAME"
echo "🌍 Environment: $NODE_ENV"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the development environment
echo "🐳 Starting Docker development environment..."
npm run dev

echo ""
echo "🎉 Address Service is starting up!"
echo "📊 View your telemetry data in Grafana Cloud:"
echo "   https://your-grafana-instance.grafana.net"
echo ""
echo "🔗 API Endpoints:"
echo "   - API: http://localhost:3001"
echo "   - Documentation: http://localhost:3001/documentation"
echo "   - Health Check: http://localhost:3001/health"
echo ""
echo "📝 View logs: npm run dev:logs"
echo "🛑 Stop service: npm run dev:down" 