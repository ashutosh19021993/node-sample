# Dockerfile
FROM nginx:1.19-alpine

# Simple static page (optional)
RUN echo '<html><body><h1>nginx-app from Jenkins + Helm + Trivy</h1></body></html>' \
    > /usr/share/nginx/html/index.html

# Default nginx entrypoint
CMD ["nginx", "-g", "daemon off;"]
