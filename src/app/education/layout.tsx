import type { ReactNode } from 'react'
import { EducationBreadcrumb } from '@/components/education/EducationBreadcrumb'

export default function EducationLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EducationBreadcrumb />
      {children}
    </>
  )
}
