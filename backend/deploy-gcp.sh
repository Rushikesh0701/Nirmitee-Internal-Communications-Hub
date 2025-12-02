#!/bin/bash
# Quick deployment script for Nirmitee Backend to GCP
# Project: nirmitee-hub

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Nirmitee Backend GCP Deployment ===${NC}"
echo "Project ID: nirmitee-hub"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Set project
echo -e "${BLUE}Step 1: Setting GCP project...${NC}"
gcloud config set project nirmitee-hub

# Enable required services
echo -e "${BLUE}Step 2: Enabling required GCP services...${NC}"
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com

# Build Docker image
echo -e "${BLUE}Step 3: Building Docker image...${NC}"
docker build -t gcr.io/nirmitee-hub/nirmitee-backend:latest .

# Configure Docker for GCR
echo -e "${BLUE}Step 4: Configuring Docker authentication...${NC}"
gcloud auth configure-docker

# Push to Container Registry
echo -e "${BLUE}Step 5: Pushing image to Google Container Registry...${NC}"
docker push gcr.io/nirmitee-hub/nirmitee-backend:latest

# Check if environment variables are set
echo -e "${BLUE}Step 6: Checking environment variables...${NC}"
if [ -z "$MONGODB_URI" ] || [ -z "$JWT_SECRET" ]; then
    echo -e "${RED}Warning: Required environment variables not set${NC}"
    echo "Please set the following before deploying:"
    echo "  export MONGODB_URI='your-mongodb-connection-string'"
    echo "  export JWT_SECRET='your-jwt-secret'"
    echo "  export FRONTEND_URL='your-frontend-url'"
    echo ""
    read -p "Do you want to continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Deploy to Cloud Run
echo -e "${BLUE}Step 7: Deploying to Cloud Run...${NC}"
gcloud run deploy nirmitee-backend \
  --image gcr.io/nirmitee-hub/nirmitee-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0 \
  --set-env-vars "NODE_ENV=production,PORT=8080,MONGODB_URI=${MONGODB_URI},JWT_SECRET=${JWT_SECRET},JWT_EXPIRES_IN=7d,FRONTEND_URL=${FRONTEND_URL},NEWSDATA_API_KEY=${NEWSDATA_API_KEY}"

# Get service URL
echo -e "${GREEN}=== Deployment Complete! ===${NC}"
SERVICE_URL=$(gcloud run services describe nirmitee-backend --region us-central1 --format 'value(status.url)')
echo -e "Service URL: ${GREEN}${SERVICE_URL}${NC}"
echo ""
echo "Test your deployment:"
echo "  curl ${SERVICE_URL}/health"
echo ""
echo "View logs:"
echo "  gcloud run services logs read nirmitee-backend --region us-central1"

