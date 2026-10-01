# Inter-Mobi

## 1. What is Inter-Mobi?

Inter-Mobi is an MVP of a real-estate platform where lands are listed and searched **directly on an interactive map**.

- **Register a land:** the user draws the land polygon on the map and fills in a short form (total price, description and contact). The system rejects the registration if the new polygon overlaps an existing land.
- **Search lands:** the user draws a search circle with the mouse, seeing the radius update while dragging. Only lands that intersect the circle are rendered.
- **View details:** clicking a land on the map opens a popup with its information.

---

## 2. How it works

### Architecture

```
Browser (React + OpenLayers)
        │  GeoJSON over HTTP
        ▼
Nginx (:3000) ──▶ Spring Boot API (:8080) ──▶ PostgreSQL + PostGIS
```

The frontend draws and displays geometries, the backend exposes the API, and PostGIS stores the lands and runs the spatial queries.

### Data flow

**Registering a land**

1. The user draws a polygon with the OpenLayers `Draw` interaction and fills in the form.
2. The frontend sends the geometry as **GeoJSON (EPSG:4326)** plus the form fields to `POST /api/lands`.
3. The backend validates the payload and converts the GeoJSON into a JTS geometry.
4. PostGIS checks whether the polygon overlaps an existing land. If so, the API rejects the request; otherwise the land is saved.

**Searching lands**

1. The user draws a circle with the mouse; the radius is shown dynamically.
2. The circle is converted to a polygon and sent as GeoJSON to `POST /api/lands/search`.
3. The backend runs a PostGIS query and returns only the lands that intersect that area.
4. The frontend renders the results on the map; clicking one opens the details popup (`GET /api/lands/{id}`).

### Technical solutions

- **GeoJSON** is the format used to exchange geometries between frontend and backend.
- **PostGIS** validates overlaps and searches by area with native spatial functions (`ST_Intersects`, `ST_Touches`), backed by a spatial index.
- **Flyway** creates the database schema automatically when the backend starts.

---

## 3. Running with Docker

**Requirements:** Docker and Docker Compose. No need to install Java, Maven, Node.js or PostgreSQL.

**1. Clone the repository**

```bash
git clone <REPOSITORY_URL>
cd inter-mobi
```

**2. Start the application**

```bash
docker compose up -d --build
```

Alternatively, use the helper script, which runs the same command and prints the application URL:

```bash
chmod +x start.sh
./start.sh
```

On the first run, Docker creates the PostgreSQL + PostGIS database, runs the Flyway migrations, builds the backend and the frontend, and starts Nginx and all services.

> No `.env` file is needed with Docker. The frontend is built with `VITE_API_URL=/api` by default, and Nginx proxies `/api` to the backend.

**3. Open the application**

http://localhost:3000/

This is the only URL needed. The API and internal services do not have to be accessed directly.

**Useful commands**

```bash
docker compose ps                 # check the services
docker compose logs -f            # follow all logs
docker compose logs -f backend    # backend logs only
docker compose logs -f frontend   # frontend logs only
docker compose logs -f db         # database logs only
docker compose down               # stop the application (data is kept)
```

**Reset everything, including the database**

```bash
docker compose down -v
docker compose up -d --build
```

> Warning: `docker compose down -v` removes the PostgreSQL volume and deletes all stored data.

---

## 4. Running without Docker

The services run separately: PostgreSQL + PostGIS → Backend → Frontend.

**Requirements:** Java 17, Maven 3.9+, Node.js 22+ with npm, PostgreSQL and PostGIS.

### 4.1 Database

The SQL commands below must be run **inside the PostgreSQL shell (`psql`)**, not in the regular terminal.

**1. Install PostgreSQL and PostGIS (skip if already installed)**

On Ubuntu/Debian:

```bash
sudo apt update
sudo apt install postgresql postgis
sudo systemctl start postgresql
```

On other systems, install PostgreSQL and PostGIS with your package manager or from their official websites. The installation creates the `postgres` superuser used in the next step.

**2. Open `psql` as the PostgreSQL superuser**

```bash
sudo -u postgres psql
```

**3. Create the database and the application user**

```sql
CREATE DATABASE inter_mobi;
CREATE USER inter_mobi_user WITH PASSWORD 'inter_mobi_pass';
GRANT ALL PRIVILEGES ON DATABASE inter_mobi TO inter_mobi_user;
```

**4. Connect to the new database and enable PostGIS**

First, connect to the database (run this command **alone**, before pasting anything else):

```sql
\c inter_mobi
```

Then run:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
GRANT ALL ON SCHEMA public TO inter_mobi_user;
```

**5. Exit `psql`**

```sql
\q
```

Tables do not need to be created manually: Flyway runs the migrations when the backend starts.

### 4.2 Backend

```bash
cd backend
mvn spring-boot:run
```

The backend connects to PostgreSQL with these settings:

| Setting | Value |
|---|---|
| Host | `localhost` |
| Port | `5432` |
| Database | `inter_mobi` |
| User | `inter_mobi_user` |
| Password | `inter_mobi_pass` |

The API starts on http://localhost:8080.

### 4.3 Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the address printed by Vite, usually http://localhost:5173/.

By default the frontend calls `/api`, which the Vite dev server proxies to `http://localhost:8080`, so no extra configuration is needed.

**Optional:** to make the frontend call the backend directly instead of going through the proxy, create a local `.env` from the example file:

```bash
cp .env.example .env
```

The `.env.example` file contains:

```env
VITE_API_URL=http://localhost:8080
```

The `.env` file is not versioned. Restart `npm run dev` after creating or changing it.

---

## 5. Running the tests and coverage

The project requires **more than 80% test coverage** on both the backend and the frontend.

### Backend (unit and integration tests, JaCoCo)

```bash
cd backend
mvn clean verify
```

This runs all tests, generates the coverage report and fails the build if coverage is below 80%.

Open the report at:

```
backend/target/site/jacoco/index.html
```

### Frontend (unit tests with coverage)

```bash
cd frontend
npm install
npm run test:coverage
```

Open the report at:

```
frontend/coverage/index.html
```

### Coverage summary

| Module | Tool | HTML report |
|---|---|---|
| Backend | JaCoCo | `backend/target/site/jacoco/index.html` |
| Frontend | Jest | `frontend/coverage/index.html` |
