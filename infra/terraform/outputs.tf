# =============================================================================
# CertiDZ — root outputs (consumed by CD pipelines and runbooks)
# =============================================================================

output "vpc_id" {
  description = "Identifier of the created VPC / private network."
  value       = module.network.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnets hosting the Kubernetes nodes."
  value       = module.network.private_subnet_ids
}

output "cluster_name" {
  description = "Name of the Kubernetes cluster (used by CD: kubectl config / kustomize apply)."
  value       = module.kubernetes.cluster_name
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint (empty until a provider implementation is plugged in)."
  value       = module.kubernetes.cluster_endpoint
}

output "signing_pool_taint" {
  description = "Taint applied to the HSM-proximate node pool; signing Deployments must add the matching toleration."
  value       = module.kubernetes.signing_pool_taint
}

output "database_endpoint" {
  description = "PostgreSQL endpoint hostname (inject into certidz-secrets via External Secrets, never hardcode)."
  value       = module.database.endpoint
  sensitive   = true
}

output "database_replica_endpoint" {
  description = "Read-replica / standby endpoint for reporting and DR checks."
  value       = module.database.replica_endpoint
  sensitive   = true
}

output "bucket_names" {
  description = "Object storage buckets (documents, evidence, backups)."
  value       = module.storage.bucket_names
}

output "evidence_bucket_object_lock" {
  description = "Object-lock configuration summary of the evidence bucket (compliance mode + retention days)."
  value       = module.storage.evidence_object_lock_summary
}

output "monitoring_alert_channel" {
  description = "Where infrastructure alerts are routed."
  value       = module.monitoring.alert_channel
}
