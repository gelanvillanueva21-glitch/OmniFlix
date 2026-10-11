# OmniFlix — Project Overview

## What is OmniFlix?

OmniFlix is an entertainment discovery and personal tracking platform that allows users to discover, search, organize, and track their favorite entertainment across multiple categories in one place.

The platform brings together comics, novels, movies, and series, allowing users to explore different types of entertainment without needing to use separate platforms to organize their interests.

## Main Entertainment Categories

OmniFlix has four main categories:

1. **Comics**
   - Manga
   - Manhwa
   - Manhua
   - Western Comics
2. **Novels**
3. **Movies**
4. **Series**

Each category provides relevant entertainment information, such as titles, descriptions, genres, and cover images or posters, retrieved from external entertainment APIs.

## User Features

### 1. User Authentication
- Users can register and log in to their accounts.
- After successful registration, users are automatically logged in.
- Authentication includes access tokens, refresh tokens, and protected user-specific resources.

### 2. Personalized Onboarding
- After registering, users choose at least three preferred genres.
- These preferences help personalize the entertainment displayed throughout the platform.

### 3. Entertainment Discovery
- Users can browse entertainment by category.
- Users can explore genres and discover titles matching their interests.
- Entertainment information is retrieved from external APIs rather than requiring OmniFlix to maintain its own complete entertainment catalog.

### 4. Search System
OmniFlix provides two search methods:

- **Global Search:** Searches across supported entertainment categories.
- **Category-Specific Search:** Searches within a selected category, such as comics, novels, movies, or series.

### 5. Personal Entertainment Lists
Users can organize entertainment into lists, including:
- Favorites
- Watchlist
- Completed
- On Hold
- Plan to Watch
- Plan to Read
- Dropped

These lists allow users to track their interests and manage their entertainment activities.

### 6. Activity and Search History
- Users can maintain records of their entertainment activity.
- Search history can record titles, genres, categories, and whether a search was global.
- Users can revisit their previous searches and track their entertainment journey.

### 7. User Profiles
Each user has a profile containing their display name, profile picture, preferences, entertainment lists, activity records, and search history.

## Technology Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Next.js backend features and FastAPI with Python
- **Database:** PostgreSQL
- **Database ORM and Schema Management:** Prisma, managed through the Next.js side
- **Python Database Access:** FastAPI queries the existing PostgreSQL tables without maintaining duplicate ORM model definitions
- **Migrations:** Prisma Migrate
- **Deployment and Development Environment:** Docker

## Architecture Philosophy

OmniFlix uses two backend technologies to practice and benefit from both TypeScript and Python.

Next.js handles the frontend and its assigned backend operations. FastAPI handles authentication and other Python-specific backend responsibilities. Both services can access the same PostgreSQL database, with Prisma serving as the single source of truth for the database schema.

External entertainment APIs provide catalog information, while PostgreSQL stores user accounts, profiles, preferences, entertainment lists, activity records, and search history.

## Project Goal

The goal of OmniFlix is to create a centralized, personalized entertainment platform while developing practical full-stack engineering skills, including API integration, database design, authentication, backend architecture, and frontend development.


## 8. Admin Analytics Dashboard

OmniFlix will include a dedicated Admin Analytics Dashboard accessible only to authenticated users with the `ADMIN` role.

### 8.1 Admin-Only Access

- The dashboard will be accessible through a dedicated route, such as `/admin`.
- Only users whose account role is `ADMIN` can access the dashboard.
- Normal users must not be able to access administrative analytics by manually entering the URL.
- Authorization must be enforced by the backend, not just by hiding the admin page in the frontend.
- Unauthorized requests must be rejected.

### 8.2 Interactive Circular Analytics

The dashboard will feature an interactive circular analytics section containing four main analytics categories:

1. **Watching** — tracks series and movies that users watch.
2. **Reading** — tracks comics and novels that users read.
3. **Searching** — tracks the entertainment categories and titles users search for.
4. **Dropped** — tracks entertainment that users stop watching or reading before completion.

Each category will be represented by a circular progress-style visualization displaying a percentage and a relevant activity metric.

Users with the `ADMIN` role can click any circular visualization to explore its detailed analytics.

For example:
- Clicking Watching displays popular movies and series based on recorded watching activity.
- Clicking Reading displays popular comics and novels based on recorded reading activity.
- Clicking Searching displays the most frequently searched titles, genres, and entertainment categories.
- Clicking Dropped displays the most frequently dropped titles and the overall dropped rate.

### 8.3 Popular Entertainment Rankings

The dashboard will display ranked entertainment titles based on recorded user activity.

Administrators can explore:

- Most-watched movies and series.
- Most-read comics and novels.
- Most-searched entertainment titles.
- Most frequently dropped entertainment.
- Most favorited titles.
- Most frequently completed titles.

Each entry can display the title, category, cover or poster, activity count, and ranking.

Because OmniFlix retrieves catalog metadata from external APIs, the dashboard can use the stored `api_source` and `external_id` to identify titles and retrieve their display information.

### 8.4 Analytics Time Filters

Administrators should be able to filter analytics by time period, such as:

- Last 7 days.
- Last 30 days.
- Last 90 days.
- All time.

Changing the time period updates the analytics visualizations and popularity rankings.

### 8.5 Analytics Visualization and Interaction

The dashboard will use interactive circular visualizations, such as donut charts or circular progress indicators.

Each visualization should communicate a meaningful metric, including:
- Total activity count.
- Percentage of activity attributed to a category.
- Completion or drop-off rate where the required data exists.
- Changes in activity during the selected time period.

Clicking a visualization opens a detailed view with the corresponding metrics and ranked entertainment titles.

### 8.6 Analytics Data and Accuracy

Analytics will be based on recorded OmniFlix user activity, list entries, and search history.

The dashboard should distinguish between:
- **Recorded activity:** Events or actions explicitly stored by OmniFlix.
- **Current list status:** Whether a title is currently favorited, on a watchlist, completed, on hold, or dropped.
- **Popularity:** A ranking based on a clearly defined metric, such as the number of users who watched, read, searched for, or dropped a title.

External API metadata alone must not be treated as proof that an OmniFlix user watched or read a title.

### 8.7 Admin Dashboard Goal

The Admin Analytics Dashboard gives administrators a platform-wide view of entertainment trends and user engagement. It helps identify popular titles, understand user interests, and discover which entertainment attracts attention or is frequently abandoned.

The dashboard is intended for administrative analysis only, not as a feature for ordinary users.