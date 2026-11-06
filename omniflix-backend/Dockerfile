
# Use the lightweight Python 3.12 image for the FastAPI backend.
FROM python:3.12-slim

# Create a dedicated group and non-root user for better security.
RUN groupadd --system app && useradd --system --gid app --create-home app

# Give the non-root application user a dedicated persistent-upload mount point.
RUN mkdir -p /var/lib/omniflix/profile_pictures \
    && chown -R app:app /var/lib/omniflix

# Set the working directory inside the container.
WORKDIR /app

# Copy the dependency list first so Docker can cache this layer.
COPY requirements.txt ./

# Install the Python dependencies inside the /app directory without retaining pip's download cache.
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend source code in my local machine into the container.
# Assign ownership to the app user rather than root.
COPY --chown=app:app . .

# Run the application as the non-root app user.
USER app

# Document the port used by the FastAPI server.
# EXPOSE does not automatically publish this port.
EXPOSE 8888

# Start the FastAPI CLI server.
# --host 0.0.0.0 allows connections from outside the container.
# --port 8888 tells the server which port to listen on.
CMD ["fastapi", "dev", "app/main.py", "--host", "0.0.0.0", "--port", "8888"]

