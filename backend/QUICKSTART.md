# Quick Start Guide - Deploy to GCP

This is a simplified guide to deploy your Nirmitee backend to GCP Cloud Run.

## Project Information
- **Project ID**: `nirmitee-hub`
- **Region**: `us-central1` (recommended)

## Prerequisites

1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Install [Docker](https://docs.docker.com/get-docker/)
3. Have your MongoDB connection string ready (MongoDB Atlas recommended)

## Option 1: Automated Script (Easiest)

```bash
# Navigate to backend directory
cd backend

# Set your environment variables
export MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/nirmitee"
export JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
export FRONTEND_URL="https://your-frontend-url.com"
export NEWSDATA_API_KEY="your-newsdata-key"  # Optional

# Make script executable and run
chmod +x deploy-gcp.sh
./deploy-gcp.sh
```

## Option 2: Manual Step-by-Step

### 1. Login and Setup

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project nirmitee-hub

# Enable required services
gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
```

### 2. Build and Push Docker Image

```bash
cd backend

# Build the image
docker build -t gcr.io/nirmitee-hub/nirmitee-backend:latest .

# Configure Docker
gcloud auth configure-docker

# Push to Google Container Registry
docker push gcr.io/nirmitee-hub/nirmitee-backend:latest
```

### 3. Deploy to Cloud Run

```bash
gcloud run deploy nirmitee-backend \
  --image gcr.io/nirmitee-hub/nirmitee-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --set-env-vars "NODE_ENV=production,MONGODB_URI=your-mongodb-uri,JWT_SECRET=your-jwt-secret,FRONTEND_URL=your-frontend-url"
```

### 4. Get Your Service URL

```bash
gcloud run services describe nirmitee-backend \
  --region us-central1 \
  --format 'value(status.url)'
```

## Option 3: One-Command Deploy

The simplest way (after setting environment variables):

```bash
cd backend

gcloud run deploy nirmitee-backend \
  --source . \
  --region us-central1 \
  --project nirmitee-hub \
  --allow-unauthenticated \
  --set-env-vars "MONGODB_URI=${MONGODB_URI},JWT_SECRET=${JWT_SECRET},FRONTEND_URL=${FRONTEND_URL}"
```

## Testing Your Deployment

```bash
# Get your service URL
SERVICE_URL=$(gcloud run services describe nirmitee-backend --region us-central1 --format 'value(status.url)')

# Test health endpoint
curl ${SERVICE_URL}/health

# Should return:
# {"status":"OK","message":"Nirmitee Internal Communications Hub API","timestamp":"..."}
```

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/nirmitee` |
| `JWT_SECRET` | Secret key for JWT (min 32 chars) | `your-super-secret-key-change-this` |
| `FRONTEND_URL` | Your frontend URL for CORS | `https://your-frontend.com` |
| `NEWSDATA_API_KEY` | NewsData API key (optional) | `pub_xxxxxxxxxxxxx` |

## MongoDB Setup (MongoDB Atlas)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user
4. **Important**: Go to Network Access → Add IP Address → Select "Allow Access from Anywhere" (0.0.0.0/0)
   - This is required for Cloud Run to connect
5. Get your connection string from "Connect" → "Connect your application"

## Viewing Logs

```bash
# View recent logs
gcloud run services logs read nirmitee-backend --region us-central1 --limit 50

# Stream logs in real-time
gcloud run services logs tail nirmitee-backend --region us-central1
```

## Updating Your Deployment

After making code changes:

```bash
# Build new version
docker build -t gcr.io/nirmitee-hub/nirmitee-backend:latest .

# Push to registry
docker push gcr.io/nirmitee-hub/nirmitee-backend:latest

# Deploy update
gcloud run deploy nirmitee-backend \
  --image gcr.io/nirmitee-hub/nirmitee-backend:latest \
  --region us-central1
```

## Common Issues

### Issue: Container fails to start
**Solution**: Check logs with `gcloud run services logs read nirmitee-backend --region us-central1`

### Issue: MongoDB connection timeout
**Solution**: 
- Verify MongoDB Atlas whitelist includes `0.0.0.0/0`
- Check connection string format
- Ensure database user has correct permissions

### Issue: CORS errors from frontend
**Solution**: 
- Update `FRONTEND_URL` environment variable
- Add your frontend URL to `allowedOrigins` in `backend/server.js`

## Next Steps

1. Set up a custom domain (optional)
2. Configure Cloud Scheduler for cron jobs
3. Set up monitoring and alerts
4. Implement CI/CD with Cloud Build

For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md)

## Cost Estimate

Cloud Run pricing (as of 2024):
- **Free tier**: 2 million requests/month
- **With your app**: Likely $0-10/month with moderate usage
- **Scales to zero**: No charges when not in use

## Support

- View detailed deployment guide: `DEPLOYMENT.md`
- Cloud Run docs: https://cloud.google.com/run/docs
- Project issues: Contact your team

