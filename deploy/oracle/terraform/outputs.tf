output "public_ip" {
  description = "Public IP of the instance. SSH in as 'ubuntu'."
  value       = oci_core_instance.this.public_ip
}

output "ssh_command" {
  value = "ssh ubuntu@${oci_core_instance.this.public_ip}"
}
