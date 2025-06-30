# EKS Cluster Outputs
output "cluster_endpoint" {
  description = "Endpoint for EKS control plane"
  value       = module.eks.cluster_endpoint
}

output "cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "cluster_iam_role_name" {
  description = "IAM role name associated with EKS cluster"
  value       = module.eks.cluster_iam_role_name
}

output "cluster_iam_role_arn" {
  description = "IAM role ARN associated with EKS cluster"
  value       = module.eks.cluster_iam_role_arn
}

output "cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
}

output "cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster for the OpenID Connect identity provider"
  value       = module.eks.cluster_oidc_issuer_url
}

output "oidc_provider_arn" {
  description = "The ARN of the OIDC Provider if `enable_irsa = true`"
  value       = module.eks.oidc_provider_arn
}

output "cluster_name" {
  description = "The name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "cluster_version" {
  description = "The Kubernetes version for the cluster"
  value       = module.eks.cluster_version
}

# VPC Outputs
output "vpc_id" {
  description = "The ID of the VPC"
  value       = module.vpc.vpc_id
}

output "vpc_cidr_block" {
  description = "The CIDR block of the VPC"
  value       = module.vpc.vpc_cidr_block
}

output "private_subnets" {
  description = "List of IDs of private subnets"
  value       = module.vpc.private_subnets
}

output "public_subnets" {
  description = "List of IDs of public subnets"
  value       = module.vpc.public_subnets
}

# ECR Outputs
output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.address_service.repository_url
}

output "ecr_repository_arn" {
  description = "The ARN of the ECR repository"
  value       = aws_ecr_repository.address_service.arn
}

output "ecr_repository_name" {
  description = "The name of the ECR repository"
  value       = aws_ecr_repository.address_service.name
}

# Security Group Outputs
output "eks_cluster_security_group_id" {
  description = "Security group ID for the EKS cluster"
  value       = aws_security_group.eks_cluster.id
}

output "eks_cluster_security_group_arn" {
  description = "Security group ARN for the EKS cluster"
  value       = aws_security_group.eks_cluster.arn
}

# CloudWatch Outputs
output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for application logs"
  value       = aws_cloudwatch_log_group.address_service.name
}

output "cloudwatch_log_group_arn" {
  description = "ARN of the CloudWatch log group for application logs"
  value       = aws_cloudwatch_log_group.address_service.arn
}

# AWS Context Outputs
output "aws_account_id" {
  description = "The AWS Account ID number of the account that owns or contains the calling entity"
  value       = data.aws_caller_identity.current.account_id
}

output "aws_caller_arn" {
  description = "The ARN of the calling entity"
  value       = data.aws_caller_identity.current.arn
}

output "aws_caller_user_id" {
  description = "The unique identifier of the calling entity"
  value       = data.aws_caller_identity.current.user_id
}

output "aws_region" {
  description = "The AWS region"
  value       = data.aws_region.current.id
}

# Configuration Summary
output "configuration_summary" {
  description = "Summary of the deployed configuration"
  value = {
    environment  = var.environment
    cluster_name = var.cluster_name
    aws_region   = var.aws_region
    vpc_cidr     = var.vpc_cidr
    node_group_config = {
      min_size       = var.node_group_min_size
      max_size       = var.node_group_max_size
      desired_size   = var.node_group_desired_size
      instance_types = var.node_group_instance_types
    }
    features_enabled = {
      vpc_flow_logs = var.enable_vpc_flow_logs
      irsa          = var.enable_irsa
      public_access = var.enable_cluster_public_access
    }
  }
} 