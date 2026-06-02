'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/context/ToastContext'
import { supabase } from '@/lib/supabase'

type PricingMap = Record<string, { enabled: boolean; modifier: number }>
type MetalTab = 'default' | 'white_gold' | 'yellow_gold' | 'rose_gold' | 'platinum'
type MetalImages = {
  white_gold: string[]
  yellow_gold: string[]
  rose_gold: string[]
  platinum: string[]
}

type ProductFormData = {
  id?: string
  sku: string
  productType: string
  category: string
  title: string
  slug: string
  description: string
  basePrice: number
  pricePerCarat: number
  diamondShape: string
  defaultCarat: number
  metalPricing: PricingMap
  caratPricing: PricingMap
  shapePricing: PricingMap
  colorPricing: PricingMap
  clarityPricing: PricingMap
  availableMetals: string[]
  availableCarats: number[]
  availableShapes: string[]
  availableColors: string[]
  availableClarities: string[]
  availableCuts: string[]
  availableSizes: string[]
  engravingAllowed: boolean
  engravingMaxChars: number
  images: string[]
  metalImages: MetalImages
  videos: string[]
  certificateUrl: string
  isActive: boolean
  isFeatured: boolean
  isNewArrival: boolean
  internalNotes: string
  tags: string[]
  sortOrder: number
  seoTitle: string
  seoDescription: string
}

type IncomingProduct = Partial<{
  [K in keyof ProductFormData]: ProductFormData[K] | null
}> & { id?: string }

interface ValidationError {
  field: string
  message: string
  tab: number
}

const productTypes = [
  ['engagement_ring', 'Engagement Ring'],
  ['wedding_ring', 'Wedding Ring'],
  ['diamond', 'Diamond'],
  ['earring', 'Earring'],
  ['necklace', 'Necklace'],
  ['bracelet', 'Bracelet'],
  ['pendant', 'Pendant'],
  ['gemstone', 'Gemstone'],
]

const categories: Record<string, string[]> = {
  engagement_ring: ['solitaire', 'pave', 'halo', 'three_stone', 'hidden_halo', 'channel_set', 'side_stone', 'custom'],
  wedding_ring: ['classic', 'diamond', 'eternity', 'stackable', 'curved'],
  necklace: ['pendant', 'choker', 'tennis'],
  bracelet: ['tennis', 'bangle', 'cuff'],
  earring: ['stud', 'drop', 'hoop'],
  pendant: ['solitaire', 'halo', 'station'],
  diamond: ['loose_stone'],
  gemstone: ['sapphire', 'emerald', 'ruby'],
}

const optionSets = {
  metals: ['White Gold', 'Yellow Gold', 'Rose Gold', 'Platinum'],
  carats: ['6', '9', '12'],
  shapes: ['Round', 'Oval', 'Cushion', 'Princess', 'Emerald', 'Radiant', 'Pear', 'Marquise', 'Heart', 'Asscher'],
  colors: ['D', 'E', 'F', 'G', 'H', 'I'],
  clarities: ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2'],
}

type MetalPricingKey = 'white_gold' | 'yellow_gold' | 'rose_gold' | 'platinum'

const metalModifierOptions: Array<{
  key: MetalPricingKey
  label: string
  legacyKey: string
  dot: string
}> = [
  { key: 'white_gold', label: 'White Gold', legacyKey: 'White Gold', dot: '#E8E8E8' },
  { key: 'yellow_gold', label: 'Yellow Gold', legacyKey: 'Yellow Gold', dot: '#C9A961' },
  { key: 'rose_gold', label: 'Rose Gold', legacyKey: 'Rose Gold', dot: '#D4956A' },
  { key: 'platinum', label: 'Platinum', legacyKey: 'Platinum', dot: '#C0C0C0' },
]

const ringSizeOptions = ['3', '3.5', '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9', '9.5', '10']

type ProductTypeConfig = {
  label: string
  fields: {
    sizes: boolean
    caratWeights: boolean
    lengths: boolean
    bandWidth?: boolean
    backType?: boolean
  }
  caratOptions?: number[]
  lengthOptions?: string[]
  description: string
}

const productTypeConfig: Record<string, ProductTypeConfig> = {
  engagement_ring: {
    label: 'Engagement Ring',
    fields: { sizes: true, caratWeights: false, lengths: false, bandWidth: true },
    caratOptions: [],
    description: 'Configure metal modifiers and available ring sizes.',
  },
  wedding_ring: {
    label: 'Wedding Ring / Band',
    fields: { sizes: true, caratWeights: false, lengths: false, bandWidth: true },
    caratOptions: [],
    description: 'Configure metal modifiers, band width, and ring sizes.',
  },
  earring: {
    label: 'Earrings / Studs',
    fields: { sizes: false, caratWeights: true, lengths: false, backType: true },
    caratOptions: [0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 3, 4, 5, 6],
    description: 'Configure metal modifiers and carat weight options per pair.',
  },
  bracelet: {
    label: 'Bracelet',
    fields: { sizes: false, caratWeights: true, lengths: true },
    caratOptions: [3, 5, 8, 10, 12, 15],
    lengthOptions: ['6.5"', '7"', '7.5"', '8"'],
    description: 'Configure metal modifiers, total carat weights, and bracelet lengths.',
  },
  necklace: {
    label: 'Necklace',
    fields: { sizes: false, caratWeights: true, lengths: true },
    caratOptions: [5, 7, 10, 15, 20],
    lengthOptions: ['14"', '16"', '18"', '20"', '22"'],
    description: 'Configure metal modifiers, total carat weights, and necklace lengths.',
  },
  pendant: {
    label: 'Pendant',
    fields: { sizes: false, caratWeights: true, lengths: true },
    caratOptions: [0.25, 0.5, 0.75, 1, 1.5, 2],
    lengthOptions: ['16"', '18"', '20"'],
    description: 'Configure metal modifiers, diamond sizes, and chain lengths.',
  },
}

function mapFromOptions(options: string[], defaults: Record<string, number> = {}) {
  return Object.fromEntries(options.map((option) => [option, { enabled: true, modifier: defaults[option] || 0 }]))
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value || 0)
}

function isRingProduct(productType: string) {
  return ['engagement_ring', 'wedding_ring', 'ring'].includes(productType.toLowerCase())
}

function getConfigForProductType(productType: string) {
  return productTypeConfig[productType] || productTypeConfig.engagement_ring
}

