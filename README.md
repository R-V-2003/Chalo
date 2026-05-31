# Chalo: Modern Ride-Hailing Platform

![Chalo App](https://raw.githubusercontent.com/R-V-2003/RAHUL_MALI_PORTFOLIO.github.io/main/chalo_card_image.png)

**[Read the Full Case Study Here](https://r-v-2003.github.io/RAHUL_MALI_PORTFOLIO.github.io/case-study-chalo.html)** | **[Download Chalo APK](https://raw.githubusercontent.com/R-V-2003/RAHUL_MALI_PORTFOLIO.github.io/main/chalo.apk)**

Chalo is a full-stack smart shuttle management and ride-hailing platform designed to bridge the gap between affordable shared transit and premium tech-enabled reliability. We bring real-time tracking, AI-assisted route planning, and digital transparency to the deeply unorganized shared-auto and shuttle sectors in fast-growing cities.

## 🌟 The Problem
Millions of daily commuters face a struggle: public transit schedules are unpredictable, and booking a private cab daily costs a fortune. The shared transit market operates entirely offline, missing out on the massive efficiency benefits of digital routing and demand prediction.

## 💡 The Solution
A platform that provides:
- **For Passengers:** Real-time visualization of shuttles, transparent fixed fares, and guaranteed rides.
- **For Drivers:** A dedicated dashboard helping them select high-demand routes, navigate efficiently, and minimize empty trips.

## 🛠️ Technology Stack

### Frontend
- **Framework:** React (via Vite)
- **Maps:** Google Maps JavaScript API for route visualization and shuttle animations.
- **State Management:** React Hooks and Context API.

### Backend
- **Framework:** Node.js & Express.js
- **Database:** SQLite (`better-sqlite3`) for lightweight, high-performance data storage.
- **Authentication:** JWT with `bcryptjs`.
- **Core Engine:** True Road-Aligned Pathfinding using hundreds of interpolated coordinates to animate shuttles smoothly along actual city curves.

### DevOps & Cloud Infrastructure
- **Containerization:** Docker (Multi-stage build for frontend and backend).
- **Hosting Platform:** Amazon ECS (Elastic Container Service).
- **Container Registry:** Amazon ECR.
- **CI/CD Pipeline:** Fully automated GitHub Actions workflow for zero-downtime rolling updates.

## 🚀 How to Run Locally

### Using Docker Compose (Recommended)
1. Ensure Docker is installed and running.
2. Clone the repository and navigate to the project directory.
3. Run the following command:
   ```bash
   docker-compose up --build
   ```
4. Access the frontend at `http://localhost:5173` and the backend API at `http://localhost:5000`.

### Manual Setup
1. **Backend:**
   ```bash
   cd server
   npm install
   node db.js # Initialize SQLite DB
   npm start
   ```
2. **Frontend:**
   ```bash
   npm install
   npm run dev
   ```

## 📱 Mobile Integration
To convert this web project into a working Android APK using Capacitor:
1. Ensure the backend API base URL is set to the absolute URL of the hosted AWS ECS service (or local IP for emulator testing).
2. Configure CORS in `server/index.js` to allow `capacitor://localhost` or `http://localhost`.
3. Generate the Android project and build the APK using Android Studio.

---
*Conceptualized, designed, and developed by [Rahul Mali](https://r-v-2003.github.io/RAHUL_MALI_PORTFOLIO.github.io/)*
