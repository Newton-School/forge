# ── Core ──────────────────────────────────────────────────────────────────────
variable "aws_region" {
  description = "AWS region for all resources."
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment (staging|prod). Drives names, tags, secret namespace."
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["staging", "prod"], var.environment)
    error_message = "environment must be 'staging' or 'prod'."
  }
}

variable "app_origin" {
  description = "Public origin of the app, scheme included (e.g. https://forge.taj.works). Single origin — ALB path-routes /api/* to the server."
  type        = string
  default     = "https://forge.taj.works"
}

# ── Networking ───────────────────────────────────────────────────────────────
variable "vpc_cidr" {
  description = "CIDR block for the dedicated Forge VPC."
  type        = string
  default     = "10.20.0.0/16"
}

variable "az_count" {
  description = "Number of Availability Zones to span (>= 2 for ALB + RDS)."
  type        = number
  default     = 2
}

variable "single_nat_gateway" {
  description = "Use one shared NAT Gateway (cheaper) instead of one per AZ (more available)."
  type        = bool
  default     = true
}

variable "alb_allowed_cidrs" {
  description = "Source CIDRs allowed to reach the ALB on 443. Defaults to Cloudflare's published IPv4 ranges so nobody can bypass the proxy (CLAUDE.md topology). Refresh from https://www.cloudflare.com/ips/."
  type        = list(string)
  default = [
    "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
    "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
    "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
    "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22"
  ]
}

# ── DNS / TLS (Cloudflare) ───────────────────────────────────────────────────
variable "manage_dns" {
  description = "Let Terraform create the ACM DNS-validation records and the proxied app CNAME in Cloudflare. Requires cloudflare_zone_id + CLOUDFLARE_API_TOKEN. When false, do DNS by hand and feed validation records from the outputs."
  type        = bool
  default     = true
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID for the app domain (required when manage_dns = true)."
  type        = string
  default     = ""
}

# ── Data: RDS Postgres ───────────────────────────────────────────────────────
variable "db_engine_version" {
  description = "PostgreSQL major/minor version."
  type        = string
  default     = "16"
}

variable "db_instance_class" {
  description = "RDS instance class."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "Initial RDS storage (GiB)."
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Storage autoscaling ceiling (GiB)."
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Initial database name."
  type        = string
  default     = "forge"
}

variable "db_username" {
  description = "Master DB username."
  type        = string
  default     = "forge"
}

variable "db_multi_az" {
  description = "Run RDS Multi-AZ (higher availability, ~2x cost)."
  type        = bool
  default     = false
}

variable "db_deletion_protection" {
  description = "Protect RDS from accidental deletion."
  type        = bool
  default     = true
}

# ── Data: ElastiCache Redis ──────────────────────────────────────────────────
variable "redis_engine_version" {
  description = "Redis engine version."
  type        = string
  default     = "7.1"
}

variable "redis_node_type" {
  description = "ElastiCache node type."
  type        = string
  default     = "cache.t4g.micro"
}

# ── ECS / containers ─────────────────────────────────────────────────────────
variable "server_cpu" {
  type    = number
  default = 512
}
variable "server_memory" {
  type    = number
  default = 1024
}
variable "client_cpu" {
  type    = number
  default = 256
}
variable "client_memory" {
  type    = number
  default = 512
}
variable "server_desired_count" {
  type    = number
  default = 2
}
variable "client_desired_count" {
  type    = number
  default = 2
}

variable "image_tag" {
  description = "Image tag used ONLY for the bootstrap task definitions on first apply. CI (deploy.yml) owns task-def revisions thereafter — the services ignore_changes on task_definition."
  type        = string
  default     = "latest"
}

# ── IAM / CI ─────────────────────────────────────────────────────────────────
variable "github_repository" {
  description = "GitHub repo allowed to assume the deploy role via OIDC, as 'owner/repo'."
  type        = string
  default     = "your-org/forge"
}

variable "github_deploy_ref" {
  description = "Git ref pattern the OIDC trust is scoped to (e.g. 'ref:refs/heads/main' or '*' for any ref in the repo)."
  type        = string
  default     = "*"
}

# ── App config ───────────────────────────────────────────────────────────────
variable "allowed_hosted_domain" {
  description = "Google Workspace hosted domain (hd) gate for login."
  type        = string
  default     = "rishihood.edu.in"
}

variable "ses_identity_domain" {
  description = "Verified SES domain for outbound mail (grants the server task ses:SendEmail scoped to it). Leave empty to skip the SES grant (e.g. when using Gmail SMTP)."
  type        = string
  default     = "nst.rishihood.edu.in"
}

variable "log_retention_days" {
  description = "CloudWatch log retention for /ecs/forge/*."
  type        = number
  default     = 30
}

# External-credential secrets that Terraform creates as EMPTY containers (a
# placeholder version is written once, then ignored). Fill the real values via the
# console/CLI — never in git/state. The computed connection secrets (DATABASE_URL,
# DIRECT_URL, REDIS_URL, SESSION_SECRET) are managed automatically and excluded here.
variable "external_secret_names" {
  description = "Secret names created under /forge/<env>/* for you to populate."
  type        = list(string)
  default = [
    "GOOGLE_OAUTH_CLIENT_ID",
    "GOOGLE_OAUTH_CLIENT_SECRET",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "GITHUB_APP_PRIVATE_KEY",
    "GITHUB_WEBHOOK_SECRET",
    "DISCORD_BOT_TOKEN",
    "GROQ_API_KEY",
  ]
}