function getCaratSamples(productType: string) {
  const options = getConfigForProductType(productType).caratOptions || []
  if (options.length >= 3) {
    return [options[0], options[Math.floor(options.length / 2)], options[options.length - 1]]
  }
  return options.length ? options : [1, 3, 5]
}

function validateForm(formData: ProductFormData): ValidationError[] {
  const errors: ValidationError[] = []

  if (!formData.productType) {
    errors.push({ field: 'productType', message: 'Product type is required', tab: 0 })
  }

  if (!formData.category) {
    errors.push({ field: 'category', message: 'Category is required', tab: 0 })
  }

  if (!formData.title.trim()) {
    errors.push({ field: 'title', message: 'Product title is required', tab: 0 })
  }

  if (!formData.slug.trim()) {
    errors.push({ field: 'slug', message: 'Slug is required', tab: 0 })
  }

  if (!formData.description.trim()) {
    errors.push({ field: 'description', message: 'Description is required', tab: 0 })
  }

  if (!formData.basePrice || formData.basePrice <= 0) {
    errors.push({ field: 'basePrice', message: 'Base price must be greater than 0', tab: 0 })
  }

  if (isRingProduct(formData.productType) && (!formData.defaultCarat || formData.defaultCarat <= 0)) {
    errors.push({ field: 'defaultCarat', message: 'Default carat must be greater than 0', tab: 0 })
  }

  const hasEnabledMetal = Object.values(formData.metalPricing || {}).some((metal) => metal?.enabled === true)
  if (!hasEnabledMetal) {
    errors.push({ field: 'metalPricing', message: 'At least one metal option must be enabled', tab: 1 })
  }

  return errors
}

function blankProduct(): ProductFormData {
  return {
    sku: `JB-ENG-${Date.now()}`,
    productType: 'engagement_ring',
    category: 'solitaire',
    title: '',
    slug: '',
    description: '',
    basePrice: 0,
    pricePerCarat: 300,
    diamondShape: 'Round',
    defaultCarat: 1,
    metalPricing: mapFromOptions(optionSets.metals, { 'Yellow Gold': 200, 'Rose Gold': 150, Platinum: 800 }),
    caratPricing: mapFromOptions(optionSets.carats, { '9': 3000, '12': 7000 }),
    shapePricing: mapFromOptions(optionSets.shapes),
    colorPricing: mapFromOptions(optionSets.colors, { D: 800, E: 500, F: 300, H: -200, I: -400 }),
    clarityPricing: mapFromOptions(optionSets.clarities, { IF: 600, VVS1: 400, VVS2: 200, VS2: -150 }),
    availableMetals: optionSets.metals,
    availableCarats: [6, 9, 12],
    availableShapes: optionSets.shapes,
    availableColors: optionSets.colors,
    availableClarities: optionSets.clarities,
    availableCuts: [],
    availableSizes: ringSizeOptions,
    engravingAllowed: true,
    engravingMaxChars: 20,
    images: [],
    metalImages: {
      white_gold: [],
      yellow_gold: [],
      rose_gold: [],
      platinum: [],
    },
    videos: [],
    certificateUrl: '',
    isActive: true,
    isFeatured: false,
    isNewArrival: false,
    internalNotes: '',
    tags: [],
    sortOrder: 0,
    seoTitle: '',
    seoDescription: '',
  }
}

function withoutNulls(product?: IncomingProduct) {
  if (!product) {
    return {}
  }

  const cleaned = Object.fromEntries(
    Object.entries(product).filter(([, value]) => value !== null && value !== undefined)
  ) as Partial<ProductFormData>

  if (cleaned.metalImages) {
    cleaned.metalImages = {
      white_gold: cleaned.metalImages.white_gold || [],
      yellow_gold: cleaned.metalImages.yellow_gold || [],
      rose_gold: cleaned.metalImages.rose_gold || [],
      platinum: cleaned.metalImages.platinum || [],
    }
  }

  return cleaned
}

