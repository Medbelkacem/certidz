output "database_name" {
  description = "Instance identifier."
  value       = local.database_name
}

output "endpoint" {
  description = "Writer endpoint hostname (provider attribute once plugged in, e.g. aws_db_instance.this.address)."
  value       = "${local.database_name}.internal" # replace with provider attribute
}

output "replica_endpoint" {
  description = "Standby / read replica endpoint."
  value       = "${local.database_name}-replica.internal" # replace with provider attribute
}

output "port" {
  description = "PostgreSQL port."
  value       = local.db_port
}

output "backup_window_utc" {
  description = "Daily automated backup window (UTC)."
  value       = local.backup_window
}
