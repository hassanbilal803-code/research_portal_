# Research Opportunity Portal

**Student:** Hassan Bilal · **Student ID:** P229072

**GitHub repository:** https://github.com/hassanbilal803-code/research_portal_

A Python, MySQL, and React application for creating, viewing, editing, closing/reopening, and deleting university research opportunities. All records come from MySQL through the REST API. The frontend provides a searchable directory, status filters, sorting, complete details, validated forms, and success/error messages.

This version adapts the [original Research Opportunity Portal implementation](https://github.com/p240756-prog/research-opportunity-portal), with a different faculty workspace and a Python repository layer separating SQL persistence from HTTP routes.

## Requirements

- Python 3.10+
- MySQL Server 8.0.16+ with CLI or MySQL Workbench
- Node.js 22.12+ (or 20.19+) and npm
- Postman for importing and demonstrating the supplied collection

Python packages are pinned in `backend/requirements.txt`. React dependencies and their lockfile are in `frontend/`.

## Files

```text
hassan-research-portal/
  backend/
    app.py                 REST routes and JSON error responses
    database.py            Request-scoped MySQL connections
    repository.py          Parameterized database CRUD operations
    validation.py          Required fields, types, limits and calendar dates
    requirements.txt
  database/schema.sql
  frontend/
    src/                   React directory, dialogs, form and API client
    index.html
    package.json
    package-lock.json
    vite.config.js
  postman/Research-Opportunity-Portal.postman_collection.json
  .gitignore
  README.md
```

## Setup and run

Extract the ZIP and open PowerShell inside `hassan-research-portal`. Start your local MySQL server first.

### 1. Import the database schema

```powershell
mysql -u root -p
```

Enter your local MySQL password. At the MySQL prompt, run:

```sql
SOURCE database/schema.sql;
SHOW TABLES FROM research_portal_hassan;
exit;
```

If MySQL is not on PATH, open `database/schema.sql` in MySQL Workbench and execute the whole file. The script creates an empty `research_portal_hassan` database and table without deleting existing records.

### 2. Create private backend settings

Create `backend/.env` locally and set values matching your MySQL installation:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=replace_with_your_local_mysql_password
DB_NAME=research_portal_hassan
PORT=5000
```

Use your own local database account and password. Importing the schema requires CREATE permission; runtime CRUD requires SELECT, INSERT, UPDATE and DELETE on the opportunities table. `.env` is ignored and excluded from the ZIP. Do not publish passwords, tokens, or private environment files. No `.env.example` is needed.

### 3. Install and run Python

From the project directory:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe backend\app.py
```

Keep this terminal open. Visit http://127.0.0.1:5000/api/health and check for `database: connected`.

On macOS/Linux, use `python3 -m venv .venv`, `.venv/bin/python -m pip install -r backend/requirements.txt`, and `.venv/bin/python backend/app.py`.

### 4. Install and run React

In a second terminal in the project directory:

```powershell
cd frontend
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. The Vite `/api` proxy forwards requests to Python on port 5000. Both servers and MySQL must remain running. If PowerShell blocks `npm.ps1`, use `npm.cmd ci` and `npm.cmd run dev`.

The initial directory is empty. Create records using the web form or Postman; no demonstration data is automatically inserted.

### Optional built frontend

Run `npm run build` inside `frontend`. Then start Python as above and visit **http://127.0.0.1:5000**. Flask serves the built React assets and API together. `npm run preview` only previews static assets; use Flask for the working built application.

## API

Base URL: `http://127.0.0.1:5000`.

| Method | Endpoint                 | Success                            |
| ------ | ------------------------ | ---------------------------------- |
| POST   | `/api/opportunities`     | 201 Created                        |
| GET    | `/api/opportunities`     | 200 OK, JSON array                 |
| GET    | `/api/opportunities/:id` | 200 OK, complete record            |
| PUT    | `/api/opportunities/:id` | 200 OK, updated record             |
| DELETE | `/api/opportunities/:id` | 200 OK, deletion confirmation      |
| GET    | `/api/health`            | 200 OK, database connection status |

POST and PUT require `Content-Type: application/json` and all nine editable fields:

```json
{
  "title": "Wireless Coverage Study",
  "description": "Evaluate signal quality and latency across campus wireless networks.",
  "research_area": "Computer Networks",
  "faculty_name": "Dr. Omar Saeed",
  "department": "Computer Science",
  "required_skills": "Python, Wireshark, TCP/IP",
  "available_positions": 3,
  "application_deadline": "2027-06-30",
  "status": "Open"
}
```

Use the response's generated `id` in URLs. For PUT, send all nine fields without `id`, `created_at`, or `updated_at`. Set `status` to `Closed` to close an opportunity, or `Open` to reopen it.

Invalid or missing fields return **400** with field-level messages. Text must be nonempty and within the schema limits; positions must be a JSON integer from 1 to 1000; deadlines must be real dates in `YYYY-MM-DD`; status must be exactly `Open` or `Closed`. Unknown fields and malformed JSON are rejected. Missing/deleted records return **404**. Database/server failures return a readable **500** JSON message without credentials. Past deadlines are permitted for historical records. MySQL values are parameterized and updates use a row lock while writing.

## Postman demonstration and export

Start MySQL and Python, then import `postman/Research-Opportunity-Portal.postman_collection.json` into Postman. Its `baseUrl` variable is `http://127.0.0.1:5000`. No separate environment or credentials are required. Run once, in the numbered order; response scripts automatically capture the generated IDs.

| TA requirement                      | Request(s) | Expected result                                |
| ----------------------------------- | ---------- | ---------------------------------------------- |
| Create three research opportunities | 01–03      | Three 201 responses with unique IDs            |
| Retrieve all                        | 04         | 200; all three created IDs present             |
| Retrieve one by ID                  | 05         | 200; complete details of the first record      |
| Update an existing record           | 06         | 200; changed title, skills and positions       |
| Change Open to Closed               | 07         | 200; status becomes Closed                     |
| Delete a record                     | 08         | 200; third record removed                      |
| Request the deleted ID              | 09         | 404 Not Found                                  |
| Invalid or missing data             | 10         | 400; missing title and invalid values rejected |

