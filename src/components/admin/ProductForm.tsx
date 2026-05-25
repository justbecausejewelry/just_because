'use client'

import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { GripVertical, Upload, Video, X } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type PricingMap = Record<string, { enabled: boolean; modifier: number }>

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

type IncomingProduct = Partial<ProductFormData> & { id?: string }

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

function TextInput({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="block">
      <span style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} type={type} style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', outlineColor: '#1A1014', padding: '12px 14px', width: '100%' }} />
    </label>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{ backgroundColor: checked ? '#C9A961' : '#D8CFC8', borderRadius: '999px', height: '24px', padding: '2px', width: '46px' }}>
      <span style={{ backgroundColor: '#FBF5F0', borderRadius: '50%', display: 'block', height: '20px', transform: checked ? 'translateX(22px)' : 'translateX(0)', transition: 'all 0.2s', width: '20px' }} />
    </button>
  )
}

export function ProductForm({ product, mode }: { product?: IncomingProduct; mode: 'new' | 'edit' }) {
  const router = useRouter()
  const [form, setForm] = useState<ProductFormData>(() => ({ ...blankProduct(), ...product }))
  const [tagInput, setTagInput] = useState('')
  const [videoInput, setVideoInput] = useState('')
  const [videoMode, setVideoMode] = useState<'url' | 'upload'>('url')
  const [videoPreview, setVideoPreview] = useState<{ name: string; size: number; url: string } | null>(null)
  const [videoUploadProgress, setVideoUploadProgress] = useState(0)
  const [status, setStatus] = useState('Not saved yet')

  useEffect(() => {
    if (product) {
      setForm((current) => ({ ...current, ...product }))
    }
  }, [product])

  const categoryOptions = categories[form.productType] || []
  const samplePrice = useMemo(() => {
    return form.basePrice + (form.metalPricing['White Gold']?.modifier || 0) + (form.caratPricing['9']?.modifier || 0) + (form.shapePricing.Round?.modifier || 0) + (form.colorPricing.G?.modifier || 0) + (form.clarityPricing.VS1?.modifier || 0)
  }, [form])

  const setField = <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const updatePricing = (group: keyof Pick<ProductFormData, 'metalPricing' | 'caratPricing' | 'shapePricing' | 'colorPricing' | 'clarityPricing'>, option: string, patch: Partial<{ enabled: boolean; modifier: number }>) => {
    setForm((current) => ({
      ...current,
      [group]: {
        ...current[group],
        [option]: { ...current[group][option], ...patch },
      },
    }))
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

  const youtubeIdFromUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/)
    return match?.[1]
  }

  const labelForVideo = (url: string) => {
    try {
      const parsed = new URL(url)
      return parsed.pathname.split('/').filter(Boolean).pop() || parsed.hostname
    } catch {
      return url
    }
  }

  const addVideoUrl = () => {
    if (!videoInput.trim()) {
      return
    }

    setField('videos', [...form.videos, videoInput.trim()])
    setVideoInput('')
  }

  const handleVideoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    const localUrl = URL.createObjectURL(file)
    setVideoPreview({ name: file.name, size: file.size, url: localUrl })
    setVideoUploadProgress(30)

    const body = new FormData()
    body.append('file', file)
    body.append('slug', form.slug || slugify(form.title) || 'draft')
    body.append('bucket', 'product-videos')

    const response = await fetch('/api/admin/upload', { method: 'POST', body })
    setVideoUploadProgress(80)
    const payload = (await response.json()) as { publicUrl?: string; error?: string }
    const publicUrl = payload.publicUrl

    if (publicUrl) {
      setField('videos', [...form.videos, publicUrl])
      setVideoUploadProgress(100)
      setStatus('Video uploaded.')
    } else {
      setStatus(payload.error || 'Unable to upload video.')
      setVideoUploadProgress(0)
    }
  }

  const save = async (publish: boolean) => {
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
    const result = (await response.json()) as { product?: ProductFormData; error?: string }
    if (!response.ok || result.error) {
      setStatus(result.error || 'Unable to save product.')
      return
    }
    setStatus('Last saved: just now')
    if (mode === 'new' && result.product?.id) {
      router.push(`/admin/products/${result.product.id}`)
    }
  }

  return (
    <div className="pb-24">
      <Tabs defaultValue="basic">
        <TabsList variant="line" className="mb-6" style={{ borderBottom: '0.5px solid #EDD9AF', width: '100%' }}>
          {['basic', 'pricing', 'media', 'settings'].map((tab) => <TabsTrigger key={tab} value={tab} style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.14em', padding: '14px 18px', textTransform: 'uppercase' }}>{tab === 'basic' ? 'Basic Info' : tab === 'media' ? 'Images & Media' : tab}</TabsTrigger>)}
        </TabsList>

        <TabsContent value="basic">
          <section className="grid gap-5" style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '24px' }}>
            <div className="grid gap-5 md:grid-cols-2">
              <label>
                <span style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>PRODUCT TYPE</span>
                <Select value={form.productType} onValueChange={(value) => { setField('productType', value); setField('category', categories[value]?.[0] || '') }}>
                  <SelectTrigger style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', width: '100%' }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF' }}>{productTypes.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </label>
              <label>
                <span style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>CATEGORY</span>
                <Select value={form.category} onValueChange={(value) => setField('category', value)}>
                  <SelectTrigger style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', width: '100%' }}><SelectValue /></SelectTrigger>
                  <SelectContent style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF' }}>{categoryOptions.map((item) => <SelectItem key={item} value={item}>{item.replace(/_/g, ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </label>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <TextInput label="TITLE" value={form.title} onChange={(value) => { setField('title', value); if (!form.slug) setField('slug', slugify(value)) }} />
              <TextInput label="SLUG" value={form.slug} onChange={(value) => setField('slug', value)} />
            </div>
            <div className="grid gap-5 md:grid-cols-[1fr_auto]">
              <TextInput label="SKU" value={form.sku} onChange={(value) => setField('sku', value)} />
              <button type="button" onClick={() => setField('sku', `JB-${form.productType.split('_')[0].slice(0, 4).toUpperCase()}-${Date.now()}`)} style={{ alignSelf: 'end', backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', height: '43px', letterSpacing: '0.12em', padding: '0 16px' }}>AUTO-GENERATE</button>
            </div>
            <label>
              <span style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>DESCRIPTION</span>
              <textarea value={form.description} onChange={(event) => setField('description', event.target.value)} style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', borderRadius: '2px', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', minHeight: '120px', outlineColor: '#1A1014', padding: '12px 14px', width: '100%' }} />
            </label>
            <TextInput label="BASE PRICE" value={form.basePrice} type="number" onChange={(value) => setField('basePrice', Number(value))} />
            <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>Starting from <span style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '22px' }}>{formatMoney(form.basePrice)}</span></p>
          </section>
        </TabsContent>

        <TabsContent value="pricing">
          <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="grid gap-5">
              {[
                ['METAL', 'metalPricing', optionSets.metals],
                ['CARAT', 'caratPricing', optionSets.carats],
                ['SHAPE', 'shapePricing', optionSets.shapes],
                ['COLOR', 'colorPricing', optionSets.colors],
                ['CLARITY', 'clarityPricing', optionSets.clarities],
              ].map(([label, group, options]) => (
                <div key={label as string} style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '20px' }}>
                  <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '12px' }}>{label as string}</p>
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
        </TabsContent>

        <TabsContent value="media">
          <section style={{ backgroundColor: '#FBF5F0', border: '0.5px solid #EDD9AF', borderRadius: '4px', padding: '24px' }}>
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
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div>
                <p style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '10px' }}>VIDEOS</p>
                <div className="mb-4 flex gap-2">
                  {(['url', 'upload'] as const).map((mode) => (
                    <button key={mode} type="button" onClick={() => setVideoMode(mode)} style={{ backgroundColor: videoMode === mode ? '#1A1014' : 'transparent', border: videoMode === mode ? '1px solid #1A1014' : '1px solid #EDD9AF', color: videoMode === mode ? '#FBF5F0' : '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', padding: '8px 20px' }}>
                      {mode === 'url' ? 'URL' : 'UPLOAD FILE'}
                    </button>
                  ))}
                </div>

                {videoMode === 'url' ? (
                  <div>
                    <input value={videoInput} onChange={(event) => setVideoInput(event.target.value)} placeholder="YouTube URL or direct MP4 link" style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '13px', outlineColor: '#1A1014', padding: '12px 16px', width: '100%' }} />
                    <button type="button" onClick={addVideoUrl} style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '10px', padding: '10px 20px' }}>
                      Add URL
                    </button>
                    {videoInput && (
                      <div className="mt-3 flex items-center gap-3" style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '10px' }}>
                        {youtubeIdFromUrl(videoInput) ? (
                          <Image src={`https://img.youtube.com/vi/${youtubeIdFromUrl(videoInput)}/0.jpg`} alt="YouTube preview" width={72} height={44} style={{ objectFit: 'cover' }} />
                        ) : (
                          <span className="flex h-11 w-[72px] items-center justify-center" style={{ backgroundColor: '#F5E8ED' }}>
                            <Video color="#C9A961" size={22} />
                          </span>
                        )}
                        <span className="min-w-0 flex-1 truncate" style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{videoInput}</span>
                        <button type="button" onClick={() => setVideoInput('')} style={{ color: '#1A1014' }}><X size={15} /></button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block cursor-pointer text-center" style={{ backgroundColor: '#FDF8F2', border: '2px dashed #EDD9AF', borderRadius: '4px', padding: '32px' }}>
                      <Video color="#C9A961" className="mx-auto mb-3" size={34} />
                      <p style={{ color: '#1A1014', fontFamily: 'var(--font-playfair)', fontSize: '20px' }}>Drag and drop video here</p>
                      <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '13px' }}>or click to browse</p>
                      <p style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '4px' }}>MP4, MOV, WebM up to 100MB</p>
                      <input onChange={handleVideoFile} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" />
                    </label>
                    {videoPreview && (
                      <div className="mt-4" style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '12px' }}>
                        <video src={videoPreview.url} controls style={{ maxHeight: '200px', width: '100%' }} />
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="truncate" style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{videoPreview.name} - {(videoPreview.size / (1024 * 1024)).toFixed(1)} MB</span>
                          <button type="button" onClick={() => { URL.revokeObjectURL(videoPreview.url); setVideoPreview(null); setVideoUploadProgress(0) }} style={{ color: '#A85C6A', fontFamily: 'var(--font-inter)', fontSize: '11px' }}>Remove</button>
                        </div>
                        <div style={{ backgroundColor: '#EDD9AF', borderRadius: '999px', height: '4px', marginTop: '12px', overflow: 'hidden' }}>
                          <div style={{ backgroundColor: '#C9A961', borderRadius: '999px', height: '4px', transition: 'width 0.3s ease', width: `${videoUploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {form.videos.length > 0 && (
                  <div className="mt-4 grid gap-2">
                    {form.videos.map((video, index) => (
                      <div key={`${video}-${index}`} className="flex items-center gap-3" style={{ backgroundColor: '#FDF8F2', border: '0.5px solid #EDD9AF', padding: '10px 12px' }}>
                        <GripVertical color="#B8A090" size={16} />
                        <Video color="#C9A961" size={18} />
                        <span className="min-w-0 flex-1 truncate" style={{ color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{labelForVideo(video)}</span>
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
        </TabsContent>

        <TabsContent value="settings">
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
              <textarea value={form.internalNotes} onChange={(event) => setField('internalNotes', event.target.value)} style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', color: '#1A1014', minHeight: '100px', padding: '12px 14px', width: '100%' }} />
            </label>
            <div>
              <TextInput label="TAGS" value={tagInput} onChange={setTagInput} />
              <button type="button" onClick={() => { if (tagInput) { setField('tags', [...form.tags, tagInput]); setTagInput('') } }} style={{ color: '#C9A961', fontFamily: 'var(--font-inter)', fontSize: '11px', marginTop: '8px' }}>Add tag →</button>
              <div className="mt-3 flex flex-wrap gap-2">{form.tags.map((tag) => <button key={tag} type="button" onClick={() => setField('tags', form.tags.filter((item) => item !== tag))} style={{ backgroundColor: '#1A1014', borderRadius: '999px', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '10px', padding: '5px 10px' }}>{tag} ×</button>)}</div>
            </div>
            <TextInput label="SEO TITLE" value={form.seoTitle} onChange={(value) => setField('seoTitle', value)} />
            <label>
              <span style={{ color: '#C9A961', display: 'block', fontFamily: 'var(--font-inter)', fontSize: '9px', letterSpacing: '0.3em', marginBottom: '8px' }}>SEO DESCRIPTION</span>
              <textarea value={form.seoDescription} onChange={(event) => setField('seoDescription', event.target.value)} style={{ backgroundColor: '#FDF8F2', border: '1px solid #EDD9AF', color: '#1A1014', minHeight: '90px', padding: '12px 14px', width: '100%' }} />
            </label>
          </section>
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-6 py-4 lg:left-[260px] lg:px-8" style={{ backgroundColor: '#FBF5F0', borderTop: '0.5px solid #EDD9AF' }}>
        <span style={{ color: '#B8A090', fontFamily: 'var(--font-inter)', fontSize: '12px' }}>{status}</span>
        <div className="flex gap-3">
          <button type="button" onClick={() => save(false)} style={{ backgroundColor: 'transparent', border: '0.5px solid #EDD9AF', color: '#1A1014', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.14em', padding: '12px 16px' }}>SAVE AS DRAFT</button>
          <button type="button" onClick={() => save(true)} style={{ backgroundColor: '#1A1014', color: '#FBF5F0', fontFamily: 'var(--font-inter)', fontSize: '11px', letterSpacing: '0.14em', padding: '12px 16px' }}>SAVE & PUBLISH</button>
        </div>
      </div>
    </div>
  )
}
