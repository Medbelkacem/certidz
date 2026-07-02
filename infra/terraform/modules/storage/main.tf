# =============================================================================
# modules/storage — S3-compatible object storage for CertiDZ
# =============================================================================
# Buckets and their guarantees:
#
#   certidz-documents  in-flight and completed envelopes/PDFs.
#                      versioning ON, SSE, lifecycle: noncurrent -> IA 30d,
#                      expire noncurrent after 365d.
#
#   certidz-evidence   audit trails, signature evidence packages, certificates
#                      of completion. VERSIONING + OBJECT LOCK (COMPLIANCE
#                      mode): nobody — including root/admin — can delete or
#                      rewrite evidence during the retention period. This is
#                      the technical anchor for non-repudiation of qualified
#                      signatures.
#
#   certidz-backups    pgBackRest/pg_dump archives, ES snapshots.
#                      versioning ON, lifecycle: -> Glacier/cold 30d,
#                      expire 365d (PITR window is served by the DB service).
#
# All buckets: block ALL public access, TLS-only bucket policy, SSE with a
# KMS-managed key, access logging enabled, replication to the DR site.
# =============================================================================

locals {
  buckets = {
    documents = "${var.name_prefix}-documents"
    evidence  = "${var.name_prefix}-evidence"
    backups   = "${var.name_prefix}-backups"
  }

  replication_enabled = var.replication_target != ""

  evidence_object_lock = {
    mode           = "COMPLIANCE" # not GOVERNANCE: no bypass permission exists
    retention_days = var.evidence_retention_days
  }
}

# -----------------------------------------------------------------------------
# PROVIDER PLUG-IN POINT — object storage
# -----------------------------------------------------------------------------
# AWS reference implementation (evidence bucket shown; documents/backups are
# identical minus object-lock):
#
# resource "aws_s3_bucket" "evidence" {
#   bucket              = local.buckets.evidence
#   object_lock_enabled = true          # can ONLY be set at creation time
#   tags                = var.tags
# }
#
# resource "aws_s3_bucket_versioning" "evidence" {
#   bucket = aws_s3_bucket.evidence.id
#   versioning_configuration { status = "Enabled" }
# }
#
# resource "aws_s3_bucket_object_lock_configuration" "evidence" {
#   bucket = aws_s3_bucket.evidence.id
#   rule {
#     default_retention {
#       mode = local.evidence_object_lock.mode
#       days = local.evidence_object_lock.retention_days
#     }
#   }
# }
#
# resource "aws_s3_bucket_server_side_encryption_configuration" "evidence" {
#   bucket = aws_s3_bucket.evidence.id
#   rule {
#     apply_server_side_encryption_by_default {
#       sse_algorithm     = "aws:kms"
#       kms_master_key_id = aws_kms_key.storage.arn
#     }
#     bucket_key_enabled = true
#   }
# }
#
# resource "aws_s3_bucket_public_access_block" "evidence" {
#   bucket                  = aws_s3_bucket.evidence.id
#   block_public_acls       = true
#   block_public_policy     = true
#   ignore_public_acls      = true
#   restrict_public_buckets = true
# }
#
# resource "aws_s3_bucket_lifecycle_configuration" "documents" {
#   bucket = aws_s3_bucket.documents.id
#   rule {
#     id     = "noncurrent-tiering"
#     status = "Enabled"
#     noncurrent_version_transition { noncurrent_days = 30, storage_class = "STANDARD_IA" }
#     noncurrent_version_expiration { noncurrent_days = 365 }
#     abort_incomplete_multipart_upload { days_after_initiation = 7 }
#   }
# }
#
# resource "aws_s3_bucket_replication_configuration" "evidence" {
#   count  = local.replication_enabled ? 1 : 0
#   bucket = aws_s3_bucket.evidence.id
#   role   = aws_iam_role.replication.arn
#   rule {
#     id     = "dr-replication"
#     status = "Enabled"
#     destination {
#       bucket        = "arn:aws:s3:::${local.buckets.evidence}-dr"  # in var.replication_target
#       storage_class = "STANDARD_IA"
#     }
#   }
# }
#
# Sovereign on-prem (MinIO): identical semantics via the MinIO Terraform
# provider or `mc`:
#   mc mb --with-lock minio/certidz-evidence
#   mc retention set --default compliance "3650d" minio/certidz-evidence
#   mc version enable minio/certidz-documents
#   mc replicate add minio/certidz-evidence --remote-bucket <dr-site>/certidz-evidence
# Cross-SITE replication replaces cross-region for single-country deployments.
# -----------------------------------------------------------------------------
