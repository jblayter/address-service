#!/bin/bash

# Local deployment script for testing
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="address-service"
CONTAINER_NAME="address-service-local"
PORT=3000

echo -e "${YELLOW}🚀 Starting local deployment...${NC}"

# Build the Docker image
echo -e "${YELLOW}📦 Building Docker image...${NC}"
docker build -t $IMAGE_NAME .

# Stop and remove existing container if it exists
echo -e "${YELLOW}🛑 Stopping existing container...${NC}"
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Run the new container
echo -e "${YELLOW}▶️  Starting new container...${NC}"
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:3000 \
  -e NODE_ENV=development \
  $IMAGE_NAME

# Wait for the application to start
echo -e "${YELLOW}⏳ Waiting for application to start...${NC}"
sleep 5

# Check if the application is running
if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Application is running successfully!${NC}"
  echo -e "${GREEN}🌐 Health check: http://localhost:$PORT/health${NC}"
  echo -e "${GREEN}📊 Application logs:${NC}"
  docker logs $CONTAINER_NAME
else
  echo -e "${RED}❌ Application failed to start${NC}"
  echo -e "${RED}📋 Container logs:${NC}"
  docker logs $CONTAINER_NAME
  exit 1
fi

echo -e "${GREEN}🎉 Local deployment completed!${NC}"
echo -e "${YELLOW}To stop the container: docker stop $CONTAINER_NAME${NC}"
echo -e "${YELLOW}To view logs: docker logs -f $CONTAINER_NAME${NC}" 