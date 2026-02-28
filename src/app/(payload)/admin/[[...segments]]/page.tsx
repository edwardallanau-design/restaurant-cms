import type { Metadata } from 'next'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import config from '@payload-config'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export async function generateMetadata({ params, searchParams }: Args): Promise<Metadata> {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  return generatePageMetadata({
    config,
    params: { segments: resolvedParams.segments },
    searchParams: resolvedSearchParams,
  })
}

export default async function Page({ params, searchParams }: Args) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  return RootPage({
    config,
    importMap,
    params: { segments: resolvedParams.segments },
    searchParams: resolvedSearchParams,
  })
}
