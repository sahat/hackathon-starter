#!/usr/bin/env groovy

pipeline {

/*    agent any */
    agent {
        docker {
            image 'node'
            args '-u root'
        }
    }


       stages {
        stage('Build') {
            steps {
                echo 'Building...'
                sh 'npm install'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing...'
                sh 'npm test'
		/*sh 'npm run lint' */
		eslint -c config.eslintrc -f checkstyle **/*.js > eslint.xml
            }
        }
    }
}
