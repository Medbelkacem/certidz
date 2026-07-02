variable "name_prefix" {
  description = "Prefix for cluster resources."
  type        = string
}

variable "kubernetes_version" {
  description = "Control plane version."
  type        = string
}

variable "vpc_id" {
  description = "VPC hosting the cluster."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnets for worker nodes."
  type        = list(string)
}

variable "general_node_pool" {
  description = "General-purpose pool sizing."
  type = object({
    machine_type = string
    min_nodes    = number
    max_nodes    = number
    disk_gb      = number
  })
}

variable "signing_node_pool" {
  description = "HSM-proximate tainted pool sizing."
  type = object({
    machine_type = string
    min_nodes    = number
    max_nodes    = number
    disk_gb      = number
  })
}

variable "hsm_subnet_cidr" {
  description = "CIDR of the isolated HSM segment the signing pool must reach."
  type        = string
}

variable "tags" {
  description = "Common tags."
  type        = map(string)
  default     = {}
}
