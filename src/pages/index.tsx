import { GetStaticProps } from 'next';
import Head  from 'next/head';
import Link  from 'next/link';
import Header from '../components/Header';
import {FiCalendar, FiUser} from 'react-icons/fi'


import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

 export default function Home({postsPagination, preview}:HomeProps) {
  //    const {results,next_page} = postsPagination;
  //   const [posts, setPosts] = useState(results);
  //  const [nextPage, setNextPage] = useState(next_page);
  const [posts, setPosts] = useState(postsPagination.results)
  
   async function handleLoadNextPage(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const response = await fetch(postsPagination.next_page);

    const { results } = await response.json();

    const newPostsArray = [...posts, results].flat();

    setPosts(newPostsArray);

  }
    return(
      <>
      <Head>
      <title>Home | Spacetraveling</title>
      </Head>

      <main>
        <section>
          <div className = {styles.container}>
            {posts.map(post =>(
              <Link key={post.uid} href={`/post/${post.uid}`}>

              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                  
                <div className={styles.infoContent}>
                  <span className={styles.icons}><FiCalendar /></span>
                  <time>{post.first_publication_date}</time>
                  <span className={styles.icons}><FiUser /></span>
                  <span>{post.data.author}</span>
                </div>
                  </a>
               </Link>
            ))}
            {postsPagination.next_page && (
            <button
              type="button"
              onClick={handleLoadNextPage}
            >
              Carregar mais posts
            </button>
          )}
          </div>
      </section>
      </main>
      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
      </>

    )
 }

 export const getStaticProps:GetStaticProps = async ({
  preview = false,
  previewData,
 }) => {
    const prismic = getPrismicClient();
    const postsResponse = await prismic.query<any>( //[]
      [Prismic.predicates.at('document.type', 'post')],
      {
        fetch: ['post.title', 'post.subtitle', 'post.author'],
        ref: previewData?.ref ?? null,
      }
    )

    const posts =  postsResponse.results.map(postData => {
      return {
          uid: postData.uid,
          first_publication_date:format(
            new Date(postData.first_publication_date),
            'dd MMM yyyy',
            {
              locale: ptBR,
            }
          ),
          data: {
            title: RichText.asText(postData.data.title),
            subtitle: RichText.asText(postData.data.subtitle),
            author: RichText.asText(postData.data.author),
          },
      }
  })


  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: posts,
      },
       preview,
    },
  };
 };
