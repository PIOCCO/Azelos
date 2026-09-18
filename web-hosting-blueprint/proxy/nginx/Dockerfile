FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY snippets /etc/nginx/conf.d/snippets
RUN mkdir -p /etc/nginx/certs && chown -R nginx:nginx /etc/nginx/certs
USER nginx
EXPOSE 80 443
HEALTHCHECK CMD wget -qO- http://127.0.0.1:80/healthz || exit 1
