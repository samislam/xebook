import axios from 'axios'
import { headers } from 'next/headers'

export async function getServerClient() {
  // Your logic and configurations...
  const requestHeaders = await headers()
  const userAgent = requestHeaders.get('user-agent') ?? undefined
  return axios.create({
    // Your custom config...
    headers: {
      ...(userAgent && { 'X-Client-User-Agent': userAgent }),
    },
  })
}
