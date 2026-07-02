# =============================================================================
# modules/kubernetes — managed cluster abstraction
# =============================================================================
# Contract:
#   * Private control plane (API server not on the public internet; access via
#     bastion/VPN or the provider's private endpoint).
#   * Two node pools:
#       - general: web/api/worker pods, autoscaled.
#       - signing: HSM-proximate nodes, tainted workload=signing:NoSchedule so
#         ONLY pods that explicitly tolerate it (the signing service) run
#         there. This bounds which workloads can ever open a socket to the
#         HSM segment, complementing the NetworkPolicy layer.
#   * OIDC/workload identity enabled so pods obtain cloud credentials without
#     static keys (used by External Secrets Operator).
# =============================================================================

locals {
  cluster_name = "${var.name_prefix}-k8s"

  signing_taint = {
    key    = "workload"
    value  = "signing"
    effect = "NoSchedule"
  }

  signing_labels = {
    "certidz.dz/pool"          = "signing"
    "certidz.dz/hsm-proximate" = "true"
  }

  general_labels = {
    "certidz.dz/pool" = "general"
  }
}

# -----------------------------------------------------------------------------
# PROVIDER PLUG-IN POINT — managed Kubernetes
# -----------------------------------------------------------------------------
# AWS (EKS) reference implementation:
#
# resource "aws_eks_cluster" "this" {
#   name     = local.cluster_name
#   version  = var.kubernetes_version
#   role_arn = aws_iam_role.cluster.arn
#   vpc_config {
#     subnet_ids              = var.private_subnet_ids
#     endpoint_private_access = true
#     endpoint_public_access  = false   # private API server only
#   }
#   encryption_config {                 # envelope-encrypt Secrets at rest
#     provider { key_arn = aws_kms_key.eks.arn }
#     resources = ["secrets"]
#   }
#   enabled_cluster_log_types = ["api", "audit", "authenticator"]
#   tags = var.tags
# }
#
# resource "aws_eks_node_group" "general" {
#   cluster_name    = aws_eks_cluster.this.name
#   node_group_name = "general"
#   subnet_ids      = var.private_subnet_ids
#   instance_types  = [var.general_node_pool.machine_type]
#   scaling_config {
#     min_size     = var.general_node_pool.min_nodes
#     max_size     = var.general_node_pool.max_nodes
#     desired_size = var.general_node_pool.min_nodes
#   }
#   labels = local.general_labels
# }
#
# resource "aws_eks_node_group" "signing" {
#   cluster_name    = aws_eks_cluster.this.name
#   node_group_name = "signing"
#   # Pin to the subnet(s) with routing to the HSM segment (var.hsm_subnet_cidr).
#   subnet_ids      = [var.private_subnet_ids[0]]
#   instance_types  = [var.signing_node_pool.machine_type]
#   scaling_config {
#     min_size     = var.signing_node_pool.min_nodes
#     max_size     = var.signing_node_pool.max_nodes
#     desired_size = var.signing_node_pool.min_nodes
#   }
#   labels = local.signing_labels
#   taint {
#     key    = local.signing_taint.key
#     value  = local.signing_taint.value
#     effect = "NO_SCHEDULE"
#   }
# }
#
# Azure: azurerm_kubernetes_cluster + azurerm_kubernetes_cluster_node_pool
#   (node_taints = ["workload=signing:NoSchedule"]).
# GCP:   google_container_cluster + google_container_node_pool
#   (node_config.taint blocks, private_cluster_config).
#
# Sovereign on-prem: no managed offering — clusters are built with kubeadm or
# RKE2 (hardened, CIS profile) on the same three-tier network. The signing
# pool becomes physical nodes cabled into the HSM VLAN, tainted identically:
#   kubectl taint nodes <node> workload=signing:NoSchedule
#   kubectl label nodes <node> certidz.dz/hsm-proximate=true
# The infra/k8s manifests apply unchanged.
# -----------------------------------------------------------------------------
