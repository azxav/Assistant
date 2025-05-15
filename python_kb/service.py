from fastapi import FastAPI, HTTPException, Query, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from python_kb.supavec import get_supabase_client
from python_kb.indexing import DocumentIndexer
import python_kb.supavec as supavec  # access google_client
import os
import traceback
import time
from unittest.mock import MagicMock

# Set up application
app = FastAPI(
    title="Knowledge Base API",
    description="API for indexing documents and searching with RAG using Gemini",
    version="0.1.0",
    docs_url="/",  # Swagger UI at root path
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods 
    allow_headers=["*"],  # Allow all headers
)

# Initialize indexer with retry logic
try:
    indexer = DocumentIndexer(get_supabase_client(), index_name="kb")
except Exception as e:
    print(f"⚠️ Error initializing DocumentIndexer: {e}")
    print("⚠️ Will retry once more after a brief delay...")
    time.sleep(2)
    try:
        indexer = DocumentIndexer(get_supabase_client(), index_name="kb")
    except Exception as e:
        print(f"⚠️ Error on second attempt to initialize DocumentIndexer: {e}")
        print("⚠️ Creating indexer without Supabase persistence.")
        # Create a dummy client if all else fails
        dummy_client = MagicMock()
        indexer = DocumentIndexer(dummy_client, index_name="kb")

# Set up documents directory
DOCS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs')
os.makedirs(DOCS_DIR, exist_ok=True)

class PathRequest(BaseModel):
    path: str
    metadata: Optional[Dict[str, Any]] = None
    max_chunks: Optional[int] = None

class SearchRequest(BaseModel):
    query: str
    limit: Optional[int] = 5

