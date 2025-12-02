# GCP Deployment Guide for Nirmitee Backend

This guide will help you deploy the Nirmitee backend to Google Cloud Platform.

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK** (`gcloud` CLI) installed
3. **Docker** installed locally (for testing)
4. **MongoDB Atlas** account (or any MongoDB instance)

## Deployment Options

### Option 1: Cloud Run (Recommended - Serverless)

Cloud Run is ideal for this application as it:
- Auto-scales based on traffic (including to zero)
- Pay only for what you use
- Fully managed (no server maintenance)
- Automatic HTTPS

#### Step 1: Setup GCP Project

```bash
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project nirmitee-hub

# Enable required APIs
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  containerregistry.googleapis.com
```

#### Step 2: Build and Push Docker Image

```bash
# Navigate to backend directory
cd backend

# Build the Docker image
docker build -t gcr.io/nirmitee-hub/nirmitee-backend:latest .

# Test locally (optional)
docker run -p 8080:8080 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-jwt-secret" \
  -e FRONTEND_URL="your-frontend-url" \
  gcr.io/nirmitee-hub/nirmitee-backend:latest

# Configure Docker to use gcloud as credential helper
gcloud auth configure-docker

# Push to Google Container Registry
docker push gcr.io/nirmitee-hub/nirmitee-backend:latest
```

#### Step 3: Deploy to Cloud Run

```bash
# Deploy to Cloud Run
gcloud run deploy nirmitee-backend \
  --image gcr.io/nirmitee-hub/nirmitee-backend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --timeout 300 \
  --max-instances 10 \
  --min-instances 0
```

#### Step 4: Set Environment Variables

```bash
# Set environment variables (CRITICAL!)
gcloud run services update nirmitee-backend \
  --region us-central1 \
  --set-env-vars "NODE_ENV=production,\
PORT=8080,\
MONGODB_URI=your-mongodb-uri,\
JWT_SECRET=your-jwt-secret,\
JWT_EXPIRES_IN=7d,\
FRONTEND_URL=your-frontend-url,\
NEWSDATA_API_KEY=your-newsdata-api-key"
```

**Important:** For sensitive data like `JWT_SECRET`, use Secret Manager instead:

```bash
# Create a secret
echo -n "your-super-secret-jwt-key" | \
  gcloud secrets create jwt-secret --data-file=-

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding jwt-secret \
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor

# Update Cloud Run to use the secret
gcloud run services update nirmitee-backend \
  --region us-central1 \
  --update-secrets=JWT_SECRET=jwt-secret:latest
```

#### Step 5: Get Service URL

```bash
# Get the deployed service URL
gcloud run services describe nirmitee-backend \
  --region us-central1 \
  --format 'value(status.url)'
```

### Option 2: Automated Deployment with Cloud Build

Use the included `cloudbuild.yaml` for CI/CD:

```bash
# Submit build (from project root)
gcloud builds submit --config=backend/cloudbuild.yaml .

# Or connect to GitHub for automatic deployments
gcloud builds triggers create github \
  --repo-name=nirmitee-internal-project \
  --repo-owner=your-github-username \
  --branch-pattern="^main$" \
  --build-config=backend/cloudbuild.yaml
```

### Option 3: GKE (Kubernetes Engine)

For more control and complex deployments:

```bash
# Create a GKE cluster
gcloud container clusters create nirmitee-cluster \
  --num-nodes=2 \
  --machine-type=e2-medium \
  --region=us-central1

# Get credentials
gcloud container clusters get-credentials nirmitee-cluster \
  --region=us-central1

# Deploy using kubectl
kubectl create deployment nirmitee-backend \
  --image=gcr.io/nirmitee-backend/nirmitee-backend:latest

# Expose the service
kubectl expose deployment nirmitee-backend \
  --type=LoadBalancer \
  --port=80 \
  --target-port=8080
```

## Local Testing with Docker

Before deploying, test your Docker image locally:

```bash
# Build the image
docker build -t nirmitee-backend .

# Run with environment variables
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-jwt-secret" \
  -e FRONTEND_URL="http://localhost:5173" \
  nirmitee-backend

# Or use docker-compose
docker-compose up
```

Test the health endpoint:
```bash
curl http://localhost:8080/health
```

## MongoDB Setup

### Using MongoDB Atlas (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Whitelist IP: Add `0.0.0.0/0` (all IPs) for Cloud Run
4. Create a database user
5. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/nirmitee`

## Environment Variables Checklist

Make sure to set these environment variables in Cloud Run:

- ✅ `NODE_ENV=production`
- ✅ `PORT=8080` (Cloud Run default)
- ✅ `MONGODB_URI` - Your MongoDB connection string
- ✅ `JWT_SECRET` - Strong secret key for JWT tokens
- ✅ `JWT_EXPIRES_IN` - Token expiration (e.g., "7d")
- ✅ `FRONTEND_URL` - Your frontend URL for CORS
- ✅ `NEWSDATA_API_KEY` - NewsData API key (optional)

## Monitoring and Logs

```bash
# View logs
gcloud run services logs read nirmitee-backend \
  --region us-central1 \
  --limit 50

# Stream logs
gcloud run services logs tail nirmitee-backend \
  --region us-central1

# View metrics in Cloud Console
open https://console.cloud.google.com/run/detail/us-central1/nirmitee-backend/metrics
```

## Cost Optimization

1. **Set Min Instances to 0** - Scale to zero when not in use
2. **Use appropriate memory** - Start with 512Mi, adjust based on usage
3. **Set request timeout** - Prevent long-running requests
4. **Use caching** - Leverage the built-in node-cache
5. **Monitor usage** - Use Cloud Monitoring to track costs

## Troubleshooting

### Container fails to start
```bash
# Check logs
gcloud run services logs read nirmitee-backend --region us-central1

# Common issues:
# - Missing environment variables
# - MongoDB connection failure
# - Port mismatch (must be 8080 for Cloud Run)
```

### Database connection issues
- Ensure MongoDB Atlas whitelist includes `0.0.0.0/0`
- Verify connection string format
- Check database user permissions

### CORS errors
- Add your Cloud Run URL to `allowedOrigins` in server.js
- Set `FRONTEND_URL` environment variable correctly

## Security Best Practices

1. **Use Secret Manager** for sensitive data
2. **Enable Cloud Armor** for DDoS protection
3. **Set up VPC** for private networking (if using GKE)
4. **Regular updates** - Keep dependencies updated
5. **Implement rate limiting** - Already configured in the app
6. **Use IAM** properly - Principle of least privilege
7. **Enable audit logs** - Track all API calls

## Updating the Deployment

```bash
# Build new image
docker build -t gcr.io/nirmitee-hub/nirmitee-backend:v2 .

# Push to registry
docker push gcr.io/nirmitee-hub/nirmitee-backend:v2

# Update Cloud Run
gcloud run deploy nirmitee-backend \
  --image gcr.io/nirmitee-hub/nirmitee-backend:v2 \
  --region us-central1
```

## Custom Domain

```bash
# Map a custom domain
gcloud run domain-mappings create \
  --service nirmitee-backend \
  --domain api.yourdomain.com \
  --region us-central1

# Follow instructions to update DNS records
```

## Support

For issues or questions:
- Check logs: `gcloud run services logs read nirmitee-backend`
- Review [Cloud Run Documentation](https://cloud.google.com/run/docs)
- Contact your DevOps team

---

## Quick Deploy Command

```bash
# One-command deploy (after setting up GCP project)
gcloud run deploy nirmitee-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "MONGODB_URI=your-uri,JWT_SECRET=your-secret,FRONTEND_URL=your-frontend"
```

