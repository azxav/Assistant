import os
import concurrent.futures
from typing import List, Dict, Any, Optional, Tuple
import json
from supabase import create_client, Client
from urllib.parse import urlparse
from vertexai.language_models import TextEmbeddingInput, TextEmbeddingModel
from dotenv import load_dotenv
from google import genai
import time
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import numpy as np
from unittest.mock import MagicMock

# Load environment variables
load_dotenv()

PROJECT_ID = "gen-lang-client-0694967196"
REGION = "us-central1"

MODEL_ID = "text-multilingual-embedding-002"

# Initialize clients
google_client = None
supabase_client = None

# Rate limiting
RATE_LIMIT_DELAY = 1  # seconds between requests
last_request_time = 0

def rate_limit():
    """Implement rate limiting for API calls."""
    global last_request_time
    current_time = time.time()
    time_since_last_request = current_time - last_request_time
    if time_since_last_request < RATE_LIMIT_DELAY:
        time.sleep(RATE_LIMIT_DELAY - time_since_last_request)
    last_request_time = time.time()

def initialize_clients():
    """Initialize Supabase and Google clients with proper error handling."""
    global google_client, supabase_client
    
    # Get Supabase credentials
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    
    # Get Google API key
    google_api_key = os.getenv("GOOGLE_API_KEY")
    
    # Check if using default values
    if not supabase_url or not supabase_key:
        print("\n⚠️ WARNING: Supabase credentials are not set. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your .env file")
        print("⚠️ You can get these from your Supabase project settings -> API")
        print("⚠️ Without these credentials, embeddings will not be stored persistently.")
        # Create dummy values for development
        supabase_url = supabase_url or "https://example.supabase.co"
        supabase_key = supabase_key or "dummy_key"
    
    if not google_api_key:
        print("\n⚠️ WARNING: Google API key is not set. Please set GOOGLE_API_KEY in your .env file")
        print("⚠️ You can get this from Google AI Studio")
        print("⚠️ Without this API key, embeddings will be created with random values.")
        google_api_key = "dummy_key"  # Dummy value
    
    if supabase_url == "https://your-project-id.supabase.co" or supabase_key == "your-supabase-anon-key":
        print("\n⚠️ WARNING: You're using placeholder Supabase credentials.")
        print("⚠️ Please replace the placeholders in your .env file with your actual Supabase project values.")
        print("⚠️ For now, the system will use local storage only.")
    
    if google_api_key == "your-google-api-key":
        print("\n⚠️ WARNING: You're using a placeholder Google API key.")
        print("⚠️ Please replace the placeholder in your .env file with your actual Google API key.")
        print("⚠️ For now, the system will use random embeddings.")
    
    try:
        # Initialize Supabase client with retry logic for network issues
        for attempt in range(3):  # Try 3 times
            try:
                supabase_client = create_client(supabase_url, supabase_key)
                # Test connection with a simple query
                supabase_client.table("embeddings").select("id").limit(1).execute()
                print("✅ Successfully connected to Supabase")
                break
            except Exception as e:
                if "getaddrinfo failed" in str(e) or "connection" in str(e).lower():
                    if attempt < 2:  # Don't wait after the last attempt
                        print(f"⚠️ Network error connecting to Supabase (attempt {attempt+1}/3): {e}")
                        print(f"⚠️ Retrying in {(attempt+1)*2} seconds...")
                        time.sleep((attempt+1)*2)  # Increasing backoff
                    else:
                        print(f"⚠️ Failed to connect to Supabase after 3 attempts: {e}")
                        print("⚠️ Check your internet connection and Supabase URL.")
                        print("⚠️ Continuing with local storage only.")
                        raise
                else:
                    print(f"⚠️ Supabase error: {e}")
                    print("⚠️ Check your Supabase credentials and project setup.")
                    print("⚠️ Make sure you've created the required tables (embeddings, hnsw_indices).")
                    raise
        
        # Initialize Google client
        google_client = genai.Client(api_key=google_api_key)
        print("✅ Successfully connected to Google AI")
        
    except Exception as e:
        print(f"\n⚠️ Error initializing clients: {e}")
        print("\n⚠️ Continuing with local storage and dummy clients.")
        print("⚠️ Your knowledge base will work, but:")
        print("  - Embeddings will not be stored in Supabase")
        print("  - The index will be lost when you restart the server")
        print("  - Responses may be less accurate without proper embeddings")
        print("\n⚠️ To fix this, please check your .env file and make sure it contains:")
        print("SUPABASE_URL=your-project-url")
        print("SUPABASE_ANON_KEY=your-anon-key")
        print("GOOGLE_API_KEY=your-google-api-key")
        
        # Create dummy clients for development
        try:
            from unittest.mock import MagicMock
            supabase_client = MagicMock()
            google_client = MagicMock()
            # Make the mock somewhat usable
            google_client.models.generate_content.return_value = MagicMock(text="This is a dummy response since no API key was provided.")
        except ImportError:
            # Basic fallback if MagicMock isn't available
            class DummyClient:
                def __getattr__(self, name):
                    return lambda *args, **kwargs: None
            supabase_client = DummyClient()
            google_client = DummyClient()

