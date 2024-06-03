#!/bin/bash

# Function to build and run a service
build_and_run() {
  local service_name=$1
  local dockerfile=$2
  local container_name=$3
  local port=$4

  echo "Building ${service_name}..."
  docker build -t ${service_name} -f ${dockerfile} .

  echo "Running ${service_name}..."
  docker run --rm -d --network stock-alert-network --name ${container_name} -p ${port}:${port} ${service_name}
}

# Create a Docker network
docker network create stock-alert-network

# Build and run alert-processing-service
build_and_run "alert-processing-service" "services/alert-processing-service/Dockerfile" "alert-processing-service" 50052

# Build and run notification-service
build_and_run "notification-service" "services/notification-service/Dockerfile" "notification-service" 50053

# Build and run stock-data-service
build_and_run "stock-data-service" "services/stock-data-service/Dockerfile" "stock-data-service" 50051

echo "All services are up and running."
