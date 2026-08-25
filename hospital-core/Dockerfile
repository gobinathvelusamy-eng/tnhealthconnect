FROM php:8.3-cli

WORKDIR /var/www/html

# Install system dependencies + required PHP extensions
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libzip-dev \
    libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite zip \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy project files
COPY . .

# Create .env for build stage
RUN cp .env.production .env 2>/dev/null || echo "APP_KEY=base64:Eo5rCF952OYqUu26coZw0vva2JqRQ8rJXKiLvcYAR80=" > .env

# Install PHP dependencies
RUN COMPOSER_ALLOW_SUPERUSER=1 composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Set permissions
RUN chmod -R 777 storage bootstrap/cache

EXPOSE 8000

ENV APP_ENV=production
ENV APP_DEBUG=false
ENV PORT=8000

CMD ["sh", "-c", "cp .env.production .env 2>/dev/null || true && php artisan config:clear && php artisan migrate --force 2>/dev/null || true && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
