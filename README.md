# Intelligent Research Assistant using RAG and LLMs

## Project Overview

The Intelligent Research Assistant is a Retrieval-Augmented Generation (RAG) based web application that allows users to securely upload research documents, organize them into projects, and interact with them through an AI-powered chatbot.

Unlike traditional AI chatbots, this system retrieves relevant information from user-uploaded documents using semantic search (FAISS + Sentence Transformers) before generating responses using an LLM. The platform supports multiple users with isolated workspaces, secure authentication, project management, document management, and persistent chat history.

---

## Features

### User Authentication

* User Registration
* User Login
* JWT Token-based Authentication
* Password Hashing
* Protected APIs

### Project Management

* Create Projects
* View Projects
* Delete Projects

### Document Management

* Upload PDF, DOCX and TXT files
* Metadata Extraction
* Duplicate File Detection
* File Size Validation
* Corrupted File Detection
* Delete Documents
* Automatic FAISS Index Rebuilding

### Retrieval-Augmented Generation (RAG)

* Document Text Extraction
* Recursive Text Chunking
* Embedding Generation using Sentence Transformers
* FAISS Vector Search
* Semantic Retrieval
* Prompt Construction
* LLM Response Generation using Groq API

### AI Chat

* Streaming Responses
* Multiple Conversations
* Persistent Chat History
* Conversation Titles
* Conversation Resume

### Security

* JWT Authentication
* User-wise Document Isolation
* User-wise Project Isolation
* Protected APIs

---

## Tech Stack

### Frontend

* React.js
* Tailwind CSS
* Axios

### Backend

* FastAPI
* Python

### Database

* MySQL

### AI Technologies

* Retrieval-Augmented Generation (RAG)
* Sentence Transformers
* FAISS
* Groq LLM (Llama-3.1-8B)

### Libraries

* PyMuPDF
* python-docx
* LangChain Text Splitters
* NumPy
* FAISS
* JWT
* Passlib

---

## Folder Structure

backend/

* main.py
* rag_pipeline.py
* retriever.py
* chunker.py
* rebuild_faiss.py
* embedding_generator.py
* process_document.py
* update_faiss.py

frontend/

* React Application

documents/

* raw_text/
* clean_text/

uploads/

research_index.faiss

chunks.pkl

---

## Project Workflow

1. User Registration/Login
2. JWT Authentication
3. Create Project
4. Upload Documents
5. Extract Text
6. Store Clean Text
7. Chunk Documents
8. Generate Embeddings
9. Store Vectors in FAISS
10. User asks Question
11. Semantic Retrieval
12. Prompt Construction
13. LLM Response
14. Save Conversation History

---

## Installation

### Clone Repository

git clone <repository-url>

### Backend

cd backend

pip install -r requirements.txt

### Frontend

cd frontend

npm install

---

## Environment Variables

Create a `.env` file with:

GROQ_API_KEY=YOUR_API_KEY

DB_HOST=localhost

DB_USER=root

DB_PASSWORD=your_password

DB_NAME=research_assistant

SECRET_KEY=your_secret_key

---

## Database Setup

1. Create MySQL Database.
2. Import schema.sql.
3. Update .env credentials.

---

## Run Backend

uvicorn main:app --reload

---

## Run Frontend

npm run dev

---

## Sample Usage

1. Register/Login
2. Create Project
3. Upload Research Documents
4. Ask Questions
5. View AI Responses
6. Resume Previous Conversations

---

## Future Improvements

* OCR Support
* Image-based Document Understanding
* Multi-document Summarization
* Citation Generation
* Hybrid Search
* Cloud Storage Integration

---

## Author

Dheeraj Kumar

Summer Internship Project – 2026