def get_supabase_client() -> Client:
    """
    Get a Supabase client with the URL and key from environment variables.
    
    Returns:
        Supabase client instance
    """
    global supabase_client
    if supabase_client is None:
        initialize_clients()
    return supabase_client

# Initialize clients
initialize_clients()

def store_embeddings_in_supabase(
    client: Client,
    texts: List[str],
    embeddings: List[List[float]],
    metadata: Optional[Dict[str, Any]] = None,
    source_file: Optional[str] = None,
    chunk_indices: Optional[List[int]] = None,
    total_chunks: Optional[int] = None
) -> bool:
    """
    Store embeddings and their associated texts in Supabase.
    Returns True if all batches were stored successfully, False otherwise.
    """
    all_successful = True
    try:
        if isinstance(client, MagicMock) or hasattr(client, '__class__') and client.__class__.__name__ == 'DummyClient':
            print("⚠️ Not storing embeddings in Supabase because no valid client is available.")
            return False # Not successful in terms of Supabase storage
            
        batch_data = []
        for i, (text, embedding) in enumerate(zip(texts, embeddings)):
            # Prepare metadata with chunk information
            chunk_metadata = {
                **(metadata or {}),
                "timestamp": time.time(),
                "embedding_model": "google"
            }
            
            # Add chunk information if available
            if source_file:
                chunk_metadata["source_file"] = source_file
            
            if chunk_indices and i < len(chunk_indices):
                chunk_metadata["chunk_index"] = chunk_indices[i]
            elif total_chunks is not None:
                chunk_metadata["chunk_index"] = i
            
            if total_chunks is not None:
                chunk_metadata["total_chunks"] = total_chunks
            
            data = {
                "content": text,
                "embedding": embedding,
                "metadata": chunk_metadata
            }
            batch_data.append(data)
        
        batch_size = 20
        success_count = 0
        
        for i in range(0, len(batch_data), batch_size):
            batch = batch_data[i:i + batch_size]
            batch_success = False
            for retry_attempt in range(3):
                try:
                    response = client.table("embeddings").insert(batch).execute()
                    if hasattr(response, 'error') and response.error:
                        print(f"⚠️ Error inserting batch {i//batch_size + 1} (attempt {retry_attempt+1}/3): {response.error}")
                        if retry_attempt < 2:
                            time.sleep(1 + retry_attempt)
                            continue
                        all_successful = False # Mark as not fully successful
                        break # Failed this batch
                    success_count += len(batch)
                    batch_success = True
                    break 
                except Exception as e:
                    print(f"⚠️ Exception inserting batch {i//batch_size + 1} (attempt {retry_attempt+1}/3): {e}")
                    if "getaddrinfo failed" in str(e).lower(): # Specific check for DNS error
                        print("🆘 DNS resolution failed. Check SUPABASE_URL and network settings.")
                    if retry_attempt < 2:
                        time.sleep(1 + retry_attempt)
                    else:
                        print(f"⚠️ Failed to insert batch after 3 attempts due to exception.")
                        all_successful = False # Mark as not fully successful
                        break 
            if not batch_success:
                all_successful = False # If any batch fails, overall is not successful

        if success_count == len(batch_data) and all_successful:
            print(f"✅ Successfully stored all {success_count}/{len(batch_data)} embeddings in Supabase")
        elif success_count > 0:
            print(f"⚠️ Partially stored {success_count}/{len(batch_data)} embeddings in Supabase due to errors.")
        else:
            print(f"❌ Failed to store any embeddings in Supabase.")
        return all_successful
        
    except Exception as e:
        print(f"⚠️ Overall error storing embeddings in Supabase: {e}")
        print("⚠️ Embeddings will not be persisted but will be available for the current session.")
        return False # Not successful

