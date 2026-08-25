FROM php:8.2-cli

WORKDIR /var/www/html

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libsqlite3-dev \
    && docker-php-ext-install pdo pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy project files
COPY . .

# Install PHP dependencies (no dev, no scripts)
RUN composer install --no-dev --optimize-autoloader --no-interaction --no-scripts

# Create storage symlink and set permissions
RUN php artisan storage:link --no-interaction 2>/dev/null || true
RUN php artisan config:cache --no-interaction 2>/dev/null || true
RUN chmod -R 777 storage bootstrap/cache

EXPOSE 8000

ENV APP_ENV=production
ENV APP_DEBUG=false

CMD ["sh", "-c", "cp .env.production .env 2>/dev/null || true && php artisan config:clear && php artisan migrate --force 2>/dev/null || true && php artisan serve --host=0.0.0.0 --port=${PORT:-8000}"]
