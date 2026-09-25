variable "region" {
  description = "OCI region, e.g. us-ashburn-1. Must match the region of your OCI account/API key."
  type        = string
}

variable "compartment_ocid" {
  description = "Compartment to create resources in. The tenancy (root) OCID works fine for a personal Always Free setup."
  type        = string
}

variable "ssh_public_key_path" {
  description = "Path to the SSH public key that will be allowed to log into the instance."
  type        = string
}

variable "availability_domain_index" {
  description = "Index into the region's list of availability domains (0-based). Bump this and re-apply if you hit 'Out of host capacity' for VM.Standard.A1.Flex — free-tier ARM capacity is often exhausted on AD 0."
  type        = number
  default     = 0
}

variable "instance_display_name" {
  description = "Display name for the compute instance."
  type        = string
  default     = "sidebyside"
}

variable "ocpus" {
  description = "OCPUs for the Ampere A1 Flex shape. Always Free covers up to 4 total."
  type        = number
  default     = 4
}

variable "memory_in_gbs" {
  description = "Memory (GB) for the Ampere A1 Flex shape. Always Free covers up to 24 total."
  type        = number
  default     = 24
}
