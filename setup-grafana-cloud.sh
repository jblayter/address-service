#!/bin/bash

# Setup Grafana Cloud Integration
# This script helps configure the Grafana Agent to send telemetry data to Grafana Cloud

set -e

echo "🚀 Setting up Grafana Cloud Integration..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    touch .env
fi

# Get Grafana Cloud credentials
echo "🔑 Please provide your Grafana Cloud credentials:"
echo ""

# Get Instance ID
read -p "Enter your Grafana Cloud Instance ID: " INSTANCE_ID
if [ -z "$INSTANCE_ID" ]; then
    echo "❌ Instance ID is required. Exiting."
    exit 1
fi

# Get API Key
read -s -p "Enter your Grafana Cloud API Key: " API_KEY
echo ""
if [ -z "$API_KEY" ]; then
    echo "❌ API Key is required. Exiting."
    exit 1
fi

# Get Stack Region
read -p "Enter your Grafana Cloud Stack Region (e.g., us-east-0, eu-west-0): " REGION
if [ -z "$REGION" ]; then
    echo "❌ Stack Region is required. Exiting."
    exit 1
fi

echo ""
echo "📝 Updating configuration files..."

# Update .env file
echo "GRAFANA_CLOUD_INSTANCE_ID=$INSTANCE_ID" >> .env
echo "GRAFANA_CLOUD_API_KEY=$API_KEY" >> .env
echo "GRAFANA_CLOUD_REGION=$REGION" >> .env

# Update grafana-agent-cloud-config.yaml
sed -i.bak "s/YOUR_INSTANCE_ID/$INSTANCE_ID/g" grafana-agent-cloud-config.yaml
sed -i.bak "s/YOUR_API_KEY/$API_KEY/g" grafana-agent-cloud-config.yaml
sed -i.bak "s/XX-XXXXX/$REGION/g" grafana-agent-cloud-config.yaml

# Remove backup files
rm -f grafana-agent-cloud-config.yaml.bak

echo "✅ Configuration updated successfully!"
echo ""
echo "📊 Your Grafana Cloud endpoints:"
echo "   - Metrics: https://prometheus-prod-$REGION.grafana.net"
echo "   - Logs: https://logs-prod-$REGION.grafana.net"
echo "   - Traces: https://tempo-prod-$REGION.grafana.net"
echo ""
echo "🚀 To start your services with Grafana Cloud:"
echo "   docker-compose -f docker-compose.cloud.yml --profile cloud up -d"
echo ""
echo "🔍 To view logs:"
echo "   docker-compose -f docker-compose.cloud.yml --profile cloud logs -f"
echo ""
echo "🛑 To stop services:"
echo "   docker-compose -f docker-compose.cloud.yml --profile cloud down"
echo ""
echo "📝 Note: Your API key has been saved to .env file. Keep this file secure!" 