# Production Environment Configuration
environment = "prod"
cluster_name = "address-service-prod-cluster"
aws_region = "us-west-2"
vpc_cidr = "10.2.0.0/16"

# Node group configuration for production
node_group_min_size = 2
node_group_max_size = 5
node_group_desired_size = 3
node_group_instance_types = ["t3.large", "t3.xlarge"]

# Features
enable_vpc_flow_logs = true
enable_cluster_public_access = false  # More secure for production
enable_irsa = true

# Retention settings
ecr_image_retention_count = 30
cloudwatch_log_retention_days = 30

# Additional tags
tags = {
  Environment = "prod"
  Project     = "address-service"
  Owner       = "devops"
  CostCenter  = "engineering"
  Criticality = "high"
} 