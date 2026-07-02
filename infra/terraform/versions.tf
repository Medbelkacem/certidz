# =============================================================================
# CertiDZ — Terraform version pinning
# =============================================================================
# The root module is provider-agnostic: it composes local modules that model
# the infrastructure (network, cluster, database, storage, monitoring) and
# expose a stable variable/output contract. Concrete cloud resources are
# plugged in inside each module where marked "PROVIDER PLUG-IN POINT".
#
# Sovereign / Algerian on-prem deployments typically do NOT use Terraform at
# all for compute: the Kubernetes manifests in infra/k8s are applied to an
# existing cluster (see docs/operations/DEPLOYMENT.md#sovereign-on-prem).
# =============================================================================

terraform {
  required_version = ">= 1.6.0"

  # PROVIDER PLUG-IN POINT — uncomment exactly one block per target cloud.
  #
  # required_providers {
  #   aws = {
  #     source  = "hashicorp/aws"
  #     version = "~> 5.80"
  #   }
  # }
  #
  # required_providers {
  #   azurerm = {
  #     source  = "hashicorp/azurerm"
  #     version = "~> 4.10"
  #   }
  # }
  #
  # required_providers {
  #   openstack = {                        # common for sovereign IaaS providers
  #     source  = "terraform-provider-openstack/openstack"
  #     version = "~> 2.1"
  #   }
  # }

  # STATE BACKEND — state contains sensitive metadata; store it encrypted with
  # locking, never in git. Example (S3-compatible, works with MinIO on-prem):
  #
  # backend "s3" {
  #   bucket         = "certidz-terraform-state"
  #   key            = "certidz/production/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   use_lockfile   = true
  # }
}
