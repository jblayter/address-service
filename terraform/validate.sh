#!/bin/bash

# Terraform Configuration Validation Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to validate Terraform configuration
validate_terraform() {
    print_status "Validating Terraform configuration..."
    
    if terraform validate; then
        print_success "Terraform configuration is valid"
    else
        print_error "Terraform configuration validation failed"
        exit 1
    fi
}

# Function to format Terraform files
format_terraform() {
    print_status "Formatting Terraform files..."
    
    if terraform fmt -recursive -check; then
        print_success "Terraform files are properly formatted"
    else
        print_warning "Terraform files need formatting. Running terraform fmt..."
        terraform fmt -recursive
        print_success "Terraform files have been formatted"
    fi
}

# Function to check for common issues
check_common_issues() {
    print_status "Checking for common configuration issues..."
    
    local issues_found=false
    
    # Check if backend is configured
    if ! grep -q "backend" main.tf; then
        print_warning "No backend configuration found. Consider adding S3 backend for team collaboration."
        issues_found=true
    fi
    
    # Check if variables have validation
    local vars_without_validation=$(grep -l "variable" variables.tf | xargs grep -L "validation" || true)
    if [ -n "$vars_without_validation" ]; then
        print_warning "Some variables may not have validation rules"
        issues_found=true
    fi
    
    # Check if environment files exist
    for env in dev staging prod; do
        if [ ! -f "environments/${env}.tfvars" ]; then
            print_warning "Environment file for ${env} not found: environments/${env}.tfvars"
            issues_found=true
        fi
    done
    
    if [ "$issues_found" = false ]; then
        print_success "No common issues found"
    fi
}

# Function to check AWS credentials
check_aws_credentials() {
    print_status "Checking AWS credentials..."
    
    if aws sts get-caller-identity &> /dev/null; then
        local account_id=$(aws sts get-caller-identity --query Account --output text)
        local user_arn=$(aws sts get-caller-identity --query Arn --output text)
        print_success "AWS credentials are valid"
        print_status "Account ID: $account_id"
        print_status "User ARN: $user_arn"
    else
        print_error "AWS credentials are not configured or invalid"
        print_status "Please run 'aws configure' to set up your credentials"
        exit 1
    fi
}

# Function to check Terraform version
check_terraform_version() {
    print_status "Checking Terraform version..."
    
    local tf_version=$(terraform version -json | jq -r '.terraform_version')
    local required_version="1.3.0"
    
    if [ "$(printf '%s\n' "$required_version" "$tf_version" | sort -V | head -n1)" = "$required_version" ]; then
        print_success "Terraform version $tf_version meets requirements (>= $required_version)"
    else
        print_error "Terraform version $tf_version is older than required version $required_version"
        exit 1
    fi
}

# Function to show configuration summary
show_configuration_summary() {
    print_status "Configuration Summary:"
    echo ""
    
    # Show available environments
    echo "Available environments:"
    for env_file in environments/*.tfvars; do
        if [ -f "$env_file" ]; then
            local env_name=$(basename "$env_file" .tfvars)
            echo "  - $env_name"
        fi
    done
    echo ""
    
    # Show key variables
    echo "Key configuration variables:"
    echo "  - AWS Region: $(grep -A1 'variable "aws_region"' variables.tf | grep default | sed 's/.*default.*= "\(.*\)"/\1/')"
    echo "  - Default Environment: $(grep -A1 'variable "environment"' variables.tf | grep default | sed 's/.*default.*= "\(.*\)"/\1/')"
    echo "  - Default Cluster Name: $(grep -A1 'variable "cluster_name"' variables.tf | grep default | sed 's/.*default.*= "\(.*\)"/\1/')"
    echo ""
    
    # Show resources that will be created
    echo "Resources that will be created:"
    echo "  - VPC with public and private subnets"
    echo "  - EKS cluster with managed node groups"
    echo "  - ECR repository with lifecycle policies"
    echo "  - CloudWatch log groups"
    echo "  - Security groups"
    echo "  - VPC flow logs (if enabled)"
    echo ""
}

# Main validation function
main() {
    echo "=========================================="
    echo "Terraform Configuration Validation"
    echo "=========================================="
    echo ""
    
    # Change to terraform directory
    cd "$(dirname "$0")"
    
    # Run all validation checks
    check_terraform_version
    check_aws_credentials
    validate_terraform
    format_terraform
    check_common_issues
    
    echo ""
    echo "=========================================="
    show_configuration_summary
    echo "=========================================="
    print_success "Validation completed successfully!"
    echo ""
    echo "Next steps:"
    echo "  1. Review the configuration summary above"
    echo "  2. Run './deploy.sh dev plan' to see what will be created"
    echo "  3. Run './deploy.sh dev apply' to deploy to development"
    echo ""
}

# Run main function
main "$@" 