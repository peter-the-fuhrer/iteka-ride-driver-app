# Iteka Ride Driver App - Complete Setup Guide

## 📋 Project Overview

A premium driver-side application for Iteka Ride with bilingual support (English/French), matching the client app's UI/UX quality.

## 🎯 Core Features

### Authentication

- ✅ Onboarding (3 slides)
- ✅ Login (phone + PIN)
- ❌ No Signup (drivers are registered by admin)

### Main Screens

1. **Home/Dashboard** - Shows driver status, earnings, and ride requests
2. **Active Ride** - Current trip details and navigation
3. **Earnings** - Daily/weekly/monthly earnings breakdown
4. **History** - Past rides with details
5. **Profile/Settings** - Driver info, vehicle details, language switcher

## 📁 Project Structure

```
iteka-ride-driver-app/
├── app/
│   ├── (root)/
│   │   ├── index.tsx              # Home/Dashboard
│   │   ├── active-ride.tsx        # Active ride screen
│   │   ├── earnings.tsx           # Earnings screen
│   │   ├── history.tsx            # Ride history
│   │   ├── profile.tsx            # Driver profile
│   │   └── _layout.tsx
│   ├── auth/
│   │   ├── login.tsx              # Driver login
│   │   ├── welcome.tsx            # Onboarding
│   │   └── _layout.tsx
│   └── _layout.tsx
├── components/
│   ├── common/
│   │   ├── CustomAlert.tsx
│   │   └── LanguageSwitcher.tsx
│   ├── home/
│   │   ├── RideRequest.tsx        # Incoming ride request card
│   │   ├── ActiveRideCard.tsx     # Current ride info
│   │   └── EarningsCard.tsx       # Earnings summary
│   └── map/
│       └── DriverMap.tsx          # Map with navigation
├── constants/
│   └── Colors.ts
├── i18n/
│   ├── en.json
│   ├── fr.json
│   └── index.ts
├── services/
│   ├── geocoding.ts
│   ├── routing.ts
│   └── index.ts
├── store/
│   ├── driverStore.ts             # Driver state management
│   └── alertStore.ts
├── assets/
│   └── iteka-ride-icon.png
├── package.json
├── tsconfig.json
└── app.json
```

## 🎨 Design Principles

- Match client app's premium feel
- Yellow (#FECA05) as primary color
- Poppins font family
- Smooth animations and transitions
- Dark mode support
- Bilingual (EN/FR)

## 📱 Key Screens Breakdown

### 1. Onboarding (3 Slides)

**Slide 1:** "Start Earning"

- Illustration: Driver with car and money/earnings
- Description: "Join Iteka Ride and start earning with flexible hours"

**Slide 2:** "Accept Rides"

- Illustration: Phone with ride request notification
- Description: "Receive ride requests and accept them with one tap"

**Slide 3:** "Track Earnings"

- Illustration: Dashboard with charts/earnings
- Description: "Monitor your earnings and performance in real-time"

### 2. Login Screen

- Phone number input
- 4-digit PIN
- Language switcher
- "Forgot PIN?" link
- No signup option (admin registers drivers)

### 3. Home/Dashboard

**Header:**

- Driver status toggle (Online/Offline)
- Current earnings today
- Language switcher

**Main Content:**

- Ride request card (when available)
- Quick stats: Rides today, Hours online, Rating
- Map showing driver location

**Bottom Navigation:**

- Home
- Earnings
- History
- Profile

### 4. Active Ride Screen

- Customer info (name, rating, phone)
- Pickup location
- Dropoff location
- Estimated fare
- Navigation button
- Actions: Call customer, Start trip, Complete trip, Cancel

### 5. Earnings Screen

- Period selector (Today, Week, Month)
- Total earnings
- Breakdown: Rides completed, Average fare, Tips
- Chart visualization
- Payout history

### 6. History Screen

- List of completed rides
- Filter by date
- Ride details: Customer, route, fare, rating

### 7. Profile Screen

- Driver info (name, phone, rating)
- Vehicle details (model, plate, color)
- Documents status
- Settings: Language, Notifications
- Logout

## 🔧 Setup Commands

```bash
# Navigate to parent directory
cd d:\

# Create new Expo app
npx create-expo-app@latest iteka-ride-driver-app --template blank-typescript

# Navigate to project
cd iteka-ride-driver-app

# Install dependencies
npm install expo-router expo-font @expo-google-fonts/poppins
npm install react-native-safe-area-context react-native-screens
npm install react-native-maps react-native-gesture-handler
npm install react-native-reanimated react-native-svg
npm install @react-navigation/native
npm install zustand i18next react-i18next expo-localization
npm install @react-native-async-storage/async-storage
npm install lucide-react-native
npm install @gorhom/bottom-sheet
npm install axios

# Development dependencies
npm install -D @types/react @types/react-native
```

## 🌐 Translation Keys Structure

### Driver-Specific Keys

```json
{
  "driver_welcome": "Welcome Driver",
  "go_online": "Go Online",
  "go_offline": "Go Offline",
  "online": "Online",
  "offline": "Offline",
  "new_ride_request": "New Ride Request",
  "accept_ride": "Accept Ride",
  "decline_ride": "Decline",
  "start_trip": "Start Trip",
  "complete_trip": "Complete Trip",
  "earnings_today": "Today's Earnings",
  "total_rides": "Total Rides",
  "hours_online": "Hours Online",
  "customer_info": "Customer Information",
  "navigate": "Navigate",
  "arrived_pickup": "Arrived at Pickup",
  "trip_started": "Trip Started",
  "trip_completed": "Trip Completed",
  "earnings": "Earnings",
  "history": "History",
  "profile": "Profile",
  "vehicle_details": "Vehicle Details",
  "documents": "Documents",
  "rating": "Rating"
}
```

## 🎯 Next Steps

1. **Run setup commands** to create the project
2. **Copy base files** from client app:

   - `constants/Colors.ts`
   - `i18n/` folder structure
   - `components/common/CustomAlert.tsx`
   - `components/common/LanguageSwitcher.tsx`
   - `assets/iteka-ride-icon.png`

3. **Create driver-specific files** (I'll provide complete code)
4. **Test bilingual functionality**
5. **Add driver-specific features**

## 📝 Notes

- Drivers cannot self-register (admin only)
- Focus on ride acceptance workflow
- Real-time location tracking
- Earnings transparency
- Simple, efficient UI for driving

---

**Ready to proceed?** Let me know when you've created the project directory, and I'll provide all the complete file implementations!
