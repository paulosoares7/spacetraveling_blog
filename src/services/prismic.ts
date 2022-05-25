import Prismic from '@prismicio/client';
// import { HttpRequestLike } from '@prismicio/client';
import { enableAutoPreviews } from '@prismicio/next';

// export interface PrismicConfig {
//   req?: HttpRequestLike;
// }

export function getPrismicClient(req?: unknown) {
  const prismic = Prismic.client(
    process.env.PRISMIC_API_ENDPOINT,
    { 
      req,
      accessToken: process.env.PRISMIC_ACCESS_TOKEN
    }
  )
  return prismic;
}
