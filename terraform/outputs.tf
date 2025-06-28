output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "kubeconfig" {
  value     = module.eks.kubeconfig
  sensitive = true
}

output "ecr_repo_url" {
  value = aws_ecr_repository.address_service.repository_url
} 