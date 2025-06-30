# Address Service Deployment Guide

This document describes the complete deployment process for the Address Service application using GitHub Actions, Terraform, and AWS EKS.

## Architecture Overview

The deployment consists of three main components:
1. **GitHub Actions Workflow** - CI/CD pipeline
2. **Terraform Infrastructure** - AWS resources (VPC, EKS, ECR)
3. **Kubernetes Deployment** - Application deployment on EKS

## Prerequisites

### AWS Setup
1. AWS CLI configured with appropriate credentials
2. AWS account with permissions for:
   - EKS cluster creation
   - ECR repository management
   - VPC and networking
   - IAM roles and policies

### GitHub Secrets
Configure the following secrets in your GitHub repository:
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `DOCKERHUB_USERNAME` - Docker Hub username
- `DOCKERHUB_TOKEN` - Docker Hub access token
- `ACTIONS_PAT` - GitHub Personal Access Token with repo permissions

## Deployment Process

### 1. GitHub Actions Workflow

The workflow (`.github/workflows/deploy.yml`) performs the following steps:

1. **Test** - Runs unit tests and linting
2. **Version Bump** - Increments version and creates git tag
3. **Build and Push** - Builds Docker image and pushes to Docker Hub
4. **Create Release** - Creates GitHub release with release notes
5. **Terraform Deploy** - Deploys infrastructure and application

#### Manual Deployment
You can trigger manual deployments with:
- Version bump type (patch, minor, major)
- Target environment (dev, staging, prod)

### 2. Terraform Infrastructure

The Terraform configuration (`terraform/`) creates:

#### Core Infrastructure
- **VPC** with public/private subnets across 2 AZs
- **EKS Cluster** with managed node groups
- **ECR Repository** for container images
- **CloudWatch Log Groups** for application logging

#### Security Features
- VPC Flow Logs for network monitoring
- IAM Roles for Service Accounts (IRSA)
- Security groups with least-privilege access
- ECR lifecycle policies for image cleanup

#### Environment-Specific Configuration
- `terraform/environments/dev.tfvars` - Development environment
- `terraform/environments/staging.tfvars` - Staging environment  
- `terraform/environments/prod.tfvars` - Production environment

### 3. Kubernetes Deployment

The application is deployed to EKS with:

#### Resources Created
- **Namespace** - `address-service`
- **ConfigMap** - Application configuration
- **Deployment** - Application pods with health checks
- **Service** - LoadBalancer for external access
- **HPA** - Horizontal Pod Autoscaler

#### Features
- Health checks (liveness and readiness probes)
- Resource limits and requests
- Environment variable configuration
- Auto-scaling based on CPU and memory usage

## Environment Configuration

### Development
- Single node group with t3.small instances
- Public cluster access enabled
- Minimal resource allocation
- 7-day log retention

### Staging
- 2-3 node group with t3.medium instances
- Public cluster access enabled
- Moderate resource allocation
- 14-day log retention

### Production
- 2-5 node group with t3.large/xlarge instances
- Private cluster access (more secure)
- Higher resource allocation
- 30-day log retention

## Deployment Commands

### Local Terraform Deployment
```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform
terraform init

# Plan deployment
terraform plan -var-file="environments/prod.tfvars"

# Apply deployment
terraform apply -var-file="environments/prod.tfvars"
```

### Manual Kubernetes Deployment
```bash
# Update kubeconfig
aws eks update-kubeconfig --region us-west-2 --name address-service-prod-cluster

# Deploy application
kubectl apply -f k8s/deployment.yaml

# Check deployment status
kubectl rollout status deployment/address-service -n address-service
```

## Monitoring and Troubleshooting

### Useful Commands
```bash
# Check cluster status
kubectl get nodes
kubectl get pods -n address-service

# View logs
kubectl logs -f deployment/address-service -n address-service

# Check service endpoints
kubectl get svc -n address-service

# Monitor resource usage
kubectl top pods -n address-service
```

### CloudWatch Logs
- Application logs: `/aws/eks/address-service-prod-cluster/address-service`
- VPC Flow Logs: `/aws/vpc/flowlogs`

### ECR Repository
- Repository: `address-service`
- Lifecycle policy: Keeps last 30 images (configurable per environment)

## Security Considerations

1. **Network Security**
   - Private subnets for EKS nodes
   - Security groups with minimal required access
   - VPC Flow Logs for network monitoring

2. **Access Control**
   - IAM roles for service accounts
   - Least-privilege permissions
   - Private cluster access in production

3. **Container Security**
   - ECR image scanning enabled
   - Resource limits to prevent resource exhaustion
   - Health checks for application monitoring

## Cost Optimization

1. **Instance Types**
   - Development: t3.small (cost-effective)
   - Staging: t3.medium (balanced)
   - Production: t3.large/xlarge (performance)

2. **Auto-scaling**
   - HPA based on CPU and memory usage
   - Node group auto-scaling
   - ECR lifecycle policies for image cleanup

3. **Log Retention**
   - Environment-specific retention periods
   - CloudWatch log groups with appropriate retention

## Troubleshooting

### Common Issues

1. **Terraform Plan Fails**
   - Check AWS credentials and permissions
   - Verify variable file syntax
   - Ensure Terraform version compatibility

2. **EKS Deployment Fails**
   - Check node group capacity
   - Verify image exists in registry
   - Check pod events: `kubectl describe pod <pod-name> -n address-service`

3. **Service Not Accessible**
   - Verify LoadBalancer provisioning
   - Check security group rules
   - Confirm health checks are passing

### Support
For deployment issues, check:
1. GitHub Actions workflow logs
2. Terraform plan/apply output
3. Kubernetes pod events and logs
4. CloudWatch logs for application errors 