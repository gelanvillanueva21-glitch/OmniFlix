
# Use Node.js 24 as the base image for the frontend.
FROM node:24.18.0

# Create a dedicated group and non-root user for better security.
RUN groupadd --system app && useradd --system --gid app --create-home app

# Set the working directory inside the container.
# Subsequent commands will run from /app.
WORKDIR /app

# Give the app user ownership of the working directory.
# This allows the application to create files without running as root.
RUN chown app:app /app

# Copy package.json and package-lock.json into the container.
# Docker can cache this layer when application source code changes
# but the dependency manifests stay the same.
COPY --chown=app:app package*.json ./

# Run subsequent instructions as the non-root app user.
USER app

# Install the exact dependency versions recorded in package-lock.json.
# npm ci requires a compatible package-lock.json.
RUN npm ci

# Copy the rest of the frontend source code into the container.
# The app user owns these files.
COPY --chown=app:app . .

# Document the port used by the Vite development server.
# EXPOSE alone does not publish the port to the host.
EXPOSE 5555

# Start Vite and make it accessible outside the container.
# The -- separator passes the remaining arguments to the npm script.
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0", "--port", "5555"]


