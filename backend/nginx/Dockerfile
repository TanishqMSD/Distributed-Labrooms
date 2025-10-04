# Dockerfile

FROM nginx:alpine

# Remove the default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy your custom config into the container
COPY nginx.conf /etc/nginx/nginx.conf

# The Nginx image is already set up to listen on port 80
EXPOSE 80

# The default command is fine
CMD ["nginx", "-g", "daemon off;"]