class AskRequest(BaseModel):
    question: str  
    max_context: Optional[int] = 5
    model_name: Optional[str] = "gemini-2.0-flash"
    use_knowledge_base: Optional[bool] = True

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/index-file")
async def index_file(req: PathRequest):
    """Index a file by path, creating embeddings and storing them."""
    try:
        print(f"Indexing file: {req.path}")
        result = indexer.index_file(req.path, metadata=req.metadata, max_chunks=req.max_chunks)
        return result if isinstance(result, dict) else {"indexed": req.path, "success": True}
    except Exception as e:
        print(f"Error indexing file {req.path}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"error": str(e), "path": req.path})

@app.post("/index-directory")
async def index_directory(req: PathRequest):
    """Index all files in a directory."""
    try:
        print(f"Indexing directory: {req.path}")
        indexer.index_directory(req.path, metadata=req.metadata, max_chunks=req.max_chunks)
        return {"indexed_directory": req.path, "success": True}
    except Exception as e:
        print(f"Error indexing directory {req.path}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"error": str(e), "path": req.path})

@app.post("/search")
async def search(req: SearchRequest):
    """Find similar documents based on semantic similarity."""
    try:
        print(f"Searching for: {req.query}")
        results = indexer.search_similar(req.query, limit=req.limit)
        return {"results": results, "query": req.query}
    except Exception as e:
        print(f"Error during search: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"error": str(e)})

@app.post("/ask")
async def ask(req: AskRequest):
    """Answer questions using RAG with retrieved context from the knowledge base, or directly if specified."""
    try:
        print(f"Question received: '{req.question}', Model: {req.model_name}, Use KB: {req.use_knowledge_base}")
        
        context_text = ""
        sources = []

        if req.use_knowledge_base:
            print(f"Performing knowledge base search for question: {req.question}")
            results = indexer.search_similar(req.question, limit=req.max_context)
            if not results:
                # If KB is enabled but no results, we can either say "I don't know from KB" 
                # or let the model answer from its general knowledge. For now, let's inform.
                # However, the prompt below will instruct the model to rely on context if provided.
                print("No relevant context found in knowledge base.")
                # To make the model answer from general knowledge if no context, an empty context_text is fine.
            else:
                context_blocks = []
                for i, result in enumerate(results):
                    context_blocks.append(f"[Document {i+1}] {result['content']}")
                    sources.append({
                        "content": result["content"][:200] + "..." if len(result["content"]) > 200 else result["content"],
                        "file_path": result["file_path"],
                        "metadata": result["metadata"],
                        "similarity_score": result["similarity_score"]
                    })
                context_text = "\n\n".join(context_blocks)
        else:
            print("Knowledge base use is disabled for this query.")

        # Construct prompt
        if req.use_knowledge_base and context_text:
            prompt = f"""You are a helpful assistant. Please answer the following question using ONLY the context provided below. If the answer isn't in the context, say you don't have enough information from the provided documents and then you can use your general knowledge if you deem it appropriate.

CONTEXT:
{context_text}

QUESTION: {req.question}

ANSWER:"""
        elif req.use_knowledge_base and not context_text: # KB was enabled, but no context found
             prompt = f"""You are a helpful assistant. No specific context was found in the knowledge base for the following question. Please answer the question using your general knowledge.

QUESTION: {req.question}

ANSWER:"""
        else: # Knowledge base use is disabled
            prompt = f"""You are a helpful assistant. Please answer the following question using your general knowledge.

QUESTION: {req.question}

ANSWER:"""
        
        print(f"Generated prompt (first 100 chars): {prompt[:100]}...")

        # Call Gemini
        try:
            if not supavec.google_client or isinstance(supavec.google_client, MagicMock):
                return {
                    "answer": "I can't answer because Google AI is not properly configured. Please set GOOGLE_API_KEY in the .env file.",
                    "sources": sources # Return sources even if AI fails, if they were retrieved
                }
                
            response = supavec.google_client.models.generate_content(
                model=req.model_name,
                contents=[prompt]
            )
            
            return {
                "answer": response.text,
                "sources": sources # only non-empty if use_knowledge_base was true and results found
            }
        except Exception as e:
            print(f"Error calling Gemini model: {e}")
            traceback.print_exc() # Print full traceback for Gemini errors
            return {
                "answer": f"I encountered an error while trying to contact the AI model: {str(e)}",
                "sources": sources
            }
            
    except Exception as e:
        print(f"Error processing question: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"error": str(e)})

@app.post("/delete-index")
async def delete_index(req: PathRequest):
    """Delete all embeddings for a specific file."""
    try:
        print(f"Deleting index for: {req.path}")
        indexer.delete_index(req.path)
        return {"deleted": req.path, "success": True}
    except Exception as e:
        print(f"Error deleting index for {req.path}: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"error": str(e)})

def background_indexing(file_path: str):
    """Background task to index a file after upload."""
    try:
        print(f"Starting background indexing of {file_path}")
        indexer.index_file(file_path)
        print(f"Successfully indexed {file_path} in background")
    except Exception as e:
        print(f"Error in background indexing of {file_path}: {e}")
        traceback.print_exc()

@app.get("/knowledgebase")
async def knowledgebase_summary():
    """Return a lightweight summary of what is stored in the KB."""
    try:
        mapping = indexer.mapping
        file_stats: Dict[str, int] = {}
        for v in mapping.values():
            path = v.get("file_path", "unknown")
            file_stats[path] = file_stats.get(path, 0) + 1
        summary = [{"file_path": k, "chunks": v, "metadata": mapping.get(list(mapping.keys())[0], {}).get("metadata", {})} for k, v in file_stats.items()]
        return {"documents": summary, "total_chunks": len(mapping)}
    except Exception as e:
        print(f"Error getting knowledgebase summary: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail={"error": str(e)})

@app.post("/upload-file")
async def upload_file(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Upload a file, save it into docs/, index it immediately."""
    try:
        # Log the start of upload processing
        print(f"Processing upload of file: {file.filename}")
        
        # Check file type
        allowed_extensions = ['.pdf', '.txt']
        filename = file.filename.lower()
        file_ext = '.' + filename.split('.')[-1] if '.' in filename else ''
        
        if file_ext not in allowed_extensions:
            print(f"Rejected file: {filename} - not an allowed type {allowed_extensions}")
            raise HTTPException(
                status_code=400, 
                detail=f"Only {', '.join(allowed_extensions)} files are supported"
            )
        
        # Save file
        dest_path = os.path.join(DOCS_DIR, file.filename)
        print(f"Saving file to: {dest_path}")
        
        try:
            with open(dest_path, "wb") as dest:
                content = await file.read()
                dest.write(content)
                print(f"File saved successfully ({len(content)} bytes)")
        except Exception as e:
            print(f"Error saving file: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
        # Index the file in the background to avoid blocking the response
        background_tasks.add_task(background_indexing, dest_path)
        
        return {
            "uploaded": dest_path,
            "fileSize": os.path.getsize(dest_path),
            "message": "File uploaded and indexing started in background",
            "success": True
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        print(f"Error processing upload: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print("Starting Knowledge Base API server...")
    
    # Check if we have valid Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    if not supabase_url or supabase_url == "https://your-project-id.supabase.co":
        print("\n⚠️ WARNING: Running without Supabase storage. Your knowledge base won't persist between restarts.")
    
    # Check if we have valid Google API key
    google_api_key = os.getenv("GOOGLE_API_KEY")
    if not google_api_key or google_api_key == "your-google-api-key":
        print("\n⚠️ WARNING: Running without Google AI. Embeddings will be random and RAG responses won't work.")
    
    uvicorn.run(app, host="0.0.0.0", port=8000) 