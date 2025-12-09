// pipeline {
//   agent {
//     kubernetes {
//       yaml """
// apiVersion: v1
// kind: Pod
// metadata:
//   labels:
//     app: jenkins-docker-agent
// spec:
//   serviceAccountName: jenkins

//   containers:
//     - name: dind
//       image: docker:24-dind
//       securityContext:
//         privileged: true
//       env:
//         - name: DOCKER_TLS_CERTDIR
//           value: ""
//       volumeMounts:
//         - name: docker-graph-storage
//           mountPath: /var/lib/docker
//         - name: docker-sock
//           mountPath: /var/run

//     - name: docker-cli
//       image: docker:24-cli
//       command: ["sh", "-c", "cat"]
//       tty: true
//       env:
//         - name: DOCKER_HOST
//           value: unix:///var/run/docker.sock
//       volumeMounts:
//         - name: docker-sock
//           mountPath: /var/run

//     - name: helm-kubectl
//       image: dtzar/helm-kubectl:3.14.2
//       command: ["sh", "-c", "cat"]
//       tty: true

//   volumes:
//     - name: docker-graph-storage
//       emptyDir: {}
//     - name: docker-sock
//       emptyDir: {}
// """
//     }
//   }

//   environment {
//     REGISTRY        = "docker.io"
//     DOCKERHUB_USER  = "ashutosh1993"
//     IMAGE_NAME      = "nginx-app"
//     IMAGE_TAG       = "${env.BUILD_NUMBER}"

//     APP_NS          = "cluster1"
//     DOCKERHUB_CRED_ID = "dockerhub-creds"
//   }

//   stages {

//     stage('Checkout') {
//       steps {
//         checkout scm
//       }
//     }

//     stage('Wait for Docker daemon') {
//       steps {
//         container('docker-cli') {
//           sh '''
//             echo "⏳ Waiting for Docker daemon ..."
//             for i in $(seq 1 15); do
//               if docker info >/dev/null 2>&1; then
//                 echo "✅ Docker daemon is up."
//                 exit 0
//               fi
//               echo "… still starting, retry $i/15"
//               sleep 3
//             done
//             echo "❌ Docker daemon did not become ready in time."
//             exit 1
//           '''
//         }
//       }
//     }

//     stage('Build Image') {
//       steps {
//         container('docker-cli') {
//           sh '''
//             echo "📦 Building image ${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}"
//             docker build -t ${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} .
//           '''
//         }
//       }
//     }

//     stage('Push Image') {
//       steps {
//         container('docker-cli') {
//           withCredentials([usernamePassword(
//             credentialsId: DOCKERHUB_CRED_ID,
//             usernameVariable: 'DOCKER_USER',
//             passwordVariable: 'DOCKER_PASS'
//           )]) {
//             sh '''
//               echo "🔐 Logging into Docker Hub..."
//               echo "${DOCKER_PASS}" | docker login -u "${DOCKER_USER}" --password-stdin ${REGISTRY}

//               echo "🚀 Pushing image..."
//               docker push ${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}

//               docker logout
//             '''
//           }
//         }
//       }
//     }

//     stage('Deploy via Helm to cluster1') {
//       steps {
//         container('helm-kubectl') {
//           sh '''
//             echo "⛵ Using in-cluster Kubernetes (service account of Jenkins)..."

//             echo "📂 Ensuring namespace ${APP_NS} exists..."
//             kubectl get ns ${APP_NS} || kubectl create ns ${APP_NS}

//             echo "📦 Deploying Helm chart ./helm/nginx-app to ${APP_NS}..."
//             helm upgrade --install nginx-app ./helm/nginx-app \
//               --namespace ${APP_NS} \
//               --set image.repository=${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME} \
//               --set image.tag=${IMAGE_TAG}

//             echo "⏱ Waiting for rollout..."
//             kubectl -n ${APP_NS} rollout status deployment/nginx-app
//           '''
//         }
//       }
//     }
//   }

