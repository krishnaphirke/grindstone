# ⚔️ Grindstone

### sharpen your competitive edge.

A full-stack competitive programming tracker built for serious grinders. Log problems, track your daily practice with a GitHub-style heatmap, schedule revisions with spaced repetition, and monitor your contest rating over time.

![Dashboard](https://raw.githubusercontent.com/krishnaphirke/grindstone/refs/heads/main/screenshots/screenshot-dashboard.png)

---

## 🤔 What is Grindstone?

Grindstone is a personal productivity tool built for competitive programmers. Most CP grinders track problems in scattered notes, spreadsheets, or just memory. Grindstone gives you one clean place to log everything, revisit what you've forgotten, and actually see your progress over time.

Built from scratch with Java, SpringBoot, PostgreSQL, and React.

---

## ✨ Features

- 🟩 **Activity Heatmap** — GitHub-style grid showing your daily solve activity over the last 6 months. More problems = darker green.
- 📚 **Problem Library** — Log problems with title, platform, topic, approach, difficulty, status, URL, and notes. Filter by any combination.
- 🔁 **Spaced Repetition Revision Queue** — Problems marked for review are automatically scheduled using spaced repetition intervals (1 day, 3 days, 7 days, 14 days). The dashboard shows how many are due today.
- 🏆 **Contest Log** — Log every contest with platform, rank, problems solved, and rating change. A cumulative rating chart shows your progression over time.
- 📊 **Dashboard** — At-a-glance stats: total solved, daily streak, due for review, topic-wise bar chart, and difficulty split pie chart.

---

## 📸 Screenshots

### 📋 Problem Library
![Problems](https://raw.githubusercontent.com/krishnaphirke/grindstone/refs/heads/main/screenshots/screenshot-problems.png)

### 🔁 Revision Queue
![Revision Queue](https://raw.githubusercontent.com/krishnaphirke/grindstone/refs/heads/main/screenshots/screenshot-revision.png)

### 🏆 Contest Log
![Contest Log](https://raw.githubusercontent.com/krishnaphirke/grindstone/refs/heads/main/screenshots/screenshot-contests.png)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 21, Spring Boot 3, Spring Data JPA |
| Database | PostgreSQL |
| Frontend | React, Vite, Recharts, Axios |
| Build Tool | Maven |

---

## 🚀 Running Locally

### Prerequisites
- Java 21
- Maven
- PostgreSQL
- Node.js 18+

### Backend

```bash
cd backend
```

Create a PostgreSQL database:
```sql
CREATE DATABASE cp_tracker;
```

Update `src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/cp_tracker
spring.datasource.username=your_username
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
server.port=8080
```

Run the backend:
```bash
./mvnw spring-boot:run
```

Backend runs at `http://localhost:8080`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/problems` | Get all problems |
| POST | `/api/problems` | Add a problem |
| DELETE | `/api/problems/{id}` | Delete a problem |
| PATCH | `/api/problems/{id}/status` | Update problem status |
| PATCH | `/api/problems/{id}/reviewed` | Mark as reviewed (advances spaced repetition) |
| GET | `/api/problems/due-today` | Get problems due for revision today |
| GET | `/api/problems/filter` | Filter by topic, difficulty, or status |
| GET | `/api/problems/heatmap` | Get date-wise problem counts |
| GET | `/api/problems/dashboard` | Get dashboard stats |
| GET | `/api/contests` | Get all contests |
| POST | `/api/contests` | Log a contest |
| DELETE | `/api/contests/{id}` | Delete a contest |

---

## 🗺️ Roadmap

- [ ] Target problem goal with weekly progress ring
- [ ] Weakness radar chart across topics
- [ ] Built-in solve timer per problem
- [ ] Export problem list to CSV
- [ ] Difficulty progression chart over time

---

## 👤 Author

**Krishna Yuvaraj Phirke**
First-year Computer Engineering student at TSEC, Mumbai University.

[![LinkedIn](https://img.shields.io/badge/LinkedIn-krishnayuvarajphirke-blue?style=flat&logo=linkedin)](https://www.linkedin.com/in/krishnayuvarajphirke)
[![GitHub](https://img.shields.io/badge/GitHub-krishnaphirke-black?style=flat&logo=github)](https://github.com/krishnaphirke)
[![LeetCode](https://img.shields.io/badge/LeetCode-krishnaphirke-orange?style=flat&logo=leetcode)](https://leetcode.com/u/krishnaphirke)
