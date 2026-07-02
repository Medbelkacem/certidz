# =============================================================================
# CertiDZ — root module variables
# =============================================================================

variable "project" {
  description = "Project slug used as a prefix for every resource name."
  type        = string
  default     = "certidz"
}

variable "environment" {
  description = "Deployment environment (staging | production)."
  type        = string
  default     = "production"

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be either \"staging\" or \"production\"."
  }
}

variable "region" {
  description = "Cloud region / datacenter location identifier. For sovereign deployments use the site code (e.g. \"alger-dc1\")."
  type        = string
  default     = "eu-west-3"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC / private network."
  type        = string
  default     = "10.50.0.0/16"
}

variable "availability_zones" {
  description = "Zones (or physical rooms/racks on-prem) to spread subnets across."
  type        = list(string)
  default     = ["a", "b", "c"]
}

variable "kubernetes_version" {
  description = "Kubernetes control-plane version for the managed cluster."
  type        = string
  default     = "1.31"
}

variable "general_node_pool" {
  description = "Sizing of the general-purpose node pool (web, api, workers)."
  type = object({
    machine_type = string
    min_nodes    = number
    max_nodes    = number
    disk_gb      = number
  })
  default = {
    machine_type = "4vcpu-16gb" # map to the provider's closest instance type
    min_nodes    = 3
    max_nodes    = 10
    disk_gb      = 100
  }
}

variable "signing_node_pool" {
  description = <<-EOT
    Sizing of the tainted, HSM-proximate node pool. These nodes sit on the
    network segment with L2/L3 reachability to the HSM appliances and carry
    the taint workload=signing:NoSchedule so only signing workloads (which
    tolerate it) land there.
  EOT
  type = object({
    machine_type = string
    min_nodes    = number
    max_nodes    = number
    disk_gb      = number
  })
  default = {
    machine_type = "4vcpu-8gb"
    min_nodes    = 2
    max_nodes    = 4
    disk_gb      = 50
  }
}

variable "database" {
  description = "Managed PostgreSQL HA settings."
  type = object({
    engine_version          = string
    instance_class          = string
    storage_gb              = number
    multi_az                = bool
    backup_retention_days   = number
    pitr_enabled            = bool
    deletion_protection     = bool
  })
  default = {
    engine_version        = "17"
    instance_class        = "4vcpu-16gb"
    storage_gb            = 200
    multi_az              = true
    backup_retention_days = 30
    pitr_enabled          = true
    deletion_protection   = true
  }
}

variable "evidence_retention_days" {
  description = "Object-lock retention for the evidence bucket (legal hold for qualified signatures). 3650 days = 10 years, aligned with Algerian law 15-04 archival guidance."
  type        = number
  default     = 3650
}

variable "dr_replication_target" {
  description = "Secondary region/site for cross-region (or cross-site) replication of backups and evidence. Empty string disables replication (single-site sovereign deployments must compensate with offline copies)."
  type        = string
  default     = "eu-central-1"
}

variable "alert_email" {
  description = "Distribution list receiving infrastructure alerts."
  type        = string
  default     = "ops@hisn.dz"
}

variable "tags" {
  description = "Common tags/labels applied to every resource."
  type        = map(string)
  default = {
    project    = "certidz"
    owner      = "hisn-platform"
    managed_by = "terraform"
  }
}
