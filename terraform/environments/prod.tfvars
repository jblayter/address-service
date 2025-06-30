# Production Environment Configuration
environment = "prod"
cluster_name = "address-service-prod-cluster"
aws_region = "us-west-2"
vpc_cidr = "10.2.0.0/16"

# Node group configuration for production - much smaller for simple app
node_group_min_size = 1
node_group_max_size = 2
node_group_desired_size = 1
node_group_instance_types = ["t3.small"]

# Features
enable_vpc_flow_logs = false  # Disable to save costs
enable_cluster_public_access = true  # Keep simple for small app
enable_irsa = false  # Disable to simplify

# Retention settings - shorter for cost savings
ecr_image_retention_count = 10
cloudwatch_log_retention_days = 7

# Additional tags
tags = {
  Environment = "prod"
  Project     = "address-service"
  Owner       = "devops"
  CostCenter  = "engineering"
  Criticality = "low"  # Changed from high since it's a simple app
} 