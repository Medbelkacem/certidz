variable "name_prefix" {
  description = "Prefix for database resources."
  type        = string
}

variable "engine_version" {
  description = "PostgreSQL major version."
  type        = string
}

variable "instance_class" {
  description = "Abstract instance size (mapped to the provider's closest class)."
  type        = string
}

variable "storage_gb" {
  description = "Allocated storage in GB."
  type        = number
}

variable "multi_az" {
  description = "Whether to run a synchronous standby in a second zone."
  type        = bool
}

variable "backup_retention_days" {
  description = "Automated backup retention (also enables PITR window)."
  type        = number
}

variable "pitr_enabled" {
  description = "Continuous WAL archiving for point-in-time recovery."
  type        = bool
}

variable "deletion_protection" {
  description = "Refuse instance deletion (must stay true in production)."
  type        = bool
}

variable "vpc_id" {
  description = "VPC hosting the database."
  type        = string
}

variable "db_subnet_ids" {
  description = "Database-tier subnets (no internet route)."
  type        = list(string)
}

variable "allowed_cidr" {
  description = "CIDR allowed to reach port 5432 (the cluster VPC CIDR)."
  type        = string
}

variable "tags" {
  description = "Common tags."
  type        = map(string)
  default     = {}
}
