# Dedicated ECR repos. Image tags are immutable per push? No — CI pushes both an
# immutable SHA tag and a moving :latest, so MUTABLE is required. Untagged layers
# are expired and the tagged history is capped to keep storage bounded.
resource "aws_ecr_repository" "server" {
  name                 = local.ecr_server
  image_tag_mutability = "MUTABLE"
  force_delete         = false

  image_scanning_configuration {
    scan_on_push = true
  }
  tags = { Name = local.ecr_server }
}

resource "aws_ecr_repository" "client" {
  name                 = local.ecr_client
  image_tag_mutability = "MUTABLE"
  force_delete         = false

  image_scanning_configuration {
    scan_on_push = true
  }
  tags = { Name = local.ecr_client }
}

locals {
  ecr_lifecycle = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 14 days"
        selection    = { tagStatus = "untagged", countType = "sinceImagePushed", countUnit = "days", countNumber = 14 }
        action       = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep only the last 30 tagged images"
        selection    = { tagStatus = "any", countType = "imageCountMoreThan", countNumber = 30 }
        action       = { type = "expire" }
      }
    ]
  })
}

resource "aws_ecr_lifecycle_policy" "server" {
  repository = aws_ecr_repository.server.name
  policy     = local.ecr_lifecycle
}

resource "aws_ecr_lifecycle_policy" "client" {
  repository = aws_ecr_repository.client.name
  policy     = local.ecr_lifecycle
}
