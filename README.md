# Labrooms Distributed 

**Labrooms Distributed** is the microservices + distributed systems implementation of [Labrooms](https://github.com/<your-normal-labrooms-repo>), a real-time collaborative platform for students to share **code, files, links, and whiteboards** inside temporary rooms.  

This repo is structured as a **monorepo** containing multiple independent services (chat, file sharing, whiteboard, gateway, etc.), all tied together through distributed system principles such as **load balancing, replication, fault tolerance, and failover**.

---

## 🚀 Features
- Real-time chat (WebSockets / Socket.IO)
- File uploads via Cloudinary + metadata in MongoDB
- Collaborative whiteboard (WebRTC / Socket)
- API Gateway for load balancing + failover
- Backup server for redundancy
- Shared libraries for DB, logging, and auth
- Configurable with environment-based settings
- Deployable on **Render (free tier)** + **Vercel** for frontend

---

## 📂 Repository Structure



---

## ⚡ Tech Stack
- **Frontend** → React (Vercel)
- **Backend** → Node.js + Express
- **Database** → MongoDB Atlas
- **File Storage** → Cloudinary
- **Cache / Pub-Sub (optional)** → Redis
- **Gateway** → Custom Node.js load balancer
- **Hosting** → Render (free tier for services)

---

## 🏗️ Setup & Development
### 1. Clone the repo
```bash
git clone https://github.com/TanishqMSD/Distributed-Labrooms.git
cd Distributed-Labrooms
