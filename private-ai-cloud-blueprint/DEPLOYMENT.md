# Deployment

## Local (Docker Compose)

```bash
docker compose up --build -d
```

## Customer cloud (Terraform)

```bash
cd terraform/environments/azure
cp terraform.tfvars.example terraform.tfvars
terraform init && terraform apply
```

Deploy application stack on VM or managed hosts with Ansible (optional).

## Profiles

| Profile | LLM | GPU |
|---------|-----|-----|
| dev | mock / small Ollama | optional |
| small | 1 GPU | yes |
| on-prem | air-gapped Ollama | customer |
