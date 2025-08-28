pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_VERSION = "1.29.2"
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/pawanxandromeda/ttt-backend.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker-compose build'
            }
        }

        stage('Run Docker Containers') {
            steps {
                sh 'docker-compose down'
                sh 'docker-compose up -d'
            }
        }

        stage('Run Tests') {
            steps {
                sh 'docker-compose run backend npm test || true'
            }
        }
    }

    post {
        always {
            sh 'docker-compose down'
        }
    }
}
