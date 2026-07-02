# =============================================================================
# modules/database — managed PostgreSQL, HA + automated backups + PITR
# =============================================================================
# Contract (any implementation MUST provide):
#   * PostgreSQL 17, synchronous HA standby in a second zone (multi_az).
#   * Automated daily snapshots, retention >= 30 days.
#   * Continuous WAL archiving => point-in-time recovery, granularity <= 5 min
#     (drives the platform RPO of 15 min — see docs/operations/DISASTER-RECOVERY.md).
#   * Storage encryption at rest (KMS/HSM-backed key) and TLS-only client
#     connections (sslmode=require is baked into DATABASE_URL).
#   * Deployed in the database subnets: no internet route, reachable only from
#     the cluster CIDR on 5432.
#   * deletion_protection = true in production: an accidental `terraform
#     destroy` must not be able to drop the legal-evidence system of record.
# =============================================================================

locals {
  database_name  = "${var.name_prefix}-postgres"
  db_port        = 5432
  backup_window  = "01:30-02:30" # UTC, before the 03:00 logical dump (cron in DR doc)
  maint_window   = "sun:02:45-sun:03:45"
}

# -----------------------------------------------------------------------------
# PROVIDER PLUG-IN POINT — managed PostgreSQL
# -----------------------------------------------------------------------------
# AWS (RDS) reference implementation:
#
# resource "aws_db_subnet_group" "this" {
#   name       = "${var.name_prefix}-db"
#   subnet_ids = var.db_subnet_ids
# }
#
# resource "aws_security_group" "db" {
#   name   = "${var.name_prefix}-db"
#   vpc_id = var.vpc_id
#   ingress {
#     from_port   = local.db_port
#     to_port     = local.db_port
#     protocol    = "tcp"
#     cidr_blocks = [var.allowed_cidr]   # cluster CIDR only, never 0.0.0.0/0
#   }
# }
#
# resource "aws_db_instance" "this" {
#   identifier                  = local.database_name
#   engine                      = "postgres"
#   engine_version              = var.engine_version
#   instance_class              = var.instance_class      # map "4vcpu-16gb" -> db.m7g.xlarge
#   allocated_storage           = var.storage_gb
#   storage_encrypted           = true
#   kms_key_id                  = aws_kms_key.db.arn
#   multi_az                    = var.multi_az
#   db_subnet_group_name        = aws_db_subnet_group.this.name
#   vpc_security_group_ids      = [aws_security_group.db.id]
#   backup_retention_period     = var.backup_retention_days   # enables PITR
#   backup_window               = local.backup_window
#   maintenance_window          = local.maint_window
#   deletion_protection         = var.deletion_protection
#   performance_insights_enabled = true
#   parameter_group_name        = aws_db_parameter_group.this.name # rds.force_ssl=1
#   username                    = "certidz"
#   manage_master_user_password = true   # credential lives in Secrets Manager,
#                                        # synced to k8s by External Secrets
# }
#
# resource "aws_db_instance" "replica" {
#   count               = var.multi_az ? 1 : 0
#   identifier          = "${local.database_name}-replica"
#   replicate_source_db = aws_db_instance.this.identifier
#   instance_class      = var.instance_class
# }
#
# Azure: azurerm_postgresql_flexible_server (zone_redundant HA, geo_redundant_backup).
# GCP:   google_sql_database_instance (availability_type = "REGIONAL", PITR on).
#
# Sovereign on-prem: Patroni cluster (3 nodes, etcd DCS) or CloudNativePG
# operator inside the cluster, with pgBackRest shipping WAL + full backups to
# the MinIO backups bucket (see modules/storage). Same contract, same RPO.
# -----------------------------------------------------------------------------
