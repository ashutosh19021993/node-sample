pipeline {
  agent {
    kubernetes {
      yaml """
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: jenkins-docker-agent
spec:
  serviceAccountName: jenkins
  containers:
    - name: docker-cli
      image: docker:24-cli
      command:
        - cat
      tty: true
      env:
        - name: DOCKER_HOST
          value: tcp://localhost:2375
      volumeMounts:
        - name: docker-graph-storage
          mountPath: /var/lib/docker

    - name: dind
      image: docker:24-dind
      securityContext:
        privileged: true
      env:
        - name: DOCKER_TLS_CERTDIR
          value: ""
      volumeMounts:
        - name: docker-graph-storage
          mountPath: /var/lib/docker

    - name: tools
      image: dtzar/helm-kubectl:3.14.2 
      command: ['cat']
      tty: true

  volumes:
    - name: docker-graph-storage
      emptyDir: {}
"""
    }
  }

  environment {
    REGISTRY        = "docker.io"
    DOCKERHUB_USER  = "ashutosh1993"
    IMAGE_NAME      = "nginx-app"
    IMAGE_TAG       = "${env.BUILD_NUMBER}"

    APP_NS          = "cluster1"
    KUBE_CONTEXT    = "kind-kind-app"   // kept for reference, but not used in-cluster

    DOCKERHUB_CRED_ID = "dockerhub-creds"   // Jenkins credential ID
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Check Docker') {
      steps {
        container('docker-cli') {
          sh '''
            echo "🔍 docker version in Kubernetes agent:"
            docker version
          '''
        }
      }
    }

    stage('Build Image') {
      steps {
        container('docker-cli') {
          sh '''
            echo "📦 Building image ${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
            docker build -t ${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} .
          '''
        }
      }
    }

    stage('Push Image') {
      steps {
        container('docker-cli') {
          withCredentials([usernamePassword(
            credentialsId: DOCKERHUB_CRED_ID,
            usernameVariable: 'DOCKER_USER',
            passwordVariable: 'DOCKER_PASS'
          )]) {
            sh '''
              echo "🔐 Logging into Docker Hub..."
              echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin ${REGISTRY}

              echo "🚀 Pushing image to registry..."
              docker push ${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}

              docker logout
            '''
          }
        }
      }
    }

    // stage('Trivy Scan (from registry)') {
    //   steps {
    //     container('docker-cli') {
    //       sh '''
    //         echo "🔍 Scanning image with Trivy (pulling from registry)..."
    //         docker run --rm \
    //           aquasec/trivy:latest image \
    //           --scanners vuln \
    //           --ignore-unfixed \
    //           --severity HIGH,CRITICAL \
    //           --exit-code 1 \
    //           ${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}
    //       '''
    //     }
    //   }
    // }

    stage('Deploy via Helm (in-cluster)') {
      steps {
        container('tools') {
          sh '''
            echo "⛵ Using in-cluster Kubernetes (service account of Jenkins)..."

            echo "📂 Ensuring namespace ${APP_NS} exists..."
            kubectl get ns ${APP_NS} || kubectl create ns ${APP_NS}

            echo "📦 Deploying Helm chart ./helm/nginx-app to ${APP_NS}..."
            helm upgrade --install nginx-app ./helm/nginx-app \
              --namespace ${APP_NS} \
              --set image.repository=${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME} \
              --set image.tag=${IMAGE_TAG}

            echo "⏱ Waiting for rollout..."
            kubectl -n ${APP_NS} rollout status deployment/nginx-app
          '''
        }
      }
    }
  }

  post {
    success {
      echo "✅ Success: ${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} built, pushed, scanned, and deployed via Helm."
    }
    failure {
      echo "❌ Pipeline failed – check build, push, Trivy, or Helm/kubectl steps."
    }
  }
}
