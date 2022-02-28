/* eslint-disable no-param-reassign */
/* eslint-disable react/no-danger */
/* eslint-disable react/self-closing-comp */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FaUser } from 'react-icons/fa';
import { BiTime } from 'react-icons/bi';
import { MdOutlineDateRange } from 'react-icons/md';

import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content?: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  if (router.isFallback) {
    return <span>Carregando...</span>;
  }
  const AVARAGE_READ_TIME = 200; // 200 words per minute;

  const totalWords = post.data.content.reduce((acumulator, item) => {
    return (
      acumulator +
      item.heading?.split(' ').length +
      item.body.reduce((acumulator2, contentBody) => {
        return acumulator2 + contentBody.text.split(' ').length;
      }, 0)
    );
  }, 0);

  const timeOfReading = Math.ceil(totalWords / AVARAGE_READ_TIME);

  return (
    <>
      <div className={styles.container}>
        <img src={post.data.banner.url} alt="banner" />

        <div className={styles.content}>
          <header className={styles.header}>
            <h1>{post.data.title}</h1>
            <div className={styles.info}>
              <span>
                <MdOutlineDateRange />
                {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                  locale: ptBR,
                })}
              </span>
              <span>
                <FaUser />
                {post.data.author}
              </span>
              <time>
                <BiTime />
                {timeOfReading} min
              </time>
            </div>
          </header>
          <div>
            {post.data.content.map(elementContent => {
              return (
                <article
                  key={elementContent.heading}
                  className={styles.content}
                >
                  <h2>{elementContent.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(elementContent.body),
                    }}
                  ></div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: [],
      pageSize: 10,
    }
  );

  return {
    paths: response.results.map(post => {
      return {
        params: { slug: post.uid },
      };
    }),
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();

  const post = await prismic.getByUID('posts', String(slug), {});

  return { props: { post }, revalidate: 60 * 5 }; // 5 minutes
};
