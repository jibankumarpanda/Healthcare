# Healthcare Backend API

Backend server for the Healthcare Management System with PDF OCR processing using Google Cloud Vision API.

## Features

- 🔐 **Clerk Authentication** - Secure user authentication
- 📄 **PDF Upload** - Upload PDF files (minimum 5MB)
- 🔍 **Google Cloud Vision OCR** - Extract text from PDF documents
- 💾 **MongoDB Database** - Store documents and OCR results
- 🚀 **RESTful API** - Clean and well-documented API endpoints

## Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- Google Cloud Vision API credentials
- Clerk account and API keys

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
   - Set your MongoDB connection string
   - Add Clerk API keys
   - Configure Google Cloud Vision credentials

## Google Cloud Vision Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Vision API
4. Create a service account and download the JSON credentials
5. Save the credentials as `google-credentials.json` in the backend folder
6. Or set the path in `.env`: `GOOGLE_APPLICATION_CREDENTIALS=./google-credentials.json`

## Running the Server

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /health
```

### Documents

#### Upload PDF
```
POST /api/documents/upload
Headers: Authorization: Bearer <clerk_token>
Body: multipart/form-data
  - pdf: PDF file (minimum 5MB)
```

#### Get All Documents
```
GET /api/documents
Headers: Authorization: Bearer <clerk_token>
Query params:
  - status: pending|processing|completed|failed
  - limit: number (default: 50)
  - page: number (default: 1)
```

#### Get Document by ID
```
GET /api/documents/:id
Headers: Authorization: Bearer <clerk_token>
```

#### Delete Document
```
DELETE /api/documents/:id
Headers: Authorization: Bearer <clerk_token>
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   └── Document.js          # Document schema
│   ├── middleware/
│   │   └── auth.js              # Clerk authentication middleware
│   ├── routes/
│   │   └── documentRoutes.js    # Document API routes
│   ├── services/
│   │   └── ocrService.js        # Google Cloud Vision OCR service
│   └── server.js                # Express server setup
├── uploads/                      # Uploaded PDF files
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment (development/production) | No |
| `MONGODB_URI` | MongoDB connection string | Yes |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key | Yes |
| `CLERK_SECRET_KEY` | Clerk secret key | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to Google credentials JSON | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | No (default: http://localhost:3000) |
| `MAX_FILE_SIZE` | Max file upload size in bytes | No (default: 10MB) |

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

## Security

- All document routes require Clerk authentication
- File uploads are validated for type and size
- User can only access their own documents
- File paths are not exposed in API responses

## License

ISC
