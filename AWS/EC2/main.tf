terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

resource "aws_security_group" "docker_sg" {
  name        = "docker-sg"
  description = "Allow SSH and Docker ports"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"] 
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "docker-sg"
  }
}

resource "aws_instance" "docker_host" {
  ami                    = "ami-0e35ddab05955cf57" 
  instance_type          = "t2.micro"
  vpc_security_group_ids = [aws_security_group.docker_sg.id]
  key_name               = "new-key-pair" 

  tags = {
    Name = "Docker-Host"
  }

  user_data = <<-EOF
              #!/bin/bash
              sudo apt-get update
              sudo apt-get install docker.io -y
              sudo systemctl start docker
              sudo chmod 666 /var/run/docker.sock
              sudo systemctl enable docker && docker --version
              mkdir actions-runner
              cd actions-runner
              curl -o actions-runner-linux-x64-2.323.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.323.0/actions-runner-linux-x64-2.323.0.tar.gz
              tar xzf ./actions-runner-linux-x64-2.323.0.tar.gz
              ./config.sh --url https://github.com/ayan-lab/Chatty --token AU6VLFVWZ633FLBQVVIRKRLIEHNWS
              ./run.sh
              sudo ./svc.sh install
              sudo ./svc.sh start
              EOF
}

output "instance_public_ip" {
  value = aws_instance.docker_host.public_ip
}

output "instance_public_dns" {
  value = aws_instance.docker_host.public_dns
}

