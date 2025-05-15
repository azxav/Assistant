"""
Document indexing and search functionality using HNSW and Supabase.
"""
import os
import json
import numpy as np
import hnswlib
from typing import List, Dict, Any, Optional
from supabase import Client
from supavec import create_embeddings_batch, get_supabase_client, store_embeddings_in_supabase, generate_contextual_embedding
import time
import base64
import io
import tempfile
from pathlib import Path
import shutil
from doc_extract import extract_pdf_text, extract_txt_text, process_directory


class DocumentIndexer:
    def __init__(self, client: Client, index_name: str = "default_index"):
        """
        Initialize the document indexer.
        
        Args:
            client: Supabase client
            index_name: Name of the index
        """
        self.client = client
        self.index_name = index_name
        self.dimension = 768  # Google's embedding dimension
        self.max_elements = 1000000  # Increased max elements
        self.ef_construction = 400   # Increased ef_construction
        self.M = 64                  # Increased M
        self.ef_search = 100        # Increased ef_search
        
        # Initialize or load HNSW index
        self._initialize_index()

    def _serialize_index(self, index: hnswlib.Index) -> str:
        """Serialize HNSW index to base64 string."""
        temp_dir = tempfile.mkdtemp()
        try:
            temp_path = os.path.join(temp_dir, 'index.bin')
            index.save_index(temp_path)
            with open(temp_path, 'rb') as f:
                data = f.read()
            return base64.b64encode(data).decode('utf-8')
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _deserialize_index(self, data: str) -> hnswlib.Index:
        """Deserialize base64 string to HNSW index."""
        temp_dir = tempfile.mkdtemp()
        try:
            temp_path = os.path.join(temp_dir, 'index.bin')
            binary_data = base64.b64decode(data)
            with open(temp_path, 'wb') as f:
                f.write(binary_data)
            index = hnswlib.Index(space='cosine', dim=self.dimension)
            index.load_index(temp_path)
            return index
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _initialize_index(self):
        """Initialize or load the HNSW index, ensuring sufficient capacity."""
        desired_max_elements = self.max_elements # The capacity we want from class attribute

        try:
            # Try to load existing index from Supabase
            print(f"Attempting to load index '{self.index_name}' from Supabase...")
            response = self.client.table("hnsw_indices").select("*").eq("index_name", self.index_name).execute()
            
            if response.data and len(response.data) > 0:
                index_data = response.data[0]
                loaded_max_elements = index_data.get("max_elements") 
                
                # Critical: Use the desired_max_elements for the current session's index object
                # The saved max_elements is more for record-keeping or future loads.
                # The actual hnswlib index object needs to be initialized with enough space.

                print(f"Found existing index '{self.index_name}' in Supabase with saved max_elements: {loaded_max_elements}.")

                # Always initialize the HNSWLib object with the desired capacity for this session
                self.index = self._deserialize_index(index_data["index_data"])
                
                # Check if the loaded index's *current item count* already prevents adding new items
                # This requires index.get_current_count() - if available, or len(index_data["mapping_data"])
                num_items_in_loaded_index = len(index_data.get("mapping_data", {}))

                # Initialize the HNSW object with desired_max_elements for this session
                # Note: load_index re-initializes with the saved index's structure but not necessarily max_elements
                # We might need to re-init if num_items_in_loaded_index + new_items > loaded_max_elements
                # OR if loaded_max_elements is simply too small for future growth in this session.

                # For simplicity and robustness, if there's any doubt or if the loaded index seems constrained,
                # it might be better to re-initialize. However, let's first try to use loaded data.
                # If loaded_max_elements is defined and smaller than desired, it's a flag.
                
                self.max_elements = desired_max_elements # Ensure current session uses desired
                self.ef_construction = index_data.get("ef_construction", self.ef_construction)
                self.M = index_data.get("m_parameter", self.M)
                
                # After deserializing, re-initialize with desired max_elements if it was different,
                # but this would lose existing items.
                # Instead, we rely on the deserialized index having its original capacity.
                # The key is that `add_items` checks against the index's *actual* capacity.
                # Let's try to call `resize_index` if current count is near capacity. This is safer.
                
                # The `load_index` function itself determines the capacity from the loaded file.
                # We need to ensure that the `add_items` call doesn't exceed this.
                # If `init_index` was called before `load_index` with a different max_elements,
                # `load_index` might override it.

                self.index.set_ef(self.ef_search) # Must be called after load_index
                self.mapping = index_data.get("mapping_data", {})
                print(f"✅ Loaded existing index '{self.index_name}' with {len(self.mapping)} items. Effective capacity from loaded data.")
                
                # HNSWLib does not have a simple resize_index that preserves data and increases max_elements easily.
                # If len(self.mapping) is already at or near loaded_max_elements, adding more will fail.
                # The "The number of elements exceeds the specified limit" error happens if the internal
                # capacity of the HNSW object (set during its original init_index) is hit.

                # If the loaded index had 0 items (as per previous logs) but was saved with a small max_elements,
                # that small max_elements becomes the limit.

                # Simplest robust fix if 'Loaded existing index 'kb' with 0 items' is true and we hit limit:
                # This implies the saved index metadata (max_elements) was too small.
                # So, if we load an index that says it has 0 items, but its metadata suggests a small limit,
                # it's better to re-initialize it with the desired_max_elements.

                if len(self.mapping) == 0 and loaded_max_elements is not None and loaded_max_elements < desired_max_elements:
                    print(f"⚠️ Loaded index '{self.index_name}' has 0 items but a small saved capacity ({loaded_max_elements}). Re-initializing with capacity {desired_max_elements}.")
                    # Fall through to create a new index
                elif loaded_max_elements is not None and len(self.mapping) >= loaded_max_elements:
                     print(f"⚠️ Loaded index '{self.index_name}' is full (items: {len(self.mapping)}, capacity: {loaded_max_elements}). Re-initializing with capacity {desired_max_elements}.")
                     # Fall through to create a new index
                else:
                    return # Successfully loaded and seems okay
                    
            # If response.data is empty or previous conditions lead here, create new.
            print(f"No suitable existing index found in Supabase for '{self.index_name}', or re-initialization forced.")

        except Exception as e:
            print(f"⚠️ Warning: Error during Supabase index load for '{self.index_name}': {e}")
        
        # Create a new index if loading failed or was skipped
        print(f"✨ Creating new HNSW index '{self.index_name}' with capacity {desired_max_elements}.")
        self.index = hnswlib.Index(space='cosine', dim=self.dimension)
        self.max_elements = desired_max_elements # Ensure self.max_elements is the desired one
        self.index.init_index(
            max_elements=self.max_elements, # Use the desired_max_elements
            ef_construction=self.ef_construction,
            M=self.M
        )
        self.index.set_ef(self.ef_search)
        self.mapping = {}
        
        try:
            self._save_index_to_supabase()
        except Exception as e:
            print(f"⚠️ Warning: Could not save newly created index '{self.index_name}' to Supabase: {e}")
            print("Your index will exist only in memory for this session.")

    def _save_index_to_supabase(self):
        """Save the HNSW index to Supabase."""
        # Don't attempt to save if client is a mock
        import inspect
        if "MagicMock" in str(inspect.getmro(type(self.client))) or hasattr(self.client, '__class__') and "Dummy" in self.client.__class__.__name__:
            print("Not saving index - using dummy/mock Supabase client")
            return
        
        try:
            # Convert index to base64 string
            index_data = self._serialize_index(self.index)
            
            # Prepare data
            data = {
                "index_name": self.index_name,
                "index_data": index_data,
                "mapping_data": self.mapping,
                "max_elements": self.max_elements,
                "ef_construction": self.ef_construction,
                "m_parameter": self.M
            }
            
            # Check if index already exists
            response = self.client.table("hnsw_indices").select("id").eq("index_name", self.index_name).execute()
            
            if response.data and len(response.data) > 0:
                # Index exists, update it
                index_id = response.data[0]['id']
                print(f"Updating existing index with ID {index_id}")
                self.client.table("hnsw_indices").update(data).eq("id", index_id).execute()
            else:
                # Index doesn't exist, insert it
                print(f"Creating new index '{self.index_name}'")
                self.client.table("hnsw_indices").insert(data).execute()
            
        except Exception as e:
            print(f"Error saving index to Supabase: {e}")
            import traceback
            traceback.print_exc()
            print("Index will continue working but won't be saved to Supabase.")
            # Don't re-raise the exception, allow the program to continue

    def _get_file_chunks(self, file_path: str) -> List[str]:
        """
        Get chunks of text from a file using doc_extract functions.
        """
        file_path = Path(file_path)
        try:
            if file_path.suffix.lower() == '.pdf':
                return extract_pdf_text(str(file_path))
            elif file_path.suffix.lower() == '.txt':
                return extract_txt_text(str(file_path))
            else:
                # Fallback for unsupported types
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                except UnicodeDecodeError:
                    with open(file_path, 'r', encoding='latin-1') as f:
                        content = f.read()
                from langchain.text_splitter import RecursiveCharacterTextSplitter
                splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100, length_function=len)
                return splitter.split_text(content)
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
            raise

    def index_file(self, file_path: str, metadata: Optional[Dict[str, Any]] = None, max_chunks: int = None):
        """Index a single file by creating embeddings and storing them."""
        try:
            chunks = self._get_file_chunks(file_path)
            print(f"Chunked file into {len(chunks)} segments")
            if max_chunks and 0 < max_chunks < len(chunks):
                chunks = chunks[:max_chunks]
                print(f"Using only first {max_chunks} chunks as requested")
            
            # Update metadata with indexing timestamp
            metadata = metadata or {}
            metadata["indexed_at"] = time.time()
            metadata["file_name"] = os.path.basename(file_path)
            
            full_doc = "\n".join(chunks)
            # Generate contextual embeddings in parallel
            contextual = []
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                futures = {executor.submit(generate_contextual_embedding, full_doc, c): i for i, c in enumerate(chunks)}
                for future in concurrent.futures.as_completed(futures):
                    idx = futures[future]
                    try:
                        text, ok = future.result()
                    except Exception as e:
                        print(f"Context generation error for chunk {idx}: {e}")
                        text, ok = chunks[idx], False
                    contextual.append((idx, text, ok))
            contextual.sort(key=lambda x: x[0])
            contextual_texts = [c[1] for c in contextual]
            ok_flags = [c[2] for c in contextual]
            
            # Batch embedding creation
            batch_size = 10
            embeddings = []
            for i in range(0, len(contextual_texts), batch_size):
                batch = contextual_texts[i:i+batch_size]
                emb = create_embeddings_batch(
                    batch, 
                    metadata=metadata, 
                    source_file=str(file_path), 
                    total_chunks=len(chunks)
                )
                embeddings.extend(emb)
            
            # Add to HNSW
            start_count = len(self.mapping)
            self.index.add_items(embeddings, list(range(start_count, start_count + len(embeddings))))
            for j, chunk in enumerate(chunks):
                self.mapping[str(start_count + j)] = {
                    "content": chunk,
                    "contextual_content": contextual_texts[j],
                    "file_path": str(file_path),
                    "metadata": { 
                        **metadata, 
                        "chunk_index": j, 
                        "total_chunks": len(chunks), 
                        "is_contextual": ok_flags[j] 
                    }
                }
            
            # Try to save to Supabase but don't fail if it doesn't work
            try:
                self._save_index_to_supabase()
            except Exception as e:
                print(f"Warning: Could not save index to Supabase after indexing file: {e}")
                print("Index will be available for this session but won't persist in Supabase.")
            
            print(f"✅ File {os.path.basename(file_path)} indexed successfully with {len(chunks)} chunks")
            return {
                "file_path": str(file_path),
                "chunks": len(chunks),
                "success": True
            }
        except Exception as e:
            print(f"Error indexing file {file_path}: {e}")
            import traceback
            traceback.print_exc()
            return {
                "file_path": str(file_path),
                "error": str(e),
                "success": False
            }

    def index_directory(self, directory_path: str, metadata: Optional[Dict[str, Any]] = None, max_chunks: int = None):
        """Index all PDF/Text files in a directory."""
        try:
            chunks = process_directory(directory_path)
            if max_chunks and 0 < max_chunks < len(chunks):
                chunks = chunks[:max_chunks]
            full_doc = "\n".join(chunks)
            contextual = []
            import concurrent.futures
            with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
                futures = {executor.submit(generate_contextual_embedding, full_doc, c): i for i, c in enumerate(chunks)}
                for f in concurrent.futures.as_completed(futures):
                    idx = futures[f]
                    try:
                        text, ok = f.result()
                    except Exception as e:
                        print(f"Context err {idx}: {e}")
                        text, ok = chunks[idx], False
                    contextual.append((idx, text, ok))
            contextual.sort(key=lambda x: x[0])
            contextual_texts = [c[1] for c in contextual]
            ok_flags = [c[2] for c in contextual]
            # Embed
            embeddings = []
            batch_size = 10
            for i in range(0, len(contextual_texts), batch_size):
                batch = contextual_texts[i:i+batch_size]
                emb = create_embeddings_batch(batch, metadata={**(metadata or {}), "directory": os.path.basename(directory_path)}, source_file=str(directory_path), total_chunks=len(chunks))
                embeddings.extend(emb)
            # Add to index
            start_count = len(self.mapping)
            self.index.add_items(embeddings, list(range(start_count, start_count + len(embeddings))))
            for j, chunk in enumerate(chunks):
                self.mapping[str(start_count + j)] = {
                    "content": chunk,
                    "contextual_content": contextual_texts[j],
                    "file_path": str(directory_path),
                    "metadata": { **(metadata or {}), "chunk_index": j, "total_chunks": len(chunks), "is_contextual": ok_flags[j] }
                }
            self._save_index_to_supabase()
            print("Directory indexed successfully")
        except Exception as e:
            print(f"Error indexing directory {directory_path}: {e}")
            raise

    def search_similar(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Return similar chunks for a query."""
        try:
            q_emb = create_embeddings_batch([query], store_in_db=False)[0]
            labels, dists = self.index.knn_query([q_emb], k=min(limit, len(self.mapping)))
            results = []
            for l, d in zip(labels[0], dists[0]):
                if str(l) in self.mapping:
                    doc = self.mapping[str(l)]
                    results.append({
                        "content": doc["content"],
                        "file_path": doc["file_path"],
                        "metadata": doc["metadata"],
                        "similarity_score": float(1 - d)  # ensure native float for JSON
                    })
            return results
        except Exception as e:
            print(f"Search error: {e}")
            return []

    def delete_index(self, file_path: str):
        """Remove all vectors originating from a particular file."""
        keys = [k for k, v in self.mapping.items() if v["file_path"] == str(file_path)]
        for k in keys:
            del self.mapping[k]
        # rebuild index
        self.clear_index()
        # re-add remaining
        for k, v in self.mapping.items():
            emb = create_embeddings_batch([v.get("contextual_content", v["content"])], store_in_db=False)[0]
            self.index.add_items([emb], [int(k)])
        self._save_index_to_supabase()

    def clear_index(self):
        """Clear entire HNSW index."""
        self.index = hnswlib.Index(space='cosine', dim=self.dimension)
        self.index.init_index(max_elements=self.max_elements, ef_construction=self.ef_construction, M=self.M)
        self.index.set_ef(self.ef_search)
        self.mapping = {}
        self._save_index_to_supabase()

    # ... existing methods (index_file, index_directory, search_similar, delete_index, clear_index) ... 