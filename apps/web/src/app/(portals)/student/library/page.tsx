'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Search, Clock, CheckCircle } from 'lucide-react'

interface Book {
  id: string
  title: string
  author: string
  isbn: string | null
  category: string
  description: string | null
  copies: number
  available: number
  myBorrow: { id: string; dueDate: string } | null
}

export default function StudentLibraryPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [borrowing, setBorrowing] = useState<string | null>(null)
  const [returning, setReturning] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/library')
      .then((r) => r.json())
      .then((data) => { setBooks(data); setLoading(false) })
  }, [])

  const borrowBook = async (bookId: string) => {
    setBorrowing(bookId)
    const res = await fetch('/api/library/borrow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookId }),
    })
    const data = await res.json()
    if (res.ok) {
      setBooks((prev) => prev.map((b) => b.id === bookId ? { ...b, available: b.available - 1, myBorrow: { id: data.id, dueDate: data.dueDate } } : b))
    }
    setBorrowing(null)
  }

  const returnBook = async (bookId: string, borrowId: string) => {
    setReturning(borrowId)
    await fetch('/api/library/borrow', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ borrowId }),
    })
    setBooks((prev) => prev.map((b) => b.id === bookId ? { ...b, available: b.available + 1, myBorrow: null } : b))
    setReturning(null)
  }

  const filtered = books.filter(
    (b) => b.title.toLowerCase().includes(search.toLowerCase()) || b.author.toLowerCase().includes(search.toLowerCase()) || b.category.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Digital Library</h1>
        <p className="text-gray-500">Browse and borrow books from the school library</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title, author, or category..."
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">Loading library...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 text-center py-16">
          <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{search ? 'No books match your search' : 'No books in library'}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((book) => (
            <div key={book.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">{book.category}</span>
              </div>
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{book.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{book.author}</p>
              {book.description && <p className="text-xs text-gray-400 mt-2 flex-1 line-clamp-2">{book.description}</p>}
              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  {book.available > 0 ? (
                    <span className="text-blue-600 font-medium">{book.available} available</span>
                  ) : (
                    <span className="text-gray-500 font-medium">All borrowed</span>
                  )}
                  {' '}/ {book.copies} total
                </div>
                {book.myBorrow ? (
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Borrowed
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Due {new Date(book.myBorrow.dueDate).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => returnBook(book.id, book.myBorrow!.id)}
                      disabled={returning === book.myBorrow.id}
                      className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium mt-1"
                    >
                      {returning === book.myBorrow.id ? '...' : 'Return'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => borrowBook(book.id)}
                    disabled={book.available < 1 || borrowing === book.id}
                    className="text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium"
                  >
                    {borrowing === book.id ? '...' : 'Borrow'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
