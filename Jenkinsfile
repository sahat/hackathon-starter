pipeline {
  agent any

  options {
    skipDefaultCheckout(true)
    disableConcurrentBuilds()
    timeout(time: 45, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  environment {
    CI = 'true'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install dependencies') {
      steps {
        bat 'npm.cmd ci'
      }
    }

    stage('Lint and formatting') {
      steps {
        bat 'npm.cmd run lint-check'
      }
    }

    stage('Unit tests') {
      steps {
        bat 'npm.cmd test'
      }
    }

    stage('Browser tests') {
      environment {
        PORT = '8081'
        BASE_URL = 'http://localhost:8081'
      }
      steps {
        bat 'npm.cmd run test:e2e:replay'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'tmp/**', allowEmptyArchive: true
    }
  }
}
