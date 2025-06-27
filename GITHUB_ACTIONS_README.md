# GitHub Actions Setup

This repository includes automated CI/CD pipelines using GitHub Actions for testing, building, versioning, and deploying the address service.

## Workflows

### 1. CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**
- Pull requests to `main` branch
- Pushes to any branch except `main`

**Jobs:**
- **Test**: Runs unit tests and linting
- **Build**: Builds Docker image (without pushing)
- **Security Scan**: Runs Trivy vulnerability scanner

### 2. Deploy Workflow (`.github/workflows/deploy.yml`)

**Triggers:**
- Pushes to `main` branch
- Manual workflow dispatch (with version bump options)

**Jobs:**
- **Test**: Runs unit tests and linting
- **Bump Version**: Automatically increments version and creates git tag
- **Build and Push**: Builds and pushes Docker image to Docker Hub
- **Create Release**: Creates GitHub release with release notes
- **Deploy to Digital Ocean**: Deploys to Digital Ocean App Platform

## Environment Setup

### 1. Create Production Environment

1. Go to your GitHub repository → **Settings** → **Environments**
2. Click **New environment**
3. Name it `production`
4. Add protection rules (optional):
   - **Required reviewers**: Add yourself or team members
   - **Wait timer**: Add a delay before deployment
   - **Deployment branches**: Restrict to `main` branch only

### 2. Add Secrets to Production Environment

Add these secrets to the `production` environment (not repository secrets):

#### Docker Hub
```
DOCKERHUB_USERNAME=your-dockerhub-username
DOCKERHUB_TOKEN=your-dockerhub-access-token
```

#### Digital Ocean App Platform
```
DIGITALOCEAN_ACCESS_TOKEN=your-digitalocean-api-token
DIGITALOCEAN_APP_ID=your-app-id
```

## Setup Instructions

### 1. Docker Hub Setup

1. Create a Docker Hub account if you don't have one
2. Create an access token:
   - Go to Docker Hub → Account Settings → Security
   - Click "New Access Token"
   - Give it a name (e.g., "GitHub Actions")
   - Copy the token

3. Add secrets to your GitHub production environment:
   - Go to your repository → Settings → Environments → production
   - Add `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN`

### 2. Digital Ocean App Platform Setup (Recommended)

1. Create a Digital Ocean account
2. Create an API token:
   - Go to API → Tokens/Keys
   - Click "Generate New Token"
   - Give it a name and select "Write" scope
   - Copy the token

3. Create an App Platform app:
   - Go to Apps → Create App
   - Connect your GitHub repository
   - Configure the app settings
   - Note the app ID

4. Add secrets to GitHub production environment:
   - `DIGITALOCEAN_ACCESS_TOKEN`
   - `DIGITALOCEAN_APP_ID`

## Usage

### Automatic Deployment

1. Push to `main` branch
2. Workflow automatically:
   - Runs tests
   - Bumps patch version
   - Builds and pushes Docker image
   - Creates GitHub release
   - Deploys to Digital Ocean App Platform

### Manual Deployment

1. Go to Actions → Deploy to Production
2. Click "Run workflow"
3. Choose version bump type:
   - **patch**: 1.0.0 → 1.0.1 (bug fixes)
   - **minor**: 1.0.0 → 1.1.0 (new features)
   - **major**: 1.0.0 → 2.0.0 (breaking changes)

### Version Management

The workflow automatically:
- Increments version in `package.json`
- Creates git tag (e.g., `v1.0.1`)
- Pushes changes to main branch
- Creates GitHub release with release notes

### Docker Image Tags

Images are tagged with:
- `latest` (main branch only)
- `v1.0.1` (version tag)
- `1.0.1` (major.minor.patch)
- `1.0` (major.minor)
- `1` (major)

## Troubleshooting

### Common Issues

1. **Docker Hub authentication failed**
   - Check `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets in production environment
   - Ensure the token has write permissions

2. **Digital Ocean deployment failed**
   - Verify API token has correct permissions
   - Check app ID exists in App Platform

3. **Version bump failed**
   - Ensure repository has write permissions
   - Check if there are uncommitted changes

4. **Build failed**
   - Check Dockerfile syntax
   - Verify all dependencies are in package.json

5. **Environment protection rules blocking deployment**
   - Check if required reviewers are set
   - Verify deployment branch restrictions
   - Check wait timer settings

### Debugging

1. Check workflow logs in GitHub Actions
2. Verify all required secrets are set in the production environment
3. Test Docker build locally: `docker build -t address-service .`
4. Test deployment manually if needed

## Security

- All secrets are encrypted and never logged
- Production environment provides additional security layer
- Docker images are scanned for vulnerabilities
- Non-root user in Docker container
- SSH keys are rotated regularly
- API tokens have minimal required permissions

## Monitoring

- GitHub Actions provides build and deployment status
- Docker Hub shows image push history
- Digital Ocean provides deployment logs
- Application health checks are included in Docker image 