'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/context/ToastContext'

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
  ['gemstone', 'Gemstone'],
]

const categories: Record<string, string[]> = {
  engagement_ring: ['solitaire', 'pave', 'halo', 'three_stone', 'hidden_halo', 'channel_set', 'side_stone', 'custom'],
  wedding_ring: ['classic', 'diamond', 'eternity', 'stackable', 'curved'],
  necklace: ['pendant', 'choker', 'tennis'],
  bracelet: ['tennis', 'bangle', 'cuff'],
  earring: ['stud', 'drop', 'hoop'],
  diamond: ['loose_stone'],
  gemstone: ['sapphire', 'emerald', 'ruby'],
}

const optionSets = {
  metals: ['White Gold', 'Yellow Gold', 'Rose Gold', 'Platinum'],
  carats: ['6', '9', '12'],
  shapes: ['Round', 'Oval', 'Cushion', 'Princess', 'Emerald', 'Pear', 'Marquise', 'Heart', 'Asscher'],
  colors: ['D', 'E', 'F', 'G', 'H', 'I'],
  clarities: ['IF', 'VVS1', 'VVS2', 'VS1', 'VS2'],
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

  const hasEnabledMetal = Object.values(formData.metalPricing || {}).some((metal) => metal?.enabled === true)
  if (!hasEnabledMetal) {
    errors.push({ field: 'metalPricing', message: 'At least one metal option must be enabled', tab: 1 })
  }

  const hasEnabledCarat = Object.values(formData.caratPricing || {}).some((carat) => carat?.enabled === true)
  if (!hasEnabledCarat) {
    errors.push({ field: 'caratPricing', message: 'At least one carat option must be enabled', tab: 1 })
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
    availableSizes: ['4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5', '9'],
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
          <div key={url} style={{ position: 'relative', aspectRatio: '1', border: '0.5px solid #EDD9AF', overflow: 'hidden', background: '#F5E8ED' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`${metal} ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
  const samplePrice = useMemo(() => {
    return form.basePrice + (form.metalPricing['White Gold']?.modifier || 0) + (form.caratPricing['9']?.modifier || 0) + (form.shapePricing.Round?.modifier || 0) + (form.colorPricing.G?.modifier || 0) + (form.clarityPricing.VS1?.modifier || 0)
  }, [form])

  const setField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setValidationErrors((current) => current.filter((error) => error.field !== key))
  }

  const getFieldError = (field: string) => validationErrors.find((error) => error.field === field)?.message

  const updatePricing = (group: keyof Pick<ProductFormData, 'metalPricing' | 'caratPricing' | 'shapePricing' | 'colorPricing' | 'clarityPricing'>, option: string, patch: Partial<{ enabled: boolean; modifier: number }>) => {
    setForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [option]: { ...current[group][option], ...patch },
      },
    }))
    setValidationErrors((current) => current.filter((error) => error.field !== group))
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
      const { createClient } = await import('@supabase/supabase-js')
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

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
        isActive: publish ? true : form.isActive,
        certificateUrl: form.certificateUrl || null,
        hoverImage: null,
        modelUrl: null,
      }
      const url = mode === 'new' ? '/api/admin/products' : `/api/admin/products/${form.id}`
      const response = await fetch(url, {
        method: mode === 'new' ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await response.json()) as { product?: ProductFormData; error?: string }

      if (!response.ok || data.error) {
        throw new Error(data.error || 'Unable to save product.')
      }

      showToast(
        publish ? 'Product published successfully!' : 'Draft saved successfully!',
        'success'
      )

      if (publish) {
        window.setTimeout(() => {
          router.push('/admin/products')
        }, 1000)
      } else {
        if (mode === 'new' && data.product?.id) {
          router.replace(`/admin/products/${data.product.id}`)
        }
        setStatus('Last saved: just now')
        setLastSaved('just now')
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Failed to save product'
      setStatus(message)
      showToast('Failed to save product', 'error')
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
                <Select value={form.productType} onValueChange={(value) => { setField('productType', value); setField('category', categories[value]?.[0] || '') }}>
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
              <span style={{ color: getFieldError('description') ? '#A85C6A' : '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>DESCRIPTION *</span>
              <textarea value={form.description ?? ''} onChange={(event) => setField('description', event.target.value)} style={{ backgroundColor: '#FDF8F2', border: getFieldError('description') ? '1px solid #A85C6A' : '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', minHeight: '120px', outlineColor: getFieldError('description') ? '#A85C6A' : '#1A1014', padding: '12px 14px', transition: 'border-color 0.2s', width: '100%' }} />
              <FieldError message={getFieldError('description')} />
            </label>
            <div>
              <TextInput label="BASE PRICE *" value={form.basePrice} type="number" hasError={Boolean(getFieldError('basePrice'))} onChange={(value) => setField('basePrice', Number(value))} />
              <FieldError message={getFieldError('basePrice')} />
            </div>
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>Starting from <span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px' }}>{formatMoney(form.basePrice)}</span></p>
          </section>
        )}

        {activeTab === 1 && (
          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-5">
              {[
                ['METAL', 'metalPricing', optionSets.metals],
                ['CARAT', 'caratPricing', optionSets.carats],
                ['SHAPE', 'shapePricing', optionSets.shapes],
                ['COLOR', 'colorPricing', optionSets.colors],
                ['CLARITY', 'clarityPricing', optionSets.clarities],
              ].map(([label, group, options]) => (
                <div key={label as string} style={{ backgroundColor: '#FBF5F0', border: getFieldError(group as string) ? '1px solid #A85C6A' : '0.5px solid #EDD9AF', borderRadius: '4px', padding: '20px' }}>
                  <p style={{ color: getFieldError(group as string) ? '#A85C6A' : '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '12px' }}>{label as string}</p>
                  <FieldError message={getFieldError(group as string)} />
                  <div className="grid gap-2">
                    {(options as string[]).map((option) => {
                      const map = form[group as keyof Pick<ProductFormData, 'metalPricing' | 'caratPricing' | 'shapePricing' | 'colorPricing' | 'clarityPricing'>] as PricingMap
                      return (
                        <div key={option} className="grid grid-cols-[auto_1fr_120px] items-center gap-3">
                          <input checked={map[option]?.enabled} onChange={(event) => updatePricing(group as keyof Pick<ProductFormData, 'metalPricing' | 'caratPricing' | 'shapePricing' | 'colorPricing' | 'clarityPricing'>, option, { enabled: event.target.checked })} type="checkbox" style={{ accentColor: '#1A1014' }} />
                          <span style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>{option}</span>
                          <input value={map[option]?.modifier || 0} onChange={(event) => updatePricing(group as keyof Pick<ProductFormData, 'metalPricing' | 'caratPricing' | 'shapePricing' | 'colorPricing' | 'clarityPricing'>, option, { modifier: Number(event.target.value) })} type="number" style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px', padding: '8px 10px' }} />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            <aside style={{ backgroundColor: '#1A1014', borderRadius: '4px', color: '#FBF5F0', height: 'fit-content', padding: '20px 24px', position: 'sticky', top: '100px' }}>
              <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '10px', letterSpacing: '0.2em' }}>SAMPLE PRICE PREVIEW</p>
              <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px', lineHeight: 1.7, marginTop: '12px' }}>White Gold + 9ct + Round + G + VS1</p>
              <p style={{ color: '#FBF5F0', fontFamily: 'var(--font-playfair)', fontSize: '38px', marginTop: '16px' }}>{formatMoney(samplePrice)}</p>
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
                      <div key={image} style={{ aspectRatio: '1', backgroundColor: '#F5E8ED', position: 'relative' }}>
                        <Image src={image} alt={`Product ${index + 1}`} fill sizes="160px" style={{ objectFit: 'cover' }} />
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

      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-6 py-4 lg:left-[260px] lg:px-8" style={{ backgroundColor: '#FBF5F0', borderTop: '0.5px solid #EDD9AF' }}>
        {activeTab < 3 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <span style={{ fontSize: '12px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
              Step {activeTab + 1} of 4
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              {activeTab > 0 && (
                <button type="button" onClick={() => setActiveTab(activeTab - 1)} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #EDD9AF', color: '#1A1014', fontSize: '11px', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                  ← BACK
                </button>
              )}
              <button type="button" onClick={() => setActiveTab(activeTab + 1)} style={{ padding: '12px 28px', background: '#1A1014', border: 'none', color: '#FBF5F0', fontSize: '11px', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                {activeTab === 0 && 'NEXT: PRICING →'}
                {activeTab === 1 && 'NEXT: MEDIA →'}
                {activeTab === 2 && 'NEXT: SETTINGS →'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div style={{ fontSize: '12px', color: '#B8A090', fontFamily: 'var(--font-inter)' }}>
              {lastSaved ? `Last saved: ${lastSaved}` : status}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={() => setActiveTab(2)} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #EDD9AF', color: '#1A1014', fontSize: '11px', letterSpacing: '0.15em', cursor: 'pointer', fontFamily: 'var(--font-inter)' }}>
                ← BACK
              </button>
              <button type="button" onClick={() => void handleSave('draft')} disabled={isSaving} style={{ padding: '12px 24px', background: 'transparent', border: '1px solid #1A1014', color: '#1A1014', fontSize: '11px', letterSpacing: '0.15em', cursor: isSaving ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-inter)', opacity: isSaving ? 0.65 : 1 }}>
                {isSaving ? 'SAVING...' : 'SAVE AS DRAFT'}
              </button>
              <button
                type="button"
                onClick={() => void handleSave('publish')}
                disabled={isSaving}
                style={{
                  padding: '12px 28px',
                  background: isSaving ? '#B8A090' : '#1A1014',
                  border: 'none',
                  color: '#FBF5F0',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  cursor: isSaving ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-inter)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background 0.2s',
                }}
              >
                {isSaving ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                    </svg>
                    SAVING...
                  </>
                ) : 'SAVE & PUBLISH'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
