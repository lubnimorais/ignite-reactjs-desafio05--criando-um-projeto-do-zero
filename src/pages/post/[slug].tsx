/* eslint-disable no-param-reassign */
/* eslint-disable react/no-danger */
/* eslint-disable react/self-closing-comp */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';

import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FaUser } from 'react-icons/fa';
import { BiTime } from 'react-icons/bi';
import { MdOutlineDateRange } from 'react-icons/md';

import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';

import Comments from '../../components/Comments';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  preview: boolean;
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
}

export default function Post({
  post,
  preview,
  navigation,
}: PostProps): JSX.Element {
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

  const isPostEdited =
    post.first_publication_date !== post.last_publication_date;

  let editionDate;
  if (isPostEdited) {
    editionDate = format(
      new Date(post.last_publication_date),
      "'* editado em' dd MMM yyyy', às' H':'m",
      {
        locale: ptBR,
      }
    );
  }

  return (
    <>
      <div className={styles.container}>
        <img src={post.data.banner.url} alt="banner" />

        <main className={styles.content}>
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

            {isPostEdited && (
              <span className={styles.edited}>{editionDate}</span>
            )}
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

          <section className={`${styles.navigation} ${commonStyles.container}`}>
            {navigation?.prevPost.length > 0 && (
              <div>
                <h3>{navigation.prevPost[0].data.title}</h3>
                <Link href={`/post/${navigation.prevPost[0].uid}`}>
                  <a>Post anterior</a>
                </Link>
              </div>
            )}

            {navigation?.nextPost.length > 0 && (
              <div>
                <h3>{navigation.nextPost[0].data.title}</h3>
                <Link href={`/post/${navigation.nextPost[0].uid}`}>
                  <a>Próximo post</a>
                </Link>
              </div>
            )}
          </section>

          <Comments />

          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a className={commonStyles.preview}>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </main>
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

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const post = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref || null,
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: post.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: post.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  return {
    props: {
      post,
      preview,
      navigation: { prevPost: prevPost?.results, nextPost: nextPost?.results },
    },
    revalidate: 60 * 5,
  }; // 5 minutes
};