//   post {
//     success {
//       echo "✅ ${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} built, pushed, and deployed."
//     }
//     failure {
//       echo "❌ Pipeline failed – check Docker/Helm stages."
//     }
//   }
// }

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
        - name: docker-sock
          mountPath: /var/run

    - name: docker-cli
      image: docker:24-cli
      command: ["sh", "-c", "cat"]
      tty: true
      env:
        - name: DOCKER_HOST
          value: unix:///var/run/docker.sock
      volumeMounts:
        - name: docker-sock
          mountPath: /var/run

    - name: helm-kubectl
      image: dtzar/helm-kubectl:3.14.2
      command: ["sh", "-c", "cat"]
      tty: true

  volumes:
    - name: docker-graph-storage
      emptyDir: {}
    - name: docker-sock
      emptyDir: {}
"""
    }
  }
parameters {
  choice(name: 'APP_NAME', choices: ['booking', 'payments', 'search'], description: 'Which app to build')
}

  environment {
    REGISTRY          = "docker.io"
    DOCKERHUB_USER    = "ashutosh1993"
    IMAGE_NAME        = "${APP_NAME}"
    IMAGE_TAG         = "${env.BUILD_NUMBER}"

    //APP_NS            = "cluster1"
    DOCKERHUB_CRED_ID = "dockerhub-creds"

    // NEW: git credentials for pushing back to SAME repo
    GIT_CRED_ID       = "github-creds"
  }

  stages {

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Wait for Docker daemon') {
      steps {
        container('docker-cli') {
          sh '''
            echo "⏳ Waiting for Docker daemon ..."
            for i in $(seq 1 15); do
              if docker info >/dev/null 2>&1; then
                echo "✅ Docker daemon is up."
                exit 0
              fi
              echo "… still starting, retry $i/15"
              sleep 3
            done
            echo "❌ Docker daemon did not become ready in time."
            exit 1
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

              echo "🚀 Pushing image..."
              docker push ${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG}

              docker logout
            '''
          }
        }
      }
    }

    // 🔁 NEW: update values.yaml in this same repo so ArgoCD sees new tag
    stage('Update Helm values & Push Git') {
      steps {
        // use the default jnlp container – it already has git
        container('jnlp') {
          withCredentials([usernamePassword(
            credentialsId: GIT_CRED_ID,
            usernameVariable: 'GIT_USER',
            passwordVariable: 'GIT_TOKEN'
          )]) {
            sh '''
              echo "📝 Updating image tags in app values.yaml files..."

              # booking
              sed -i "s/^\\s*tag:.*/  tag: \\"${IMAGE_TAG}\\"/" argocd-multi/apps/booking/values.yaml

              # payments
              sed -i "s/^\\s*tag:.*/  tag: \\"${IMAGE_TAG}\\"/" argocd-multi/apps/payments/values.yaml

              # search
              sed -i "s/^\\s*tag:.*/  tag: \\"${IMAGE_TAG}\\"/" argocd-multi/apps/search/values.yaml

              echo "📊 Git status after changes:"
              git status

              git config user.email "jenkins@example.com"
              git config user.name "Jenkins CI"

              git add argocd-multi/apps/booking/values.yaml argocd-multi/apps/payments/values.yaml argocd-multi/apps/search/values.yaml

              # If nothing changed, skip commit/push
              if git diff --cached --quiet; then
                echo "ℹ️ No changes to commit (image tag already ${IMAGE_TAG})."
                exit 0
              fi

              git commit -m "Update image tag to ${IMAGE_TAG}"

              echo "🚀 Pushing changes back to SAME repo (origin)..."
              ORIGIN_URL=$(git config --get remote.origin.url)
              AUTH_URL=$(echo "$ORIGIN_URL" | sed "s#https://#https://${GIT_USER}:${GIT_TOKEN}@#")

              git push "$AUTH_URL" HEAD:${env.BRANCH_NAME}`
            '''
          }
        }
      }
    }

    // ❌ We REMOVE direct Helm deploy if ArgoCD is doing GitOps
    // stage('Deploy via Helm to cluster1') { ... }
  }

  post {
    success {
      echo "✅ ${REGISTRY}/${DOCKERHUB_USER}/${IMAGE_NAME}:${IMAGE_TAG} built, pushed, and Git updated for ArgoCD."
    }
    failure {
      echo "❌ Pipeline failed – check Docker / Git stages."
    }
  }
}

