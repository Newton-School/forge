resource "aws_ecs_cluster" "this" {
  name = local.name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = { Name = local.name }
}

resource "aws_ecs_cluster_capacity_providers" "this" {
  cluster_name       = aws_ecs_cluster.this.name
  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    capacity_provider = "FARGATE"
    weight            = 1
  }
}

locals {
  server_image = "${aws_ecr_repository.server.repository_url}:${var.image_tag}"
  client_image = "${aws_ecr_repository.client.repository_url}:${var.image_tag}"

  server_environment = [
    { name = "NODE_ENV", value = "production" },
    { name = "PORT", value = "8000" },
    { name = "APP_BASE_URL", value = var.app_origin },
    { name = "GOOGLE_OAUTH_REDIRECT_URI", value = "${var.app_origin}/api/auth/google/callback" },
    { name = "GITHUB_OAUTH_REDIRECT_URI", value = "${var.app_origin}/api/integrations/github/oauth/callback" },
    { name = "ALLOWED_HOSTED_DOMAIN", value = var.allowed_hosted_domain },
    { name = "SMTP_FAMILY", value = "4" },
    { name = "GROQ_MODEL", value = "llama-3.1-8b-instant" },
    { name = "NEWTON_AUTH_BASE_URL", value = var.newton_auth_base_url },
  ]

  server_secrets = [for name, arn in local.secret_arns : { name = name, valueFrom = arn }]
}

# ── Bootstrap task definitions ────────────────────────────────────────────────
# These let the services start on first apply. CI (deploy.yml) registers new
# revisions on every deploy; the services ignore_changes on task_definition, so
# Terraform and CI don't fight over the running revision.
resource "aws_ecs_task_definition" "server" {
  family                   = "forge-server-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(var.server_cpu)
  memory                   = tostring(var.server_memory)
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.server_task.arn

  runtime_platform {
    cpu_architecture        = "X86_64"
    operating_system_family = "LINUX"
  }

  container_definitions = jsonencode([
    {
      name         = "server"
      image        = local.server_image
      essential    = true
      portMappings = [{ containerPort = 8000, protocol = "tcp" }]
      environment  = local.server_environment
      secrets      = local.server_secrets
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.server.name
          "awslogs-region"        = local.region
          "awslogs-stream-prefix" = "server"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "wget -qO- http://127.0.0.1:8000/api/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 15
      }
      linuxParameters = { initProcessEnabled = true }
    }
  ])

  tags = { Name = "forge-server-${var.environment}" }

  lifecycle {
    ignore_changes = [container_definitions] # CI owns the image/env after bootstrap
  }
}

resource "aws_ecs_task_definition" "client" {
  family                   = "forge-client-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(var.client_cpu)
  memory                   = tostring(var.client_memory)
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.client_task.arn

  runtime_platform {
    cpu_architecture        = "X86_64"
    operating_system_family = "LINUX"
  }

  container_definitions = jsonencode([
    {
      name         = "client"
      image        = local.client_image
      essential    = true
      portMappings = [{ containerPort = 3000, protocol = "tcp" }]
      environment = [
        { name = "NODE_ENV", value = "production" },
        { name = "PORT", value = "3000" },
        { name = "APP_MODE", value = "production" },
        { name = "NEXT_PUBLIC_API_URL", value = "/api" },
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.client.name
          "awslogs-region"        = local.region
          "awslogs-stream-prefix" = "client"
        }
      }
      healthCheck = {
        command     = ["CMD-SHELL", "wget -qO- http://127.0.0.1:3000/ || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 20
      }
    }
  ])

  tags = { Name = "forge-client-${var.environment}" }

  lifecycle {
    ignore_changes = [container_definitions]
  }
}

# ── Services ──────────────────────────────────────────────────────────────────
resource "aws_ecs_service" "server" {
  name            = "forge-server-${var.environment}"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.server.arn
  desired_count   = var.server_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.server.arn
    container_name   = "server"
    container_port   = 8000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  health_check_grace_period_seconds = 60
  propagate_tags                    = "SERVICE"

  lifecycle {
    ignore_changes = [task_definition, desired_count] # CI owns rollouts
  }

  depends_on = [aws_lb_listener.https, aws_lb_listener_rule.api]
  tags       = { Name = "forge-server-${var.environment}" }
}

resource "aws_ecs_service" "client" {
  name            = "forge-client-${var.environment}"
  cluster         = aws_ecs_cluster.this.id
  task_definition = aws_ecs_task_definition.client.arn
  desired_count   = var.client_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.private[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.client.arn
    container_name   = "client"
    container_port   = 3000
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  health_check_grace_period_seconds = 60
  propagate_tags                    = "SERVICE"

  lifecycle {
    ignore_changes = [task_definition, desired_count]
  }

  depends_on = [aws_lb_listener.https]
  tags       = { Name = "forge-client-${var.environment}" }
}
