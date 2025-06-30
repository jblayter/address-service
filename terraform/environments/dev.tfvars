# Development Environment Configuration
environment = "dev"
cluster_name = "address-service-dev-cluster"
aws_region = "us-west-2"
vpc_cidr = "10.0.0.0/16"

# Node group configuration for dev
node_group_min_size = 1
node_group_max_size = 2
node_group_desired_size = 1
node_group_instance_types = ["t3.small"]

# Features
enable_vpc_flow_logs = true
enable_cluster_public_access = true
enable_irsa = true

# Retention settings
ecr_image_retention_count = 10
cloudwatch_log_retention_days = 7

# Additional tags
tags = {
  Environment = "dev"
  Project     = "address-service"
  Owner       = "devops"
  CostCenter  = "engineering"
} 