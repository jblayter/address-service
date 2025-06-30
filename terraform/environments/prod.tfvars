# Production Environment Configuration
environment = "prod"
cluster_name = "address-service-prod-cluster"
aws_region = "us-west-2"
vpc_name = "address-service-vpc"
vpc_cidr = "10.0.0.0/16"

# Node group configuration for production
node_group_min_size = 1
node_group_max_size = 1
node_group_desired_size = 1
node_group_instance_types = ["t3.small"]

# Features - production ready
enable_vpc_flow_logs = true
enable_cluster_public_access = false  # More secure for production
enable_irsa = true

# Retention settings - longer for production
ecr_image_retention_count = 30
cloudwatch_log_retention_days = 30

# Additional tags
tags = {
  Environment = "prod"
  Project     = "address-service"
  Owner       = "devops"
  CostCenter  = "engineering"
  Criticality = "high"
  Compliance  = "pci-dss"
}

variable "use_existing_vpc" {
  type    = bool
  default = false
}

data "aws_vpc" "existing" {
  count = var.use_existing_vpc ? 1 : 0
  filter {
    name   = "tag:Name"
    values = [var.vpc_name]
  }
}

module "vpc" {
  count  = var.use_existing_vpc ? 0 : 1
  source = "terraform-aws-modules/vpc/aws"
  # ... your VPC config ...
}

use_existing_vpc = false 