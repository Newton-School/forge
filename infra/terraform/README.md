# infra/terraform/

Production Terraform for the Forge AWS topology (CLAUDE.md §2/§6, `docs/aws/index.html`):

```
Cloudflare → ALB (forge.taj.works) → /api/* → server :8000 · default → client :3000
           → ECS Fargate · RDS Postgres · ElastiCache Redis
           + ECR · Secrets Manager · KMS CMK · CloudWatch logs/alarms · SNS email alerts
```

Everything is wired by reference (no placeholder ARNs), least-privilege, tagged `app=forge,env=<env>`, in a dedicated VPC with zero blast radius into other account tenants.

## Files
| File | Resources |
|---|---|
| `network.tf` | VPC, public/private subnets, IGW, NAT, route tables |
| `security_groups.tf` | alb ← Cloudflare:443 · ecs ← alb · rds ← ecs:5432 · redis ← ecs:6379 |
| `kms.tf` | dedicated CMK (RDS + Secrets at rest) |
| `rds.tf` | PostgreSQL 16, private, encrypted, force-SSL |
| `redis.tf` | ElastiCache Redis (sessions/cache) |
| `ecr.tf` | `forge-server` / `forge-client` repos + lifecycle |
| `secrets.tf` | Secrets Manager: TF-managed DB/Redis/session secrets + empty containers for external creds |
| `iam.tf` | execution role · server/client task roles · **GitHub OIDC provider + deploy role** |
| `acm_dns.tf` | ACM cert + Cloudflare validation & proxied app CNAME |
| `alb.tf` | ALB, target groups, HTTPS+path routing, 80→443 redirect |
| `ecs.tf` | cluster, bootstrap task defs, services (circuit breaker, `ignore_changes` so CI owns rollouts) |
| `logs.tf` · `monitoring.tf` | log groups · SNS email alerts + CloudWatch alarms + server-error log metric |
| `cloudtrail.tf` | AWS-API audit: multi-region trail + versioned S3 sink + CW Logs + root-usage/unauthorized-call alarms (`enable_cloudtrail`) |
| `bootstrap/` | one-time S3 (versioned) + DynamoDB state backend |

## Apply order
```bash
# 0. One-time: state backend (versioned S3 + DynamoDB lock)
cd bootstrap && terraform init && terraform apply -var=aws_region=ap-south-1 && cd ..

# 1. Init main module against that backend
terraform init \
  -backend-config="bucket=$(terraform -chdir=bootstrap output -raw state_bucket)" \
  -backend-config="dynamodb_table=$(terraform -chdir=bootstrap output -raw lock_table)" \
  -backend-config="key=forge/prod/terraform.tfstate" \
  -backend-config="region=ap-south-1"

# 2. Configure and apply
cp terraform.tfvars.example terraform.tfvars   # edit it
export CLOUDFLARE_API_TOKEN=...                 # if manage_dns = true
terraform apply
```

## After apply
1. **Fill the external secrets** (`terraform output secret_names`) in Secrets Manager — `GOOGLE_OAUTH_*`, `SMTP_*`, `GITHUB_*`, `DISCORD_BOT_TOKEN`, `GROQ_API_KEY`. The DB/Redis/session secrets are already populated by Terraform.
2. **Confirm the SNS email** subscription (AWS emails a confirmation link to `alert_email`).
3. **Set the GitHub Actions vars/secrets** from the outputs:
   - `AWS_DEPLOY_ROLE_ARN` ← `github_deploy_role_arn`
   - `PRIVATE_SUBNET_IDS` ← `private_subnet_ids_csv`
   - `SERVER_SECURITY_GROUP_ID` ← `server_security_group_id`
   - plus `AWS_REGION`, `AWS_ACCOUNT_ID`, `APP_ORIGIN`
4. Push to `main` (or run the workflow manually) → `deploy.yml` builds, migrates, and rolls out.

> CI owns container images and task-def revisions; Terraform owns the service shell (`ignore_changes = [task_definition, desired_count]`). They don't fight.
