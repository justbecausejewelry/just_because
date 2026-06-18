import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { PromoBar } from '@/components/layout/PromoBar'
import { BestSellers } from '@/components/home/BestSellers'
import { Categories } from '@/components/home/Categories'
import { EditorialSplit } from '@/components/home/EditorialSplit'
import { GalleryTileImage } from '@/components/home/GalleryTileImage'
import { Hero } from '@/components/home/Hero'
import { Reviews } from '@/components/home/Reviews'
import { ShopByShape } from '@/components/home/ShopByShape'
import StatsCounter from '@/components/home/StatsCounter'
import { VideoStory } from '@/components/home/VideoStory'

const galleryFiles = Array.from({ length: 20 }, (_, index) => {
  const imageNumber = String(index + 1).padStart(2, '0')
  return `gallery-${imageNumber}.jpg`
}).filter((filename) => existsSync(join(process.cwd(), 'public', 'images', 'gallery', filename)))

const galleryRowOne = galleryFiles
  .filter((filename) => Number(filename.match(/\d+/)?.[0] || 0) <= 10)
  .map((filename) => `/images/gallery/${filename}`)

const galleryRowTwo = galleryFiles
  .filter((filename) => Number(filename.match(/\d+/)?.[0] || 0) > 10)
  .map((filename) => `/images/gallery/${filename}`)

function InfiniteJewelryGallery() {
  const rows = [
    { direction: 'galleryLeft', images: [...galleryRowOne, ...galleryRowOne] },
    { direction: 'galleryRight', images: [...galleryRowTwo, ...galleryRowTwo] },
  ]

  return (
    <section
      id="infinite-gallery"
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
                <GalleryTileImage src={src} />
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
        <StatsCounter />
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
