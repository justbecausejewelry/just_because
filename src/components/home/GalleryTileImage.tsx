'use client'

import { useState } from 'react'
import Image from 'next/image'

type GalleryTileImageProps = {
  src: string
}

export function GalleryTileImage({ src }: GalleryTileImageProps) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div
        aria-label="Just Because jewelry lifestyle image unavailable"
        style={{
          alignItems: 'center',
          backgroundColor: '#EDD9AF',
          color: '#C9A961',
          display: 'flex',
          fontFamily: 'var(--font-playfair)',
          fontSize: '18px',
          fontStyle: 'italic',
          height: '100%',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
        }}
      >
        Just Because
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt="Just Because jewelry lifestyle"
      width={300}
      height={200}
      onError={() => setFailed(true)}
      style={{
        display: 'block',
        height: '100%',
        objectFit: 'cover',
        width: '100%',
      }}
    />
  )
}
