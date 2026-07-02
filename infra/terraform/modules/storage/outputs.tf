output "bucket_names" {
  description = "Map of logical bucket role -> bucket name."
  value       = local.buckets
}

output "evidence_object_lock_summary" {
  description = "Evidence bucket immutability configuration."
  value       = "mode=${local.evidence_object_lock.mode} retention_days=${local.evidence_object_lock.retention_days}"
}

output "replication_enabled" {
  description = "Whether DR replication is configured."
  value       = local.replication_enabled
}
