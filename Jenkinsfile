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
		sh 'mocha test/test.js --reporter spec'
            }
        }
        stage('Test') {
            steps {
                echo 'Testing...'
                sh 'npm test'
            }
        }
    }
}
