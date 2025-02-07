import { useEffect, useState } from 'react'
import { Tab } from '@headlessui/react'
import { HeartIcon } from '@heroicons/react/outline'
import { StarIcon, PlayIcon } from '@heroicons/react/solid'
import { NextSeo } from 'next-seo'
import classNames from '@components/utils/classNames'
import AttributesHandler from './AttributesHandler'
import { useUI } from '@components/ui/context'
import BreadCrumbs from '@components/ui/BreadCrumbs'
import RelatedProducts from '@components/product/RelatedProducts'
import Bundles from '@components/product/Bundles'
import Reviews from '@components/product/Reviews'
import PriceMatch from '@components/product/PriceMatch'
import Engraving from '@components/product/Engraving'
import ProductDetails from '@components/product/ProductDetails'
import { KEYS_MAP, EVENTS } from '@components/utils/dataLayer'
import cartHandler from '@components/services/cart'
import DeliveryInstruction from './DeliveryInstructions'

import axios from 'axios'
import {
  NEXT_CREATE_WISHLIST,
  NEXT_BULK_ADD_TO_CART,
  NEXT_UPDATE_CART_INFO,
  NEXT_GET_PRODUCT,
} from '@components/utils/constants'
import Button from '@components/ui/IndigoButton'
import eventDispatcher from '@components/services/analytics/eventDispatcher'
import { EVENTS_MAP } from '@components/services/analytics/constants'
import {
  ALERT_SUCCESS_WISHLIST_MESSAGE,
  BTN_ADD_TO_FAVORITES,
  BTN_NOTIFY_ME,
  BTN_PRE_ORDER,
  GENERAL_ADD_TO_BASKET,
  GENERAL_ENGRAVING,
  GENERAL_PRICE_LABEL_RRP,
  GENERAL_REFERENCE,
  GENERAL_REVIEWS,
  GENERAL_REVIEW_OUT_OF_FIVE,
  ITEM_TYPE_ADDON,
  PRICEMATCH_ADDITIONAL_DETAILS,
  PRICEMATCH_BEST_PRICE,
  PRICEMATCH_SEEN_IT_CHEAPER,
  PRODUCT_INFORMATION,
  YOUTUBE_VIDEO_PLAYER,
  SLUG_TYPE_MANUFACTURER,
  BTN_ADD_TO_WISHLIST
} from '@components/utils/textVariables'


const PLACEMENTS_MAP: any = {
  Head: {
    element: 'head',
    position: 'beforeend',
  },
  PageContainerAfter: {
    element: '.page-container',
    position: 'afterend',
  },
  PageContainerBefore: {
    element: '.page-container',
    position: 'beforebegin',
  },
}

