import Image from 'next/image'
import { PromoBar } from '@/components/layout/PromoBar'
import { BestSellers } from '@/components/home/BestSellers'
import { Categories } from '@/components/home/Categories'
import { EditorialSplit } from '@/components/home/EditorialSplit'
import { Hero } from '@/components/home/Hero'
import { Reviews } from '@/components/home/Reviews'
import { ShopByShape } from '@/components/home/ShopByShape'
import { VideoStory } from '@/components/home/VideoStory'

const galleryRowOne = [
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=320&q=85',
  'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?w=320&q=85',
  'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=320&q=85',
  'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=320&q=85',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=320&q=85',
  'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=320&q=85',
  'https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=320&q=85',
  'https://images.unsplash.com/photo-1599643477877-530eb83abc8e?w=320&q=85',
  'https://images.unsplash.com/photo-1602173574767-37ac01994b2a?w=320&q=85',
]

const galleryRowTwo = [
  'https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=320&q=85',
  'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=320&q=85',
  'https://images.unsplash.com/photo-1584302179602-e4c3d3fd629d?w=320&q=85',
  'https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=320&q=85',
  'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=320&q=85',
  'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=320&q=85',
  'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=320&q=85',
  'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=320&q=85',
  'https://images.unsplash.com/photo-1573408301185-9519f94816b5?w=320&q=85',
]

function InfiniteJewelryGallery() {
  const rows = [
    { direction: 'galleryLeft', images: [...galleryRowOne, ...galleryRowOne] },
    { direction: 'galleryRight', images: [...galleryRowTwo, ...galleryRowTwo] },
  ]

  return (
    <section
      style={{
        padding: '80px 0 40px',
        background: '#FBF5F0',
        overflow: 'hidden',
      }}
    >
      <div style={{ textAlign: 'center', padding: '0 24px', marginBottom: '40px' }}>
        <div
          style={{
            fontSize: '10px',
            letterSpacing: '0.32em',
            color: '#C9A961',
            marginBottom: '10px',
            fontFamily: 'var(--font-inter)',
          }}
        >
          AS WORN
        </div>
        <h2
          style={{
            fontFamily: 'var(--font-playfair)',
            fontSize: 'clamp(24px,4vw,40px)',
            fontWeight: 400,
            color: '#1A1014',
          }}
        >
          Seen and loved
          <span style={{ fontStyle: 'italic', color: '#C9A961' }}> everywhere.</span>
        </h2>
      </div>

      {rows.map((row, rowIndex) => (
        <div key={row.direction} style={{ marginBottom: rowIndex === 0 ? '10px' : 0, overflow: 'hidden' }}>
          <div
            className="infinite-jewelry-row"
            style={{
              display: 'flex',
              gap: '10px',
              animation: `${row.direction} ${rowIndex === 0 ? 35 : 40}s linear infinite`,
              width: 'max-content',
            }}
          >
            {row.images.map((src, index) => (
              <div
                className="infinite-jewelry-tile"
                key={`${row.direction}-${src}-${index}`}
                style={{
                  width: '200px',
                  height: '200px',
                  flexShrink: 0,
                  position: 'relative',
                  overflow: 'hidden',
                  border: '0.5px solid #EDD9AF',
                  transition: 'transform 400ms cubic-bezier(0.4,0,0.2,1), border-color 400ms cubic-bezier(0.4,0,0.2,1), box-shadow 400ms cubic-bezier(0.4,0,0.2,1)',
                }}
              >
                <Image
                  src={src}
                  alt="Just Because jewelry as worn"
                  fill
                  style={{ objectFit: 'cover' }}
                  sizes="200px"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}

export default function Home() {
  return (
    <>
      <PromoBar />
      <div style={{ backgroundColor: '#FBF5F0' }}>
        <Hero />
        <ShopByShape />
        <Categories />
        <VideoStory />
        <BestSellers />
        <InfiniteJewelryGallery />
        <Reviews />
        <EditorialSplit />
      </div>
    </>
  )
}
