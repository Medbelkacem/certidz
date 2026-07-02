variable "name_prefix" {
  description = "Prefix for monitoring resources."
  type        = string
}

variable "alert_email" {
  description = "Distribution list for infrastructure alerts."
  type        = string
}

variable "cluster_name" {
  description = "Kubernetes cluster to watch from outside."
  type        = string
}

variable "database_name" {
  description = "Database instance to watch from outside."
  type        = string
}

variable "bucket_names" {
  description = "Buckets to watch (replication lag, size growth)."
  type        = map(string)
}

variable "tags" {
  description = "Common tags."
  type        = map(string)
  default     = {}
}
