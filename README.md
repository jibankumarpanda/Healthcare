# MediOps - Healthcare Management System

A comprehensive healthcare management system with AI-powered PDF OCR processing, predictive analytics, and real-time monitoring.

## 🌟 Features

### Core Features
- **🔐 Clerk Authentication** - Secure user authentication and session management
- **📄 PDF Upload & OCR** - Upload medical documents (5MB-10MB) and extract text using Google Cloud Vision API
- **💾 MongoDB Database** - Store documents, OCR results, and extracted medical data
- **📊 Dashboard** - Real-time healthcare analytics and document management
- **🔍 Data Extraction** - Automatic extraction of medical terms, dates, emails, and phone numbers
- **📈 Predictive Analytics** - Patient volume forecasting and air quality correlation
- **🎨 Modern UI** - Beautiful, responsive design with dark mode support

### Technical Features
- **Next.js 15** - React framework with App Router
- **Express.js Backend** - RESTful API with async OCR processing
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Radix UI** - Accessible component primitives

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Cloud Platform account (for Vision API)
- Clerk account (for authentication)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd healthcare-landing
```

2. **Backend Setup**
```bash
cd backend
npm install

# Create .env file (see backend/.env.example)
cp .env.example .env

# Add your credentials to .env
# - MongoDB URI
# - Clerk API keys
# - Google Cloud Vision credentials

# Start the backend server
npm run dev
```

3. **Frontend Setup**
```bash
cd frontend
npm install

# Create .env.local file (see frontend/.env.example)
cp .env.example .env.local

# Add your credentials to .env.local
# - Clerk API keys
# - Backend API URL

# Start the frontend
npm run dev
```

4. **Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📚 Documentation

### Key Documentation
- [Backend API Documentation](./backend/README.md)
- [Quick Start Guide](./QUICKSTART.md)
- Environment configuration examples in `.env.example` files

## 🏗️ Project Structure

```
healthcare-landing/
├── backend/                    # Express.js backend
│   ├── src/
│   │   ├── config/            # Database configuration
│   │   ├── models/            # MongoDB schemas
│   │   ├── middleware/        # Authentication middleware
│   │   ├── routes/            # API routes
│   │   ├── services/          # OCR and business logic
│   │   └── server.js          # Express server
│   ├── uploads/               # Uploaded PDF files
│   └── package.json
│
├── frontend/                   # Next.js frontend
│   ├── app/                   # App router pages
│   │   ├── dashboard/         # Dashboard with analytics
│   │   ├── upload/            # PDF upload interface
│   │   ├── predictions/       # Predictive analytics
│   │   └── resources/         # Resource management
│   ├── components/            # React components
│   ├── lib/                   # Utilities and API client
│   ├── middleware.ts          # Clerk route protection
│   └── package.json
│
├── SETUP.md                   # Detailed setup guide
└── README.md                  # This file
```

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthcare-db
CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key
CLERK_SECRET_KEY=your_secret
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## 🎯 Usage

### Upload PDF Documents
1. Sign in to your account
2. Navigate to "Upload PDF"
3. Drag and drop or select a PDF file (5MB-10MB)
4. Wait for OCR processing to complete
5. View results on the dashboard

### View Dashboard
- Real-time healthcare metrics
- Patient volume forecasts
- Air quality correlation
- Processed documents with extracted data
- Active alerts and notifications

### API Endpoints

```bash
# Health check
GET /health

# Upload PDF
POST /api/documents/upload
Headers: Authorization: Bearer <token>
Body: multipart/form-data with 'pdf' field

# Get all documents
GET /api/documents
Headers: Authorization: Bearer <token>

# Get specific document
GET /api/documents/:id
Headers: Authorization: Bearer <token>

# Delete document
DELETE /api/documents/:id
Headers: Authorization: Bearer <token>
```

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 15.2.4
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI, shadcn/ui
- **Charts**: Recharts
- **Authentication**: Clerk
- **State Management**: React Hooks

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: Clerk SDK
- **OCR**: Google Cloud Vision API
- **File Upload**: Multer

## 📦 Dependencies

### Key Frontend Dependencies
- `@clerk/nextjs` - Authentication
- `next` - React framework
- `recharts` - Data visualization
- `@radix-ui/*` - UI primitives
- `tailwindcss` - Styling

### Key Backend Dependencies
- `express` - Web framework
- `mongoose` - MongoDB ODM
- `@clerk/clerk-sdk-node` - Authentication
- `@google-cloud/vision` - OCR processing
- `multer` - File uploads

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚢 Deployment

### Backend
- Deploy to Railway, Render, or Heroku
- Set environment variables
- Connect to MongoDB Atlas
- Configure Google Cloud credentials

### Frontend
- Deploy to Vercel or Netlify
- Set environment variables
- Update Clerk redirect URLs
- Update CORS settings in backend

## 🔒 Security

- All routes protected with Clerk authentication
- File upload validation (type and size)
- User-scoped data access
- Secure credential management
- CORS configuration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

ISC

## 🆘 Support

For setup help, see [SETUP.md](./SETUP.md)

For API documentation, see [backend/README.md](./backend/README.md)

## 🙏 Acknowledgments

- Clerk for authentication
- Google Cloud Vision for OCR
- MongoDB for database
- Vercel for Next.js framework