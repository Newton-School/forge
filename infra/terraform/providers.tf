# AWS provider — region from var; every resource gets the Forge isolation tags
# so account-wide IAM conditions (aws:ResourceTag/app = forge) and cost reporting
# work out of the box (CLAUDE.md §6).
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      app       = "forge"
      env       = var.environment
      ManagedBy = "terraform"
    }
  }
}

# Cloudflare — only used when var.manage_dns = true (ACM DNS-validation records +
# the proxied app CNAME). Auth via the CLOUDFLARE_API_TOKEN environment variable
# (a scoped token with DNS:Edit on the zone). Declared unconditionally; it is only
# exercised when the cloudflare_* resources are created.
provider "cloudflare" {}
