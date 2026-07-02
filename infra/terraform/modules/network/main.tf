# =============================================================================
# modules/network — VPC, subnets, NAT (provider-agnostic contract)
# =============================================================================
# Topology (three tiers, one per availability zone):
#   * public subnets   — load balancers + NAT gateways only, nothing else.
#   * private subnets  — Kubernetes nodes; egress via NAT, no inbound internet.
#   * database subnets — PostgreSQL/Redis/ES; NO route to the internet at all.
#   * hsm subnet       — isolated segment for HSM appliances (sovereign sites);
#                        reachable only from the signing node pool.
#
# Security rationale: databases and HSMs are unreachable from the internet by
# construction (routing), not merely by firewall rules.
# =============================================================================

locals {
  az_count = length(var.availability_zones)

  # Deterministic subnet plan carved from the VPC CIDR:
  #   /20 per public subnet   (10.50.0.0/20,  10.50.16.0/20,  10.50.32.0/20)
  #   /20 per private subnet  (10.50.64.0/20, 10.50.80.0/20,  10.50.96.0/20)
  #   /24 per database subnet (10.50.200.0/24, 10.50.201.0/24, 10.50.202.0/24)
  public_subnet_cidrs   = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 4, i)]
  private_subnet_cidrs  = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 4, i + 4)]
  database_subnet_cidrs = [for i in range(local.az_count) : cidrsubnet(var.vpc_cidr, 8, i + 200)]

  # Dedicated /24 for HSM appliances; matches the NetworkPolicy egress rule in
  # infra/k8s/base/networkpolicy.yaml (keep the two in sync).
  hsm_subnet_cidr = cidrsubnet(var.vpc_cidr, 8, 210)
}

# -----------------------------------------------------------------------------
# PROVIDER PLUG-IN POINT — VPC + subnets + NAT
# -----------------------------------------------------------------------------
# AWS reference implementation (uncomment with the aws provider enabled):
#
# resource "aws_vpc" "this" {
#   cidr_block           = var.vpc_cidr
#   enable_dns_support   = true
#   enable_dns_hostnames = true
#   tags                 = merge(var.tags, { Name = "${var.name_prefix}-vpc" })
# }
#
# resource "aws_subnet" "public" {
#   count                   = local.az_count
#   vpc_id                  = aws_vpc.this.id
#   cidr_block              = local.public_subnet_cidrs[count.index]
#   availability_zone       = var.availability_zones[count.index]
#   map_public_ip_on_launch = false   # even public subnets: explicit EIPs only
#   tags = merge(var.tags, { Name = "${var.name_prefix}-public-${count.index}" })
# }
#
# resource "aws_subnet" "private" {
#   count             = local.az_count
#   vpc_id            = aws_vpc.this.id
#   cidr_block        = local.private_subnet_cidrs[count.index]
#   availability_zone = var.availability_zones[count.index]
#   tags = merge(var.tags, { Name = "${var.name_prefix}-private-${count.index}" })
# }
#
# resource "aws_subnet" "database" {
#   count             = local.az_count
#   vpc_id            = aws_vpc.this.id
#   cidr_block        = local.database_subnet_cidrs[count.index]
#   availability_zone = var.availability_zones[count.index]
#   tags = merge(var.tags, { Name = "${var.name_prefix}-db-${count.index}" })
# }
#
# resource "aws_internet_gateway" "this" { vpc_id = aws_vpc.this.id }
#
# # One NAT gateway per AZ: a single-NAT design would make one zone's failure
# # break egress (OCSP/TSA calls) for the whole platform.
# resource "aws_eip" "nat" { count = local.az_count, domain = "vpc" }
# resource "aws_nat_gateway" "this" {
#   count         = local.az_count
#   allocation_id = aws_eip.nat[count.index].id
#   subnet_id     = aws_subnet.public[count.index].id
# }
#
# # Route tables: private -> NAT, database -> no default route (no internet).
# ... (route tables + associations omitted for brevity)
#
# Azure equivalent: azurerm_virtual_network + azurerm_subnet + azurerm_nat_gateway.
# OpenStack (sovereign IaaS): openstack_networking_network_v2 + router with SNAT.
# Pure on-prem: this module is a no-op; the network team provisions VLANs that
# mirror the same three-tier plan and the outputs below are still meaningful
# as documentation of the expected segmentation.
# -----------------------------------------------------------------------------
