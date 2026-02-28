import type { Metadata } from 'next'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import config from '@payload-config'
import { importMap } from '../importMap'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export async function generateMetadata({ params, searchParams }: Args): Promise<Metadata> {
  return generatePageMetadata({ config, params, searchParams })
}

export default async function Page({ params, searchParams }: Args) {
  return RootPage({ config, importMap, params, searchParams })
}
