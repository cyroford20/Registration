FROM php:8.2-apache

# Install PHP extensions used by the API.
RUN docker-php-ext-install mysqli pdo pdo_mysql

# Enable Apache modules needed by many PHP apps.
RUN a2enmod rewrite headers

WORKDIR /var/www/html

# Copy app files.
COPY . /var/www/html

# Render provides a dynamic PORT; configure Apache to listen on it at startup.
COPY docker/start.sh /usr/local/bin/start.sh
RUN chmod +x /usr/local/bin/start.sh \
    && chown -R www-data:www-data /var/www/html

EXPOSE 10000

CMD ["/usr/local/bin/start.sh"]
