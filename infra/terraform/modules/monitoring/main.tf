# =============================================================================
# modules/monitoring — observability stack wiring
# =============================================================================
# The in-cluster stack (Prometheus, Alertmanager, Grafana, Loki, OTel
# Collector) is deployed with the kube-prometheus-stack Helm chart; its
# CertiDZ-specific configuration lives in infra/monitoring/ (scrape configs,
# alert rules, dashboards). This module covers what must exist OUTSIDE the
# cluster:
#   * alert routing (email/SMS/webhook to the on-call rotation),
#   * provider-level alarms that still fire when the cluster itself is down
#     (dead-man's-switch / heartbeat),
#   * long-term metric and log retention storage.
# =============================================================================

locals {
  alert_channel = "email:${var.alert_email}"

  # Watchdog: Alertmanager continuously fires a "Watchdog" alert to an external
  # heartbeat receiver. If the heartbeat stops, the external system pages —
  # covering the "monitoring is down" blind spot.
  heartbeat_url_name = "${var.name_prefix}-alertmanager-heartbeat"
}

# -----------------------------------------------------------------------------
# PROVIDER PLUG-IN POINT — external alarms & alert routing
# -----------------------------------------------------------------------------
# AWS reference implementation:
#
# resource "aws_sns_topic" "alerts" {
#   name = "${var.name_prefix}-alerts"
# }
#
# resource "aws_sns_topic_subscription" "email" {
#   topic_arn = aws_sns_topic.alerts.arn
#   protocol  = "email"
#   endpoint  = var.alert_email
# }
#
# # Fires even if every pod (including Prometheus) is dead:
# resource "aws_cloudwatch_metric_alarm" "cluster_unreachable" {
#   alarm_name          = "${var.name_prefix}-k8s-api-unreachable"
#   namespace           = "AWS/EKS"
#   metric_name         = "cluster_failed_request_count"
#   comparison_operator = "GreaterThanThreshold"
#   threshold           = 0
#   evaluation_periods  = 3
#   period              = 60
#   alarm_actions       = [aws_sns_topic.alerts.arn]
#   dimensions          = { ClusterName = var.cluster_name }
# }
#
# resource "aws_cloudwatch_metric_alarm" "db_storage" {
#   alarm_name          = "${var.name_prefix}-db-free-storage"
#   namespace           = "AWS/RDS"
#   metric_name         = "FreeStorageSpace"
#   comparison_operator = "LessThanThreshold"
#   threshold           = 20 * 1024 * 1024 * 1024   # 20 GiB
#   evaluation_periods  = 3
#   period              = 300
#   alarm_actions       = [aws_sns_topic.alerts.arn]
#   dimensions          = { DBInstanceIdentifier = var.database_name }
# }
#
# Sovereign on-prem: the same role is played by an independent VM (outside the
# cluster) running Uptime-Kuma/healthchecks.io-style heartbeat monitoring on
# https://app.certidz.dz/api/v1/health, alerting via the national SMS gateway.
# -----------------------------------------------------------------------------
