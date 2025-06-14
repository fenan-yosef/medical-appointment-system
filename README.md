# Medical Appointment System

This is a full-stack medical appointment system built using **Next.js** for the frontend and **Express.js** for the backend. It integrates with MongoDB for data storage and provides features for managing appointments, users, notifications, and more.

## Features

- **User Roles**: Admin, Doctor, Patient, and Receptionist.
- **Authentication**: Secure login and registration using `next-auth`.
- **Appointments**: Book, manage, and track appointments.
- **Notifications**: Real-time notifications using Server-Sent Events (SSE).
- **Admin Dashboard**: Manage users, doctors, departments, and services.
- **Doctor Availability**: Manage doctor schedules and availability.
- **Patient Records**: Store and manage patient medical history.
- **Analytics**: View statistics and trends for appointments and users.

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [MongoDB](https://www.mongodb.com/) (local or cloud instance)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/medical-appointment-system.git
   cd medical-appointment-system
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory and configure the following environment variables:
   ```env
   MONGO_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   BOT_TOKEN=your_telegram_bot_token
   CHAT_ID=your_telegram_chat_id
   GEMINI_API_KEY=your_gemini_api_key
   ```

4. Run database migrations (if applicable):
   ```bash
   npm run migrate
   ```

---

## Running the Application

### Development

Start the development server for both the frontend and backend:

```bash
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend: [http://localhost:5000](http://localhost:5000)

### Production

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

---

## Project Structure

### Frontend (Next.js)

- **`app/`**: Contains the Next.js pages and components.
- **`components/`**: Reusable UI components.
- **`hooks/`**: Custom React hooks.
- **`lib/`**: Utility functions and services.
- **`middleware.ts`**: Middleware for handling authentication and other logic.

### Backend (Express.js)

- **`routes/`**: API routes for authentication, profiles, and more.
- **`models/`**: Mongoose models for MongoDB collections.
- **`lib/`**: Utility functions for database connections and services.

---

## API Endpoints

### Authentication

- **POST** `/api/auth/register`: Register a new user.
- **POST** `/api/auth/login`: Login a user.

### Appointments

- **GET** `/api/patients/appointments`: Fetch patient appointments.
- **POST** `/api/patients/appointments`: Create a new appointment.
- **PUT** `/api/patients/appointments/:id`: Update an appointment.
- **DELETE** `/api/patients/appointments/:id`: Cancel an appointment.

### Notifications

- **GET** `/api/notifications`: Fetch user notifications.
- **PUT** `/api/notifications/mark-all-as-read`: Mark all notifications as read.

### Admin

- **GET** `/api/admin/doctors`: Fetch all doctors.
- **POST** `/api/admin/doctors`: Create a new doctor.
- **GET** `/api/admin/patients`: Fetch all patients.
- **POST** `/api/admin/patients`: Create a new patient.

---

## Scripts

- **`npm run dev`**: Start the development server.
- **`npm run build`**: Build the application for production.
- **`npm run start`**: Start the production server.
- **`npm run lint`**: Run ESLint to check for code quality issues.

---

## Contributing

1. Fork the repository.
2. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add your message here"
   ```
4. Push to your branch:
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a pull request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
