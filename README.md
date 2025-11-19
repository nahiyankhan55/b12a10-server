# B12A10 Server

# For: B12A10 - IE Hub - Import Export Hub

## Links:

- **Live Site:** [https://b12a10-nahiyan-ieh.netlify.app/](https://b12a10-nahiyan-ieh.netlify.app/)
- **Client Repo:** [https://github.com/nahiyankhan55/b12a10-web](https://github.com/nahiyankhan55/b12a10-web)

---

## ✅ **Features**

### **🔗 API Endpoints**

- Add / Get / Update / Delete Products
- Import Products (with quantity validation & stock update)
- Get Import history per user
- Get Export entries per user
- Search support on products, imports, and exports

### **Database**

- MongoDB (Native Driver)
- Collections:

  - `export`
  - `import`

---

## 🛠 **Tech Stack**

- Node.js
- Express.js
- MongoDB (Native driver)
- Dotenv
- CORS

---

## 📦 Dependencies

```json
 "dependencies": {
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "mongodb": "^7.0.0"
  }
```

---

## ⚙️ **Installation Process**

Follow the steps below to run the backend locally.

---

### **1️⃣ Clone the Repository**

```bash
git clone https://github.com/nahiyankhan55/b12a10-server
cd b12a10-server
```

---

### **2️⃣ Install Dependencies**

```bash
npm install
```

---

### **3️⃣ Create Environment Variables**

Create a `.env` file in the root directory:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DB_NAME=ieh
```

> ⚠️ Make sure your MongoDB connection string includes the correct username/password (if required).

---

### **4️⃣ Start the Server**

```bash
node index.js
```

or, if you use nodemon:

```bash
nodemon index.js
```

---

### **5️⃣ Test API Endpoints**

Once the server is running, open:

```
http://localhost:5000
```

You can test endpoints using:

- Postman
- Thunder Client (VS Code)
- Browser (for GET routes)

---
