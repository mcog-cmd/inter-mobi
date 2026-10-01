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

### 4.0 Prerequisites

| Tool | Version | Used for |
|---|---|---|
| Java (JDK) | 17 | Backend |
| Node.js + npm | 22+ | Frontend |
| PostgreSQL + PostGIS | any recent version | Database |

Maven does not need to be installed: the backend ships with the Maven Wrapper (`./mvnw`), which downloads the right Maven version automatically on first use.

Check what you already have:

```bash
java -version      # should print 17.x
node -v            # should print v22.x or newer
npm -v
psql --version
```

Install whatever is missing.

**Ubuntu / Debian**

```bash
sudo apt update
sudo apt install openjdk-17-jdk
```

Install Node.js 22 with [nvm](https://github.com/nvm-sh/nvm) (the `apt` package is usually outdated):

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
```

PostgreSQL and PostGIS are installed in the next step.

**macOS (Homebrew)**

```bash
