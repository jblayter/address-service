# Staging Environment Configuration
environment = "staging"
cluster_name = "address-service-staging-cluster"
aws_region = "us-west-2"
vpc_cidr = "10.1.0.0/16"

# Node group configuration for staging
node_group_min_size = 1
node_group_max_size = 3
node_group_desired_size = 2
node_group_instance_types = ["t3.medium"]

# Features
enable_vpc_flow_logs = true
enable_cluster_public_access = true
enable_irsa = true

# Retention settings
ecr_image_retention_count = 20
cloudwatch_log_retention_days = 14

# Additional tags
tags = {
  Environment = "staging"
  Project     = "address-service"
  Owner       = "devops"
  CostCenter  = "engineering"
} 