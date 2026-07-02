# Outputs form the module contract. Until a provider implementation is
# uncommented they expose the planned identifiers/CIDRs so downstream modules
# and documentation stay consistent.

output "vpc_id" {
  description = "VPC identifier (provider resource id once plugged in)."
  value       = "${var.name_prefix}-vpc" # replace with aws_vpc.this.id etc.
}

output "public_subnet_cidrs" {
  description = "CIDRs of the public (LB/NAT) subnets."
  value       = local.public_subnet_cidrs
}

output "private_subnet_ids" {
  description = "Identifiers of the private node subnets."
  value       = [for i in range(local.az_count) : "${var.name_prefix}-private-${i}"]
}

output "private_subnet_cidrs" {
  description = "CIDRs of the private node subnets."
  value       = local.private_subnet_cidrs
}

output "database_subnet_ids" {
  description = "Identifiers of the database subnets (no internet route)."
  value       = [for i in range(local.az_count) : "${var.name_prefix}-db-${i}"]
}

output "database_subnet_cidrs" {
  description = "CIDRs of the database subnets."
  value       = local.database_subnet_cidrs
}

output "hsm_subnet_cidr" {
  description = "Isolated HSM segment CIDR — must match the api egress NetworkPolicy."
  value       = local.hsm_subnet_cidr
}
