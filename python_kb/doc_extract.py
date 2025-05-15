import pymupdf4llm
from langchain.text_splitter import MarkdownTextSplitter, RecursiveCharacterTextSplitter
from typing import List
from pathlib import Path
import os


def extract_pdf_text(file_path: str, chunk_size: int = 4000, chunk_overlap: int = 400) -> List[str]:
    """
    Extract text from PDF file and split it into chunks.
    
    Args:
        file_path: Path to the PDF file
        chunk_size: Size of each text chunk (default 4000 chars, ~600-800 words)
        chunk_overlap: Overlap between chunks (default 400 chars, ~10% of chunk size)
        
    Returns:
        List[str]: List of text chunks
    """
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found: {file_path}")
            
        # Extract text from PDF using pymupdf4llm
        md_text = pymupdf4llm.to_markdown(file_path)
        
        # Use RecursiveCharacterTextSplitter for better semantic chunking
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n## ", "\n### ", "\n#### ", "\n\n", "\n", ". ", " ", ""],
            keep_separator=True
        )
        documents = splitter.create_documents([md_text])
        chunks = [doc.page_content for doc in documents]
        
        # Print chunk stats
        total_chars = sum(len(chunk) for chunk in chunks)
        avg_chunk_size = total_chars / len(chunks) if chunks else 0
        print(f"PDF {file_path}: Created {len(chunks)} chunks, avg size: {avg_chunk_size:.0f} chars")
        
        return chunks
    except Exception as e:
        raise Exception(f"Error processing PDF file: {str(e)}")


def extract_txt_text(file_path: str, chunk_size: int = 4000, chunk_overlap: int = 400) -> List[str]:
    """
    Extract text from TXT file and split it into chunks.
    
    Args:
        file_path: Path to the TXT file
        chunk_size: Size of each text chunk (default 4000 chars, ~600-800 words)
        chunk_overlap: Overlap between chunks (default 400 chars, ~10% of chunk size)
        
    Returns:
        List[str]: List of text chunks
    """
    try:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"TXT file not found: {file_path}")
            
        with open(file_path, 'r', encoding='utf-8') as file:
            text = file.read()
        
        # Use RecursiveCharacterTextSplitter for better semantic chunking
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            separators=["\n## ", "\n### ", "\n#### ", "\n\n", "\n", ". ", " ", ""],
            keep_separator=True
        )
        documents = splitter.create_documents([text])
        chunks = [doc.page_content for doc in documents]
        
        # Print chunk stats
        total_chars = sum(len(chunk) for chunk in chunks)
        avg_chunk_size = total_chars / len(chunks) if chunks else 0
        print(f"TXT {file_path}: Created {len(chunks)} chunks, avg size: {avg_chunk_size:.0f} chars")
        
        return chunks
    except Exception as e:
        raise Exception(f"Error processing TXT file: {str(e)}")


def process_directory(directory_path: str, chunk_size: int = 4000, chunk_overlap: int = 400) -> List[str]:
    """
    Process all PDF and TXT files in a directory.
    
    Args:
        directory_path: Path to the directory containing files
        chunk_size: Size of each text chunk (default 4000 chars, ~600-800 words)
        chunk_overlap: Overlap between chunks (default 400 chars, ~10% of chunk size)
        
    Returns:
        List[str]: List of text chunks from all files
    """
    all_chunks = []
    file_count = 0
    try:
        for file_path in Path(directory_path).glob('*.*'):
            if file_path.suffix.lower() == '.pdf':
                chunks = extract_pdf_text(str(file_path), chunk_size, chunk_overlap)
                file_count += 1
            elif file_path.suffix.lower() == '.txt':
                chunks = extract_txt_text(str(file_path), chunk_size, chunk_overlap)
                file_count += 1
            else:
                continue
            all_chunks.extend(chunks)
        
        # Print summary
        print(f"Processed {file_count} files into {len(all_chunks)} chunks from directory: {directory_path}")
        
        return all_chunks
    except Exception as e:
        raise Exception(f"Error processing directory: {str(e)}") 