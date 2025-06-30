#!/bin/bash

# Address Service Terraform Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh dev plan
# Example: ./deploy.sh prod apply

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  dev       - Development environment"
    echo "  staging   - Staging environment"
    echo "  prod      - Production environment"
    echo ""
    echo "Actions:"
    echo "  init      - Initialize Terraform"
    echo "  plan      - Show execution plan"
    echo "  apply     - Apply changes"
    echo "  destroy   - Destroy infrastructure"
    echo "  validate  - Validate configuration"
    echo "  fmt       - Format Terraform files"
    echo "  output    - Show outputs"
    echo ""
    echo "Examples:"
    echo "  $0 dev plan"
    echo "  $0 staging apply"
    echo "  $0 prod destroy"
}

# Function to validate environment
validate_environment() {
    local env=$1
    case $env in
        dev|staging|prod)
            return 0
            ;;
        *)
            print_error "Invalid environment: $env"
            return 1
            ;;
    esac
}

# Function to validate action
validate_action() {
    local action=$1
    case $action in
        init|plan|apply|destroy|validate|fmt|output)
            return 0
            ;;
        *)
            print_error "Invalid action: $action"
            return 1
            ;;
    esac
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if Terraform is installed
    if ! command -v terraform &> /dev/null; then
        print_error "Terraform is not installed. Please install Terraform >= 1.3.0"
        exit 1
    fi
    
    # Check Terraform version
    local tf_version=$(terraform version -json | jq -r '.terraform_version')
    local required_version="1.3.0"
    
    if [ "$(printf '%s\n' "$required_version" "$tf_version" | sort -V | head -n1)" != "$required_version" ]; then
        print_error "Terraform version $tf_version is older than required version $required_version"
        exit 1
    fi
    
    # Check if AWS CLI is configured
    if ! aws sts get-caller-identity &> /dev/null; then
        print_error "AWS CLI is not configured. Please run 'aws configure'"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to confirm production deployment
confirm_production() {
    if [ "$1" = "prod" ] && [ "$2" = "apply" ]; then
        echo ""
        print_warning "You are about to deploy to PRODUCTION environment!"
        echo ""
        read -p "Are you sure you want to continue? (yes/no): " -r
        echo
        if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
            print_status "Deployment cancelled"
            exit 0
        fi
        
        echo ""
        read -p "Please type 'PRODUCTION' to confirm: " -r
        echo
        if [[ ! $REPLY =~ ^PRODUCTION$ ]]; then
            print_error "Confirmation failed. Deployment cancelled"
            exit 1
        fi
    fi
}

# Function to run Terraform command
run_terraform() {
    local env=$1
    local action=$2
    local var_file="environments/${env}.tfvars"
    
    print_status "Running Terraform $action for $env environment..."
    
    case $action in
        init)
            terraform init
            ;;
        plan)
            terraform plan -var-file="$var_file" -out="${env}.tfplan"
            ;;
        apply)
            if [ -f "${env}.tfplan" ]; then
                terraform apply "${env}.tfplan"
                rm -f "${env}.tfplan"
            else
                terraform apply -var-file="$var_file"
            fi
            ;;
        destroy)
            terraform destroy -var-file="$var_file"
            ;;
        validate)
            terraform validate
            ;;
        fmt)
            terraform fmt -recursive
            ;;
        output)
            terraform output
            ;;
    esac
    
    print_success "Terraform $action completed successfully"
}

# Main script logic
main() {
    # Check if correct number of arguments provided
    if [ $# -ne 2 ]; then
        print_error "Invalid number of arguments"
        show_usage
        exit 1
    fi
    
    local environment=$1
    local action=$2
    
    # Validate arguments
    if ! validate_environment "$environment"; then
        show_usage
        exit 1
    fi
    
    if ! validate_action "$action"; then
        show_usage
        exit 1
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Confirm production deployment
    confirm_production "$environment" "$action"
    
    # Change to terraform directory
    cd "$(dirname "$0")"
    
    # Run Terraform command
    run_terraform "$environment" "$action"
    
    print_success "Deployment script completed successfully"
}

# Run main function with all arguments
main "$@" 