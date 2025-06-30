# Address Service Infrastructure

This directory contains the Terraform configuration for the Address Service infrastructure on AWS.

## Architecture Overview

The infrastructure includes:
- **VPC** with public and private subnets across 2 availability zones
- **EKS Cluster** with managed node groups
- **ECR Repository** for container images
- **CloudWatch Log Groups** for application logging
- **Security Groups** for network security
- **VPC Flow Logs** for network monitoring

## Prerequisites

- Terraform >= 1.3.0
- AWS CLI configured with appropriate credentials
- kubectl (for EKS cluster management)

## Quick Start

### 1. Initialize Terraform
```bash
cd terraform
terraform init
```

### 2. Plan the deployment
```bash
# For development environment
terraform plan -var-file="environments/dev.tfvars"

# For staging environment
terraform plan -var-file="environments/staging.tfvars"

# For production environment
terraform plan -var-file="environments/prod.tfvars"
```

### 3. Apply the configuration
```bash
# For development environment
terraform apply -var-file="environments/dev.tfvars"

# For staging environment
terraform apply -var-file="environments/staging.tfvars"

# For production environment
terraform apply -var-file="environments/prod.tfvars"
```

## Configuration

### Variables

All configurable variables are defined in `variables.tf` with validation rules and sensible defaults.

Key variables:
- `environment`: Environment name (dev, staging, prod)
- `cluster_name`: EKS cluster name
- `vpc_cidr`: VPC CIDR block
- `node_group_*`: EKS node group configuration
- `enable_*`: Feature flags for various services

### Environment-Specific Configurations

Environment-specific configurations are stored in the `environments/` directory:
- `dev.tfvars`: Development environment settings
- `staging.tfvars`: Staging environment settings  
- `prod.tfvars`: Production environment settings

### State Management

For team collaboration, configure the S3 backend in `main.tf`:

```hcl
terraform {
  backend "s3" {
    bucket = "your-terraform-state-bucket"
    key    = "terraform.tfstate"
    region = "us-west-2"
    encrypt = true
  }
}
```

## Security Features

- **VPC Flow Logs**: Network traffic monitoring
- **ECR Image Scanning**: Automatic vulnerability scanning
- **ECR Lifecycle Policies**: Automatic cleanup of old images
- **IAM Roles for Service Accounts (IRSA)**: Fine-grained permissions
- **Security Groups**: Network-level security controls
- **Encryption**: ECR repository encryption at rest

## Monitoring and Logging

- **CloudWatch Logs**: Application and cluster logs
- **VPC Flow Logs**: Network traffic analysis
- **EKS Control Plane Logs**: API server, audit, and scheduler logs

## Best Practices Implemented

1. **Modular Design**: Using official Terraform modules
2. **Variable Validation**: Input validation for all variables
3. **Environment Separation**: Different configurations per environment
4. **Security by Default**: Secure configurations enabled by default
5. **Comprehensive Tagging**: Consistent resource tagging
6. **State Management**: S3 backend for team collaboration
7. **Documentation**: Comprehensive README and inline comments

## Outputs

The configuration provides comprehensive outputs including:
- EKS cluster endpoints and credentials
- VPC and subnet information
- ECR repository details
- Security group IDs
- CloudWatch log group information

## Maintenance

### Updating EKS Version
1. Update `cluster_version` in the appropriate `.tfvars` file
2. Run `terraform plan` to review changes
3. Apply the update during maintenance window

### Scaling Node Groups
1. Update node group variables in the appropriate `.tfvars` file
2. Run `terraform plan` to review changes
3. Apply the configuration

### Adding New Environments
1. Create a new `.tfvars` file in the `environments/` directory
2. Configure environment-specific values
3. Use the new file with `terraform plan` and `terraform apply`

## Troubleshooting

### Common Issues

1. **Provider Version Conflicts**: Ensure all team members use the same Terraform and provider versions
2. **State Lock Issues**: Check for existing state locks in S3
3. **Permission Errors**: Verify AWS credentials and IAM permissions
4. **VPC CIDR Conflicts**: Ensure VPC CIDR blocks don't overlap between environments

### Useful Commands

```bash
# Check Terraform version
terraform version

# Validate configuration
terraform validate

# Format code
terraform fmt

# Show current state
terraform show

# List resources
terraform state list

# Import existing resources
terraform import <resource> <id>
```

## Contributing

1. Follow the existing code structure and naming conventions
2. Add validation rules for new variables
3. Update documentation for new features
4. Test changes in development environment first
5. Use meaningful commit messages

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review AWS documentation for specific services
3. Contact the DevOps team 