import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Prismic from '@prismicio/client';
import Link  from 'next/link';
import { useRouter } from 'next/router';

import { getPrismicClient } from '../../services/prismic';

import Header from '../../components/Header';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { MdOutlineWatchLater } from 'react-icons/md';
import { Fragment } from 'react';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    
    last_publication_date: string | null;
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}
interface PaginationItem {
  uid: string;
  data: {
    title: string;
  }
}
interface PostProps {
  post: Post;
    pagination: {
    prevPost: PaginationItem[],
    nextPost: PaginationItem[],
  };
  preview: boolean;
}

export default function Post({ post, preview }: PostProps) {
  const router = useRouter()

  if(router.isFallback) {
    return <h1>Carregando...</h1>
  }

  const countWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length

    const words = contentItem.body.map(paragraph => paragraph.text.split(' ').length)
    words.map(word => (total += word))
    return total
  }, 0)

  const timeToRead = Math.ceil(countWords / 200)

  return (
    <>
    <Head>
      <title>{post.data.title} | spacetraveling</title>
    </Head>
    <main>


      <img src={post.data.banner.url} className={styles.banner} alt="Banner" />

      <div className={commonStyles.contentContainer}>
        <article className={styles.post}>
            <h1>{post.data.title}</h1>

            <div className={styles.iconContent}>
              <span className={styles.icon}><FiCalendar /></span>
              <time>{post.first_publication_date}</time>
              <span className={styles.icon}><FiUser /></span>
              <span>{post.data.author}</span>
              <span className={styles.icon}><MdOutlineWatchLater /></span>
              <span>{timeToRead} min</span>

              {post.data.last_publication_date > post.first_publication_date && (
                <i> editado no dia {post.data.last_publication_date}</i>
              )}
            </div>

            {post.data.content.map((content, index) => {
              return (
                <div key={index} className={styles.postContent}>
                  <h2>{content.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{ __html: RichText.asHtml(content.body) }}
                  />
                </div>
              )
            })}
        </article>
      </div>

      {/* <section className={`${styles.pagination} ${commonStyles.contentContainer}`}>
        {pagination?.prevPost.length > 0 && (
          <div className={styles.prev}>
            <h3>{pagination.prevPost[0].data.title}</h3>
            <Link href={`/post/${pagination.prevPost[0].uid}`}>
              <a>Post anterior</a>
            </Link>
          </div>
        )}

        {pagination?.nextPost.length > 0 && (
          <div className={styles.next}>
            <h3>{pagination.nextPost[0].data.title}</h3>
            <Link href={`/post/${pagination.nextPost[0].uid}`}>
              <a>Próximo post</a>
            </Link>
          </div>
        )}
      </section> */}

      {/* <Comments /> */}

       {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a className={commonStyles.preview}>Sair do modo Preview</a>
          </Link>
        </aside>
      )} 

    </main>
    </>
  )
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'post')
  ])

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid
      }
    }
  })

  return {
    paths,
    fallback: true,
  }
};

export const getStaticProps: GetStaticProps = async ({ params}) => {
  const { slug } = params
  const prismic = getPrismicClient();
  const response = await prismic.getByUID<any>('post', String(slug), {
    // ref: previewData?.ref || null,
  });

  // if ( slug === 'favicon.png' ) {
  //   return {
  //       redirect: {
  //         destination: '/',
  //         permanent: false,
  //       }
  //   }
  // }

  const postsResponse = await prismic.query<any>([
    Prismic.Predicates.at('document.type', 'post')
  ],{
 
    after: response.id,
    fetch: ['post.title', 'post.subtitle', 'post.author'],
    }
  )

  const nextPost = await prismic.query([
    Prismic.Predicates.at('document.type', 'post')
  ],{
    pageSize: 1,
    after: response.id,
    orderings: '[document.last_publication_date desc]'
  })
  const results = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      data: {
        title: post.data.title,
      },
    };
  });

  const currentPostPositionIndex = results.findIndex(
    post => post.uid === response.uid
  );

  const otherPosts = results.filter(
    (post, index) =>
      index === currentPostPositionIndex + 1 ||
      index === currentPostPositionIndex - 1
  );

  const pagination = {
    nextPost: otherPosts[0] ?? null,
    previousPost: otherPosts[1] ?? null,
  };


  const post = {
    uid: response.uid,
    first_publication_date: format(
      new Date(response.first_publication_date),
      `PP`,
      { locale: ptBR }
    ),
    data: {
      title: RichText.asText(response.data.title),
      subtitle: RichText.asText(response.data.subtitle),
      author: RichText.asText(response.data.author),
      last_publication_date: format(
        new Date(response.last_publication_date),
        `PP, 'às' p`,
        { locale: ptBR }
      ),
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        }
      }),
    },
  }

  return {
    props: {
      post,
      pagination,
    },
    revalidate: 60 * 60 * 24, // 1 day
  }
};