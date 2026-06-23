# ACM certificate for the single app origin, DNS-validated.
resource "aws_acm_certificate" "this" {
  domain_name       = local.app_fqdn
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
  tags = { Name = local.app_fqdn }
}

# ── Cloudflare-managed DNS (when manage_dns = true) ───────────────────────────
# Validation CNAME(s) for ACM. proxied = false (validation must resolve directly).
resource "cloudflare_record" "acm_validation" {
  for_each = var.manage_dns ? {
    for dvo in aws_acm_certificate.this.domain_validation_options : dvo.domain_name => {
      name  = dvo.resource_record_name
      type  = dvo.resource_record_type
      value = dvo.resource_record_value
    }
  } : {}

  zone_id = var.cloudflare_zone_id
  name    = trimsuffix(each.value.name, ".")
  type    = each.value.type
  content = trimsuffix(each.value.value, ".")
  ttl     = 60
  proxied = false
}

resource "aws_acm_certificate_validation" "this" {
  count                   = var.manage_dns ? 1 : 0
  certificate_arn         = aws_acm_certificate.this.arn
  validation_record_fqdns = [for r in cloudflare_record.acm_validation : r.hostname]
}

# Proxied app record → ALB (orange cloud = Cloudflare WAF/DDoS in front).
resource "cloudflare_record" "app" {
  count   = var.manage_dns ? 1 : 0
  zone_id = var.cloudflare_zone_id
  name    = local.app_fqdn
  type    = "CNAME"
  content = aws_lb.this.dns_name
  ttl     = 1 # must be 1 (auto) when proxied
  proxied = true
}

locals {
  # When TF manages DNS, use the validated cert; otherwise the cert ARN directly
  # (you must add the validation records shown in the outputs for it to serve).
  certificate_arn = var.manage_dns ? aws_acm_certificate_validation.this[0].certificate_arn : aws_acm_certificate.this.arn
}
