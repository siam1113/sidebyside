terraform {
  required_version = ">= 1.5.0"

  required_providers {
    oci = {
      source  = "oracle/oci"
      version = ">= 5.0"
    }
  }
}

# Reads ~/.oci/config (DEFAULT profile) for auth — see ../README.md for how
# that file gets created. No secrets live in this repo.
provider "oci" {
  region = var.region
}
