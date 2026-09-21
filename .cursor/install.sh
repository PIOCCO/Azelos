#!/usr/bin/env bash
# Idempotent bootstrap for the BCDR Cloud Blueprint dev environment.
# Installs pinned CLI tooling (Terraform, ShellCheck, tfsec) and Python deps.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${REPO_ROOT}"

TERRAFORM_VERSION="1.9.5"

log() { echo "[install] $*"; }

install_terraform() {
  if command -v terraform >/dev/null 2>&1 && terraform version | grep -q "v${TERRAFORM_VERSION}"; then
    log "Terraform v${TERRAFORM_VERSION} already present"
    return
  fi
  log "Installing Terraform v${TERRAFORM_VERSION}"
  local tmp
  tmp="$(mktemp -d)"
  curl -fsSL -o "${tmp}/terraform.zip" \
    "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip"
  unzip -o -q "${tmp}/terraform.zip" -d "${tmp}"
  sudo mv "${tmp}/terraform" /usr/local/bin/terraform
  rm -rf "${tmp}"
}

install_shellcheck() {
  if command -v shellcheck >/dev/null 2>&1; then
    log "ShellCheck already present"
    return
  fi
  log "Installing ShellCheck"
  sudo apt-get update -qq
  sudo apt-get install -y -qq shellcheck
}

install_tfsec() {
  if command -v tfsec >/dev/null 2>&1; then
    log "tfsec already present"
    return
  fi
  log "Installing tfsec"
  curl -fsSL https://raw.githubusercontent.com/aquasecurity/tfsec/master/scripts/install_linux.sh | bash
}

install_terraform
install_shellcheck
install_tfsec

log "Installing Python dependencies"
pip install --user -r requirements.txt

log "Making operational scripts executable"
chmod +x scripts/*.sh tests/recovery/*.sh || true

log "Bootstrap complete"
terraform version | head -1
shellcheck --version | grep version
python3 -c "import yaml, pytest; print('PyYAML', yaml.__version__, '| pytest', pytest.__version__)"
