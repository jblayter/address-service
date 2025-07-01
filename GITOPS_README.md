# GitOps Deployment with ArgoCD and Helm

This project uses GitOps principles with ArgoCD and Helm for automated, declarative deployments to Kubernetes.

## Architecture Overview

```
GitHub Repository
       ↓
   ArgoCD Server
       ↓
   EKS Cluster
       ↓
   Application Pods
```

## Components

### 1. **Helm Chart** (`charts/address-service/`)
- **Chart.yaml**: Chart metadata and version
- **values.yaml**: Default configuration values
- **values-dev.yaml**: Development environment overrides
- **values-prod.yaml**: Production environment overrides
- **templates/**: Kubernetes manifest templates

### 2. **ArgoCD Applications** (`k8s/`)
- **argocd-app.yaml**: Default application (uses `values.yaml`)
- **argocd-app-dev.yaml**: Development environment
- **argocd-app-prod.yaml**: Production environment

### 3. **CI/CD Pipeline** (`.github/workflows/deploy.yml`)
- Builds and pushes Docker images
- Updates Helm chart versions
- ArgoCD automatically syncs changes

## Quick Start

### 1. **Deploy ArgoCD Applications**

```bash
# Deploy to development environment
kubectl apply -f k8s/argocd-app-dev.yaml

# Deploy to production environment
kubectl apply -f k8s/argocd-app-prod.yaml
```

### 2. **Access ArgoCD UI**

```bash
# Port forward ArgoCD server
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open in browser
open https://localhost:8080

# Get admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

### 3. **Monitor Deployments**

- **ArgoCD UI**: Visual deployment status and logs
- **CLI**: `argocd app list` and `argocd app get <app-name>`
- **Kubernetes**: `kubectl get pods -n address-service-<env>`

## Deployment Flow

### **Automatic Deployment (GitOps)**
1. **Push to main branch** → GitHub Actions triggers
2. **Build & Push** → Docker image with new version
3. **Update Helm Chart** → Chart version and appVersion updated
4. **ArgoCD Sync** → Detects Git changes automatically
5. **Deploy** → New version deployed to EKS

### **Manual Deployment**
```bash
# Force sync an application
argocd app sync address-service-dev

# Check sync status
argocd app get address-service-dev
```

## Environment Management

### **Development Environment**
- **Namespace**: `address-service-dev`
- **Replicas**: 1
- **Resources**: Minimal (100m CPU, 128Mi memory)
- **Image Tag**: `latest`

### **Production Environment**
- **Namespace**: `address-service-prod`
- **Replicas**: 2
- **Resources**: Standard (250m CPU, 256Mi memory)
- **HPA**: Enabled (2-10 replicas)
- **PDB**: Enabled (min 1 available)

## Configuration

### **Update Application Configuration**
1. **Modify values files** in `charts/address-service/`
2. **Commit and push** to Git
3. **ArgoCD automatically syncs** the changes

### **Update Image Tag**
```yaml
# In values.yaml or environment-specific values
image:
  repository: docker.io/jblayter/address-service
  tag: "v1.2.3"  # Specific version
```

### **Scale Application**
```yaml
# In values.yaml or environment-specific values
replicaCount: 3
```

## Monitoring and Troubleshooting

### **ArgoCD CLI Commands**
```bash
# List all applications
argocd app list

# Get application details
argocd app get address-service-dev

# View application logs
argocd app logs address-service-dev

# Sync application
argocd app sync address-service-dev

# Rollback to previous version
argocd app rollback address-service-dev
```

### **Kubernetes Commands**
```bash
# Check pods
kubectl get pods -n address-service-dev

# View logs
kubectl logs -f deployment/address-service -n address-service-dev

# Check service
kubectl get svc -n address-service-dev

# Check events
kubectl get events -n address-service-dev --sort-by='.lastTimestamp'
```

## Best Practices

### **1. GitOps Principles**
- **Declarative**: All configuration in Git
- **Versioned**: Every change is tracked
- **Automated**: ArgoCD handles deployment
- **Observable**: Full audit trail

### **2. Environment Separation**
- **Different namespaces** for each environment
- **Environment-specific values** files
- **Separate ArgoCD applications** for each environment

### **3. Security**
- **Service accounts** with minimal permissions
- **Security contexts** for pods and containers
- **Resource limits** to prevent resource exhaustion

### **4. Reliability**
- **Health checks** (liveness and readiness probes)
- **Pod disruption budgets** for high availability
- **Horizontal pod autoscaling** for production

## Troubleshooting

### **Common Issues**

1. **Application Out of Sync**
   ```bash
   argocd app sync <app-name>
   ```

2. **Image Pull Errors**
   - Check image repository and tag
   - Verify Docker Hub credentials

3. **Resource Constraints**
   - Check node resources
   - Adjust resource requests/limits

4. **Health Check Failures**
   - Verify application health endpoint
   - Check application logs

### **Useful Commands**
```bash
# Check ArgoCD server status
kubectl get pods -n argocd

# View ArgoCD logs
kubectl logs -f deployment/argocd-server -n argocd

# Check application sync status
argocd app get <app-name> -o yaml
```

## Next Steps

1. **Set up monitoring** (Prometheus, Grafana)
2. **Configure ingress** for external access
3. **Add secrets management** (Sealed Secrets, External Secrets)
4. **Implement blue-green deployments**
5. **Set up alerting** for deployment failures 