function TextInput({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  hasError = false,
}: {
  label: string
  value: string | number | null | undefined
  onChange: (value: string) => void
  type?: string
  placeholder?: string
  hasError?: boolean
}) {
  return (
    <label className="block">
      <span style={{ color: hasError ? '#A85C6A' : '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>{label}</span>
      <input value={value ?? ''} onChange={(event) => onChange(event.target.value)} type={type} placeholder={placeholder} style={{ backgroundColor: '#FDF8F2', border: hasError ? '1px solid #A85C6A' : '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', outlineColor: hasError ? '#A85C6A' : '#1A1014', padding: '12px 14px', transition: 'border-color 0.2s', width: '100%' }} />
    </label>
  )
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null
  }

  return (
    <div style={{ fontSize: '11px', color: '#A85C6A', fontFamily: 'var(--font-inter)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span>!</span>
      {message}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{ backgroundColor: checked ? '#C9A961' : '#D8CFC8', borderRadius: '999px', height: '24px', padding: '2px', width: '46px' }}>
      <span style={{ backgroundColor: '#FBF5F0', borderRadius: '50%', display: 'block', height: '20px', transform: checked ? 'translateX(22px)' : 'translateX(0)', transition: 'all 0.2s', width: '20px' }} />
    </button>
  )
}

function MetalImageUpload({
  metal,
  images,
  slug,
  onImagesChange,
}: {
  metal: Exclude<MetalTab, 'default'>
  images: string[]
  slug: string
  onImagesChange: (images: string[]) => void
}) {
  const [uploading, setUploading] = useState(false)
  const metalColors: Record<string, string> = {
    white_gold: '#E8E8E8',
    yellow_gold: '#C9A961',
    rose_gold: '#D4956A',
    platinum: '#C0C0C0',
  }
  const metalLabels: Record<string, string> = {
    white_gold: 'WHITE GOLD',
    yellow_gold: 'YELLOW GOLD',
    rose_gold: 'ROSE GOLD',
    platinum: 'PLATINUM',
  }

  const handleUpload = async (file: File) => {
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      body.append('slug', `${slug || 'draft'}/${metal}`)

      const response = await fetch('/api/admin/upload', { method: 'POST', body })
      const payload = (await response.json()) as { publicUrl?: string; error?: string }

      if (!response.ok || !payload.publicUrl) {
        throw new Error(payload.error || 'Upload failed')
      }

      onImagesChange([...images, payload.publicUrl])
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Upload failed'
      window.alert(`Upload failed: ${message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '16px' }}>
        {images.map((url, index) => (
          <div key={url} className="product-img-wrap" style={{ position: 'relative', aspectRatio: '1', border: '0.5px solid #EDD9AF', overflow: 'hidden', background: '#FDF8F2' }}>
            <div style={{ position: 'absolute', top: '6px', left: '6px', background: metalColors[metal] || '#C9A961', color: '#1A1014', fontSize: '7px', padding: '2px 6px', letterSpacing: '0.12em', fontFamily: 'var(--font-inter)', fontWeight: 500, zIndex: 2 }}>
              {metalLabels[metal]}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${metal} ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }} />
            <button
              type="button"
              onClick={() => onImagesChange(images.filter((_, imageIndex) => imageIndex !== index))}
              style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(168,92,106,0.9)', border: 'none', color: '#FBF5F0', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              x
            </button>
            {index === 0 && (
              <div style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'rgba(201,169,97,0.9)', color: '#1A1014', fontSize: '8px', padding: '2px 6px', letterSpacing: '0.1em' }}>
                MAIN
              </div>
            )}
          </div>
        ))}

        {images.length < 4 && (
          <button
            type="button"
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = 'image/*'
              input.onchange = (event) => {
                const file = (event.target as HTMLInputElement).files?.[0]
                if (file) {
                  void handleUpload(file)
                }
              }
              input.click()
            }}
            style={{ aspectRatio: '1', border: '2px dashed #EDD9AF', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#FDF8F2', transition: 'all 0.2s', gap: '8px' }}
            onMouseEnter={(event) => {
              event.currentTarget.style.borderColor = '#C9A961'
              event.currentTarget.style.background = '#FBF5F0'
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.borderColor = '#EDD9AF'
              event.currentTarget.style.background = '#FDF8F2'
            }}
          >
            {uploading ? (
              <span style={{ fontSize: '11px', color: '#B8A090' }}>Uploading...</span>
            ) : (
              <>
                <Upload color="#C9A961" size={20} />
                <span style={{ fontSize: '10px', color: '#B8A090', letterSpacing: '0.1em', textAlign: 'center' }}>Add photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <p style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
        Upload up to 4 photos for {metal.replace('_', ' ')} variant. First photo is the main image shown when this metal is selected.
      </p>

      {images.length === 0 && (
        <div style={{ padding: '16px 20px', background: 'rgba(201,169,97,0.08)', border: '0.5px solid rgba(201,169,97,0.25)', borderRadius: '2px', marginTop: '8px' }}>
          <div style={{ fontSize: '11px', color: '#C9A961', fontFamily: 'var(--font-inter)', letterSpacing: '0.1em', marginBottom: '6px', fontWeight: 500 }}>
            ✦ TIP FOR {metal.replace('_', ' ').toUpperCase()} PHOTOS
          </div>
          <div style={{ fontSize: '12px', color: '#B8A090', fontFamily: 'var(--font-inter)', lineHeight: 1.6 }}>
            Upload photos that show this product in <strong style={{ color: '#1A1014' }}>{metal.replace('_', ' ')} metal only</strong>. These images will automatically display when a customer selects this metal option on the product page.
          </div>
          <div style={{ marginTop: '10px', fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
            Recommended: 4 photos per metal variant
            <br />
            Angles: Front · Side · Detail · Lifestyle
          </div>
        </div>
      )}
    </div>
  )
}

export function ProductForm({ product, mode }: { product?: IncomingProduct; mode: 'new' | 'edit' }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [form, setForm] = useState<ProductFormData>(() => ({ ...blankProduct(), ...withoutNulls(product) }))
  const [tagInput, setTagInput] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState('')
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)
  const [status, setStatus] = useState('Not saved yet')
  const [lastSaved, setLastSaved] = useState('')
  const [activeTab, setActiveTab] = useState(0)
  const [activeMetalTab, setActiveMetalTab] = useState<MetalTab>('default')
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  useEffect(() => {
    if (product) {
      setForm((current) => ({ ...current, ...withoutNulls(product) }))
    }
  }, [product])

  const categoryOptions = categories[form.productType] || []
  const selectedProductConfig = getConfigForProductType(form.productType)
  const ringProduct = isRingProduct(form.productType)
  const whiteGoldModifier = form.metalPricing['White Gold']?.modifier || form.metalPricing.white_gold?.modifier || 0
  const caratSamples = useMemo(
    () => getCaratSamples(form.productType),
    [form.productType]
  )
  const samplePriceRows = useMemo(() => {
    if (ringProduct) {
      return [form.defaultCarat || 1, 1.5, 2].map((carat) => {
        const caratCost = Math.max(0, carat - (form.defaultCarat || 1)) * form.pricePerCarat
        return {
          label: `White Gold, ${carat}ct ${form.diamondShape}`,
          carat,
          caratCost,
          total: form.basePrice + whiteGoldModifier + caratCost,
        }
      })
    }

    return caratSamples.map((carat) => {
      const caratCost = carat * form.pricePerCarat
      return {
        label: `White Gold, ${carat}ct`,
        carat,
        caratCost,
        total: form.basePrice + whiteGoldModifier + caratCost,
      }
    })
  }, [caratSamples, form.basePrice, form.defaultCarat, form.diamondShape, form.pricePerCarat, ringProduct, whiteGoldModifier])

  const setField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setValidationErrors((current) => current.filter((error) => error.field !== key))
  }

  const handleProductTypeChange = (value: string) => {
    const nextConfig = getConfigForProductType(value)
    const nextCategory = categories[value]?.[0] || ''
    setForm((current) => ({
      ...current,
      productType: value,
      category: nextCategory,
      availableCarats: nextConfig.caratOptions || [],
      availableSizes: nextConfig.fields.sizes ? ringSizeOptions : nextConfig.lengthOptions || [],
      diamondShape: isRingProduct(value) ? current.diamondShape || 'Round' : current.diamondShape,
      defaultCarat: isRingProduct(value) ? current.defaultCarat || 1 : current.defaultCarat,
      pricePerCarat: current.pricePerCarat || 300,
    }))
    setValidationErrors((current) => current.filter((error) => error.field !== 'productType' && error.field !== 'category'))
  }

  const getFieldError = (field: string) => validationErrors.find((error) => error.field === field)?.message

  const updateMetalModifier = (metal: (typeof metalModifierOptions)[number], modifier: number) => {
    setForm((current) => ({
      ...current,
      metalPricing: {
        ...current.metalPricing,
        [metal.legacyKey]: {
          ...current.metalPricing[metal.legacyKey],
          enabled: true,
          modifier,
        },
      },
    }))
    setValidationErrors((current) => current.filter((error) => error.field !== 'metalPricing'))
  }

  const handleFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    for (const file of files) {
      const body = new FormData()
      body.append('file', file)
      body.append('slug', form.slug || slugify(form.title) || 'draft')
      const response = await fetch('/api/admin/upload', { method: 'POST', body })
      const payload = (await response.json()) as { publicUrl?: string; error?: string }
      const publicUrl = payload.publicUrl
      if (publicUrl) {
        setForm((current) => ({ ...current, images: [...current.images, publicUrl] }))
      } else if (payload.error) {
        setStatus(payload.error)
      }
    }
  }

  const handleVideoSelect = async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      showToast('Video must be under 100MB', 'error')
      return
    }

    const localUrl = URL.createObjectURL(file)
    setVideoFile(file)
    setVideoPreview(localUrl)
    setVideoUploading(true)
    setVideoProgress(0)

    try {
      const productSlug = form.slug || slugify(form.title) || `product-${Date.now()}`
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`
      const filePath = `products/${productSlug}/${fileName}`

      setVideoProgress(30)

      const { error } = await supabase.storage
        .from('product-videos')
        .upload(filePath, file, { upsert: true })

      if (error) {
        throw error
      }

      setVideoProgress(80)

      const { data: { publicUrl } } = supabase.storage
        .from('product-videos')
        .getPublicUrl(filePath)

      setField('videos', [publicUrl])
      setVideoProgress(100)
      showToast('Video uploaded successfully!', 'success')
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unknown upload error'
      showToast(`Video upload failed: ${message}`, 'error')
      setVideoFile(null)
      setVideoPreview('')
    } finally {
      setVideoUploading(false)
      window.setTimeout(() => setVideoProgress(0), 1000)
    }
  }

  const handleSave = async (action: 'draft' | 'publish') => {
    const errors = validateForm(form)

    if (errors.length > 0) {
      showToast(errors[0].message, 'error')
      setActiveTab(errors[0].tab)
      setValidationErrors(errors)
      return
    }

    setValidationErrors([])
    setIsSaving(true)
    try {
      const publish = action === 'publish'
      const payload = {
        ...form,
        slug: form.slug || slugify(form.title),
        isActive: publish,
        pricePerCarat: Number(form.pricePerCarat) || 300,
        diamondShape: form.diamondShape || 'Round',
        defaultCarat: Number(form.defaultCarat) || 1,
        certificateUrl: form.certificateUrl || null,
        hoverImage: null,
        modelUrl: null,
        updatedAt: new Date().toISOString(),
      }
      const url = mode === 'new' ? '/api/admin/products' : `/api/admin/products/${form.id}`
      const response = await fetch(url, {
        method: mode === 'new' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await response.json()) as { product?: ProductFormData; error?: string; omittedColumns?: string[] }

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Unable to save product.')
      }

      const skippedColumns = data.omittedColumns?.length
        ? ` Some newer fields were skipped until Supabase refreshes: ${data.omittedColumns.join(', ')}.`
        : ''

      showToast(
        publish
          ? `Product published - Now live${skippedColumns}`
          : `Draft saved - Not visible to customers${skippedColumns}`,
        'success'
      )

      if (publish) {
        window.setTimeout(() => {
          router.push('/admin/products')
        }, 800)
      } else {
        if (mode === 'new' && data.product?.id) {
          router.replace(`/admin/products/${data.product.id}`)
        }
        if (data.product) {
          setForm((current) => ({ ...current, ...withoutNulls(data.product) }))
        }
        setStatus('Last saved: just now')
        setLastSaved('just now')
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to save product'
      setStatus(message)
      showToast(`Failed to save product: ${message}`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="pb-24">
      <div>
        <div style={{ display: 'flex', borderBottom: '0.5px solid #EDD9AF', background: '#FBF5F0', marginBottom: '24px', overflowX: 'auto' }}>
          {['Basic Info', 'Pricing', 'Images & Media', 'Settings'].map((tab, i) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(i)}
              style={{
                padding: '16px 24px',
                background: 'transparent',
                border: 'none',
                borderBottom: activeTab === i ? '2px solid #1A1014' : '2px solid transparent',
                fontSize: '11px',
                letterSpacing: '0.15em',
                cursor: 'pointer',
                color: activeTab === i ? '#1A1014' : '#B8A090',
                fontFamily: 'var(--font-inter)',
                fontWeight: activeTab === i ? 500 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {i < activeTab && (
                <span style={{ color: '#C9A961', fontSize: '12px' }}>✓</span>
              )}
              {i >= activeTab && (
                <span
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: activeTab === i ? '#1A1014' : 'transparent',
                    border: activeTab === i ? 'none' : '1px solid #EDD9AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    color: activeTab === i ? '#FBF5F0' : '#B8A090',
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </span>
              )}
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {validationErrors.length > 0 && (
          <div style={{ background: '#FCF0F4', border: '1px solid #A85C6A', borderRadius: '2px', padding: '14px 18px', marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '16px', color: '#A85C6A', flexShrink: 0 }}>!</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#A85C6A', fontFamily: 'var(--font-inter)', marginBottom: '6px' }}>
                Please fix {validationErrors.length} error{validationErrors.length > 1 ? 's' : ''} before saving
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', listStyle: 'disc' }}>
                {validationErrors.map((error, index) => (
                  <li key={`${error.field}-${index}`} style={{ fontSize: '12px', color: '#A85C6A', fontFamily: 'var(--font-inter)', lineHeight: '1.8' }}>
                    {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 0 && (
          <section className="grid gap-5" style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '24px' }}>
            <p style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)', marginBottom: '4px' }}>
              Fields marked with * are required
            </p>
            <div className="grid gap-5 md:grid-cols-2">
              <label>
                <span style={{ color: getFieldError('productType') ? '#A85C6A' : '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>PRODUCT TYPE *</span>
                <Select value={form.productType} onValueChange={handleProductTypeChange}>
                  <SelectTrigger style={{ backgroundColor: '#FDF8F2', border: getFieldError('productType') ? '1px solid #A85C6A' : '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', width: '100%' }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF' }}>{productTypes.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
                <FieldError message={getFieldError('productType')} />
              </label>
              <label>
                <span style={{ color: getFieldError('category') ? '#A85C6A' : '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>CATEGORY *</span>
                <Select value={form.category} onValueChange={(value) => setField('category', value)}>
                  <SelectTrigger style={{ backgroundColor: '#FDF8F2', border: getFieldError('category') ? '1px solid #A85C6A' : '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', width: '100%' }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF' }}>{categoryOptions.map((item) => <SelectItem key={item} value={item}>{item.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
                <FieldError message={getFieldError('category')} />
              </label>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <TextInput label="TITLE *" value={form.title} hasError={Boolean(getFieldError('title'))} onChange={(value) => { setForm((current) => ({ ...current, title: value, slug: current.slug ? current.slug : slugify(value) })); setValidationErrors((current) => current.filter((error) => error.field !== 'title' && error.field !== 'slug')) }} />
                <FieldError message={getFieldError('title')} />
              </div>
              <div>
                <TextInput label="SLUG *" value={form.slug} hasError={Boolean(getFieldError('slug'))} onChange={(value) => setField('slug', value)} />
                <FieldError message={getFieldError('slug')} />
              </div>
            </div>
            <div className="grid gap-5 md:grid-cols-[1fr_auto]">
              <TextInput label="SKU" value={form.sku} onChange={(value) => setField('sku', value)} />
              <button type="button" onClick={() => setField('sku', `JB-${form.productType.split('_')[0].slice(0, 4).toUpperCase()}-${Date.now()}`)} style={{ alignSelf: 'end', backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', height: '43px', letterSpacing: '0.12em', padding: '0 16px' }}>AUTO-GENERATE</button>
            </div>
            <label>
              <span style={{ color: getFieldError('description') ? '#A85C6A' : '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>INTERNAL DESCRIPTION *</span>
              <textarea value={form.description ?? ''} onChange={(event) => setField('description', event.target.value)} style={{ backgroundColor: '#FDF8F2', border: getFieldError('description') ? '1px solid #A85C6A' : '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', minHeight: '120px', outlineColor: getFieldError('description') ? '#A85C6A' : '#1A1014', padding: '12px 14px', transition: 'border-color 0.2s', width: '100%' }} />
              <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', lineHeight: 1.6, marginTop: '8px' }}>
                Description is used for SEO only. It is not displayed to customers on the product page.
              </p>
              <FieldError message={getFieldError('description')} />
            </label>
            <div>
              <TextInput label="BASE PRICE *" value={form.basePrice} type="number" hasError={Boolean(getFieldError('basePrice'))} onChange={(value) => setField('basePrice', Number(value))} />
              <FieldError message={getFieldError('basePrice')} />
            </div>
            {ringProduct && (
              <div style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '18px 20px' }}>
                <div style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '12px' }}>
                  DIAMOND VISUALIZER
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  <label>
                    <span style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>DIAMOND SHAPE</span>
                    <Select value={form.diamondShape || 'Round'} onValueChange={(value) => setField('diamondShape', value)}>
                      <SelectTrigger style={{ backgroundColor: '#FBF5F0', border: '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', width: '100%' }}><SelectValue /></SelectTrigger>
                      <SelectContent style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF' }}>{optionSets.shapes.map((shape) => <SelectItem key={shape} value={shape}>{shape}</SelectItem>)}</SelectContent>
                    </Select>
                  </label>
                  <div>
                    <TextInput label="DEFAULT CARAT *" value={form.defaultCarat} type="number" hasError={Boolean(getFieldError('defaultCarat'))} onChange={(value) => setField('defaultCarat', Number(value))} />
                    <FieldError message={getFieldError('defaultCarat')} />
                  </div>
                  <TextInput label="PRICE PER EXTRA CARAT" value={form.pricePerCarat} type="number" onChange={(value) => setField('pricePerCarat', Number(value))} />
                </div>
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', lineHeight: 1.6, marginTop: '10px' }}>
                  Product page price = selected metal price plus carat above the default times this extra-carat rate.
                </p>
              </div>
            )}
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>Starting from <span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px' }}>{formatMoney(form.basePrice)}</span></p>
          </section>
        )}

        {activeTab === 1 && (
          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-5">
              <div style={{ background: 'rgba(201,169,97,0.08)', border: '0.5px solid rgba(201,169,97,0.3)', padding: '14px 20px' }}>
                <div style={{ fontSize: '11px', color: '#C9A961', letterSpacing: '0.15em', fontFamily: 'var(--font-inter)', fontWeight: 500, marginBottom: '4px' }}>
                  {selectedProductConfig.label.toUpperCase()} PRICING
                </div>
                <div style={{ fontSize: '12px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
                  {selectedProductConfig.description}
                </div>
              </div>

              <div style={{ backgroundColor: '#FBF5F0', border: getFieldError('metalPricing') ? '1px solid #A85C6A' : '0.5px solid #EDD9AF', borderRadius: '4px', padding: '22px 24px' }}>
                <p style={{ color: getFieldError('metalPricing') ? '#A85C6A' : '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '6px' }}>
                  METAL MODIFIERS
                </p>
                <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.6, marginBottom: '16px' }}>
                  Price added or subtracted per metal.
                </p>
                <FieldError message={getFieldError('metalPricing')} />

                {metalModifierOptions.map((metal) => {
                  const value = form.metalPricing[metal.legacyKey]?.modifier || form.metalPricing[metal.key]?.modifier || 0
                  return (
                    <div key={metal.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: '0.5px solid #EDD9AF' }}>
                      <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: metal.dot, border: '1px solid rgba(26,16,20,0.1)', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '13px', color: '#1A1014', fontFamily: 'var(--font-inter)' }}>
                        {metal.label}
                      </span>
                      <span style={{ fontSize: '13px', color: value >= 0 ? '#7A8F72' : '#A85C6A', fontFamily: 'var(--font-inter)', fontWeight: 500, width: '16px' }}>
                        {value >= 0 ? '+' : ''}
                      </span>
                      <input
                        type="number"
                        value={value}
                        onChange={(event) => updateMetalModifier(metal, Number.parseInt(event.target.value, 10) || 0)}
                        style={{ width: '100px', padding: '8px 12px', background: '#FDF8F2', border: '1px solid #EDD9AF', color: '#1A1014', fontSize: '13px', fontFamily: 'var(--font-inter)', textAlign: 'right', outline: 'none' }}
                      />
                      <span style={{ fontSize: '12px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
                        USD
                      </span>
                    </div>
                  )
                })}
              </div>

              {selectedProductConfig.fields.caratWeights && (
                <div style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '22px 24px' }}>
                  <div style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#C9A961', marginBottom: '8px', fontFamily: 'var(--font-inter)' }}>
                    PRICE PER CARAT
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <input
                      type="number"
                      value={form.pricePerCarat || 300}
                      onChange={(event) => setField('pricePerCarat', Number.parseInt(event.target.value, 10) || 0)}
                      style={{ width: '140px', padding: '12px 16px', background: '#FDF8F2', border: '1px solid #EDD9AF', color: '#1A1014', fontSize: '14px', fontFamily: 'var(--font-inter)', outline: 'none' }}
                    />
                    <span style={{ fontSize: '13px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
                      USD per carat
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#B8A090', marginTop: '8px', fontFamily: 'var(--font-inter)', lineHeight: 1.6 }}>
                    Customer price = Base price + Metal modifier + selected carats times this value.
                  </p>

                  <div style={{ marginTop: '24px' }}>
                    <div style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#C9A961', marginBottom: '12px', fontFamily: 'var(--font-inter)' }}>
                      AVAILABLE CARAT WEIGHTS
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(74px, 1fr))', gap: '6px' }}>
                      {(selectedProductConfig.caratOptions || []).map((carat) => {
                        const selected = form.availableCarats.includes(carat)
                        return (
                          <label key={carat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', border: '0.5px solid #EDD9AF', background: selected ? '#FDF8F2' : '#FBF5F0', cursor: 'pointer', fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)' }}>
                            <input
                              type="checkbox"
                              checked={selected}
                              onChange={(event) => {
                                const next = event.target.checked
                                  ? [...form.availableCarats, carat].sort((a, b) => a - b)
                                  : form.availableCarats.filter((item) => item !== carat)
                                setField('availableCarats', next)
                              }}
                              style={{ accentColor: '#1A1014' }}
                            />
                            {carat}
                          </label>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {selectedProductConfig.fields.lengths && selectedProductConfig.lengthOptions && (
                <div style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '22px 24px' }}>
                  <div style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#C9A961', marginBottom: '12px', fontFamily: 'var(--font-inter)' }}>
                    AVAILABLE LENGTHS
                  </div>
                  <p style={{ fontSize: '11px', color: '#B8A090', marginBottom: '12px', fontFamily: 'var(--font-inter)', lineHeight: 1.6 }}>
                    Check which chain or bracelet lengths are offered for this product.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(82px, 1fr))', gap: '6px' }}>
                    {selectedProductConfig.lengthOptions.map((length) => {
                      const selected = form.availableSizes.includes(length)
                      return (
                        <label key={length} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', border: '0.5px solid #EDD9AF', background: selected ? '#FDF8F2' : '#FBF5F0', cursor: 'pointer', fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)' }}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => {
                              const next = event.target.checked
                                ? [...form.availableSizes, length]
                                : form.availableSizes.filter((item) => item !== length)
                              setField('availableSizes', next)
                            }}
                            style={{ accentColor: '#1A1014' }}
                          />
                          {length}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}

              {selectedProductConfig.fields.sizes && (
                <div style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '22px 24px' }}>
                  <div style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#C9A961', marginBottom: '12px', fontFamily: 'var(--font-inter)' }}>
                    AVAILABLE RING SIZES
                  </div>
                  <p style={{ fontSize: '11px', color: '#B8A090', marginBottom: '12px', fontFamily: 'var(--font-inter)', lineHeight: 1.6 }}>
                    Check which sizes are available for this ring. Most styles support sizes 3 through 10.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(56px, 1fr))', gap: '6px' }}>
                    {ringSizeOptions.map((size) => {
                      const selected = form.availableSizes.includes(size)
                      return (
                        <label key={size} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', border: '0.5px solid #EDD9AF', background: selected ? '#FDF8F2' : '#FBF5F0', cursor: 'pointer', fontSize: '12px', color: '#1A1014', fontFamily: 'var(--font-inter)' }}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(event) => {
                              const next = event.target.checked
                                ? [...form.availableSizes, size]
                                : form.availableSizes.filter((item) => item !== size)
                              setField('availableSizes', next)
                            }}
                            style={{ accentColor: '#1A1014' }}
                          />
                          {size}
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
            <aside style={{ backgroundColor: '#1A1014', borderRadius: '4px', color: '#FBF5F0', height: 'fit-content', padding: '20px 24px', position: 'sticky', top: '100px' }}>
              <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em' }}>PRICE PREVIEW</p>
              <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.7, marginTop: '12px' }}>
                White Gold sample calculations
              </p>
              <div style={{ display: 'grid', gap: '18px', marginTop: '18px' }}>
                {samplePriceRows.map((row) => (
                  <div key={row.label} style={{ borderTop: '0.5px solid rgba(237,217,175,0.25)', paddingTop: '14px' }}>
                    <p style={{ color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '12px', fontWeight: 500, marginBottom: '10px' }}>{row.label}</p>
                    <div style={{ display: 'grid', gap: '8px', color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <span>Base price</span>
                        <span>{formatMoney(form.basePrice)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                        <span>+ White Gold</span>
                        <span>{whiteGoldModifier >= 0 ? '+' : ''}{formatMoney(whiteGoldModifier)}</span>
                      </div>
                      {row.carat !== null && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                          <span>+ {row.carat}ct x {formatMoney(form.pricePerCarat)}</span>
                          <span>+ {formatMoney(row.caratCost)}</span>
                        </div>
                      )}
                      <div style={{ borderTop: '0.5px solid rgba(237,217,175,0.25)', display: 'flex', justifyContent: 'space-between', gap: '16px', marginTop: '4px', paddingTop: '10px' }}>
                        <span style={{ color: '#C9A961' }}>Total</span>
                        <span style={{ color: '#FBF5F0', fontFamily: 'var(--font-playfair)', fontSize: '22px' }}>{formatMoney(row.total)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </section>
        )}

        {activeTab === 2 && (
          <section style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '24px' }}>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.25em', color: '#C9A961', marginBottom: '12px', fontFamily: 'var(--font-inter)' }}>
                IMAGES BY METAL VARIANT
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                {[
                  { key: 'default', label: 'Default', dot: '#888' },
                  { key: 'white_gold', label: 'White Gold', dot: '#E8E8E8' },
                  { key: 'yellow_gold', label: 'Yellow Gold', dot: '#C9A961' },
                  { key: 'rose_gold', label: 'Rose Gold', dot: '#D4956A' },
                  { key: 'platinum', label: 'Platinum', dot: '#C0C0C0' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveMetalTab(tab.key as MetalTab)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: activeMetalTab === tab.key ? '#1A1014' : 'transparent', color: activeMetalTab === tab.key ? '#FBF5F0' : '#1A1014', border: `0.5px solid ${activeMetalTab === tab.key ? '#1A1014' : '#EDD9AF'}`, cursor: 'pointer', fontSize: '11px', letterSpacing: '0.1em', fontFamily: 'var(--font-inter)', transition: 'all 0.2s' }}
                  >
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: tab.dot, border: '0.5px solid rgba(26,16,20,0.15)', flexShrink: 0 }} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeMetalTab === 'default' ? (
                <>
                  <label className="block cursor-pointer text-center" style={{ backgroundColor: '#FDF8F2', border: '2px dashed #EDD9AF', borderRadius: '4px', padding: '40px' }}>
                    <Upload color="#C9A961" className="mx-auto mb-4" size={34} />
                    <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px' }}>Drag and drop product images here</p>
                    <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>or click to browse. PNG, JPG up to 10MB each.</p>
                    <input multiple onChange={handleFiles} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" />
                  </label>
                  <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
                    {form.images.map((image, index) => (
                      <div key={image} className="product-img-wrap" style={{ aspectRatio: '1', backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', overflow: 'hidden', position: 'relative' }}>
                        <Image src={image} alt={`Product ${index + 1}`} fill sizes="160px" className="img-cover" style={{ objectFit: 'cover', objectPosition: 'center' }} />
                        {index === 0 && <span style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '9px', left: '8px', letterSpacing: '0.12em', padding: '4px 8px', position: 'absolute', top: '8px' }}>PRIMARY</span>}
                        <button type="button" onClick={() => setField('images', form.images.filter((item) => item !== image))} style={{ backgroundColor: '#FBF5F0', borderRadius: '50%', color: '#1A1014', padding: '5px', position: 'absolute', right: '8px', top: '8px' }}><X size={14} /></button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <MetalImageUpload
                  metal={activeMetalTab}
                  images={form.metalImages[activeMetalTab]}
                  slug={form.slug || slugify(form.title)}
                  onImagesChange={(newImages) => {
                    setField('metalImages', {
                      ...form.metalImages,
                      [activeMetalTab]: newImages,
                    })
                  }}
                />
              )}
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <div style={{ fontSize: '9px', letterSpacing: '0.3em', color: '#C9A961', fontFamily: 'var(--font-inter)', marginBottom: '12px' }}>
                  PRODUCT VIDEO
                </div>

                {!videoPreview && !form.videos?.[0] ? (
                  <div
                    onClick={() => document.getElementById('video-upload')?.click()}
                    style={{
                      border: '2px dashed #EDD9AF',
                      borderRadius: '4px',
                      padding: '36px 24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: '#FDF8F2',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(event) => {
                      event.currentTarget.style.borderColor = '#C9A961'
                      event.currentTarget.style.background = '#FBF5F0'
                    }}
                    onMouseLeave={(event) => {
                      event.currentTarget.style.borderColor = '#EDD9AF'
                      event.currentTarget.style.background = '#FDF8F2'
                    }}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.currentTarget.style.borderColor = '#C9A961'
                    }}
                    onDrop={(event) => {
                      event.preventDefault()
                      const file = event.dataTransfer.files[0]
                      if (file && file.type.startsWith('video/')) {
                        void handleVideoSelect(file)
                      }
                    }}
                  >
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="1.2" style={{ margin: '0 auto 12px' }}>
                      <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                    </svg>
                    <p style={{ fontSize: '13px', color: '#1A1014', fontFamily: 'var(--font-inter)', marginBottom: '4px' }}>
                      Drop video here or click to upload
                    </p>
                    <p style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
                      MP4, MOV, WebM - max 100MB
                    </p>
                  </div>
                ) : (
                  <div style={{ border: '0.5px solid #EDD9AF', borderRadius: '4px', overflow: 'hidden', background: '#FDF8F2' }}>
                    <video src={videoPreview || form.videos?.[0]} controls style={{ width: '100%', maxHeight: '240px', display: 'block' }} />
                    <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '0.5px solid #EDD9AF' }}>
                      <span style={{ fontSize: '11px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
                        {videoFile?.name || 'Current video'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (videoPreview) {
                            URL.revokeObjectURL(videoPreview)
                          }
                          setVideoFile(null)
                          setVideoPreview('')
                          setField('videos', [])
                        }}
                        style={{ background: 'transparent', border: '0.5px solid #EDD9AF', color: '#A85C6A', padding: '6px 12px', fontSize: '10px', cursor: 'pointer', fontFamily: 'var(--font-inter)', letterSpacing: '0.1em' }}
                      >
                        REMOVE
                      </button>
                    </div>
                  </div>
                )}

                {videoUploading && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#B8A090', fontFamily: 'var(--font-inter)', marginBottom: '6px' }}>
                      <span>Uploading...</span>
                      <span>{videoProgress}%</span>
                    </div>
                    <div style={{ background: '#EDD9AF', height: '4px', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ background: '#C9A961', height: '100%', width: `${videoProgress}%`, transition: 'width 0.3s ease', borderRadius: '999px' }} />
                    </div>
                  </div>
                )}

                <input
                  id="video-upload"
                  type="file"
                  accept="video/mp4,video/mov,video/webm,video/*"
                  style={{ display: 'none' }}
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      void handleVideoSelect(file)
                    }
                  }}
                />

                <details style={{ marginTop: '12px' }}>
                  <summary style={{ fontSize: '11px', color: '#B8A090', cursor: 'pointer', fontFamily: 'var(--font-inter)', letterSpacing: '0.05em', listStyle: 'none' }}>
                    - Or paste a video URL instead
                  </summary>
                  <div style={{ marginTop: '10px' }}>
                    <input
                      type="url"
                      placeholder="https://youtube.com/... or direct MP4 URL"
                      value={form.videos?.[0]?.startsWith('http') && !form.videos[0].includes('supabase') ? form.videos[0] : ''}
                      onChange={(event) => setField('videos', event.target.value ? [event.target.value] : [])}
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #EDD9AF', background: '#FDF8F2', color: '#1A1014', fontSize: '12px', fontFamily: 'var(--font-inter)', borderRadius: '2px' }}
                    />
                  </div>
                </details>

                {form.videos.length > 0 && (
                  <div className="mt-4 grid gap-2">
                    {form.videos.map((video, index) => (
                      <div key={`${video}-${index}`} className="flex items-center gap-3" style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '10px 12px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A961" strokeWidth="1.5">
                          <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                        </svg>
                        <span className="min-w-0 flex-1 truncate" style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{video}</span>
                        {index === 0 && <span style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '8px', letterSpacing: '0.12em', padding: '3px 7px' }}>PRIMARY</span>}
                        <button type="button" onClick={() => setField('videos', form.videos.filter((item) => item !== video))} style={{ color: '#A85C6A' }}><X size={15} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <TextInput label="CERTIFICATE URL" value={form.certificateUrl} onChange={(value) => setField('certificateUrl', value)} />
            </div>
          </section>
        )}

        {activeTab === 3 && (
          <section className="grid gap-5" style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '24px' }}>
            {[['Show to customers', 'isActive'], ['Featured product', 'isFeatured'], ['New Arrival', 'isNewArrival']].map(([label, key]) => (
              <div key={key} className="flex items-center justify-between" style={{ borderBottom: '0.5px solid #EDD9AF', paddingBottom: '14px' }}>
                <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>{label}</span>
                <Toggle checked={Boolean(form[key as keyof ProductFormData])} onChange={(checked) => setField(key as 'isActive' | 'isFeatured' | 'isNewArrival', checked)} />
              </div>
            ))}
            <TextInput label="SORT ORDER" value={form.sortOrder} type="number" onChange={(value) => setField('sortOrder', Number(value))} />
            <label>
              <span style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>INTERNAL NOTES</span>
              <textarea value={form.internalNotes ?? ''} onChange={(event) => setField('internalNotes', event.target.value)} style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', color: '#1A1014', minHeight: '100px', padding: '12px 14px', width: '100%' }} />
            </label>
            <div>
              <TextInput label="TAGS" value={tagInput} onChange={setTagInput} />
              <button type="button" onClick={() => { if (tagInput) { setField('tags', [...form.tags, tagInput]); setTagInput('') } }} style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '8px' }}>Add tag →</button>
              <div className="mt-3 flex flex-wrap gap-2">{form.tags.map((tag) => <button key={tag} type="button" onClick={() => setField('tags', form.tags.filter((item) => item !== tag))} style={{ backgroundColor: '#1A1014', borderRadius: '999px', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '10px', padding: '5px 10px' }}>{tag} ×</button>)}</div>
            </div>
            <TextInput label="SEO TITLE" value={form.seoTitle} onChange={(value) => setField('seoTitle', value)} />
            <label>
              <span style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>SEO DESCRIPTION</span>
              <textarea value={form.seoDescription ?? ''} onChange={(event) => setField('seoDescription', event.target.value)} style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', color: '#1A1014', minHeight: '90px', padding: '12px 14px', width: '100%' }} />
            </label>
          </section>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 px-6 py-4 lg:left-[260px] lg:px-8" style={{ backgroundColor: '#FBF5F0', borderTop: '0.5px solid #EDD9AF' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          width: '100%',
        }}>
          <div style={{
            fontSize: '11px',
            color: '#B8A090',
            fontFamily: 'var(--font-inter)',
          }}>
            Step {activeTab + 1} of 4
            {activeTab === 3 && (lastSaved || status !== 'Not saved yet') ? (
              <span style={{ marginLeft: '12px' }}>
                {lastSaved ? `Last saved: ${lastSaved}` : status}
              </span>
            ) : null}
          </div>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {activeTab > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab - 1)}
                style={{
                  padding: '12px 24px',
                  background: 'transparent',
                  border: '0.5px solid #EDD9AF',
                  color: '#B8A090',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.borderColor = '#1A1014'
                  event.currentTarget.style.color = '#1A1014'
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.borderColor = '#EDD9AF'
                  event.currentTarget.style.color = '#B8A090'
                }}
              >
                ← BACK
              </button>
            )}

            {activeTab < 3 && (
              <button
                type="button"
                onClick={() => setActiveTab(activeTab + 1)}
                style={{
                  padding: '12px 32px',
                  background: '#1A1014',
                  border: 'none',
                  color: '#FBF5F0',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-inter)',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = '#2A1E24'
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = '#1A1014'
                }}
              >
                NEXT →
              </button>
            )}

            {activeTab === 3 && (
              <>
                <button
                  type="button"
                  onClick={() => void handleSave('draft')}
                  disabled={isSaving}
                  style={{
                    padding: '12px 28px',
                    background: 'transparent',
                    border: '0.5px solid #EDD9AF',
                    color: '#1A1014',
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-inter)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSaving ? 0.65 : 1,
                  }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.borderColor = '#C9A961'
                    event.currentTarget.style.color = '#C9A961'
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.borderColor = '#EDD9AF'
                    event.currentTarget.style.color = '#1A1014'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  {isSaving ? 'SAVING...' : 'SAVE DRAFT'}
                </button>

                <button
                  type="button"
                  onClick={() => void handleSave('publish')}
                  disabled={isSaving}
                  style={{
                    padding: '12px 32px',
                    background: isSaving ? '#B8A090' : '#1A1014',
                    border: 'none',
                    color: '#FBF5F0',
                    fontSize: '11px',
                    letterSpacing: '0.15em',
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-inter)',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: isSaving ? 0.75 : 1,
                  }}
                  onMouseEnter={(event) => {
                    if (!isSaving) event.currentTarget.style.background = '#2A1E24'
                  }}
                  onMouseLeave={(event) => {
                    if (!isSaving) event.currentTarget.style.background = '#1A1014'
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {isSaving ? 'PUBLISHING...' : 'PUBLISH ✦'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