export default function ProductView({
  data = { images: [] },
  snippets,
  setEntities,
  recordEvent,
  slug,
}: any) {
  const {
    openNotifyUser,
    addToWishlist,
    openWishlist,
    basketId,
    setCartItems,
    user,
    openCart,
  } = useUI()

  const [updatedProduct, setUpdatedProduct] = useState(null)
  const [isPriceMatchModalShown, showPriceMatchModal] = useState(false)
  const [isEngravingOpen, showEngravingModal] = useState(false)
  const [isInWishList, setItemsInWishList] = useState(false)

  const product = updatedProduct || data

  const [selectedAttrData, setSelectedAttrData] = useState({
    productId: product.recordId,
    stockCode: product.stockCode,
    ...product,
  })

  const { ProductViewed } = EVENTS_MAP.EVENT_TYPES

  const { Product } = EVENTS_MAP.ENTITY_TYPES
  const fetchProduct = async () => {
    const response: any = await axios.post(NEXT_GET_PRODUCT, { slug: slug })
    if (response?.data?.product) {
      eventDispatcher(ProductViewed, {
        entity: JSON.stringify({
          id: response.data.product.recordId,
          sku: response.data.product.sku,
          name: response.data.product.name,
          stockCode: response.data.product.stockCode,
          img: response.data.product.image,
        }),
        entityId: response.data.product.recordId,
        entityName: response.data.product.name,
        entityType: Product,
        eventType: ProductViewed,
        omniImg: response.data.product.image,
      })
      setUpdatedProduct(response.data.product)
      setSelectedAttrData({
        productId: response.data.product.recordId,
        stockCode: response.data.product.stockCode,
        ...response.data.product,
      })
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [slug])

  useEffect(() => {
    const { entityId, entityName, entityType, entity } = KEYS_MAP

    recordEvent(EVENTS.ProductViewed)
    if (snippets) {
      snippets.forEach((snippet: any) => {
        const domElement = document.querySelector(
          PLACEMENTS_MAP[snippet.placement]?.element
        )
        if (domElement) {
          domElement.insertAdjacentHTML(
            PLACEMENTS_MAP[snippet.placement].position,
            snippet.content
          )
        }
      })
    }
    //this function is triggered when the component is unmounted. here we clean the injected scripts
    return function cleanup() {
      snippets.forEach((snippet: any) => {
        document
          .getElementsByName(snippet.name)
          .forEach((node: any) => node.remove())
      })
    }
  }, [])

  if (!product) {
    return null
  }

  const handleNotification = () => {
    openNotifyUser(product.recordId)
  }

  let content = [{ image: selectedAttrData.image }, ...product.images].filter(
    (value: any, index: number, self: any) =>
      index === self.findIndex((t: any) => t.image === value.image)
  )

  if (product.videos && product.videos.length > 0) {
    content = [...product.images, ...product.videos].filter(
      (value: any, index: number, self: any) =>
        index === self.findIndex((t: any) => t.image === value.image)
    )
  }
const DEFAULT_COLOR_SCHEME = {
  bgColor: 'bg-gray-900',
  hoverBgColor: 'bg-gray-800',
  focusRingColor: 'ring-gray-900',
  paddingTop: 'py-5',
  fontSize: 'text-xl'
}
  const buttonTitle = () => {
    let buttonConfig: any = {
      title: GENERAL_ADD_TO_BASKET,
      action: async () => {
        const item = await cartHandler().addToCart(
          {
            basketId: basketId,
            productId: selectedAttrData.productId,
            qty: 1,
            manualUnitPrice: product.price.raw.withTax,
            stockCode: selectedAttrData.stockCode,
            userId: user.userId,
            isAssociated: user.isAssociated,
          },
          'ADD',
          { product: selectedAttrData }
        )
        setCartItems(item)
      },
      shortMessage: '',
    }
    if (!selectedAttrData.currentStock && !product.preOrder.isEnabled) {
      if (
        !product.flags.sellWithoutInventory ||
        !selectedAttrData.sellWithoutInventory
      ) {
        buttonConfig.title = BTN_NOTIFY_ME
        buttonConfig.action = async () => handleNotification()
        buttonConfig.type = 'button'
      }
    } else if (product.preOrder.isEnabled && !selectedAttrData.currentStock) {
      if (product.preOrder.currentStock < product.preOrder.maxStock) {
        buttonConfig.title = BTN_PRE_ORDER
        buttonConfig.shortMessage = product.preOrder.shortMessage
      } else {
        buttonConfig.title = BTN_NOTIFY_ME
        buttonConfig.action = async () => handleNotification()
        buttonConfig.type = 'button'
      }
    }
    return buttonConfig
  }

  const buttonConfig = buttonTitle()

  const handleEngravingSubmit = (values: any) => {
    const updatedProduct = {
      ...product,
      ...{
        recordId: selectedAttrData.productId,
        stockCode: selectedAttrData.stockCode,
      },
    }
    const addonProducts = product.relatedProducts?.filter(
      (item: any) => item.stockCode === ITEM_TYPE_ADDON
    )
    const addonProductsWithParentProduct = addonProducts.map((item: any) => {
      item.parentProductId = product.recordId
      return item
    })
    const computedProducts = [
      ...addonProductsWithParentProduct,
      updatedProduct,
    ].reduce((acc: any, obj: any) => {
      acc.push({
        ProductId: obj.recordId || obj.productId,
        BasketId: basketId,
        ParentProductId: obj.parentProductId || null,
        Qty: 1,
        DisplayOrder: obj.displayOrder || 0,
        StockCode: obj.stockCode,
        ItemType: obj.itemType || 0,
        CustomInfo1: values.line1 || null,

        CustomInfo2: values.line2 || null,

        CustomInfo3: values.line3 || null,

        CustomInfo4: values.line4 || null,

        CustomInfo5: values.line5 || null,

        ProductName: obj.name,

        ManualUnitPrice: obj.manualUnitPrice || 0.0,

        PostCode: obj.postCode || null,

        IsSubscription: obj.subscriptionEnabled || false,

        IsMembership: obj.hasMembership || false,

        SubscriptionPlanId: obj.subscriptionPlanId || null,

        SubscriptionTermId: obj.subscriptionTermId || null,

        UserSubscriptionPricing: obj.userSubscriptionPricing || 0,

        GiftWrapId: obj.giftWrapConfig || null,

        IsGiftWrapApplied: obj.isGiftWrapApplied || false,

        ItemGroupId: obj.itemGroupId || 0,

        PriceMatchReqId:
          obj.priceMatchReqId || '00000000-0000-0000-0000-000000000000',
      })
      return acc
    }, [])

    const asyncHandler = async () => {
      try {
        const newCart = await axios.post(NEXT_BULK_ADD_TO_CART, {
          basketId,
          products: computedProducts,
        })
        await axios.post(NEXT_UPDATE_CART_INFO, {
          basketId,
          info: [...Object.values(values)],
          lineInfo: computedProducts,
        })

        setCartItems(newCart.data)
        showEngravingModal(false)
      } catch (error) {
        console.log(error, 'err')
      }
    }
    asyncHandler()
  }

  const isEngravingAvailable = !!product.relatedProducts?.filter(
    (item: any) => item.stockCode === ITEM_TYPE_ADDON
  ).length

  //TODO no additionalProperties key found on product object
  const insertToLocalWishlist = () => {
    addToWishlist(product)
    setItemsInWishList(true)
    openWishlist()
  }
  const handleWishList = () => {
    const accessToken = localStorage.getItem('user')
    if (accessToken) {
      const createWishlist = async () => {
        try {
          await axios.post(NEXT_CREATE_WISHLIST, {
            id: user.userId,
            productId: product.recordId,
            flag: true,
          })
          insertToLocalWishlist()
        } catch (error) {
          console.log(error, 'error')
        }
      }
      createWishlist()
    } else insertToLocalWishlist()
  }

  const filteredRelatedProducts = product.relatedProducts?.filter(
    (item: any) => item.stockCode !== ITEM_TYPE_ADDON
  )

  const filteredRelatedProductList = product.relatedProductList?.filter(
    (item: any) => item.stockCode !== ITEM_TYPE_ADDON
  )

  const breadcrumbs = product.breadCrumbs?.filter(
    (item: any) => item.slugType !== SLUG_TYPE_MANUFACTURER
  )
  /*if (product === null) {
    return {
      notFound: true,
    }
  }*/

  return (
    <div className="bg-white page-container">
      
      {/* Mobile menu */}
      <div className="max-w-7xl mx-auto pt-2 px-2 sm:pt-6 sm:px-6 lg:px-8">
        {breadcrumbs && (
          <BreadCrumbs items={breadcrumbs} currentProduct={product} />          
        )}
      </div>
      <main className="max-w-7xl mx-auto sm:pt-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto lg:max-w-none">
          {/* Product */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
            {/* Image gallery */}
            <Tab.Group as="div" className="flex flex-col-reverse">
              {/* Image selector */}
              <div className="hidden mt-6 w-full max-w-2xl mx-auto sm:block lg:max-w-none">
                <Tab.List className="grid grid-cols-4 gap-6">
                  {content?.map((image: any, idx) => (
                    <Tab
                      key={`${idx}-tab`}
                      className="relative h-40 bg-white rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring focus:ring-offset-4 focus:ring-opacity-50"
                    >
                      {() => (
                        <>
                          <span className="sr-only">{image.name}</span>
                          <span className="absolute inset-0 rounded-md overflow-hidden border">
                            {image.image ? (
                              <img
                                src={image.image}
                                alt=""
                                className="w-full h-full object-center object-cover"
                              />
                              
                            ) : (
                              <PlayIcon className="h-full w-full object-center object-cover" />
                            )}
                          </span>
                        </>
                      )}
                    </Tab>
                  ))}
                  {content?.map((image: any, idx) => (
                    <Tab
                      key={`${idx}`}
                      className="relative h-40 bg-white rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring focus:ring-offset-4 focus:ring-opacity-50"
                    >
                      {() => (
                        <>
                          <span className="sr-only">{image.name}</span>
                          <span className="absolute inset-0 rounded-md overflow-hidden border">
                            {image.image ? (
                              <img
                                src={image.image}
                                alt=""
                                className="w-full h-full object-center object-cover"
                              />
                              
                            ) : (
                              <PlayIcon className="h-full w-full object-center object-cover" />
                            )}
                          </span>
                        </>
                      )}
                    </Tab>
                  ))}
                  {content?.map((image: any, idx) => (
                    <Tab
                      key={`${idx}-tab1`}
                      className="relative h-40 bg-white rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring focus:ring-offset-4 focus:ring-opacity-50"
                    >
                      {() => (
                        <>
                          <span className="sr-only">{image.name}</span>
                          <span className="absolute inset-0 rounded-md overflow-hidden border">
                            {image.image ? (
                              <img
                                src={image.image}
                                alt=""
                                className="w-full h-full object-center object-cover"
                              />
                              
                            ) : (
                              <PlayIcon className="h-full w-full object-center object-cover" />
                            )}
                          </span>
                        </>
                      )}
                    </Tab>
                  ))}
                  {content?.map((image: any, idx) => (
                    <Tab
                      key={`${idx}-tab2`}
                      className="relative h-40 bg-white rounded-md flex items-center justify-center text-sm font-medium uppercase text-gray-900 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring focus:ring-offset-4 focus:ring-opacity-50"
                    >
                      {() => (
                        <>
                          <span className="sr-only">{image.name}</span>
                          <span className="absolute inset-0 rounded-md overflow-hidden border">
                            {image.image ? (
                              <img
                                src={image.image}
                                alt=""
                                className="w-full h-full object-center object-cover"
                              />
                              
                            ) : (
                              <PlayIcon className="h-full w-full object-center object-cover" />
                            )}
                          </span>
                        </>
                      )}
                    </Tab>
                  ))}
                </Tab.List>
              </div>

              <Tab.Panels className="w-full aspect-w-1 aspect-h-1 p-3 sm:p-0">
                {content?.map((image: any) => (
                  <Tab.Panel key={image.name + 'tab-panel'}>
                    {image.image ? (
                      <img
                        src={image.image}
                        alt={image.name}
                        className="w-full h-full object-center object-cover rounded-lg"
                      />
                    ) : (
                      <iframe
                        width="560"
                        height="315"
                        src={image.url}
                        title={YOUTUBE_VIDEO_PLAYER}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </Tab.Panel>
                ))}
                {content?.map((image: any) => (
                  <Tab.Panel key={image.name + 'tab-panel'}>
                    {image.image ? (
                      <img
                        src={image.image}
                        alt={image.name}
                        className="w-full h-full object-center object-cover rounded-lg"
                      />
                    ) : (
                      <iframe
                        width="560"
                        height="315"
                        src={image.url}
                        title={YOUTUBE_VIDEO_PLAYER}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </Tab.Panel>
                ))}
                {content?.map((image: any) => (
                  <Tab.Panel key={image.name + 'tab-panel'}>
                    {image.image ? (
                      <img
                        src={image.image}
                        alt={image.name}
                        className="w-full h-full object-center object-cover rounded-lg"
                      />
                    ) : (
                      <iframe
                        width="560"
                        height="315"
                        src={image.url}
                        title={YOUTUBE_VIDEO_PLAYER}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </Tab.Panel>
                ))}
                {content?.map((image: any) => (
                  <Tab.Panel key={image.name + 'tab-panel'}>
                    {image.image ? (
                      <img
                        src={image.image}
                        alt={image.name}
                        className="w-full h-full object-center object-cover rounded-lg"
                      />
                    ) : (
                      <iframe
                        width="560"
                        height="315"
                        src={image.url}
                        title={YOUTUBE_VIDEO_PLAYER}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                  </Tab.Panel>
                ))}
              </Tab.Panels>
            </Tab.Group>

            {/* Product info */}
            <div className="sm:mt-10 mt-2 px-4 sm:px-10 sm:mt-16 lg:mt-0 text-center">
              <h1 className="sm:text-3xl text-xl font-bold sm:font-semibold lowercase tracking-tight text-gray-900">
                {selectedAttrData.name || selectedAttrData.productName}
              </h1>

              <p className="text-gray-500 sm:text-md text-sm mt-2 sm:mt-1">
                {GENERAL_REFERENCE}: {selectedAttrData.stockCode}
              </p>
              <div className="mt-3">
                <h2 className="sr-only">{PRODUCT_INFORMATION}</h2>
                {updatedProduct ? (
                  <p className="sm:text-3xl text-2xl font-bold sm:font-medium text-gray-900">
                    {selectedAttrData.price?.formatted?.withTax}
                    {selectedAttrData.listPrice?.raw.tax > 0 ? (
                      <span className="px-5 text-sm line-through text-gray-500">
                        {GENERAL_PRICE_LABEL_RRP}{' '}
                        {product.listPrice.formatted.withTax}
                      </span>
                    ) : null}
                  </p>
                ) : (
                  <p className="text-3xl text-gray-900">------</p>
                )}
              </div>

              {/* Reviews */}
              <div className="mt-6">
                <h3 className="sr-only">{GENERAL_REVIEWS}</h3>
                <div className="flex items-center flex-col">
                  <div className="flex items-center text-center align-center">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <StarIcon
                        key={rating}
                        className={classNames(
                          product.rating > rating
                            ? 'text-indigo-500'
                            : 'text-gray-300',
                          'h-5 w-5 flex-shrink-0'
                        )}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <p className="sr-only">
                    {product.rating} {GENERAL_REVIEW_OUT_OF_FIVE}
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-full">
                <AttributesHandler
                  product={product}
                  variant={selectedAttrData}
                  setSelectedAttrData={setSelectedAttrData}
                />
              </div>

              {/* <p
                className="text-gray-900 sm:text-md text-sm cursor-pointer hover:underline"
                onClick={() => showPriceMatchModal(true)}
              >
                <span className="font-bold">{PRICEMATCH_SEEN_IT_CHEAPER}</span>
                <span>
                  {''} {PRICEMATCH_BEST_PRICE}
                </span>
              </p> */}
              {updatedProduct ? (
                  <>
                    <div className="sm:mt-4 mt-6 flex sm:flex-col1 grid grid-cols-1 sm:px-16">
                      <Button
                        title={buttonConfig.title}
                        action={buttonConfig.action}
                        colorScheme = {DEFAULT_COLOR_SCHEME}
                        buttonType={buttonConfig.type || 'cart'}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          if (!isInWishList) {
                            handleWishList()
                          }
                        }}
                        className="mt-3 py-3 px-3 rounded-md flex items-center justify-center text-gray-600 block flex hover:text-gray-900"
                      >
                        {isInWishList ? (
                          <span>{ALERT_SUCCESS_WISHLIST_MESSAGE}</span>
                        ) : (
                          <>
                            <HeartIcon className="h-6 w-6 flex-shrink-0" /> <span>{BTN_ADD_TO_WISHLIST}</span>
                          </>
                        )}
                        <span className="sr-only">{BTN_ADD_TO_FAVORITES}</span>
                      </button>
                    </div>
                    {isEngravingAvailable && (
                      <button
                        className="max-w-xs flex-1 mt-5 bg-gray-400 border border-transparent rounded-md py-3 px-8 flex items-center justify-center font-medium text-white hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-gray-500 sm:w-full"
                        onClick={() => showEngravingModal(true)}
                      >
                        <span className="font-bold">{GENERAL_ENGRAVING}</span>
                      </button>
                    )}
                  </>
                ) : null}                
              <section aria-labelledby="details-heading" className="sm:mt-2 mt-4">
                <h2 id="details-heading" className="sr-only">
                  {PRICEMATCH_ADDITIONAL_DETAILS}
                </h2>
                <ProductDetails
                  product={product}
                  description={
                    selectedAttrData.description || product.description
                  }
                />    
                <DeliveryInstruction></DeliveryInstruction>   
                <div className="divide-gray-200 sm:mt-10 mt-6">
                  <p className="text-gray-900 text-lg">
                    {selectedAttrData.currentStock > 0
                      ? product.deliveryMessage
                      : product.stockAvailabilityMessage}
                  </p>
                </div>         
              </section>
            </div>
          </div>

          {product.componentProducts && (
            <Bundles
              price={product.price.formatted.withTax}
              products={product.componentProducts}
            />
          )}
          {filteredRelatedProducts ? (
            <RelatedProducts
              relatedProducts={filteredRelatedProducts}
              relatedProductList={filteredRelatedProductList}
            />
          ) : null}
          <Reviews data={product.reviews} productId={product.recordId} />
          {isEngravingAvailable && (
            <Engraving
              show={isEngravingOpen}
              submitForm={handleEngravingSubmit}
              onClose={() => showEngravingModal(false)}
            />
          )}

          <PriceMatch
            show={isPriceMatchModalShown}
            onClose={showPriceMatchModal}
            productName={product.name}
            productImage={product.images[0]?.image}
            productId={product.id}
            stockCode={product.stockCode}
            ourCost={product.price.raw.withTax}
            rrp={product.listPrice.raw.withTax}
            ourDeliveryCost={product.price.raw.tax} //TBD
          />
        </div>
        <NextSeo
          title={product.name}
          description={product.metaDescription}
          additionalMetaTags={[
            {
              name: 'keywords',
              content: product.metaKeywords,
            },
          ]}
          openGraph={{
            type: 'website',
            title: product.metaTitle,
            description: product.metaDescription,
            images: [
              {
                url: product.image,
                width: 800,
                height: 600,
                alt: product.name,
              },
            ],
          }}
        />
      </main>
    </div>
  )
}