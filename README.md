# GrayKnight - Spotify Analytics & Controller

A web application that enhances your Spotify experience with detailed listening statistics and advanced playback controls.

## Features

### Live Music Control

- Real-time playback controls
- Multi-device management
- Queue management
- Volume and playback mode controls

![Image](https://github.com/user-attachments/assets/a3501e48-74db-454d-afa8-aefab7d88f5f)
![Image](https://github.com/user-attachments/assets/3092ac9c-f17f-4f10-9dc5-f7206a081785)
![Image](https://github.com/user-attachments/assets/87f0e21e-ef0b-4355-b46b-4779f99df96d)
![Image](https://github.com/user-attachments/assets/2d3136f8-5b69-490c-8e6a-a0a246994043)

### Detailed Analytics

- Track listening history
- Genre distribution analysis
- Peak listening hours
- Time-based statistics
- Artist diversity tracking

![Image](https://github.com/user-attachments/assets/587fb86c-0962-4010-b40b-237885d84ccb)
![Image](https://github.com/user-attachments/assets/de58f1a8-8bc1-4a1e-a345-6ffac9a5877c)
![Image](https://github.com/user-attachments/assets/5b3a7ae0-0e38-455d-bf33-6bea02db36da)

### Library Management

- User Top items
- User's playlist and dialogs

![Image](https://github.com/user-attachments/assets/975fc34e-3977-4baf-84c3-c1dcd5e1ec0a)

### Smart Features

- Offline tracking capability
- Background scrobbling
- Cross-device synchronization
- Listening pattern analysis
- ![Image](https://github.com/user-attachments/assets/3829d9bd-b172-48bf-937a-66237d39ede8)

## Technical Details

### Frontend

- Built with Next.js and Ts
- Responsive design with Tailwind CSS
- Clean and consitent UI.

### Backend

- NestJS
- PSQL with Prisma
- Efficient caching system (almost done)
- Spotify Web API integration

### Key Components

- User authentication and session management
- Real-time track scrobbling
- Artist genre caching
- Time-series data tracking
- Device state management

## Setup Guide

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL database

### Installation Steps

1. **Clone the Repository**

```bash
git clone https://github.com/qeqqe/GrayKnight-Remake.git
cd GrayKnight-Remake
```

2. **Install Dependencies**

```bash
pnpm install
```

3. **Environment Configuration**

- Copy `.env.example` to `.env` in both apps/client and apps/server
- Fill in required environment variables

4. **Start Development Servers**

```bash
# Start Frontend (from apps/client)
cd apps/client
pnpm run dev

# Start Backend (from apps/server)
cd apps/server
pnpm run start:dev
```
