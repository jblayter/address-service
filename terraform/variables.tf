variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "us-west-2"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[1-9]$", var.aws_region))
    error_message = "AWS region must be a valid region format (e.g., us-west-2)."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be one of: dev, staging, prod."
  }
}

variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  default     = "address-service-cluster"

  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9-]*$", var.cluster_name))
    error_message = "Cluster name must start with a letter and contain only alphanumeric characters and hyphens."
  }
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "VPC CIDR must be a valid CIDR block."
  }
}

variable "node_group_min_size" {
  description = "Minimum size of the EKS node group"
  type        = number
  default     = 1

  validation {
    condition     = var.node_group_min_size >= 1
    error_message = "Node group minimum size must be at least 1."
  }
}

variable "node_group_max_size" {
  description = "Maximum size of the EKS node group"
  type        = number
  default     = 3

  validation {
    condition     = var.node_group_max_size >= 1
    error_message = "Node group maximum size must be at least 1."
  }
}

variable "node_group_desired_size" {
  description = "Desired size of the EKS node group"
  type        = number
  default     = 1

  validation {
    condition     = var.node_group_desired_size >= 1
    error_message = "Node group desired size must be at least 1."
  }
}

variable "node_group_instance_types" {
  description = "List of instance types for the EKS node group"
  type        = list(string)
  default     = ["t3.medium"]

  validation {
    condition     = length(var.node_group_instance_types) > 0
    error_message = "At least one instance type must be specified."
  }
}

variable "enable_vpc_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = true
}

variable "vpc_flow_log_retention_days" {
  description = "Number of days to retain VPC flow logs"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.vpc_flow_log_retention_days)
    error_message = "VPC flow log retention days must be one of the allowed values."
  }
}

variable "ecr_image_retention_count" {
  description = "Number of images to retain in ECR"
  type        = number
  default     = 30

  validation {
    condition     = var.ecr_image_retention_count >= 1
    error_message = "ECR image retention count must be at least 1."
  }
}

variable "cloudwatch_log_retention_days" {
  description = "Number of days to retain CloudWatch logs"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.cloudwatch_log_retention_days)
    error_message = "CloudWatch log retention days must be one of the allowed values."
  }
}

variable "enable_cluster_public_access" {
  description = "Enable public access to the EKS cluster"
  type        = bool
  default     = true
}

variable "enable_irsa" {
  description = "Enable IAM roles for service accounts"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
} 