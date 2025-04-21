# React FastAPI MySQL Application

This project is a full-stack application that combines a FastAPI backend with a React frontend and a MySQL database. 

## Project Structure

```
react-fastapi-mysql-app
├── backend
│   ├── app
│   │   ├── __init__.py
│   │   ├── main.py
│   │   ├── api
│   │   │   ├── __init__.py
│   │   │   ├── endpoints
│   │   │   │   ├── __init__.py
│   │   │   │   └── items.py
│   │   ├── core
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db
│   │   │   ├── __init__.py
│   │   │   ├── base.py
│   │   │   └── models.py
│   │   └── schemas
│   │       ├── __init__.py
│   │       └── item.py
│   ├── requirements.txt
│   └── README.md
├── frontend
│   ├── public
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src
│   │   ├── components
│   │   │   └── App.jsx
│   │   ├── services
│   │   │   └── api.js
│   │   ├── index.js
│   │   └── App.css
│   ├── package.json
│   └── README.md
└── README.md
```

## Backend

The backend is built using FastAPI and connects to a MySQL database. It includes:

- **API Endpoints**: Located in `backend/app/api/endpoints/`, these handle CRUD operations for items.
- **Database Models**: Defined in `backend/app/db/models.py`, these represent the data structure in the MySQL database.
- **Configuration**: Settings for the application can be found in `backend/app/core/config.py`.

## Frontend

The frontend is a React application that communicates with the FastAPI backend. It includes:

- **Main App Component**: Located in `frontend/src/components/App.jsx`, this is the core of the React application.
- **API Service**: Functions for making API calls to the backend are defined in `frontend/src/services/api.js`.
- **HTML and CSS**: The main HTML file and styles are located in `frontend/public/index.html` and `frontend/src/App.css`, respectively.

## Getting Started

1. Clone the repository.
2. Navigate to the `backend` directory and install the required dependencies using:
   ```
   pip install -r requirements.txt
   ```
3. Set up the MySQL database and update the configuration in `backend/app/core/config.py`.
4. Run the FastAPI application:
   ```
   uvicorn backend.app.main:app --reload
   ```
5. Navigate to the `frontend` directory and install the required dependencies using:
   ```
   npm install
   ```
6. Start the React application:
   ```
   npm start
   ```

## License

This project is licensed under the MIT License.