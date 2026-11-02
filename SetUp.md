# OmniFlix — Home Server Deployment Guide

This guide details how to pull, build, and deploy the OmniFlix stack onto a fresh home server machine running Docker Compose.

---

## 1. Prerequisites

Ensure your target server has Git, Docker Engine, and Docker Compose installed:

```bash
docker --version
docker compose version
```

---

## 2. Clone Repository & Setup Environment Files

1. Clone your project repository onto the home server:
   ```bash
   git clone <YOUR_GIT_REPOSITORY_URL> OmniFlix
   cd OmniFlix
   ```

2. Create the root `.env` file for Docker Compose:
   ```bash
   cat <<EOF> .env
   DATABASE_PASSWORD=your_secure_postgres_password_here
   EOF
   ```

3. Create the backend `.env` file:
   ```bash
   cat <<EOF> omniflix-backend/.env
   # Add backend-specific variables here
   EOF
   ```

4. Create the frontend `.env` file:
   ```bash
   cat <<EOF> omniflix-frontend/.env
   NEXT_PUBLIC_SUWAYOMI_URL=http://localhost:4567
   NEXT_PUBLIC_KAVITA_URL=http://localhost:5001
   NEXT_PUBLIC_LNCRAWL_API_URL=http://localhost:8181
   LNCRAWL_USERNAME=your_lncrawl_username
   LNCRAWL_PASSWORD=your_lncrawl_password
   EOF
   ```

---

## 3. Prepare Persistent Local Volumes & Fix Permissions

Create all volume directories on the host before starting Docker to prevent root ownership permission errors:

```bash
# Create persistent data directories
mkdir -p ./suwayomi-data ./kavita-config ./novels-data

# Align ownership to host UID/GID 1000
sudo chown -R 1000:1000 ./suwayomi-data ./kavita-config ./novels-data
sudo chmod -R 775 ./suwayomi-data ./kavita-config ./novels-data
```

---

## 4. Build and Start the Docker Stack

Build custom images (FastAPI backend and Next.js frontend) and launch all containers in detached mode:

```bash
docker compose up -d --build
```

---

## 5. Verify Running Services & Logs

1. Check that all containers are healthy:
   ```bash
   docker compose ps
   ```

2. Monitor container output in real-time:
   ```bash
   # Stream all service logs
   docker compose logs -f

   # Stream specific service logs
   docker compose logs -f suwayomi
   docker compose logs -f kavita
   docker compose logs -f backend
   ```

---

## 6. Access Service Dashboards

| Service | Container Service Name | Access URL |
| :--- | :--- | :--- |
| **OmniFlix Frontend** | `frontend` | `http://localhost:5555` |
| **OmniFlix FastAPI Backend** | `backend` | `http://localhost:8888/docs` |
| **Suwayomi Engine (Comics)** | `suwayomi` | `http://localhost:4567` |
| **Kavita Engine (Novels)** | `kavita` | `http://localhost:5001` |
| **PostgreSQL Database** | `db` | `localhost:5000` *(Internal 5432)* |

---

## 7. Useful Operational Commands

* **Stop the entire stack:**
  ```bash
  docker compose down
  ```
* **Pull latest Suwayomi/Kavita images and rebuild local code:**
  ```bash
  docker compose up -d --build --pull always
  ```
* **Restart a single service (e.g., backend):**
  ```bash
  docker compose restart backend
  ```