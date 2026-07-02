# =============================================================================
# CertiDZ by HISN — root infrastructure composition
# =============================================================================
# Composition order (implicit through references):
#   network -> kubernetes -> (database, storage) -> monitoring
#
# Provider-agnostic by design:
#   * Each module declares a stable input/output contract.
#   * Cloud-specific resources are added inside modules at the marked
#     "PROVIDER PLUG-IN POINT" sections (AWS/Azure/GCP/OpenStack examples
#     are included as commented reference implementations).
#   * Algerian sovereign / on-prem deployments can skip Terraform compute
#     entirely and apply infra/k8s manifests to an existing cluster; the
#     database/storage modules then only document the required guarantees
#     (HA, PITR, object-lock) that the on-prem operator must provide.
# =============================================================================

locals {
  name_prefix = "${var.project}-${var.environment}"

  common_tags = merge(var.tags, {
    environment = var.environment
    region      = var.region
  })
}

module "network" {
  source = "./modules/network"

  name_prefix        = local.name_prefix
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  tags               = local.common_tags
}

module "kubernetes" {
  source = "./modules/kubernetes"

  name_prefix        = local.name_prefix
  kubernetes_version = var.kubernetes_version
  vpc_id             = module.network.vpc_id
  private_subnet_ids = module.network.private_subnet_ids
  general_node_pool  = var.general_node_pool
  signing_node_pool  = var.signing_node_pool
  hsm_subnet_cidr    = module.network.hsm_subnet_cidr
  tags               = local.common_tags
}

module "database" {
  source = "./modules/database"

  name_prefix           = local.name_prefix
  engine_version        = var.database.engine_version
  instance_class        = var.database.instance_class
  storage_gb            = var.database.storage_gb
  multi_az              = var.database.multi_az
  backup_retention_days = var.database.backup_retention_days
  pitr_enabled          = var.database.pitr_enabled
  deletion_protection   = var.database.deletion_protection
  vpc_id                = module.network.vpc_id
  db_subnet_ids         = module.network.database_subnet_ids
  allowed_cidr          = var.vpc_cidr
  tags                  = local.common_tags
}

module "storage" {
  source = "./modules/storage"

  name_prefix             = local.name_prefix
  evidence_retention_days = var.evidence_retention_days
  replication_target      = var.dr_replication_target
  tags                    = local.common_tags
}

module "monitoring" {
  source = "./modules/monitoring"

  name_prefix   = local.name_prefix
  alert_email   = var.alert_email
  cluster_name  = module.kubernetes.cluster_name
  database_name = module.database.database_name
  bucket_names  = module.storage.bucket_names
  tags          = local.common_tags
}
