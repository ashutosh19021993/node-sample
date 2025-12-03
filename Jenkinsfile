// Jenkinsfile
pipeline {
  agent any

  environment {
    // TODO: change this to your real registry;
    // e.g. "docker.io/your-dockerhub-username"
    REGISTRY     = "docker.io"
    DOCKERHUB_USER = "ashutosh1993"
    IMAGE_NAME   = "nginx-app"
    IMAGE_TAG    = "${env.BUILD_NUMBER}"
    APP_NS       = "cluster1"

    // Kube context of the *target* kind cluster where app will run
    // This must exist in kubeconfig on the Jenkins agent
    KUBE_CONTEXT = "kind-kind-app"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Build Image') {
      steps {
        sh """
          echo '📦 Building image ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}'
          docker build -t ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} .
        """
      }
    }

    stage('Trivy Scan') {
      steps {
        sh '''
          if ! command -v trivy >/dev/null 2>&1; then
            echo "❌ Trivy is not installed on this Jenkins agent."
            echo "Install Trivy or use an agent image that includes it."
            exit 1
          fi
        '''
        sh """
          echo '🔍 Scanning image with Trivy...'
          trivy image \
            --scanners vuln \
            --ignore-unfixed \
            --severity HIGH,CRITICAL \
            --exit-code 1 \
            ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
        """
      }
    }

    stage('Push Image') {
      steps {
        // If your registry needs auth, uncomment and configure credentials
        // withCredentials([usernamePassword(credentialsId: 'docker-creds',
        //                                   usernameVariable: 'DOCKER_USER',
        //                                   passwordVariable: 'DOCKER_PASS')]) {
        //   sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin ${REGISTRY}'
        // }

        sh """
          echo '🚀 Pushing image to registry...'
          docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
        """
      }
    }

    stage('Deploy via Helm to kind-app / app-dev') {
      steps {
        sh '''
          if ! command -v helm >/dev/null 2>&1; then
            echo "❌ helm is not installed on this Jenkins agent."
            exit 1
          fi
          if ! command -v kubectl >/dev/null 2>&1; then
            echo "❌ kubectl is not installed on this Jenkins agent."
            exit 1
          fi
        '''

        sh """
          echo '⛵ Switching kubectl context to ${KUBE_CONTEXT}...'
          kubectl config use-context ${KUBE_CONTEXT}

          echo '📂 Ensuring namespace ${APP_NS} exists...'
          kubectl get ns ${APP_NS} || kubectl create ns ${APP_NS}

          echo '📦 Deploying Helm chart ./helm/nginx-app to ${APP_NS}...'
          helm upgrade --install nginx-app ./helm/nginx-app \
            --namespace ${APP_NS} \
            --set image.repository=${REGISTRY}/${IMAGE_NAME} \
            --set image.tag=${IMAGE_TAG}

          echo '⏱ Waiting for rollout...'
          kubectl -n ${APP_NS} rollout status deployment/nginx-app
        """
      }
    }
  }

  post {
    success {
      echo "✅ Success: ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG} scanned by Trivy and deployed via Helm to ${KUBE_CONTEXT}/${APP_NS}."
    }
    failure {
      echo "❌ Pipeline failed – check build, Trivy scan, push, or Helm/kubectl steps."
    }
  }
}
