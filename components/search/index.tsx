import { useState, useEffect, useLayoutEffect } from 'react'
import { SearchIcon } from '@heroicons/react/outline'
import axios from 'axios'
import { NEXT_SEARCH_PRODUCTS } from '@components/utils/constants'
import Link from 'next/link'
import { XIcon } from '@heroicons/react/outline'
import rangeMap from '@lib/range-map'
import { useRouter } from 'next/router'
import eventDispatcher from '@components/services/analytics/eventDispatcher'
import { EVENTS_MAP } from '@components/services/analytics/constants'
import { useUI } from '@components/ui/context'
import { BTN_SEARCH } from '@components/utils/textVariables'

export default function Search({ closeWrapper = () => {}, keywords }: any) {
  const Router = useRouter()
  const [inputValue, setInputValue] = useState('')
  const [products, setProducts] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [path, setCurrentPath] = useState(Router.asPath)
  const SearchEvent = EVENTS_MAP.EVENT_TYPES.Search
  const SearchEntity = EVENTS_MAP.ENTITY_TYPES.Search

  const { basketId, cartItems } = useUI()

  useEffect(() => {
    const fetchItems = async () => {
      setIsLoading(true)
      try {
        const response: any = await axios.post(NEXT_SEARCH_PRODUCTS, {
          value: inputValue,
        })
        setProducts(response?.data?.products)
        setIsLoading(false)
        eventDispatcher(SearchEvent, {
          entity: JSON.stringify({
            FreeText: inputValue,
            ResultCount: response?.data?.products?.length || 0,
          }),
          entityId: inputValue,
          entityName: inputValue,
          entityType: SearchEntity,
          eventType: SearchEvent,
        })
      } catch (error) {
        console.log(error)
        setIsLoading(false)
      }
    }
    if (inputValue.length > 2) fetchItems()
  }, [inputValue])

  const handleEnterPress = (e: any) => {
    const keyword = keywords.find(
      (keyword: any) => keyword.keywords === e.target.value
    )
    if (e.key === 'Enter' && keyword) {
      Router.push(keyword.url)
    } else if (e.key === 'Enter' && !keyword) {
      Router.push('/search?freeText=' + e.target.value)
    }
  }

  useLayoutEffect(() => {
    document.addEventListener('keypress', handleEnterPress)
    return () => document.removeEventListener('keypress', handleEnterPress)
  }, [])

  useEffect(() => {
    if (path !== Router.asPath) {
      closeWrapper()
    }
  }, [Router.asPath])

  return (
    <div className="z-50 w-full h-full bg-white fixed right-0 top-0">
      <div
        className="h-9 text-gray-900 w-9 right-10 top-10 absolute cursor-pointer"
        onClick={closeWrapper}
      >
        <XIcon />
      </div>
      <div className="w-full mt-5 justify-center items-center flex flex-col px-10 py-5">
        <div className="flex flex-row mb-6">
          <div className="min-w-3xl flex flex-row border border-gray-300 rounded-md py-2 px-4 shadow-sm ">
            <label className="hidden" htmlFor={'search-bar'}>
              {BTN_SEARCH}
            </label>
            <input
              id={'search-bar'}
              className="text-gray-700 appearance-none min-w-4xl w-full bg-white  placeholder-gray-500 focus:outline-none"
              placeholder={BTN_SEARCH}
              onChange={(e: any) => setInputValue(e.target.value)}
            />
            <div className="text-gray-400">
              <SearchIcon className="w-6 h-6" aria-hidden="true" />
            </div>
          </div>
        </div>
        <div className='flex flex-col search-result'>
            <div className="-mx-px border-l border-t border-gray-200 grid grid-cols-2 sm:mx-0 md:grid-cols-3 lg:grid-cols-5">
          {isLoading &&
            rangeMap(12, (i) => (
              <div
                key={i}
                className="shadow-md w-60 h-72 rounded-md mx-auto mt-10"
              >
                <div className="flex animate-pulse flex-row items-center h-full justify-center space-x-5">
                  <div className="flex flex-col space-y-3">
                    <div className="w-full bg-gray-100 h-48 rounded-md "></div>
                    <div className="w-36 bg-gray-100 h-6 mt-40 rounded-md "></div>
                  </div>
                </div>
              </div>
            ))}
          {products?.map((product: any, idx: number) => {
            return (
              <div className="border-r border-b border-gray-200" key={idx}>
                <div className="group relative p-2 sm:p-3">
                  <Link passHref href={`/${product.slug}`}>
                    <a href={`/${product.slug}`}>
                      <div className="relative image-container rounded-lg overflow-hidden bg-gray-200 aspect-w-1 aspect-h-1 group-hover:opacity-75">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-64 object-center object-cover image"
                        />
                      </div>
                    </a>
                  </Link>

                  <div className="pt-3 text-center">
                    <h3 className="min-h-40px text-sm font-medium text-gray-900">
                      <Link href={`/${product.slug}`}>
                        <a href={`/${product.slug}`}>{product.name}</a>
                      </Link>
                    </h3>

                    <p className="mt-4 font-medium text-gray-900">
                      {product?.price?.formatted?.withTax}
                    </p>

                    <div className="flex flex-col"></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        </div>        
      </div>
    </div>
  )
}