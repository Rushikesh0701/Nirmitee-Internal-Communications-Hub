import { useState, useEffect, useRef } from 'react'
import { useQuery } from 'react-query'
import api from '../services/api'

const MentionInput = ({ value, onChange, placeholder = 'Type @ to mention someone...', className = '' }) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionQuery, setMentionQuery] = useState('')
  const textareaRef = useRef(null)
  const suggestionsRef = useRef(null)

  // Fetch users for mention suggestions
  const { data: usersData } = useQuery(
    ['users-for-mentions', mentionQuery],
    () => api.get(`/users/search?q=${encodeURIComponent(mentionQuery)}&limit=10`).then((res) => res.data.data),
    { enabled: showSuggestions && mentionQuery.length > 0 }
  )

  useEffect(() => {
    if (showSuggestions && usersData?.users) {
      setSuggestions(usersData.users.slice(0, 5))
      setSelectedIndex(0)
    } else if (showSuggestions && mentionQuery.length === 0) {
      setSuggestions([])
    }
  }, [mentionQuery, usersData, showSuggestions])

  const handleInputChange = (e) => {
    const text = e.target.value
    onChange(e)

    // Check for @ mentions
    const cursorPos = e.target.selectionStart
    const textBeforeCursor = text.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1)
      // Check if there's a space after @ (meaning mention is complete)
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        setMentionQuery(textAfterAt)
        setShowSuggestions(true)
        return
      }
    }

    setShowSuggestions(false)
  }

  const insertMention = (user) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const text = value
    const cursorPos = textarea.selectionStart
    const textBeforeCursor = text.substring(0, cursorPos)
    const lastAtIndex = textBeforeCursor.lastIndexOf('@')

    if (lastAtIndex !== -1) {
      const mentionText = `@${user.firstName} ${user.lastName}`
      const newText = 
        text.substring(0, lastAtIndex) + 
        mentionText + 
        ' ' + 
        text.substring(cursorPos)
      
      onChange({ target: { value: newText } })
      setShowSuggestions(false)
      
      // Set cursor position after mention
      setTimeout(() => {
        const newPos = lastAtIndex + mentionText.length + 1
        textarea.setSelectionRange(newPos, newPos)
        textarea.focus()
      }, 0)
    }
  }

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % suggestions.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length)
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        insertMention(suggestions[selectedIndex])
      } else if (e.key === 'Escape') {
        setShowSuggestions(false)
      }
    }
  }

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        placeholder={placeholder}
        className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
        rows={4}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {suggestions.map((user, index) => (
            <div
              key={user.id || user._id}
              onClick={() => insertMention(user)}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                index === selectedIndex ? 'bg-primary-50' : ''
              }`}
            >
              <div className="flex items-center gap-2">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-primary-600 font-semibold text-sm">
                      {user.firstName?.[0]}
                    </span>
                  </div>
                )}
                <div>
                  <div className="font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                  {user.displayName && (
                    <div className="text-sm text-gray-500">{user.displayName}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default MentionInput

