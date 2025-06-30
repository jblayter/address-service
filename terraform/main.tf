terraform {
  required_version = ">= 1.3.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0.0, < 6.0.0"
    }
  }
  
  # Backend configuration for state management
  # Uncomment and configure when ready to use S3 backend
  # backend "s3" {
  #   bucket = "address-service-terraform-state"
  #   key    = "terraform.tfstate"
  #   region = "us-west-2"
  #   encrypt = true
  # }
}

# Data sources for current AWS context
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Provider configuration with default tags
provider "aws" {
  region = var.aws_region
  
  default_tags {
    tags = {
      Environment = var.environment
      Project     = "address-service"
      ManagedBy   = "terraform"
      Owner       = "devops"
    }
  }
}

# VPC Module with enhanced configuration
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.8.1"

  name = "${var.cluster_name}-vpc"
  cidr = var.vpc_cidr

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  private_subnets = [for i, az in ["${var.aws_region}a", "${var.aws_region}b"] : cidrsubnet(var.vpc_cidr, 8, i + 1)]
  public_subnets  = [for i, az in ["${var.aws_region}a", "${var.aws_region}b"] : cidrsubnet(var.vpc_cidr, 8, i + 101)]

  enable_nat_gateway     = true
  single_nat_gateway     = true
  one_nat_gateway_per_az = false
  
  enable_flow_log                      = var.enable_vpc_flow_logs
  create_flow_log_cloudwatch_log_group = var.enable_vpc_flow_logs
  create_flow_log_cloudwatch_iam_role  = var.enable_vpc_flow_logs
  flow_log_max_aggregation_interval    = 60
  
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  # EKS requirements
  enable_dhcp_options              = true
  dhcp_options_domain_name         = "ec2.internal"
  dhcp_options_domain_name_servers = ["AmazonProvidedDNS"]

  tags = merge(var.tags, {
    Environment = var.environment
    Project     = "address-service"
  })
}

# Security Group for EKS Cluster
resource "aws_security_group" "eks_cluster" {
  name_prefix = "${var.cluster_name}-cluster-"
  vpc_id      = module.vpc.vpc_id
  description = "Security group for EKS cluster"

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(var.tags, {
    Name        = "${var.cluster_name}-cluster-sg"
    Environment = var.environment
    Project     = "address-service"
  })
}

# EKS Cluster with enhanced configuration
module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.17.0"

  cluster_name    = var.cluster_name
  cluster_version = "1.29"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = var.enable_cluster_public_access

  # Node group configuration
  eks_managed_node_groups = {
    general = {
      name = "general-node-group"

      min_size     = var.node_group_min_size
      max_size     = var.node_group_max_size
      desired_size = var.node_group_desired_size

      instance_types = var.node_group_instance_types
      capacity_type  = "ON_DEMAND"

      labels = {
        Environment = var.environment
        NodeGroup   = "general"
      }

      tags = {
        ExtraTag = "eks-node-group"
      }
    }
  }

  # Cluster add-ons
  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  # IAM roles for service accounts
  enable_irsa = var.enable_irsa

  # CloudWatch logging
  cluster_enabled_log_types = ["api", "audit", "authenticator", "controllerManager", "scheduler"]

  tags = merge(var.tags, {
    Environment = var.environment
    Project     = "address-service"
  })
}

# ECR Repository with enhanced security
resource "aws_ecr_repository" "address_service" {
  name                 = "address-service"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(var.tags, {
    Environment = var.environment
    Project     = "address-service"
  })
}

# ECR Lifecycle Policy
resource "aws_ecr_lifecycle_policy" "address_service" {
  repository = aws_ecr_repository.address_service.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last ${var.ecr_image_retention_count} images"
      selection = {
        tagStatus     = "any"
        countType     = "imageCountMoreThan"
        countNumber   = var.ecr_image_retention_count
      }
      action = {
        type = "expire"
      }
    }]
  })
}

# CloudWatch Log Group for application logs
resource "aws_cloudwatch_log_group" "address_service" {
  name              = "/aws/eks/${var.cluster_name}/address-service"
  retention_in_days = var.cloudwatch_log_retention_days

  tags = merge(var.tags, {
    Environment = var.environment
    Project     = "address-service"
  })
} 