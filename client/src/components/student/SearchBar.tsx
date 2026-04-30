import React, { useState, type FormEvent, type SubmitEventHandler } from 'react'
import { useNavigate } from 'react-router-dom'
import { assets } from '../../assets/assets'

interface SearchBarProps {
  data?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({data}) => {

  const navigate = useNavigate()
  const [input, setInput] = useState<string>(data || '')

  const onSearchHandler: SubmitEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    if (input.trim()){
      navigate('/course-list/' + encodeURIComponent(input))
    }
  }

  return (
    
    <form onSubmit={onSearchHandler} className='max-w-xl w-full md:h-14 h-12 flex items-center bg-white border border-gray-500/20 rounded'>
      <img src={assets.search_icon} alt="search_icon" className="md:w-auto w-10 h-10 px-3" />
      <input onChange={e => setInput(e.target.value)} type="text" maxLength={2048} placeholder="Search" className='w-full h-full outline-none text-gray-500/80' />
      <button type='submit' className='bg-blue-600 rounded text-white md:px-10 px-7 md:py-3 py-2 mx-1'>Search</button>
    </form>
  )
}

export default SearchBar
