import { FC, memo, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { SearchIcon } from '@heroicons/react/outline'
import { Transition } from '@headlessui/react'
import { BTN_SEARCH } from '@components/utils/textVariables'
interface Props {
  id?: string
  onClick: any
}

const Searchbar: FC<Props> = ({ id = 'search', onClick }) => {
  return (
    <div className="flex flex-row">
      <button
        onClick={onClick}
        className="p-1 text-gray-400 hover:text-gray-500"
      >
        <span className="sr-only" aria-label="Search">{BTN_SEARCH}</span>
        <SearchIcon className="w-7 h-7 text-gray-800" aria-hidden="true" />
      </button>
    </div>
  )
}

export default memo(Searchbar)
