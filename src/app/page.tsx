import { PromoBar } from '@/components/layout/PromoBar'
import { BestSellers } from '@/components/home/BestSellers'
import { Categories } from '@/components/home/Categories'
import { Hero } from '@/components/home/Hero'
import { Reviews } from '@/components/home/Reviews'
import { ShopByShape } from '@/components/home/ShopByShape'
import { VideoStory } from '@/components/home/VideoStory'

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
        <Reviews />
      </div>
    </>
  )
}
