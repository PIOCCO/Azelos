# Placeholder for future VNet integration (PostgreSQL private access, internal collectors).
# MVP uses public PostgreSQL firewall + Container Apps public ingress to minimize cost.

output "note" {
  value = "Network module reserved for production hardening; not required for MVP."
}
