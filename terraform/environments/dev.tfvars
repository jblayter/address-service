# Development Environment Configuration
environment = "dev"
cluster_name = "address-service-dev-cluster"
aws_region = "us-west-2"
vpc_name = "address-service-vpc"
vpc_cidr = "10.0.0.0/16"

# Node group configuration for dev - minimal for simple app
node_group_min_size = 1
node_group_max_size = 1
node_group_desired_size = 1
node_group_instance_types = ["t3.small"]

# Features - minimal for cost savings
enable_vpc_flow_logs = false
enable_cluster_public_access = true
enable_irsa = false

# Retention settings - minimal for cost savings
ecr_image_retention_count = 5
cloudwatch_log_retention_days = 3

# Additional tags
tags = {
  Environment = "dev"
  Project     = "address-service"
  Owner       = "devops"
  CostCenter  = "engineering"
  Criticality = "low"
}

use_existing_vpc = false 