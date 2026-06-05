# ⚡ IssueTracker - Smart AI-Powered Resolution Hub

IssueTracker is a production-ready, highly interactive **Online Complaint & Issue Tracker System** designed with modern glassmorphism aesthetics. It leverages low-latency local Natural Language Processing (NLP) to automate issue tagging, estimate urgency, and assist administrators with smart templates.

---

## 🚀 Key Features

### 🧠 1. Local AI Classifier (NLP Engine)
- **Real-Time Client-Side Auto-Tagging**: Predicts and pre-selects the issue's **Category** (Technical, Billing, Account, Feedback) and **Priority Level** (High, Medium, Low) instantly as the user types.
- **Urgency Indicator**: Computes a dynamic urgency index using keyword vectors and sentiment metrics, rendered via a sleek gradient fill bar.
- **Offline & Zero Latency**: The classification engine runs entirely locally in JavaScript (both frontend and backend)—resulting in zero network delay, zero API billing, and complete privacy.

### 🔍 2. User Tracking Portal
- **Real-time Status Updates**: Allows users to input their unique Complaint ID or email address to view a live status timeline.
- **Admin Feedback**: Users can instantly see official comments or resolution responses provided by the administration team.

### ⚙️ 3. Premium Admin Dashboard
- **Interactive Metrics Grid**: Live tracking cards showing total, pending, resolved, and rejected cases.
- **AI-Driven Sorting**: Prioritizes complaints based on an calculated **AI Urgency Score**, ensuring critical issues float to the top automatically.
- **Smart Resolution Templates**: Recommends pre-composed template responses matching the issue category (e.g., refund policies for billing, credentials reset for account locks) to resolve tickets with a single click.

### 📂 4. Lightweight Data Persistence
- Stores complaints inside `data/complaints.json`, securing submissions and status logs across server restarts.

---

## 🛠️ Tech Stack & Architecture

- **Frontend**: Vanilla HTML5, CSS3 (Custom design system variables with glowing effects & glassmorphism), Vanilla JavaScript.
- **Backend**: Node.js & Express.js (RESTful API architecture).
- **Database**: Local JSON-based persistent file system.

---

## 💻 Installation & Setup

Follow these steps to set up and run the project locally:

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed (v16.x or higher is recommended).

### 2. Clone the Repository
```bash
git clone https://github.com/phanindra267/Online-Complaint-Issue-Tracker-System.git
cd Online-Complaint-Issue-Tracker-System
```

### 3. Install Dependencies
Install the required packages (`express`, `cors`, `body-parser`):
```bash
npm install
```

### 4. Run the Server
Start the development server:
```bash
npm start
```

The server will initialize and output:
```text
Server is running on http://localhost:3000
```

---

## 🧪 Running Tests
Verify backend API compliance and route structures using the built-in test harness:
```bash
node verify_backend.js
```

---

## 🔐 Credentials & Default Access

- **Client Portal**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/login.html](http://localhost:3000/login.html)
  - **Username**: `admin`
  - **Password**: `admin123`