class QuotaExceededError(Exception):
    """Custom exception for quota exceeded errors."""
    pass

@retry(
    stop=stop_after_attempt(5),
    wait=wait_exponential(multiplier=2, min=4, max=60),
    retry=retry_if_exception_type(QuotaExceededError)
)
def create_embeddings_batch(
    texts: List[str], 
    store_in_db: bool = True,
    metadata: Optional[Dict[str, Any]] = None,
    source_file: Optional[str] = None,
    chunk_indices: Optional[List[int]] = None,
    total_chunks: Optional[int] = None
) -> List[List[float]]:
    """
    Create embeddings for multiple texts using Google's text-multilingual-embedding-002 model.
    
    Args:
        texts: List of texts to create embeddings for
        store_in_db: Whether to store embeddings in Supabase
        metadata: Optional metadata to store with embeddings
        source_file: Optional source file path
        chunk_indices: Optional list of chunk indices
        total_chunks: Optional total number of chunks
        
    Returns:
        List of embeddings (each embedding is a list of floats)
    """
    if not texts:
        return []
        
    try:
        # Verify Google API key
        if not os.getenv("GOOGLE_API_KEY"):
            print("\n⚠️ WARNING: GOOGLE_API_KEY environment variable is not set!")
            print("⚠️ Cannot generate proper embeddings. Using dummy values.")
            print("⚠️ Set this in your .env file to enable proper embedding generation.")
            return [[0.0] * 768 for _ in range(len(texts))]
        
        if os.getenv("GOOGLE_API_KEY") == "your-google-api-key":
            print("\n⚠️ WARNING: GOOGLE_API_KEY is set to the placeholder value.")
            print("⚠️ Update it with your actual Google API key in the .env file.")
            return [[0.0] * 768 for _ in range(len(texts))]
            
        rate_limit()
        
        print(f"Generating embeddings for {len(texts)} text chunks using Google model")
        model = TextEmbeddingModel.from_pretrained(MODEL_ID)
        inputs = [TextEmbeddingInput(text, "RETRIEVAL_DOCUMENT") for text in texts]
        embeddings_response = model.get_embeddings(inputs)
        result = [embedding.values for embedding in embeddings_response]
        print(f"Successfully generated {len(result)} embeddings")
        
        if store_in_db:
            supabase_storage_successful = False
            try:
                if not os.getenv("SUPABASE_URL") or not os.getenv("SUPABASE_ANON_KEY") or \
                   os.getenv("SUPABASE_URL") == "https://your-project-id.supabase.co" or \
                   os.getenv("SUPABASE_URL") == "https://example.supabase.co": # Added example.co
                    print("\n⚠️ WARNING: Supabase credentials are missing or placeholders.")
                    print("⚠️ Cannot store embeddings in database. Check SUPABASE_URL and SUPABASE_ANON_KEY.")
                else:
                    print(f"Attempting to store {len(texts)} embeddings in Supabase...")
                    supabase_storage_successful = store_embeddings_in_supabase(
                        supabase_client, 
                        texts, 
                        result, 
                        metadata=metadata,
                        source_file=source_file,
                        chunk_indices=chunk_indices,
                        total_chunks=total_chunks
                    )
                    if not supabase_storage_successful:
                        print("⚠️ Supabase storage was not fully successful. Embeddings may be in-memory only.")
            except Exception as e:
                print(f"\n⚠️ Exception during attempt to store embeddings in Supabase: {e}")
                print("⚠️ Check your Supabase credentials and network connection.")
        return result
    except Exception as e:
        if "429" in str(e) or "Quota exceeded" in str(e):
            print("Quota exceeded, waiting before retry...")
            raise QuotaExceededError("Google API quota exceeded")
        print(f"Error creating batch embeddings: {e}")
        import traceback
        traceback.print_exc()
        return [[0.0] * 768 for _ in range(len(texts))]

