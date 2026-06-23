variable "alb_deletion_protection" {
  description = "Protect the ALB from accidental deletion."
  type        = bool
  default     = true
}

resource "aws_lb" "this" {
  name                       = "${local.name}-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.alb.id]
  subnets                    = aws_subnet.public[*].id
  enable_deletion_protection = var.alb_deletion_protection
  drop_invalid_header_fields = true
  tags                       = { Name = "${local.name}-alb" }
}

# Target groups (ip targets — Fargate awsvpc).
resource "aws_lb_target_group" "server" {
  name        = "${local.name}-server"
  port        = 4000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.this.id

  health_check {
    path                = "/api/health"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
  deregistration_delay = 30
  tags                 = { Name = "${local.name}-server" }
}

resource "aws_lb_target_group" "client" {
  name        = "${local.name}-client"
  port        = 3000
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.this.id

  health_check {
    path                = "/"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 3
    unhealthy_threshold = 3
  }
  deregistration_delay = 30
  tags                 = { Name = "${local.name}-client" }
}

# HTTPS:443 — default → client, /api/* → server.
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = local.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.client.arn
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.server.arn
  }
  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# HTTP:80 → 301 to HTTPS.
resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}
