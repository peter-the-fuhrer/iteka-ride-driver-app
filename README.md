# Iteka Ride Driver App

This is the driver-side application for the Iteka Ride platform.

## 🚀 Getting Started

1. **Install Dependencies**:

   ```bash
   npm install --legacy-peer-deps
   ```

2. **Start the Development Server**:
   ```bash
   npx expo start
   ```

## 🛠️ Project Structure

- `app/` - Expo Router screens (Home, Earnings, History, Profile)
- `components/` - Reusable UI components
- `store/` - Zustand state management (Driver status, Ride handling)
- `i18n/` - Bilingual support (English & French)
- `client-app/` - Backup of the original client application

## 📱 Features

- **Online/Offline Toggle**: Control your availability
- **Ride Requests**: Real-time simulation of incoming rides
- **Active Ride Management**: Trip lifecycle from pickup to completion
- **Earnings Tracking**: Detailed breakdown of daily and monthly income
- **Bilingual Interface**: Seamlessly switch between English and French
