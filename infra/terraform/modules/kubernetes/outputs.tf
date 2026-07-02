output "cluster_name" {
  description = "Cluster name used by CD (aws eks update-kubeconfig / az aks get-credentials)."
  value       = local.cluster_name
}

output "cluster_endpoint" {
  description = "API server endpoint; populated by the provider implementation (e.g. aws_eks_cluster.this.endpoint)."
  value       = "" # replace with provider resource attribute once plugged in
}

output "signing_pool_taint" {
  description = "Taint on the HSM-proximate pool. Signing Deployments need the matching toleration + nodeSelector certidz.dz/pool=signing."
  value       = "${local.signing_taint.key}=${local.signing_taint.value}:${local.signing_taint.effect}"
}

output "signing_pool_labels" {
  description = "Labels identifying HSM-proximate nodes."
  value       = local.signing_labels
}
