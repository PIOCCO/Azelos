FROM php:8.3-apache
COPY public/ /var/www/html/
RUN a2enmod rewrite
USER www-data
EXPOSE 8000
HEALTHCHECK CMD curl -fsS http://127.0.0.1/health.php || exit 1
