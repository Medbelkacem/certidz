output "alert_channel" {
  description = "Primary alert routing target."
  value       = local.alert_channel
}

output "heartbeat_monitor" {
  description = "Name of the external dead-man's-switch monitor for Alertmanager."
  value       = local.heartbeat_url_name
}