def create_embedding(text: str, store_in_db: bool = True) -> List[float]:
    """
    Create an embedding for a single text using Google's text-multilingual-embedding-002 model.
    
    Args:
        text: Text to create an embedding for
        store_in_db: Whether to store embedding in Supabase
        
    Returns:
        List of floats representing the embedding
    """
    try:
        embeddings = create_embeddings_batch([text], store_in_db)
        return embeddings[0] if embeddings else [0.0] * 768
    except Exception as e:
        print(f"Error creating embedding: {e}")
        return [0.0] * 768

def generate_contextual_embedding(full_document: str, chunk: str) -> Tuple[str, bool]:
    """
    Generate contextual information for a chunk within a document to improve retrieval.
    
    Args:
        full_document: The complete document text
        chunk: The specific chunk of text to generate context for
        
    Returns:
        Tuple containing:
        - The contextual text that situates the chunk within the document
        - Boolean indicating if contextual embedding was performed
    """
    try:
        # Remove strict truncation; allow larger documents (200k chars safeguard)
        max_doc_length = 200000  # generous limit (~30k tokens)
        truncated_document = full_document if len(full_document) <= max_doc_length else full_document[:max_doc_length] + "\n[Document truncated due to length...]"
        
        # Ensure chunk is not too long for the API
        max_chunk_length = 10000
        truncated_chunk = chunk[:max_chunk_length]
        if len(chunk) > max_chunk_length:
            print(f"Chunk truncated from {len(chunk)} to {max_chunk_length} chars for contextual embedding")
            truncated_chunk += "\n[Chunk truncated due to length...]"
        
        # Create the prompt for generating contextual information - use a more focused prompt
        prompt = f"""You are working on an information retrieval system. Your task is to provide a brief context (2-3 sentences) explaining how a document excerpt fits within the overall document. This context will be used to improve search.

Here is an excerpt from a document:
---
{truncated_chunk}
---

Based on your understanding of how this excerpt relates to the broader document, provide ONLY a brief context (2-3 sentences) that would help a search system understand this excerpt better. Do not summarize the excerpt itself."""

        # Call the Gemini API to generate contextual information
        response = google_client.models.generate_content(
            model="gemini-1.5-flash",
            contents=[prompt]
        )
        
        # Extract the generated context
        context = response.text.strip()
        
        # Check if we got a meaningful context
        if len(context) < 10 or len(context) > 500:
            print(f"Warning: Contextual embedding generation produced unusual output length ({len(context)} chars)")
            if len(context) > 500:
                context = context[:500] + "..."
        
        # Combine the context with the original chunk (not truncated)
        contextual_text = f"{context}\n---\n{chunk}"
        
        print(f"Created contextual embedding: {len(context)} chars context + {len(chunk)} chars content")
        return contextual_text, True
    
    except Exception as e:
        print(f"Error generating contextual embedding: {e}. Using original chunk instead.")
        return chunk, False

def process_chunk_with_context(args):
    """
    Process a single chunk with contextual embedding.
    This function is designed to be used with concurrent.futures.
    
    Args:
        args: Tuple containing (url, content, full_document)
        
    Returns:
        Tuple containing:
        - The contextual text that situates the chunk within the document
        - Boolean indicating if contextual embedding was performed
    """
    url, content, full_document = args
    return generate_contextual_embedding(full_document, content) 